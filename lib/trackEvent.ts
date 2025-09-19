// Use stub client to prevent build-time Supabase imports
const createClient = (url?: string, key?: string) => ({
  from: (table: string) => ({
    insert: (data: any) => Promise.resolve({ error: null })
  }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null })
  }
});

export type EventType = 
  | 'signup' 
  | 'search' 
  | 'provider_view' 
  | 'contact_click' 
  | 'recommendation_create' 
  | 'connection_request' 
  | 'admin_login';

export interface EventPayload {
  [key: string]: any;
}

/**
 * Track an event in the analytics system
 * @param eventType - The type of event being tracked
 * @param userId - The user ID (optional for anonymous events)
 * @param payload - Additional event data
 */
export async function trackEvent(
  eventType: EventType,
  userId?: string,
  payload?: EventPayload
): Promise<void> {
  try {
    // Always track events (removed development mode restriction)
    console.log('Event tracking:', { eventType, userId, payload });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase
      .from('events')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_payload: payload || {},
      });

    if (error) {
      console.error('Failed to track event:', error);
    }
  } catch (error) {
    console.error('Event tracking error:', error);
  }
}

/**
 * Track an event from the client side
 * @param eventType - The type of event being tracked
 * @param payload - Additional event data
 */
export async function trackClientEvent(
  eventType: EventType,
  payload?: EventPayload
): Promise<void> {
  try {
    // Get current user from Supabase auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user } } = await supabase.auth.getUser();

    await trackEvent(eventType, user?.id, payload);
  } catch (error) {
    console.error('Client event tracking error:', error);
  }
}

/**
 * Track an event from the server side (API routes)
 * @param eventType - The type of event being tracked
 * @param userId - The user ID
 * @param payload - Additional event data
 */
export async function trackServerEvent(
  eventType: EventType,
  userId?: string,
  payload?: EventPayload
): Promise<void> {
  try {
    // Use service role for server-side tracking
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from('events')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_payload: payload || {},
      });

    if (error) {
      console.error('Failed to track server event:', error);
    }
  } catch (error) {
    console.error('Server event tracking error:', error);
  }
}
