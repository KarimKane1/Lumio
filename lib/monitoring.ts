// Basic monitoring and alerting utilities

interface MonitoringEvent {
  type: 'error' | 'warning' | 'info' | 'security';
  message: string;
  context?: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

class MonitoringService {
  private static instance: MonitoringService;
  private events: MonitoringEvent[] = [];
  private maxEvents = 1000; // Keep last 1000 events in memory

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  public log(event: Omit<MonitoringEvent, 'timestamp'>): void {
    const monitoringEvent: MonitoringEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    // Add to in-memory store
    this.events.unshift(monitoringEvent);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    // Log to console with structured format
    console.log(`[${monitoringEvent.type.toUpperCase()}] ${monitoringEvent.message}`, {
      context: monitoringEvent.context,
      userId: monitoringEvent.userId,
      metadata: monitoringEvent.metadata,
      timestamp: monitoringEvent.timestamp
    });

    // In production, you would send this to a monitoring service
    // like Sentry, DataDog, New Relic, etc.
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(monitoringEvent);
    }
  }

  public logError(message: string, context?: string, userId?: string, metadata?: Record<string, any>): void {
    this.log({
      type: 'error',
      message,
      context,
      userId,
      metadata
    });
  }

  public logWarning(message: string, context?: string, userId?: string, metadata?: Record<string, any>): void {
    this.log({
      type: 'warning',
      message,
      context,
      userId,
      metadata
    });
  }

  public logSecurity(message: string, context?: string, userId?: string, metadata?: Record<string, any>): void {
    this.log({
      type: 'security',
      message,
      context,
      userId,
      metadata
    });
  }

  public logInfo(message: string, context?: string, userId?: string, metadata?: Record<string, any>): void {
    this.log({
      type: 'info',
      message,
      context,
      userId,
      metadata
    });
  }

  public getRecentEvents(type?: MonitoringEvent['type'], limit: number = 50): MonitoringEvent[] {
    let filtered = this.events;
    
    if (type) {
      filtered = this.events.filter(event => event.type === type);
    }
    
    return filtered.slice(0, limit);
  }

  public getErrorCount(timeWindowMinutes: number = 60): number {
    const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    return this.events.filter(event => 
      event.type === 'error' && 
      new Date(event.timestamp) > cutoff
    ).length;
  }

  public getSecurityEventCount(timeWindowMinutes: number = 60): number {
    const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    return this.events.filter(event => 
      event.type === 'security' && 
      new Date(event.timestamp) > cutoff
    ).length;
  }

  private sendToMonitoringService(event: MonitoringEvent): void {
    // In production, implement actual monitoring service integration
    // Examples:
    
    // Sentry
    // Sentry.captureException(new Error(event.message), {
    //   tags: { type: event.type, context: event.context },
    //   user: { id: event.userId },
    //   extra: event.metadata
    // });
    
    // DataDog
    // datadog.increment('app.events', 1, [`type:${event.type}`]);
    
    // Custom webhook
    // fetch(process.env.MONITORING_WEBHOOK_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // });
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();

// Convenience functions
export const logError = (message: string, context?: string, userId?: string, metadata?: Record<string, any>) => {
  monitoring.logError(message, context, userId, metadata);
};

export const logWarning = (message: string, context?: string, userId?: string, metadata?: Record<string, any>) => {
  monitoring.logWarning(message, context, userId, metadata);
};

export const logSecurity = (message: string, context?: string, userId?: string, metadata?: Record<string, any>) => {
  monitoring.logSecurity(message, context, userId, metadata);
};

export const logInfo = (message: string, context?: string, userId?: string, metadata?: Record<string, any>) => {
  monitoring.logInfo(message, context, userId, metadata);
};

// Rate limiting monitoring
export const logRateLimitExceeded = (ip: string, endpoint: string, userId?: string) => {
  logSecurity('Rate limit exceeded', 'rate_limiting', userId, {
    ip,
    endpoint,
    timestamp: new Date().toISOString()
  });
};

// Authentication monitoring
export const logAuthFailure = (reason: string, ip: string, userId?: string) => {
  logSecurity('Authentication failure', 'auth', userId, {
    reason,
    ip,
    timestamp: new Date().toISOString()
  });
};

export const logAuthSuccess = (userId: string, ip: string) => {
  logInfo('Authentication success', 'auth', userId, {
    ip,
    timestamp: new Date().toISOString()
  });
};

// Database monitoring
export const logDatabaseError = (operation: string, error: any, userId?: string) => {
  logError('Database operation failed', 'database', userId, {
    operation,
    error: error.message,
    code: error.code
  });
};

// API monitoring
export const logApiCall = (method: string, endpoint: string, statusCode: number, duration: number, userId?: string) => {
  const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warning' : 'info';
  monitoring.log({
    type: level,
    message: `API ${method} ${endpoint} - ${statusCode}`,
    context: 'api',
    userId,
    metadata: {
      method,
      endpoint,
      statusCode,
      duration
    }
  });
};
