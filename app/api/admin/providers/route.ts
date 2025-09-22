import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server';
import { validateAndSanitize } from '../../../../lib/validation';
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const supabase = supabaseServer();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('provider')
      .select(`
        *,
        recommendation_count:recommendation(count),
        neighborhoods:provider_neighborhoods(neighborhood),
        specialties:provider_specialties(specialty)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Add search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,service_type.ilike.%${search}%,city.ilike.%${search}%`);
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const response = await query;
    const providers = response.data;
    const error = response.error;
    const count = (response as any)?.count || 0;
    
    console.log('Provider tab - Total providers count:', count);
    console.log('Provider tab - Providers returned:', providers?.length);

    if (error) {
      console.error('Error fetching providers:', error);
      return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
    }

    // Transform the data to include recommendation count and decrypt phone numbers
    const transformedProviders = providers?.map(provider => {
      let phone_e164 = '';
      
      // Try to decrypt the phone_enc data
      if (provider.phone_enc) {
        const decrypted = decodePhoneFromBytea(provider.phone_enc);
        if (decrypted) {
          phone_e164 = decrypted;
        }
      }
      
      return {
        ...provider,
        recommendation_count: provider.recommendation_count?.[0]?.count || 0,
        phone_e164: phone_e164,
      };
    }) || [];

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      providers: transformedProviders,
      total: count || 0,
      page,
      totalPages,
      limit,
    });
  } catch (error) {
    console.error('Error in providers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, service_type, city, phone, owner_user_id, neighborhoods, specialties } = body;

    // Validate required fields (city and owner_user_id are optional)
    if (!name || !service_type || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate and sanitize inputs
    const validation = validateAndSanitize({
      name: { value: name, type: 'name' },
      service_type: { value: service_type, type: 'service_type' },
      phone: { value: phone, type: 'phone' },
    });

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
    }

    const supabase = supabaseServer();

    // Check if provider already exists for this user (only if owner_user_id is provided)
    if (owner_user_id) {
      const { data: existingProvider } = await supabase
        .from('provider')
        .select('id')
        .eq('owner_user_id', owner_user_id)
        .eq('service_type', validation.sanitized.service_type)
        .single();

      if (existingProvider) {
        return NextResponse.json({ error: 'Provider already exists for this user and service type' }, { status: 409 });
      }
    }

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
      } else {
        console.log('ENCRYPTION_KEY_HEX is invalid, skipping encryption');
      }
    } catch (error) {
      console.error('Error encrypting phone:', error);
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

    // Create the provider
    const { data: provider, error } = await supabase
      .from('provider')
      .insert({
        name: validation.sanitized.name,
        service_type: validation.sanitized.service_type,
        service_category_id: serviceCategory.id,
        city: city || 'Dakar', // Default to Dakar if not provided
        phone_hash: phoneHash,
        phone_enc: phoneEnc,
        owner_user_id: owner_user_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating provider:', error);
      return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 });
    }

    // Add neighborhoods if provided
    if (neighborhoods && Array.isArray(neighborhoods) && neighborhoods.length > 0) {
      const neighborhoodInserts = neighborhoods
        .filter(n => n && n.trim())
        .map(neighborhood => ({
          provider_id: provider.id,
          neighborhood: neighborhood.trim(),
          city: city || 'Dakar'
        }));
      
      if (neighborhoodInserts.length > 0) {
        await supabase
          .from('provider_neighborhoods')
          .insert(neighborhoodInserts);
      }
    }

    // Add specialties if provided
    if (specialties && Array.isArray(specialties)) {
      const specialtyInserts = specialties
        .filter(s => s && s.trim())
        .map(specialty => ({
          provider_id: provider.id,
          specialty: specialty.trim()
        }));
      
      if (specialtyInserts.length > 0) {
        await supabase
          .from('provider_specialties')
          .insert(specialtyInserts);
      }
    }

    return NextResponse.json({ provider }, { status: 201 });
  } catch (error) {
    console.error('Error in create provider API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
