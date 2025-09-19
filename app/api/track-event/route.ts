import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { eventType, payload } = await request.json();
    
    const supabase = supabaseServer();
    
    // Insert the event into the events table
    const { error } = await supabase
      .from('events')
      .insert({
        event_type: eventType,
        event_payload: payload || {},
        user_id: payload?.user_id || null
      });
    
    if (error) {
      console.error('Error tracking event:', error);
      return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in track-event API:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
