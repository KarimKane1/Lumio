import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server';
import { getUserCounts } from '../../../../lib/userCounting';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const granularity = searchParams.get('granularity') || 'weekly'; // daily, weekly, monthly
    const limit = parseInt(searchParams.get('limit') || '12'); // number of weeks to show

    const supabase = supabaseServer();

    // Default to last 8 weeks
    const endOfRange = new Date();
    const startOfRange = new Date();
    startOfRange.setDate(startOfRange.getDate() - (8 * 7)); // 8 weeks ago

    // Generate weekly user growth data with breakdown by type
    const generateUserGrowthData = async () => {
      // First, find the actual earliest user creation date
      const { data: earliestUser } = await supabase
        .from('users')
        .select('created_at')
        .order('created_at', { ascending: true })
        .limit(1);

      if (!earliestUser || earliestUser.length === 0) {
        return []; // No users yet
      }

      const firstUserDate = new Date(earliestUser[0].created_at);
      console.log('Earliest user created at:', firstUserDate.toISOString());
      
      // Start from the week containing the first user
      const firstWeekStart = new Date(firstUserDate);
      firstWeekStart.setDate(firstWeekStart.getDate() - firstWeekStart.getDay()); // Start of week (Sunday)
      firstWeekStart.setHours(0, 0, 0, 0);

      const data = [];
      const currentDate = new Date();
      
      // Generate weekly data starting from first user's week, but limit to 8 weeks max
      let weekStart = new Date(firstWeekStart);
      let weekNumber = 1;
      
      while (weekStart <= currentDate && weekNumber <= 8) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        // Get accurate user counts up to this week using shared logic
        const { totalUsers, seekers, providers } = await getUserCounts(supabase, weekEnd);

        data.push({
          date: weekStart.toISOString().split('T')[0],
          totalUsers,
          seekers,
          providers,
          label: `Week ${weekNumber} (${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
        });

        // Move to next week
        weekStart.setDate(weekStart.getDate() + 7);
        weekNumber++;
      }
      
      return data;
    };

    const userGrowthData = await generateUserGrowthData();

    return NextResponse.json({
      data: userGrowthData,
      granularity: 'weekly',
      totalDataPoints: userGrowthData.length,
      startDate: startOfRange.toISOString().split('T')[0],
      endDate: endOfRange.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Error fetching user growth data:', error);
    return NextResponse.json({ error: 'Failed to fetch user growth data' }, { status: 500 });
  }
}
