import { NextResponse } from 'next/server';
import { monitoring } from '../../../lib/monitoring';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    };

    // Get monitoring stats
    const errorCount = monitoring.getErrorCount(60); // Last hour
    const securityEventCount = monitoring.getSecurityEventCount(60); // Last hour
    const recentErrors = monitoring.getRecentEvents('error', 5);
    const recentSecurityEvents = monitoring.getRecentEvents('security', 5);

    // Determine overall health status
    let status = 'healthy';
    if (errorCount > 10) {
      status = 'degraded';
    }
    if (errorCount > 50 || securityEventCount > 5) {
      status = 'unhealthy';
    }

    const response = {
      ...health,
      status,
      monitoring: {
        errorsLastHour: errorCount,
        securityEventsLastHour: securityEventCount,
        recentErrors: recentErrors.map(e => ({
          message: e.message,
          context: e.context,
          timestamp: e.timestamp
        })),
        recentSecurityEvents: recentSecurityEvents.map(e => ({
          message: e.message,
          context: e.context,
          timestamp: e.timestamp
        }))
      },
      responseTime: Date.now() - startTime
    };

    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, { status: 503 });
  }
}