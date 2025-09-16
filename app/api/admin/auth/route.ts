import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { trackServerEvent } from '../../../../lib/trackEvent';
import { authRateLimit } from '../../../../lib/rateLimit';
import { withRateLimit } from '../../../../lib/rateLimitMiddleware';

export async function POST(req: Request) {
  // Apply rate limiting for admin auth
  // const rateLimitResponse = await withRateLimit(authRateLimit)(req);
  // if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Check if email is in admin emails list
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
    
    if (!adminEmails.includes(email)) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Create Supabase client for authentication
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Track admin login event
    await trackServerEvent('admin_login', data.user.id, { email });

    // Return the session token
    return NextResponse.json({ 
      success: true, 
      token: data.session?.access_token,
      user: { email, role: 'admin' }
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Apply rate limiting for admin auth
  // const rateLimitResponse = await withRateLimit(authRateLimit)(req);
  // if (rateLimitResponse) return rateLimitResponse;

  try {
    const authHeader = req.headers.get('authorization');
    console.log('Admin auth GET - authHeader:', authHeader ? 'present' : 'missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Admin auth GET - no valid auth header');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log('Admin auth GET - token length:', token.length);

    // Create Supabase client to verify the token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify the JWT token
    console.log('Admin auth GET - verifying token with Supabase...');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log('Admin auth GET - token verification failed:', error?.message);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('Admin auth GET - token verified, user email:', user.email);

    // Check if user email is in admin emails list
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
    console.log('Admin auth GET - admin emails:', adminEmails);
    
    if (!adminEmails.includes(user.email!)) {
      console.log('Admin auth GET - email not in admin list:', user.email);
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    console.log('Admin auth GET - authentication successful');
    return NextResponse.json({ 
      valid: true, 
      user: { email: user.email, role: 'admin' }
    });
  } catch (error) {
    console.error('Admin token validation error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
