"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { getSessionManager } from '../../lib/sessionManager';

interface SessionGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function SessionGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth' 
}: SessionGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [sessionManager] = useState(() => getSessionManager());

  useEffect(() => {
    const validateSession = async () => {
      if (loading) return;

      try {
        // For auth pages, don't validate session - just check if user exists
        if (!requireAuth) {
          if (user) {
            console.log('User already authenticated, redirecting to app');
            router.push('/');
          } else {
            setIsValidating(false);
          }
          return;
        }

        // For protected pages, validate session
        if (requireAuth) {
          if (!user) {
            console.log('No user found, redirecting to auth');
            router.push(redirectTo);
            return;
          }

          // Only validate session if user exists
          const isValid = await sessionManager.validateSession();
          
          if (!isValid) {
            console.log('Session validation failed, redirecting to auth');
            router.push(redirectTo);
            return;
          }

          setIsValidating(false);
        }
      } catch (error) {
        console.error('Session validation error:', error);
        if (requireAuth) {
          router.push(redirectTo);
        } else {
          setIsValidating(false);
        }
      }
    };

    validateSession();
  }, [user, loading, requireAuth, redirectTo, router, sessionManager]);

  // Show loading while validating
  if (loading || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Higher-order component for protecting routes
export function withSessionGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: { requireAuth?: boolean; redirectTo?: string } = {}
) {
  return function SessionGuardedComponent(props: P) {
    return (
      <SessionGuard {...options}>
        <Component {...props} />
      </SessionGuard>
    );
  };
}
