import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase/server';

export async function GET() {
  const supabase = supabaseServer();
  
  try {
    // Check connection table structure
    const { data: connectionData, error: connectionError } = await supabase
      .from('connection')
      .select('*')
      .limit(1);
    
    if (connectionError) {
      return NextResponse.json({
        error: 'Connection table error',
        details: connectionError.message
      }, { status: 500 });
    }
    
    // Get column names from the first row
    const connectionColumns = connectionData && connectionData.length > 0 ? Object.keys(connectionData[0]) : [];
    
    // Check connection_request table structure
    const { data: requestData, error: requestError } = await supabase
      .from('connection_request')
      .select('*')
      .limit(1);
    
    const requestColumns = requestData && requestData.length > 0 ? Object.keys(requestData[0]) : [];
    
    return NextResponse.json({
      connectionTable: {
        columns: connectionColumns,
        sampleData: connectionData
      },
      connectionRequestTable: {
        columns: requestColumns,
        sampleData: requestData
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Schema check failed',
      details: error.message
    }, { status: 500 });
  }
}
