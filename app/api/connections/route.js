import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase/server';
import { apiRateLimit } from '../../../lib/rateLimit';
import { withRateLimit } from '../../../lib/rateLimitMiddleware';

export async function GET(req) {
  // Apply rate limiting
  // const rateLimitResponse = await withRateLimit(apiRateLimit)(req);
  // if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const wantsRequests = searchParams.get('requests') === '1';
  const wantsSentRequests = searchParams.get('sentRequests') === '1';
  const wantsNetwork = searchParams.get('network') === '1';
  const wantsDiscover = searchParams.get('discover') === '1';
  const searchPhone = searchParams.get('searchPhone');
  const supabase = supabaseServer();
  // For MVP: if requests=1 return a small list of pending requests derived from users
  if (wantsRequests) {
    if (!userId) return NextResponse.json({ items: [] });
    try {
      const { data: reqs, error: reqErr } = await supabase
        .from('connection_request')
        .select('id,requester_user_id,created_at,status')
        .eq('recipient_user_id', userId)
        .eq('status', 'pending')
        .limit(50);
      if (reqErr) throw reqErr;
      const items = [];
      for (const r of reqs || []) {
        const { data: u } = await supabase
          .from('users')
          .select('id,name,photo_url')
          .eq('id', r.requester_user_id)
          .maybeSingle();
        items.push({
          id: r.requester_user_id,
          name: (u && u.name) || 'Member',
          location: 'Dakar',
          avatar: (u && u.photo_url) || null,
          mutualConnections: 0,
          mutualNames: [],
          recommendationCount: 0,
          requestDate: r.created_at,
        });
      }
      return NextResponse.json({ items });
    } catch (e) {
      // If table doesn't exist yet, return no requests instead of 500
      return NextResponse.json({ items: [] });
    }
  }

  // Handle sent requests
  if (wantsSentRequests) {
    if (!userId) return NextResponse.json({ items: [] });
    try {
      console.log('Fetching sent requests for userId:', userId);
      const { data: reqs, error: reqErr } = await supabase
        .from('connection_request')
        .select('id,recipient_user_id,created_at,status')
        .eq('requester_user_id', userId)
        .eq('status', 'pending')
        .limit(50);
      if (reqErr) throw reqErr;
      console.log('Found sent requests:', reqs?.length || 0);
      const items = [];
      for (const r of reqs || []) {
        const { data: u } = await supabase
          .from('users')
          .select('id,name,photo_url')
          .eq('id', r.recipient_user_id)
          .maybeSingle();
        console.log('API Debug: Recipient ID:', r.recipient_user_id, 'User found:', u?.name);
        items.push({
          id: r.recipient_user_id,
          name: (u && u.name) || 'Member',
          location: 'Dakar',
          avatar: (u && u.photo_url) || null,
          mutualConnections: 0,
          mutualNames: [],
          recommendationCount: 0,
          requestDate: r.created_at,
          status: r.status,
        });
      }
      return NextResponse.json({ items });
    } catch (e) {
      // If table doesn't exist yet, return no requests instead of 500
      return NextResponse.json({ items: [] });
    }
  }

  if (wantsNetwork && userId) {
    // Return current user's connections
    const { data, error } = await supabase
      .from('connection')
      .select('user1_id,user2_id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    
    if (error) {
      console.error('Connection query error:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }
    const otherIds = new Set(
      (data || []).map((r) => (r.user1_id === userId ? r.user2_id : r.user1_id))
    );
    
    // If no connections, return empty array instead of error
    if (otherIds.size === 0) {
      return NextResponse.json({ items: [] });
    }
    
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('id,name,photo_url')
      .in('id', Array.from(otherIds));
    if (usersErr) {
      console.error('Users query error:', usersErr);
      return NextResponse.json({ error: usersErr.message, details: usersErr }, { status: 500 });
    }

    // Recommendation counts per connected user
    const recCountByUser = new Map();
    try {
      await Promise.all(Array.from(otherIds).map(async (oid) => {
        try {
          const { count } = await supabase
            .from('recommendation')
            .select('*', { count: 'exact', head: true })
            .eq('recommender_user_id', oid);
          recCountByUser.set(oid, count || 0);
        } catch (recError) {
          console.error('Error getting recommendation count for user:', oid, recError);
          recCountByUser.set(oid, 0);
        }
      }));
    } catch (error) {
      console.error('Error in recommendation count batch:', error);
      // Continue with empty counts rather than failing
    }

    const items = (users || []).map((u) => ({
      id: u.id,
      name: u.name || 'Member',
      location: 'Dakar',
      avatar: u.photo_url || null,
      recommendationCount: recCountByUser.get(u.id) || 0,
    }));
    return NextResponse.json({ items });
  }

  // Discover users for Find People: only seekers with a non-empty name, exclude self
  let discoverQuery = supabase
    .from('users')
    .select('id,name,photo_url,phone_e164');
  if (wantsDiscover) {
    discoverQuery = discoverQuery
      .or('user_type.is.null,user_type.eq.seeker')
      .neq('name', '');
    
    // If searching by phone, add phone filter
    if (searchPhone) {
      console.log('Searching for user with phone:', searchPhone);
      discoverQuery = discoverQuery.eq('phone_e164', searchPhone);
    }
  } else {
    discoverQuery = discoverQuery
      .neq('id', '00000000-0000-0000-0000-000000000000');
  }
  const { data, error } = await discoverQuery.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const maskE164 = (e164) => {
    if (!e164) return '';
    const s = String(e164).replace(/\s+/g, '');
    const m = s.match(/^(\+\d{1,3})(\d*)$/);
    if (!m) return '';
    const cc = m[1];
    const rest = m[2] || '';
    const last4 = rest.slice(-4).padStart(4, '0');
    // Only show country code and last 4 digits
    return `${cc} *****${last4}`;
  };

  let baseItems = (data || []).map((u) => ({
    id: u.id,
    name: u.name || 'Member',
    location: 'Dakar',
    avatar: u.photo_url || 'https://placehold.co/64x64',
    recommendationCount: 0,
    masked_phone: maskE164(u.phone_e164),
  }));
  if (wantsDiscover && userId) {
    baseItems = baseItems.filter(u => u.id !== userId && u.name && u.name.trim() !== '');

    // Exclude provider accounts by owner_user_id even if user_type is null
    try {
      const { data: owners } = await supabase
        .from('provider')
        .select('owner_user_id')
        .not('owner_user_id', 'is', null);
      const ownerIds = new Set((owners || []).map(o => o.owner_user_id));
      baseItems = baseItems.filter(u => !ownerIds.has(u.id));
    } catch {}

    // Neighbors of current user for mutual counts
    const { data: meConns } = await supabase
      .from('connection')
      .select('user1_id,user2_id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    const myNeighbors = new Set((meConns || []).map(r => (r.user1_id === userId ? r.user2_id : r.user1_id)));

    // Exclude users already connected with current user
    baseItems = baseItems.filter(u => !myNeighbors.has(u.id));

    const withCounts = [];
    for (const u of baseItems) {
      // Recommendation count for user u
      const recResponse = await supabase
        .from('recommendation')
        .select('id', { count: 'exact', head: true })
        .eq('recommender_user_id', u.id);
      const recCount = recResponse?.count || 0;

      // Mutual connections between current user and u
      const { data: uConns } = await supabase
        .from('connection')
        .select('user1_id,user2_id')
        .or(`user1_id.eq.${u.id},user2_id.eq.${u.id}`);
      const uNeighbors = new Set((uConns || []).map(r => (r.user1_id === u.id ? r.user2_id : r.user1_id)));
      let mutual = 0;
      for (const nid of myNeighbors) {
        if (uNeighbors.has(nid)) mutual++;
      }

      withCounts.push({ ...u, recommendationCount: recCount || 0, mutualConnections: mutual });
    }
    
    // Sort by mutual connections, then by recommendation count
    withCounts.sort((a, b) => {
      if (a.mutualConnections !== b.mutualConnections) {
        return b.mutualConnections - a.mutualConnections;
      }
      return b.recommendationCount - a.recommendationCount;
    });
    
    return NextResponse.json({ items: withCounts });
  }
  return NextResponse.json({ items: baseItems });
}

export async function POST(req) {
  // Apply rate limiting
  // const rateLimitResponse = await withRateLimit(apiRateLimit)(req);
  // if (rateLimitResponse) return rateLimitResponse;

  const body = await req.json().catch(() => ({}));
  const { requester_user_id, recipient_user_id, status, requester_name, recipient_name } = body || {};
  if (!requester_user_id || !recipient_user_id) {
    return NextResponse.json({ error: 'requester_user_id and recipient_user_id are required' }, { status: 400 });
  }
  const supabase = supabaseServer();
  try {
    // Ensure user rows exist with latest names (MVP upsert)
    if (requester_user_id) {
      await supabase.from('users').upsert({ id: requester_user_id, name: requester_name || null }, { onConflict: 'id' });
    }
    if (recipient_user_id) {
      await supabase.from('users').upsert({ id: recipient_user_id, name: recipient_name || null }, { onConflict: 'id' });
    }
    
    // Check if request already exists
    const { data: existingRequest } = await supabase
      .from('connection_request')
      .select('id, status')
      .eq('requester_user_id', requester_user_id)
      .eq('recipient_user_id', recipient_user_id)
      .maybeSingle();
    
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json({ error: 'Request already sent' }, { status: 409 });
      } else if (existingRequest.status === 'approved') {
        return NextResponse.json({ error: 'Already connected' }, { status: 409 });
      }
    }
    
    const { data, error } = await supabase
      .from('connection_request')
      .insert({
        requester_user_id,
        recipient_user_id,
        status: status || 'pending',
      })
      .select('id')
      .single();
    if (error) throw error;
    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}

export async function PATCH(req) {
  // Apply rate limiting
  // const rateLimitResponse = await withRateLimit(apiRateLimit)(req);
  // if (rateLimitResponse) return rateLimitResponse;

  const body = await req.json().catch(() => ({}));
  const { requester_user_id, recipient_user_id, action } = body || {};
  
  console.log('PATCH /api/connections called with:', { requester_user_id, recipient_user_id, action });
  
  if (!requester_user_id || !recipient_user_id || !action) {
    console.log('Missing required fields:', { requester_user_id, recipient_user_id, action });
    return NextResponse.json({ error: 'requester_user_id, recipient_user_id, and action are required' }, { status: 400 });
  }
  const supabase = supabaseServer();
  try {
    if (action === 'approve') {
      console.log('Approving connection request:', { requester_user_id, recipient_user_id });
      
      // Ensure single canonical order user1_id < user2_id to satisfy unique constraint
      const [a, b] = [requester_user_id, recipient_user_id].sort();
      
      // First, check if connection already exists
      const { data: existingConnection, error: checkError } = await supabase
        .from('connection')
        .select('user1_id, user2_id')
        .eq('user1_id', a)
        .eq('user2_id', b)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking existing connection:', checkError);
        throw checkError;
      }
      
      if (existingConnection) {
        console.log('Connection already exists, just updating request status');
        // Connection already exists, just update the request status
        const { data: updateData, error: updateError } = await supabase
          .from('connection_request')
          .update({ status: 'approved', responded_at: new Date().toISOString() })
          .eq('requester_user_id', requester_user_id)
          .eq('recipient_user_id', recipient_user_id)
          .eq('status', 'pending')
          .select();
        
        console.log('Update connection_request result:', { updateData, updateError });
        if (updateError) throw updateError;
        
        return NextResponse.json({ ok: true, connectionId: `${a}-${b}`, alreadyExists: true });
      }
      
      // Mark request approved
      const { data: updateData, error: updateError } = await supabase
        .from('connection_request')
        .update({ status: 'approved', responded_at: new Date().toISOString() })
        .eq('requester_user_id', requester_user_id)
        .eq('recipient_user_id', recipient_user_id)
        .eq('status', 'pending')
        .select();
      
      console.log('Update connection_request result:', { updateData, updateError });
      if (updateError) {
        console.error('Failed to update connection_request:', updateError);
        throw updateError;
      }
      
      if (!updateData || updateData.length === 0) {
        console.error('No connection request found to approve');
        return NextResponse.json({ error: 'No pending connection request found' }, { status: 404 });
      }
      
      // Create connection row
      console.log('Creating connection:', { user1_id: a, user2_id: b });
      
      const { data: connectionData, error: connectionError } = await supabase
        .from('connection')
        .insert({ user1_id: a, user2_id: b })
        .select('user1_id, user2_id')
        .single();
      
      console.log('Create connection result:', { connectionData, connectionError });
      if (connectionError) {
        console.error('Failed to create connection:', connectionError);
        throw connectionError;
      }
      
      return NextResponse.json({ ok: true, connectionId: `${a}-${b}` });
    }
    if (action === 'deny') {
      await supabase
        .from('connection_request')
        .update({ status: 'denied', responded_at: new Date().toISOString() })
        .eq('requester_user_id', requester_user_id)
        .eq('recipient_user_id', recipient_user_id)
        .eq('status', 'pending');
      return NextResponse.json({ ok: true });
    }
    if (action === 'cancel') {
      console.log('Canceling request:', { requester_user_id, recipient_user_id });
      const { data, error } = await supabase
        .from('connection_request')
        .update({ status: 'cancelled', responded_at: new Date().toISOString() })
        .eq('requester_user_id', requester_user_id)
        .eq('recipient_user_id', recipient_user_id)
        .eq('status', 'pending')
        .select();
      
      console.log('Cancel result:', { data, error });
      if (error) throw error;
      return NextResponse.json({ ok: true, updated: data?.length || 0 });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error('PATCH /api/connections error:', e);
    return NextResponse.json({ error: String(e.message || e), details: e }, { status: 500 });
  }
}


