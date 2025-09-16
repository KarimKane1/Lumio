import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Find Karim in public.users table
    const { data: karimUser, error: userError } = await supabase
      .from('users')
      .select('id, email, phone_e164, name')
      .or('email.ilike.%karim%,name.ilike.%karim%')
      .limit(1);

    if (userError) {
      console.error('Error finding Karim:', userError);
      return NextResponse.json(
        { error: 'Failed to find Karim in public.users' },
        { status: 500 }
      );
    }

    if (!karimUser || karimUser.length === 0) {
      return NextResponse.json(
        { error: 'Karim not found in public.users table' },
        { status: 404 }
      );
    }

    const karim = karimUser[0];
    console.log('Found Karim:', karim);

    // Check if auth user already exists
    const { data: existingAuthUser } = await supabase.auth.admin.getUserById(karim.id);
    
    if (existingAuthUser.user) {
      // Update existing auth user's password
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(karim.id, {
        password: 'test123123'
      });

      if (updateError) {
        console.error('Error updating Karim password:', updateError);
        return NextResponse.json(
          { error: 'Failed to update password: ' + updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Karim password updated successfully',
        user: {
          id: karim.id,
          name: karim.name,
          email: karim.email,
          phone: karim.phone_e164
        },
        action: 'password_updated'
      });
    } else {
      // Create new auth user
      const authData: any = {
        password: 'test123123',
        user_metadata: {
          name: karim.name,
          phone: karim.phone_e164
        }
      };

      if (karim.email) {
        authData.email = karim.email;
        authData.email_confirm = true;
      } else if (karim.phone_e164) {
        authData.phone = karim.phone_e164;
        authData.phone_confirm = true;
      }

      const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser(authData);

      if (createError) {
        console.error('Error creating Karim auth user:', createError);
        return NextResponse.json(
          { error: 'Failed to create auth user: ' + createError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Karim auth user created successfully',
        user: {
          id: karim.id,
          name: karim.name,
          email: karim.email,
          phone: karim.phone_e164
        },
        action: 'user_created',
        authId: newAuthUser.user?.id
      });
    }

  } catch (error) {
    console.error('Reset Karim password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
