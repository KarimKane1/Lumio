import { NextResponse } from 'next/server';
import { RateLimiter } from './rateLimit';

export function withRateLimit(
  rateLimiter: RateLimiter,
  options: {
    skipSuccessfulRequests?: boolean;
    message?: string;
  } = {}
) {
  return async function rateLimitMiddleware(req: Request) {
    const { allowed, remaining, resetTime } = await rateLimiter.checkLimit(req);
    
    if (!allowed) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      return NextResponse.json(
        { 
          error: options.message || 'Too many requests. Please try again later.',
          retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': rateLimiter['config'].maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toString(),
          }
        }
      );
    }
    
    // Return null to indicate rate limit passed (no response needed)
    return null;
  };
}
