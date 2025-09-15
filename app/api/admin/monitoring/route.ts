import { NextResponse } from 'next/server';
import { monitoring } from '../../../../lib/monitoring';

export async function GET() {
  try {
    // Get recent events by type
    const errors = monitoring.getRecentEvents('error', 20);
    const warnings = monitoring.getRecentEvents('warning', 20);
    const securityEvents = monitoring.getRecentEvents('security', 20);
    const infoEvents = monitoring.getRecentEvents('info', 20);

    // Get counts for different time windows
    const errorCounts = {
      lastHour: monitoring.getErrorCount(60),
      last24Hours: monitoring.getErrorCount(24 * 60),
      lastWeek: monitoring.getErrorCount(7 * 24 * 60)
    };

    const securityCounts = {
      lastHour: monitoring.getSecurityEventCount(60),
      last24Hours: monitoring.getSecurityEventCount(24 * 60),
      lastWeek: monitoring.getSecurityEventCount(7 * 24 * 60)
    };

    const response = {
      timestamp: new Date().toISOString(),
      summary: {
        errorCounts,
        securityCounts
      },
      recentEvents: {
        errors,
        warnings,
        securityEvents,
        infoEvents
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Monitoring data fetch failed:', error);
    return NextResponse.json({
      error: 'Failed to fetch monitoring data'
    }, { status: 500 });
  }
}
