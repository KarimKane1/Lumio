// Centralized error handling utilities

export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
  details?: any;
}

export class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

// Common error types
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
} as const;

// Error factory functions
export function createValidationError(message: string, details?: any): AppError {
  return new AppError(message, 400, ErrorCodes.VALIDATION_ERROR, details);
}

export function createAuthenticationError(message: string = 'Authentication required'): AppError {
  return new AppError(message, 401, ErrorCodes.AUTHENTICATION_ERROR);
}

export function createAuthorizationError(message: string = 'Access denied'): AppError {
  return new AppError(message, 403, ErrorCodes.AUTHORIZATION_ERROR);
}

export function createNotFoundError(message: string = 'Resource not found'): AppError {
  return new AppError(message, 404, ErrorCodes.NOT_FOUND);
}

export function createRateLimitError(message: string = 'Too many requests'): AppError {
  return new AppError(message, 429, ErrorCodes.RATE_LIMIT_EXCEEDED);
}

export function createInternalError(message: string = 'Internal server error'): AppError {
  return new AppError(message, 500, ErrorCodes.INTERNAL_ERROR);
}

export function createDatabaseError(message: string, originalError?: any): AppError {
  return new AppError(message, 500, ErrorCodes.DATABASE_ERROR, originalError);
}

// Error handler for API routes
export function handleApiError(error: any): { message: string; statusCode: number; code?: string; details?: any } {
  console.error('API Error:', error);

  // If it's already an AppError, return it
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      details: error.details
    };
  }

  // Handle specific error types
  if (error.code === 'PGRST116') {
    return {
      message: 'Resource not found',
      statusCode: 404,
      code: ErrorCodes.NOT_FOUND
    };
  }

  if (error.code === '23505') {
    return {
      message: 'Resource already exists',
      statusCode: 409,
      code: 'DUPLICATE_ERROR'
    };
  }

  if (error.code === '23503') {
    return {
      message: 'Referenced resource not found',
      statusCode: 400,
      code: 'FOREIGN_KEY_ERROR'
    };
  }

  // Handle Supabase auth errors
  if (error.message?.includes('JWT')) {
    return {
      message: 'Invalid or expired token',
      statusCode: 401,
      code: ErrorCodes.AUTHENTICATION_ERROR
    };
  }

  // Handle network errors
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return {
      message: 'Service temporarily unavailable',
      statusCode: 503,
      code: ErrorCodes.EXTERNAL_SERVICE_ERROR
    };
  }

  // Default to internal server error
  return {
    message: 'Internal server error',
    statusCode: 500,
    code: ErrorCodes.INTERNAL_ERROR
  };
}

// Safe error response creator
export function createErrorResponse(error: any) {
  const handledError = handleApiError(error);
  
  // In production, don't expose internal details
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    error: handledError.message,
    code: handledError.code,
    ...(isProduction ? {} : { details: handledError.details }),
    ...(isProduction ? {} : { stack: error.stack })
  };
}

// Log error for monitoring
export function logError(error: any, context?: string) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    message: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode
  };
  
  console.error('Error logged:', JSON.stringify(errorInfo, null, 2));
  
  // In production, you might want to send this to a monitoring service
  // like Sentry, DataDog, etc.
}
