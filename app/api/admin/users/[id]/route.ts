import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { is_active, action, ...updateData } = await request.json();

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (action === 'toggle_status') {
      // Toggle user active status
      const { data, error } = await supabase
        .from('users')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user status:', error);
        return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
      }

      return NextResponse.json({ success: true, user: data });
    }

    // Update user data
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('Attempting to delete user with ID:', id);

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First, check if user exists in users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', id)
      .single();

    if (checkError) {
      console.error('Error checking user existence:', checkError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Found user to delete:', existingUser.name, existingUser.id);

    // Try to delete user from auth.users first (ignore if not found)
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    
    if (authError && authError.code !== 'user_not_found') {
      console.error('Error deleting auth user:', authError);
      return NextResponse.json({ error: 'Failed to delete user from auth' }, { status: 500 });
    } else if (authError && authError.code === 'user_not_found') {
      console.log('User not found in auth, continuing with database deletion...');
    } else {
      console.log('Successfully deleted user from auth');
    }

    // Delete user from users table
    const { error: userError, count: deletedCount } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .select();

    if (userError) {
      console.error('Error deleting user:', userError);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    console.log('Deleted user from users table, count:', deletedCount);

    // Also delete related data
    const cleanupResults = await Promise.all([
      // Delete connections
      supabase.from('connection').delete().or(`user1_id.eq.${id},user2_id.eq.${id}`),
      // Delete connection requests
      supabase.from('connection_request').delete().or(`requester_user_id.eq.${id},recipient_user_id.eq.${id}`),
      // Delete recommendations
      supabase.from('recommendation').delete().eq('recommender_user_id', id),
      // Delete provider attribute votes
      supabase.from('provider_attribute_vote').delete().eq('user_id', id),
    ]);

    console.log('Cleanup results:', cleanupResults.map(r => r.error ? r.error.message : 'success'));

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
