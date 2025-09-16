import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = supabaseServer();

    // Get all users for consistent counting
    const { data: allUsers } = await supabase
      .from('users')
      .select('phone_e164, user_type');
    
    // Count total users (all users, not just those with phone numbers)
    const totalUsers = allUsers?.length || 0;

    // Count users by type (seeker vs provider) - match database logic exactly
    const seekers = allUsers?.filter(u => u.user_type === 'seeker').length || 0;
    const providers = allUsers?.filter(u => u.user_type === 'provider').length || 0;

    // Get total providers (from provider table)
    const providerResponse = await supabase
      .from('provider')
      .select('*', { count: 'exact', head: true });
    const totalProviders = (providerResponse as any)?.count || 0;

    // Get new users in last 7 days (all users, not just those with phone numbers)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: newUsersData } = await supabase
      .from('users')
      .select('id')
      .gte('created_at', sevenDaysAgo.toISOString());
    
    const newUsers7d = newUsersData?.length || 0;

    // Get active users (users who have made recommendations or connections in last 24h)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: recentRecommendations } = await supabase
      .from('recommendation')
      .select('recommender_user_id')
      .gte('created_at', oneDayAgo.toISOString());

    const activeUserIds = new Set(
      recentRecommendations?.map((r: any) => r.recommender_user_id).filter(Boolean) || []
    );
    const activeUsersDAU = activeUserIds.size;

    // Get active users in last 7 days
    const { data: recentRecommendations7d } = await supabase
      .from('recommendation')
      .select('recommender_user_id')
      .gte('created_at', sevenDaysAgo.toISOString());

    const activeUserIds7d = new Set(
      recentRecommendations7d?.map((r: any) => r.recommender_user_id).filter(Boolean) || []
    );
    const activeUsersWAU = activeUserIds7d.size;

    // Get active users in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentRecommendations30d } = await supabase
      .from('recommendation')
      .select('recommender_user_id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const activeUserIds30d = new Set(
      recentRecommendations30d?.map((r: any) => r.recommender_user_id).filter(Boolean) || []
    );
    const activeUsersMAU = activeUserIds30d.size;

    // Get provider views in last 7 days (simulated - would need event logging)
    const providerViews7d = Math.floor(Math.random() * 100) + 50; // Placeholder

    // Get contact clicks in last 7 days (simulated - would need event logging)
    const contactClicks7d = Math.floor(Math.random() * 30) + 10; // Placeholder

    // Calculate percentage changes (simplified - in production would compare with previous periods)
    const calculatePercentageChange = (current: number) => {
      if (current === 0) return 0;
      // For demo purposes, return a small positive change
      return Math.floor(Math.random() * 20) + 5; // 5-25% increase
    };

    // Calculate average recommendations per provider
    const { data: allRecommendations } = await supabase
      .from('recommendation')
      .select('provider_id');

    const providerRecommendationCounts = new Map();
    allRecommendations?.forEach(rec => {
      const count = providerRecommendationCounts.get(rec.provider_id) || 0;
      providerRecommendationCounts.set(rec.provider_id, count + 1);
    });

    const avgRecommendationsPerProvider = totalProviders > 0 
      ? Array.from(providerRecommendationCounts.values()).reduce((sum, count) => sum + count, 0) / totalProviders
      : 0;

    // Generate real user growth data based on actual user creation dates
    const generateUserGrowthData = async (days: number, userType?: string) => {
      const data = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        let query = supabase
          .from('users')
          .select('phone_e164, user_type')
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());

        const { data: dayUsers } = await query;
        
        // Deduplicate by phone number
        const uniquePhones = new Set(dayUsers?.map(u => u.phone_e164).filter(Boolean) || []);
        let count = uniquePhones.size;

        // Filter by user type if specified - match database logic exactly
        if (userType && userType !== 'all') {
          const filteredUsers = dayUsers?.filter(u => {
            if (userType === 'seeker') {
              return u.user_type === 'seeker';
            }
            return u.user_type === userType;
          }) || [];
          const filteredPhones = new Set(filteredUsers.map(u => u.phone_e164).filter(Boolean));
          count = filteredPhones.size;
        }

        data.push({
          date: date.toISOString().split('T')[0],
          count: count,
        });
      }
      return data;
    };

    // Generate user growth data for different periods
    const userGrowthData7d = await generateUserGrowthData(7);
    const userGrowthData30d = await generateUserGrowthData(30);
    const userGrowthData90d = await generateUserGrowthData(90);

    // Generate data by user type for the last 30 days
    const seekersGrowthData = await generateUserGrowthData(30, 'seeker');
    const providersGrowthData = await generateUserGrowthData(30, 'provider');

    const activityData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        dau: Math.floor(Math.random() * 20) + 10,
        wau: Math.floor(Math.random() * 50) + 30,
      };
    });

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalProviders: totalProviders || 0,
      seekers: seekers,
      providers: providers,
      newUsers7d: newUsers7d || 0,
      activeUsersDAU,
      activeUsersWAU,
      activeUsersMAU,
      providerViews7d,
      contactClicks7d,
      avgRecommendationsPerProvider,
      userGrowthData: userGrowthData7d,
      userGrowthData30d,
      userGrowthData90d,
      seekersGrowthData,
      providersGrowthData,
      activityData,
      // Percentage changes (simplified for demo)
      totalUsersChange: calculatePercentageChange(totalUsers),
      totalProvidersChange: calculatePercentageChange(totalProviders),
      newUsers7dChange: calculatePercentageChange(newUsers7d),
      activeUsersDAUChange: calculatePercentageChange(activeUsersDAU),
      providerViews7dChange: calculatePercentageChange(providerViews7d),
      contactClicks7dChange: calculatePercentageChange(contactClicks7d),
    });
  } catch (error) {
    console.error('Error fetching KPI data:', error);
    return NextResponse.json({ error: 'Failed to fetch KPI data' }, { status: 500 });
  }
}
