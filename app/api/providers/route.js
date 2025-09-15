import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase/server';
import { apiRateLimit } from '../../../lib/rateLimit';
import { withRateLimit } from '../../../lib/rateLimitMiddleware';

export async function POST(req) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(apiRateLimit)(req);
  if (rateLimitResponse) return rateLimitResponse;

  const body = await req.json().catch(() => ({}));
  const { name, service_type, city = '', phone_hash, phone_enc } = body || {};
  if (!name || !service_type || !phone_hash) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  const supabase = supabaseServer();
  const { data: exists, error: existsErr } = await supabase
    .from('provider')
    .select('id')
    .eq('phone_hash', phone_hash)
    .maybeSingle();
  if (existsErr) return NextResponse.json({ error: existsErr.message }, { status: 500 });
  if (exists) return NextResponse.json({ id: exists.id, deduped: true }, { status: 200 });

  const { data, error } = await supabase
    .from('provider')
    .insert({
      name,
      service_type,
      city,
      phone_hash,
      phone_enc: phone_enc ? Buffer.from(phone_enc, 'hex') : null,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Record initial city and potential alias rows
  try {
    if (city) await supabase.from('provider_city_sighting').insert({ provider_id: data.id, city, source: 'provider' });
    if (name) await supabase.from('provider_name_alias').upsert({ provider_id: data.id, alias: name, source: 'provider' }, { onConflict: 'provider_id,alias' });
  } catch {}
  return NextResponse.json({ id: data.id, deduped: false }, { status: 201 });
}

export async function GET(req) {
  // Apply rate limiting
  // const rateLimitResponse = await withRateLimit(apiRateLimit)(req);
  // if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const service = searchParams.get('service');
  const city = searchParams.get('city');
  const page = Number(searchParams.get('page') || '1');
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = supabaseServer();
  
  // Get the current user to filter recommendations by network
  const { data: { user } } = await supabase.auth.getUser();
  let query = supabase
    .from('provider')
    .select('id,name,service_type,city,photo_url');
  if (q) query = query.ilike('name', `%${q}%`);
  if (service) {
    const slug = String(service).toLowerCase().replace(/[^a-z]+/g, '_');
    const map = {
      plumber: 'plumber',
      cleaner: 'cleaner',
      nanny: 'nanny',
      electrician: 'electrician',
      carpenter: 'carpenter',
      hair: 'hair',
      henna: 'henna',
      chef: 'chef',
    };
    if (map[slug]) {
      query = query.eq('service_type', map[slug]);
    }
  }
  if (city) query = query.eq('city', city);
  query = query.range(from, to);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach simple aggregates: top 2 likes and notes per provider
  // For performance, this is a naive per-row fetch for MVP
  const items = await Promise.all(
    (data || []).map(async (prov) => {
      // Get likes from recommendation notes instead of votes table
      const { data: recs } = await supabase
        .from('recommendation')
        .select('note,recommender_user_id,users(id,name)')
        .eq('provider_id', prov.id);
      
      // Parse likes from recommendation notes
      const likeCounts = new Map();
      for (const r of (recs || [])) {
        const note = r.note || '';
        const m = note.match(/Liked:\s*([^|]+)/i);
        if (m && m[1]) {
          m[1].split(',').map(s => s.trim()).filter(Boolean).forEach(lbl => 
            likeCounts.set(lbl, (likeCounts.get(lbl) || 0) + 1)
          );
        }
      }
      const likes = Array.from(likeCounts.entries()).sort((a,b)=>b[1]-a[1]).map(([k])=>k);
      const watchCounts = new Map();
      for (const r of (recs || [])) {
        const note = r.note || '';
        const m = note.match(/Watch:\s*([^|]+)/i);
        if (m && m[1]) {
          m[1].split(',').map(s => s.trim()).filter(Boolean).forEach(lbl => watchCounts.set(lbl, (watchCounts.get(lbl) || 0) + 1));
        }
      }
      const topWatch = Array.from(watchCounts.entries()).sort((a,b)=>b[1]-a[1]).map(([k])=>k);
      
      // Get recommenders data - filter by network connections
      // For now, since we don't have a proper connection system, 
      // we'll only show recommendations from the current user themselves
      let recommenders = (recs || []).map(rec => ({
        id: rec.recommender_user_id,
        name: rec.users?.name || 'Unknown'
      })).filter(rec => rec.name !== 'Unknown');
      
      // For now, show all recommendations since authentication isn't working properly
      // TODO: Implement proper authentication and network filtering
      console.log('Provider:', prov.name, 'All recommenders:', recommenders.map(r => ({ id: r.id, name: r.name })));
      
      // Keep all recommenders for now - the frontend will handle filtering if needed
      recommenders = recommenders;
      
      return {
        ...prov,
        top_likes: Array.from(new Set(likes)).slice(0, 3),
        top_watch: topWatch.slice(0, 2),
        recommenders: recommenders,
      };
    })
  );
  return NextResponse.json({ items, page, pageSize });
}


