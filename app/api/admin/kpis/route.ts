import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server';
import { getUserCounts } from '../../../../lib/userCounting';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = supabaseServer();

    // Get accurate user counts using shared logic
    const { totalUsers, seekers, providers } = await getUserCounts(supabase);
    
    console.log('Dashboard - User counts:', { totalUsers, seekers, providers });

    // Get new users in last 7 days (all users, not just those with phone numbers)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: newUsersData } = await supabase
      .from('users')
      .select('id')
      .gte('created_at', sevenDaysAgo.toISOString());
    
    const newUsers7d = newUsersData?.length || 0;

    // Get active users - users who have any activity in the last 7 days
    // This includes: recommendations, connections, provider views, contact clicks, etc.
    const activeUserIds7d = new Set();

    // Users who made recommendations
    const { data: recentRecommendations7d } = await supabase
      .from('recommendation')
      .select('recommender_user_id')
      .gte('created_at', sevenDaysAgo.toISOString());
    
    recentRecommendations7d?.forEach((r: any) => {
      if (r.recommender_user_id) activeUserIds7d.add(r.recommender_user_id);
    });

    // Users who made connection requests
    const { data: recentConnections7d } = await supabase
      .from('connection_request')
      .select('requester_user_id, recipient_user_id')
      .gte('created_at', sevenDaysAgo.toISOString());
    
    recentConnections7d?.forEach((c: any) => {
      if (c.requester_user_id) activeUserIds7d.add(c.requester_user_id);
      if (c.recipient_user_id) activeUserIds7d.add(c.recipient_user_id);
    });

    // Users who had any events (provider views, contact clicks, etc.)
    const { data: recentEvents7d } = await supabase
      .from('events')
      .select('user_id')
      .gte('created_at', sevenDaysAgo.toISOString())
      .not('user_id', 'is', null);
    
    recentEvents7d?.forEach((e: any) => {
      if (e.user_id) activeUserIds7d.add(e.user_id);
    });

    const activeUsersWAU = activeUserIds7d.size;

    // For DAU, use the same logic but for last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const activeUserIdsDAU = new Set();
    
    // Users who made recommendations in last 24h
    const { data: recentRecommendationsDAU } = await supabase
      .from('recommendation')
      .select('recommender_user_id')
      .gte('created_at', oneDayAgo.toISOString());
    
    recentRecommendationsDAU?.forEach((r: any) => {
      if (r.recommender_user_id) activeUserIdsDAU.add(r.recommender_user_id);
    });

    // Users who had events in last 24h
    const { data: recentEventsDAU } = await supabase
      .from('events')
      .select('user_id')
      .gte('created_at', oneDayAgo.toISOString())
      .not('user_id', 'is', null);
    
    recentEventsDAU?.forEach((e: any) => {
      if (e.user_id) activeUserIdsDAU.add(e.user_id);
    });

    // Get real contact clicks in last 7 days from events table
    const { data: contactClickEvents } = await supabase
      .from('events')
      .select('id')
      .eq('event_type', 'contact_click')
      .gte('created_at', sevenDaysAgo.toISOString());
    const contactClicks7d = contactClickEvents?.length || 0;

    // Get new providers added in last 7 days
    const { data: newProvidersData } = await supabase
      .from('provider')
      .select('id')
      .gte('created_at', sevenDaysAgo.toISOString());
    const newProviders7d = newProvidersData?.length || 0;

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      seekers: seekers,
      providers: providers,
      activeUsersWAU,
      newProviders7d,
      contactClicks7d,
      newUsers7d: newUsers7d || 0,
    });
  } catch (error) {
    console.error('Error fetching KPI data:', error);
    return NextResponse.json({ error: 'Failed to fetch KPI data' }, { status: 500 });
  }
}
