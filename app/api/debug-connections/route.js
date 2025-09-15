import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase/server';

export async function GET(req) {
  try {
    const supabase = supabaseServer();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    console.log('Debug connections - userId:', userId);
    
    // Test 1: Check if connection table exists and what columns it has
    const { data: tableInfo, error: tableError } = await supabase
      .from('connection')
      .select('*')
      .limit(1);
    
    console.log('Table info:', { tableInfo, tableError });
    
    // Test 2: Try to get all connections
    const { data: allConnections, error: allError } = await supabase
      .from('connection')
      .select('*');
    
    console.log('All connections:', { count: allConnections?.length, error: allError });
    
    // Test 3: If userId provided, try to get user's connections
    let userConnections = null;
    let userError = null;
    if (userId) {
      const { data, error } = await supabase
        .from('connection')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
      
      userConnections = data;
      userError = error;
      console.log('User connections:', { count: data?.length, error });
    }
    
    return NextResponse.json({
      success: true,
      tableInfo: tableInfo || null,
      tableError: tableError?.message || null,
      allConnectionsCount: allConnections?.length || 0,
      allError: allError?.message || null,
      userConnections: userConnections || null,
      userError: userError?.message || null,
      userId: userId
    });
    
  } catch (error) {
    console.error('Debug connections error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
