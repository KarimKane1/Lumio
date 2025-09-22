import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || '7d';
    
    const supabase = supabaseServer();
    
    // Calculate date range based on filter
    const now = new Date();
    let startDate: Date;
    
    switch (filter) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date('2020-01-01'); // Very early date to get all records
        break;
    }

    console.log('Contact Clicks API Debug:', {
      filter,
      startDate: startDate.toISOString(),
      now: now.toISOString()
    });

    // Query contact clicks with user and provider details
    const { data: contactClicks, error } = await supabase
      .from('events')
      .select(`
        id,
        user_id,
        event_payload,
        created_at
      `)
      .eq('event_type', 'contact_click')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contact clicks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Raw contact clicks from events table:', {
      count: contactClicks?.length || 0,
      clicks: contactClicks?.map(c => ({
        id: c.id,
        user_id: c.user_id,
        provider_id: c.event_payload?.provider_id,
        created_at: c.created_at,
        event_payload: c.event_payload
      }))
    });

    // Get user and provider details separately
    // Check both user_id column and event_payload.user_id
    const userIds = Array.from(new Set([
      ...(contactClicks || []).map((c: any) => c.user_id).filter(Boolean),
      ...(contactClicks || []).map((c: any) => c.event_payload?.user_id).filter(Boolean)
    ]));
    const providerIds = Array.from(new Set((contactClicks || []).map((c: any) => c.event_payload?.provider_id).filter(Boolean)));

    console.log('Extracted IDs:', {
      userIds,
      providerIds,
      totalContactClicks: contactClicks?.length || 0,
      clicksWithUserId: (contactClicks || []).filter(c => c.user_id).length,
      clicksWithProviderId: (contactClicks || []).filter(c => c.event_payload?.provider_id).length
    });

    // Debug: Check what's actually in the database
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, name')
      .limit(10);
    
    const { data: allProviders } = await supabase
      .from('provider')
      .select('id, name, service_type')
      .limit(10);

    console.log('Database contents debug:', {
      sampleUsers: allUsers?.map(u => ({ id: u.id, name: u.name })),
      sampleProviders: allProviders?.map(p => ({ id: p.id, name: p.name, service_type: p.service_type })),
      lookingForUserIds: userIds,
      lookingForProviderIds: providerIds
    });

    // Fetch user details
    const { data: users } = await supabase
      .from('users')
      .select('id, name')
      .in('id', userIds);

    // Fetch provider details
    const { data: providers } = await supabase
      .from('provider')
      .select('id, name, service_type, city')
      .in('id', providerIds);

    console.log('User and Provider lookup debug:', {
      userIds,
      providerIds,
      usersFound: users?.length || 0,
      providersFound: providers?.length || 0,
      users: users?.map(u => ({ id: u.id, name: u.name })),
      providers: providers?.map(p => ({ id: p.id, name: p.name, service_type: p.service_type }))
    });

    // Create lookup maps
    const userMap = new Map((users || []).map((u: any) => [u.id, u]));
    const providerMap = new Map((providers || []).map((p: any) => [p.id, p]));

    // Transform the data to match our interface
    const transformedClicks = (contactClicks || []).map((click: any) => {
      // Use user_id from event_payload if column user_id is null
      const effectiveUserId = click.user_id || click.event_payload?.user_id;
      const user = userMap.get(effectiveUserId);
      const providerId = click.event_payload?.provider_id;
      const provider = providerMap.get(providerId);
      
      // Use provider name from event_payload if available, otherwise from database lookup
      const providerName = click.event_payload?.provider_name || (provider as any)?.name || 'Unknown Provider';
      const serviceType = click.event_payload?.service_type || (provider as any)?.service_type || 'unknown';
      
      return {
        id: click.id,
        seeker_name: user?.name || click.event_payload?.user_name || (effectiveUserId ? 'Unknown User' : 'Guest User'),
        seeker_id: effectiveUserId,
        provider_name: providerName,
        provider_id: providerId,
        service_type: serviceType,
        provider_city: (provider as any)?.city,
        clicked_at: click.created_at
      };
    });

    console.log('Final transformed clicks:', {
      count: transformedClicks.length,
      clicks: transformedClicks
    });

    return NextResponse.json({
      contactClicks: transformedClicks,
      total: transformedClicks.length,
      filter: filter
    });

  } catch (error) {
    console.error('Error in contact clicks API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
