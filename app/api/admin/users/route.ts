import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'all';

    const supabase = supabaseServer();
    const offset = (page - 1) * limit;

    // Get all users first to deduplicate by phone number
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    // Add search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone_e164.ilike.%${search}%`);
    }

    const { data: allUsers, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Deduplicate by phone number (keep the most recent record for each phone number)
    const phoneMap = new Map();
    allUsers?.forEach(user => {
      if (user.phone_e164) {
        if (!phoneMap.has(user.phone_e164) || new Date(user.created_at) > new Date(phoneMap.get(user.phone_e164).created_at)) {
          phoneMap.set(user.phone_e164, user);
        }
      } else {
        // Keep users without phone numbers (they'll be unique by ID anyway)
        phoneMap.set(user.id, user);
      }
    });

    const uniqueUsers = Array.from(phoneMap.values());
    console.log('Unique users found:', uniqueUsers.length);
    console.log('User IDs:', uniqueUsers.map(u => ({ name: u.name, id: u.id })));
    
    // Add role detection for each user - match database logic exactly
    const usersWithRoles = await Promise.all(uniqueUsers.map(async (user) => {
      // Use explicit user_type from database, matching the SQL query logic
      let userRole = 'seeker'; // Default
      
      if (user.user_type === 'provider') {
        userRole = 'provider';
      } else if (user.user_type === 'seeker') {
        userRole = 'seeker';
      } else {
        // For users with null user_type, check if they have recommendations (provider role)
        const { data: recommendations } = await supabase
          .from('recommendation')
          .select('id')
          .eq('recommender_user_id', user.id)
          .limit(1);
        
        userRole = recommendations && recommendations.length > 0 ? 'provider' : 'seeker';
      }

      return {
        ...user,
        role: userRole,
        is_active: user.is_active !== false // Default to true if not set
      };
    }));

    // Calculate counts by role
    const seekersCount = usersWithRoles.filter(u => u.role === 'seeker').length;
    
    // Get actual provider count from provider table (not from users)
    const providerResponse = await supabase
      .from('provider')
      .select('*', { count: 'exact', head: true });
    const providersCount = providerResponse.count || 0;

    // Apply role filter
    let filteredUsers = usersWithRoles;
    let totalCount = usersWithRoles.length;
    
    if (role === 'seeker') {
      filteredUsers = usersWithRoles.filter(u => u.role === 'seeker');
      totalCount = seekersCount;
    } else if (role === 'provider') {
      // For provider filter, we can't show provider table data in users table
      // So we'll show users who have provider listings
      filteredUsers = usersWithRoles.filter(u => u.role === 'provider');
      totalCount = filteredUsers.length;
    }

    // Apply pagination to filtered results
    const users = filteredUsers.slice(offset, offset + limit);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      users: users || [],
      total: totalCount,
      seekersCount,
      providersCount,
      page,
      totalPages,
      limit,
    });
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
