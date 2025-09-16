import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get all users from public.users table
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email, phone_e164, name')
      .or('email.not.is.null,phone_e164.not.is.null');

    if (publicError) {
      console.error('Error fetching public users:', publicError);
      return NextResponse.json(
        { error: 'Failed to fetch users from public.users' },
        { status: 500 }
      );
    }

    if (!publicUsers || publicUsers.length === 0) {
      return NextResponse.json(
        { error: 'No users found in public.users table' },
        { status: 404 }
      );
    }

    console.log(`Found ${publicUsers.length} users in public.users table`);

    const results = [];
    const errors = [];

    for (const user of publicUsers) {
      try {
        // Check if auth user already exists
        const { data: existingAuthUser } = await supabase.auth.admin.getUserById(user.id);
        
        if (existingAuthUser.user) {
          const identifier = user.email || user.phone_e164 || user.id;
          console.log(`Auth user already exists for ${identifier}`);
          results.push({ identifier, status: 'already_exists', type: user.email ? 'email' : 'phone' });
          continue;
        }

        // Create auth user - use email if available, otherwise use phone
        const authData: any = {
          password: 'temp123456', // Temporary password - users will need to reset
          user_metadata: {
            name: user.name,
            phone: user.phone_e164
          }
        };

        if (user.email) {
          // Admin user with email
          authData.email = user.email;
          authData.email_confirm = true;
        } else if (user.phone_e164) {
          // Phone-only user
          authData.phone = user.phone_e164;
          authData.phone_confirm = true;
        } else {
          // Skip users with neither email nor phone
          console.log(`Skipping user ${user.id} - no email or phone`);
          continue;
        }

        const { data: authUser, error: authError } = await supabase.auth.admin.createUser(authData);

        if (authError) {
          const identifier = user.email || user.phone_e164 || user.id;
          console.error(`Error creating auth user for ${identifier}:`, authError);
          errors.push({ identifier, error: authError.message });
        } else {
          const identifier = user.email || user.phone_e164 || user.id;
          console.log(`Successfully created auth user for ${identifier}`);
          results.push({ 
            identifier, 
            status: 'created',
            authId: authUser.user?.id,
            type: user.email ? 'email' : 'phone'
          });
        }
      } catch (error) {
        const identifier = user.email || user.phone_e164 || user.id;
        console.error(`Error processing user ${identifier}:`, error);
        errors.push({ identifier, error: 'Unknown error' });
      }
    }

    return NextResponse.json({
      message: `Processed ${publicUsers.length} users`,
      results,
      errors,
      summary: {
        total: publicUsers.length,
        created: results.filter(r => r.status === 'created').length,
        alreadyExists: results.filter(r => r.status === 'already_exists').length,
        errors: errors.length
      }
    });

  } catch (error) {
    console.error('Recreate auth users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
