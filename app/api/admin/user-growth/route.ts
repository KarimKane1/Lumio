import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const granularity = searchParams.get('granularity') || 'daily'; // daily, weekly, monthly
    const userType = searchParams.get('userType') || 'all'; // all, seeker, provider
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '30'); // number of data points to show

    const supabase = supabaseServer();

    // Calculate date range based on granularity
    let startOfRange: Date;
    let endOfRange = new Date();

    if (startDate && endDate) {
      startOfRange = new Date(startDate);
      endOfRange = new Date(endDate);
    } else {
      // Default ranges based on granularity
      switch (granularity) {
        case 'daily':
          startOfRange = new Date();
          startOfRange.setDate(startOfRange.getDate() - limit + 1);
          break;
        case 'weekly':
          startOfRange = new Date();
          startOfRange.setDate(startOfRange.getDate() - (limit * 7) + 1);
          break;
        case 'monthly':
          startOfRange = new Date();
          startOfRange.setMonth(startOfRange.getMonth() - limit + 1);
          break;
        default:
          startOfRange = new Date();
          startOfRange.setDate(startOfRange.getDate() - 30);
      }
    }

    // Generate user growth data based on granularity
    const generateUserGrowthData = async () => {
      const data = [];
      
      if (granularity === 'daily') {
        // Daily data
        const days = Math.ceil((endOfRange.getTime() - startOfRange.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        for (let i = 0; i < days; i++) {
          const date = new Date(startOfRange);
          date.setDate(date.getDate() + i);
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);

          const count = await getUsersInRange(startOfDay, endOfDay, userType);
          data.push({
            date: date.toISOString().split('T')[0],
            count: count,
            label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          });
        }
      } else if (granularity === 'weekly') {
        // Weekly data
        const weeks = Math.ceil((endOfRange.getTime() - startOfRange.getTime()) / (1000 * 60 * 60 * 24 * 7));
        for (let i = 0; i < weeks; i++) {
          const weekStart = new Date(startOfRange);
          weekStart.setDate(weekStart.getDate() + (i * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);

          const count = await getUsersInRange(weekStart, weekEnd, userType);
          data.push({
            date: weekStart.toISOString().split('T')[0],
            count: count,
            label: `Week ${i + 1} (${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
          });
        }
      } else if (granularity === 'monthly') {
        // Monthly data
        const months = Math.ceil((endOfRange.getTime() - startOfRange.getTime()) / (1000 * 60 * 60 * 24 * 30));
        for (let i = 0; i < months; i++) {
          const monthStart = new Date(startOfRange);
          monthStart.setMonth(monthStart.getMonth() + i);
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          
          const monthEnd = new Date(monthStart);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          monthEnd.setDate(0);
          monthEnd.setHours(23, 59, 59, 999);

          const count = await getUsersInRange(monthStart, monthEnd, userType);
          data.push({
            date: monthStart.toISOString().split('T')[0],
            count: count,
            label: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
          });
        }
      }
      
      return data;
    };

    // Helper function to get users in a date range
    const getUsersInRange = async (startDate: Date, endDate: Date, userType: string) => {
      let query = supabase
        .from('users')
        .select('phone_e164, user_type')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const { data: users } = await query;
      
      // Deduplicate by phone number
      const uniquePhones = new Set(users?.map(u => u.phone_e164).filter(Boolean) || []);
      let count = uniquePhones.size;

      // Filter by user type if specified - match database logic exactly
      if (userType && userType !== 'all') {
        const filteredUsers = users?.filter(u => {
          if (userType === 'seeker') {
            return u.user_type === 'seeker';
          }
          return u.user_type === userType;
        }) || [];
        const filteredPhones = new Set(filteredUsers.map(u => u.phone_e164).filter(Boolean));
        count = filteredPhones.size;
      }

      return count;
    };

    const userGrowthData = await generateUserGrowthData();

    return NextResponse.json({
      data: userGrowthData,
      granularity,
      userType,
      totalDataPoints: userGrowthData.length,
      startDate: startOfRange.toISOString().split('T')[0],
      endDate: endOfRange.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Error fetching user growth data:', error);
    return NextResponse.json({ error: 'Failed to fetch user growth data' }, { status: 500 });
  }
}
