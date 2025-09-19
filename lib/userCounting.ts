import { SupabaseClient } from '@supabase/supabase-js';

export interface UserCounts {
  totalUsers: number;
  seekers: number;
  providers: number;
}

/**
 * Get accurate user counts using consistent logic across all dashboard components
 * This ensures KPI cards and charts show the same data
 */
export async function getUserCounts(supabase: SupabaseClient, upToDate?: Date): Promise<UserCounts> {
  // Build query with optional date filter
  let query = supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (upToDate) {
    query = query.lte('created_at', upToDate.toISOString());
  }

  const { data: allUsers } = await query;

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
  
  // Add role detection for each user - match users endpoint logic exactly
  const usersWithRoles = await Promise.all(uniqueUsers.map(async (user) => {
    // Use explicit user_type from database, matching the users endpoint logic
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
      role: userRole
    };
  }));

  // Calculate counts by role
  const seekers = usersWithRoles.filter(u => u.role === 'seeker').length;
  
  // Get actual provider count from provider table (use exact same query as provider tab)
  const providerResponse = await supabase
    .from('provider')
    .select(`
      *,
      recommendation_count:recommendation(count)
    `, { count: 'exact' })
    .order('created_at', { ascending: false });
  const providers = (providerResponse as any)?.count || 0;
  
  // Total users should be seekers + providers
  const totalUsers = seekers + providers;

  console.log('User counting debug:', {
    allUsersCount: allUsers?.length || 0,
    uniqueUsersCount: uniqueUsers.length,
    seekers,
    providers,
    totalUsers,
    upToDate: upToDate?.toISOString()
  });

  return {
    totalUsers,
    seekers,
    providers
  };
}
