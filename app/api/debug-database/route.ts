import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();
    
    // Get sample users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name')
      .limit(5);
    
    // Get sample providers
    const { data: providers, error: providersError } = await supabase
      .from('provider')
      .select('id, name, service_type')
      .limit(5);
    
    // Get sample events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, event_type, user_id, event_payload')
      .eq('event_type', 'contact_click')
      .limit(3);

    return NextResponse.json({
      users: users || [],
      providers: providers || [],
      contactClickEvents: events || [],
      errors: {
        users: usersError?.message,
        providers: providersError?.message,
        events: eventsError?.message
      }
    });

  } catch (error) {
    console.error('Error in debug database API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
