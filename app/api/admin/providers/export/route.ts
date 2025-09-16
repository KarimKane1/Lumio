import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const supabase = supabaseServer();

    // Fetch all providers with their recommendation counts
    const { data: providers, error } = await supabase
      .from('provider')
      .select(`
        *,
        recommendation_count:recommendation(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching providers for export:', error);
      return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
    }

    // Transform the data
    const transformedProviders = providers?.map(provider => ({
      ...provider,
      recommendation_count: provider.recommendation_count?.[0]?.count || 0,
    })) || [];

    // Convert to CSV
    const headers = [
      'ID',
      'Name',
      'Service Type',
      'City',
      'Phone',
      'Owner User ID',
      'Recommendation Count',
      'Is Active',
      'Created At',
      'Updated At'
    ];

    const csvRows = [
      headers.join(','),
      ...transformedProviders.map(provider => [
        provider.id,
        `"${provider.name || ''}"`,
        provider.service_type,
        `"${provider.city || ''}"`,
        provider.phone_e164 || '',
        provider.owner_user_id,
        provider.recommendation_count,
        provider.is_active ? 'true' : 'false',
        provider.created_at,
        provider.updated_at
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="providers-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error in providers export API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
