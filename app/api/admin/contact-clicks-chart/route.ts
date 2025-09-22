import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // 'all', 'plumber', 'electrician', etc.
    
    const supabase = supabaseServer();
    
    // Get all contact click events
    const { data: contactClicks, error } = await supabase
      .from('events')
      .select(`
        id,
        user_id,
        event_payload,
        created_at
      `)
      .eq('event_type', 'contact_click')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching contact clicks for chart:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter by service category if specified
    let filteredClicks = contactClicks || [];
    if (filter !== 'all') {
      filteredClicks = filteredClicks.filter((click: any) => {
        const serviceType = click.event_payload?.service_type;
        return serviceType === filter;
      });
    }

    // Group by week and count
    const weeklyData = new Map<string, number>();
    
    filteredClicks.forEach((click: any) => {
      const date = new Date(click.created_at);
      const weekStart = new Date(date);
      // Start of week (Monday) - adjust for Monday start
      const dayOfWeek = date.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, so go back 6 days
      weekStart.setDate(date.getDate() + daysToMonday);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyData.set(weekKey, (weeklyData.get(weekKey) || 0) + 1);
    });

    // Convert to array format for chart
    const chartData = Array.from(weeklyData.entries())
      .map(([week, count]) => ({
        week,
        count,
        label: new Date(week).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      }))
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());

    // Create a standardized 8-week range ending with the current week (Monday start)
    const now = new Date();
    const currentWeekStart = new Date(now);
    // Start of current week (Monday) - adjust for Monday start
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, so go back 6 days
    currentWeekStart.setDate(now.getDate() + daysToMonday);
    currentWeekStart.setHours(0, 0, 0, 0);

    // Generate 8 weeks going backwards from current week
    const filledData = [];
    for (let i = 7; i >= 0; i--) {
      const weekDate = new Date(currentWeekStart);
      weekDate.setDate(currentWeekStart.getDate() - (i * 7));
      
      const weekKey = weekDate.toISOString().split('T')[0];
      const existingData = chartData.find(item => item.week === weekKey);
      
      filledData.push({
        week: weekKey,
        count: existingData?.count || 0,
        label: weekDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }

    return NextResponse.json({
      chartData: filledData,
      totalClicks: chartData.reduce((sum, item) => sum + item.count, 0),
      filter: filter
    });

  } catch (error: any) {
    console.error('Error in contact clicks chart API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
