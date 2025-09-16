import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Skip middleware for admin login page
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Skip middleware for browser requests to admin pages
  // Browser requests don't have authorization headers, so we let the client-side auth handle it
  const userAgent = request.headers.get('user-agent') || '';
  const isBrowserRequest = userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari');
  
  if (isBrowserRequest) {
    return NextResponse.next();
  }

  try {
    // Get the authorization header (for API requests)
    const authorization = request.headers.get('authorization');
    
    if (!authorization) {
      // Redirect to admin login if no auth header
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Extract token from "Bearer <token>"
    const token = authorization.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // For now, just check if token exists - actual verification will be done in API routes
    // This prevents build-time Supabase imports
    if (token && token.length > 10) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL('/admin/login', request.url));

  } catch (error) {
    console.error('Admin middleware error:', error);
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
