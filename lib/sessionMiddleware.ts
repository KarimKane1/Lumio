import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export interface SessionValidationResult {
  isValid: boolean;
  user?: any;
  error?: string;
}

export async function validateSession(request: NextRequest): Promise<SessionValidationResult> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        isValid: false,
        error: 'No authorization token provided'
      };
    }

    const token = authHeader.substring(7);
    
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify the token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return {
        isValid: false,
        error: 'Invalid or expired token'
      };
    }

    // Check if user is active (not deleted)
    if (!user.email_confirmed_at && !user.phone_confirmed_at) {
      return {
        isValid: false,
        error: 'User account not confirmed'
      };
    }

    return {
      isValid: true,
      user
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return {
      isValid: false,
      error: 'Session validation failed'
    };
  }
}

export function withSessionValidation(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const sessionResult = await validateSession(req);
    
    if (!sessionResult.isValid) {
      return NextResponse.json(
        { error: sessionResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    return handler(req, sessionResult.user);
  };
}

// Utility to check if request is from authenticated user
export function requireAuth(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return withSessionValidation(handler);
}
