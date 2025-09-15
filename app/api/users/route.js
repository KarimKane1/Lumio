import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase/server';
import { apiRateLimit } from '../../../lib/rateLimit';
import { withRateLimit } from '../../../lib/rateLimitMiddleware';

export async function GET(req) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(apiRateLimit)(req);
  if (rateLimitResponse) return rateLimitResponse;

  const supabase = supabaseServer();
  
  // Get the Authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
  }
  
  // Extract the token
  const token = authHeader.replace('Bearer ', '');
  
  // Verify the JWT token and get user info
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Get user profile
  const { data, error } = await supabase
    .from('users')
    .select('id, name, phone_e164, email, photo_url, created_at')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(apiRateLimit)(req);
  if (rateLimitResponse) return rateLimitResponse;

  const supabase = supabaseServer();
  
  // Get the Authorization header
  const authHeader = req.headers.get('authorization');
  console.log('Auth header:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No valid auth header');
    return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
  }
  
  // Extract the token
  const token = authHeader.replace('Bearer ', '');
  console.log('Token extracted:', token ? 'Present' : 'Missing');
  
  // Verify the JWT token and get user info
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  console.log('User auth result:', { user: user?.id, error: authError });
  
  if (authError || !user) {
    console.log('Auth failed:', authError);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, email } = body;

  // Build update object
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  // Note: language is stored in session metadata, not in the users table

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // Update user profile
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select('id, name, phone_e164, email, photo_url, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
