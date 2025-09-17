import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get all table names
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return NextResponse.json(
        { error: 'Failed to fetch tables' },
        { status: 500 }
      );
    }

    const schemaInfo: any = {
      database_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      tables: {}
    };

    // For each table, get column information
    for (const table of tables || []) {
      const tableName = table.table_name;
      
      try {
        // Get column information
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
          .order('ordinal_position');

        if (columnsError) {
          console.error(`Error fetching columns for ${tableName}:`, columnsError);
          schemaInfo.tables[tableName] = { error: columnsError.message };
          continue;
        }

        // Get row count
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        schemaInfo.tables[tableName] = {
          columns: columns || [],
          row_count: countError ? 'error' : count || 0,
          column_names: (columns || []).map(col => col.column_name)
        };

        // For connection table specifically, get sample data
        if (tableName === 'connection') {
          const { data: sampleData, error: sampleError } = await supabase
            .from(tableName)
            .select('*')
            .limit(3);
          
          if (!sampleError && sampleData) {
            schemaInfo.tables[tableName].sample_data = sampleData;
          }
        }

        // For users table, get sample data
        if (tableName === 'users') {
          const { data: sampleData, error: sampleError } = await supabase
            .from(tableName)
            .select('id, name, email, phone_e164, created_at')
            .limit(3);
          
          if (!sampleError && sampleData) {
            schemaInfo.tables[tableName].sample_data = sampleData;
          }
        }

      } catch (error) {
        console.error(`Error processing table ${tableName}:`, error);
        schemaInfo.tables[tableName] = { error: 'Failed to process table' };
      }
    }

    return NextResponse.json(schemaInfo, { status: 200 });

  } catch (error) {
    console.error('Schema check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
