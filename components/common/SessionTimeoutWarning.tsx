"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSessionManager } from '../../lib/sessionManager';

interface SessionTimeoutWarningProps {
  warningTime?: number; // Time in milliseconds before timeout to show warning
}

export default function SessionTimeoutWarning({ 
  warningTime = 5 * 60 * 1000 // 5 minutes before timeout
}: SessionTimeoutWarningProps) {
  const { user } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sessionManager] = useState(() => getSessionManager());

  useEffect(() => {
    if (!user || user.isGuest) return;

    let warningTimer: NodeJS.Timeout;
    let countdownTimer: NodeJS.Timeout;

    const setupWarningTimer = () => {
      // Clear existing timers
      if (warningTimer) clearTimeout(warningTimer);
      if (countdownTimer) clearInterval(countdownTimer);

      // Set warning timer (5 minutes before actual timeout)
      warningTimer = setTimeout(() => {
        setShowWarning(true);
        setTimeRemaining(warningTime);

        // Start countdown
        countdownTimer = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1000) {
              // Time's up - logout
              sessionManager.logout();
              return 0;
            }
            return prev - 1000;
          });
        }, 1000);
      }, warningTime);
    };

    // Initial setup
    setupWarningTimer();

    // Reset timer on user activity
    const resetTimer = () => {
      setShowWarning(false);
      setTimeRemaining(0);
      setupWarningTimer();
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      if (warningTimer) clearTimeout(warningTimer);
      if (countdownTimer) clearInterval(countdownTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [user, warningTime, sessionManager]);

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    setTimeRemaining(0);
    // Reset the session manager's activity tracking
    sessionManager.updateActivity();
  };

  const handleLogout = () => {
    sessionManager.logout();
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Session Timeout Warning
          </h3>
          
          <p className="text-gray-600 mb-4">
            Your session will expire in{' '}
            <span className="font-mono font-bold text-red-600">
              {formatTime(timeRemaining)}
            </span>
            {' '}due to inactivity.
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={handleLogout}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Logout Now
            </button>
            <button
              onClick={handleStayLoggedIn}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Stay Logged In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
