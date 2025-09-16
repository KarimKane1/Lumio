import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users for export:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Convert to CSV
    const csvHeaders = [
      'Name',
      'Email', 
      'Phone',
      'City',
      'Language',
      'Role',
      'Status',
      'Joined Date'
    ];

    const csvRows = users.map(user => [
      user.name || '',
      user.email || '',
      user.phone_e164 || '',
      user.city || '',
      user.language === 'fr' ? 'French' : user.language === 'wo' ? 'Wolof' : 'English',
      user.role || 'seeker',
      user.is_active !== false ? 'Active' : 'Inactive',
      new Date(user.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
