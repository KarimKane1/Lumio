import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../../lib/supabase/server';
import { validateAndSanitize } from '../../../../../lib/validation';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function decryptPhone(hex: string): string | null {
  try {
    const keyHex = process.env.ENCRYPTION_KEY_HEX;
    if (!keyHex || keyHex.length !== 64 || !hex) return null;
    const buf = Buffer.from(hex, 'hex');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);
    const key = Buffer.from(keyHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString('utf8');
  } catch (error) {
    console.error('Decrypt phone error:', error);
    return null;
  }
}

function byteaToHex(value: any): string | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const trimmed = value.startsWith('\\x') ? value.slice(2) : value;
    return trimmed;
  }
  try {
    return Buffer.from(value).toString('hex');
  } catch {
    return null;
  }
}

function decodePhoneFromBytea(byteaVal: any): string | null {
  const hex = byteaToHex(byteaVal);
  if (!hex) return null;
  // Try AES-GCM first
  try {
    const keyHex = process.env.ENCRYPTION_KEY_HEX;
    if (keyHex && keyHex.length === 64) {
      const buf = Buffer.from(hex, 'hex');
      const iv = buf.subarray(0, 12);
      const tag = buf.subarray(12, 28);
      const ciphertext = buf.subarray(28);
      const key = Buffer.from(keyHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      const phone = plaintext.toString('utf8');
      if (/^\+?\d{6,}$/.test(phone.replace(/\s/g, ''))) return phone;
    }
  } catch {}
  // Fallback to plaintext utf8 stored as hex (dev mode)
  try {
    const s = Buffer.from(hex, 'hex').toString('utf8');
    if (/^\+?\d{6,}$/.test(s.replace(/\s/g, ''))) return s;
  } catch {}
  return null;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, service_type, city, phone, is_active, action } = body;

    const supabase = supabaseServer();

    // Check if provider exists
    const { data: existingProvider, error: fetchError } = await supabase
      .from('provider')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingProvider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Decrypt phone number for validation
    let decryptedPhone = '';
    if (existingProvider.phone_enc) {
      const decrypted = decodePhoneFromBytea(existingProvider.phone_enc);
      if (decrypted) {
        decryptedPhone = decrypted;
      }
    }

    // Handle different actions
    if (action === 'toggle_status') {
      // Status toggle not supported - provider table doesn't have is_active column
      return NextResponse.json({ error: 'Status toggle not supported for providers' }, { status: 400 });
    } else {
      // Full update - validate required fields
      if (!name || !service_type || !city) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Validate and sanitize inputs (phone is optional for updates)
      const validation = validateAndSanitize({
        name: { value: name, type: 'name' },
        service_type: { value: service_type, type: 'service_type' },
        city: { value: city, type: 'location' },
      });

      // Only validate phone if provided
      if (phone) {
        const phoneValidation = validateAndSanitize({
          phone: { value: phone, type: 'phone' },
        });
        if (!phoneValidation.isValid) {
          return NextResponse.json({ error: phoneValidation.errors.join(', ') }, { status: 400 });
        }
        validation.sanitized.phone = phoneValidation.sanitized.phone;
      }

      if (!validation.isValid) {
        return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
      }

      // Check if another provider exists for the same user and service type
      const { data: duplicateProvider } = await supabase
        .from('provider')
        .select('id')
        .eq('owner_user_id', existingProvider.owner_user_id)
        .eq('service_type', validation.sanitized.service_type)
        .neq('id', id)
        .single();

      if (duplicateProvider) {
        return NextResponse.json({ error: 'Provider already exists for this user and service type' }, { status: 409 });
      }

      // Get service category ID
      const { data: serviceCategory } = await supabase
        .from('service_categories')
        .select('id')
        .eq('slug', validation.sanitized.service_type)
        .single();

      if (!serviceCategory) {
        return NextResponse.json({ error: 'Invalid service type' }, { status: 400 });
      }

      // Prepare update data
      const updateData: any = {
        name: validation.sanitized.name,
        service_type: validation.sanitized.service_type,
        service_category_id: serviceCategory.id,
        city: validation.sanitized.city,
      };

      // Only update phone if a new one was provided
      if (phone && validation.sanitized.phone) {
        // Generate phone hash and encrypt phone
        const phoneHash = crypto.createHash('sha256')
          .update(process.env.ENCRYPTION_KEY_HEX || 'jokko-default-salt')
          .update(validation.sanitized.phone)
          .digest('hex');

        // Encrypt phone
        let phoneEnc = null;
        try {
          const keyHex = process.env.ENCRYPTION_KEY_HEX;
          if (keyHex && keyHex.length === 64) {
            const key = Buffer.from(keyHex, 'hex');
            const iv = crypto.randomBytes(12);
            const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
            const ciphertext = Buffer.concat([cipher.update(validation.sanitized.phone, 'utf8'), cipher.final()]);
            const tag = cipher.getAuthTag();
            const encryptedBuffer = Buffer.concat([iv, tag, ciphertext]);
            // Save as hex string with \\x prefix (matching other APIs)
            phoneEnc = `\\x${encryptedBuffer.toString('hex')}`;
          }
        } catch (error) {
          console.error('Error encrypting phone:', error);
        }

        updateData.phone_hash = phoneHash;
        updateData.phone_enc = phoneEnc;
      }

      // Update the provider
      const { data: updatedProvider, error } = await supabase
        .from('provider')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating provider:', error);
        return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 });
      }

      return NextResponse.json({ provider: updatedProvider });
    }
  } catch (error) {
    console.error('Error in update provider API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const supabase = supabaseServer();

    console.log(`Attempting to delete provider with ID: ${id}`);

    // Check if provider exists
    const { data: existingProvider, error: fetchError } = await supabase
      .from('provider')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingProvider) {
      console.log(`Provider not found: ${fetchError?.message || 'No provider found'}`);
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    console.log(`Found provider: ${existingProvider.name} (${existingProvider.service_type})`);

    // Delete related data first
    console.log('Deleting related recommendations...');
    const { error: recError } = await supabase
      .from('recommendation')
      .delete()
      .eq('provider_id', id);

    if (recError) {
      console.error('Error deleting recommendations:', recError);
      return NextResponse.json({ error: 'Failed to delete related recommendations' }, { status: 500 });
    }

    console.log('Deleting provider attribute votes...');
    const { error: voteError } = await supabase
      .from('provider_attribute_vote')
      .delete()
      .eq('provider_id', id);

    if (voteError) {
      console.error('Error deleting provider attribute votes:', voteError);
      return NextResponse.json({ error: 'Failed to delete related votes' }, { status: 500 });
    }

    // Finally delete the provider
    console.log('Deleting provider...');
    const { error: deleteError } = await supabase
      .from('provider')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting provider:', deleteError);
      return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 });
    }

    console.log(`Successfully deleted provider: ${existingProvider.name}`);
    return NextResponse.json({ message: 'Provider deleted successfully' });
  } catch (error) {
    console.error('Error in delete provider API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
