"use client";
import { supabaseBrowser } from './supabase/client';

export interface SessionConfig {
  sessionTimeout: number; // in milliseconds
  refreshThreshold: number; // in milliseconds - when to refresh before expiry
  maxInactivity: number; // in milliseconds - max time without activity
}

export class SessionManager {
  private config: SessionConfig;
  private refreshTimer: NodeJS.Timeout | null = null;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private isActive: boolean = true;

  constructor(config: SessionConfig) {
    this.config = config;
    this.setupActivityTracking();
    this.setupInactivityTimer();
  }

  private setupActivityTracking() {
    if (typeof window === 'undefined') return;

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetInactivityTimer = () => {
      this.lastActivity = Date.now();
      this.isActive = true;
      this.setupInactivityTimer();
    };

    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.isActive = false;
      } else {
        this.isActive = true;
        this.lastActivity = Date.now();
        this.setupInactivityTimer();
      }
    });
  }

  private setupInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = setTimeout(() => {
      this.handleInactivityTimeout();
    }, this.config.maxInactivity);
  }

  private handleInactivityTimeout() {
    console.log('Session timeout due to inactivity');
    this.logout();
  }

  public async validateSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabaseBrowser.auth.getSession();
      
      if (error || !session) {
        console.log('No valid session found');
        return false;
      }

      // Check if session is expired
      const now = Date.now();
      const expiresAt = session.expires_at ? session.expires_at * 1000 : now + this.config.sessionTimeout;
      
      if (expiresAt <= now) {
        console.log('Session expired');
        return false; // Don't auto-logout here, let the component handle it
      }

      // Check inactivity
      const timeSinceActivity = now - this.lastActivity;
      if (timeSinceActivity > this.config.maxInactivity) {
        console.log('Session timeout due to inactivity');
        return false; // Don't auto-logout here, let the component handle it
      }

      // Setup refresh timer if needed
      this.setupRefreshTimer(expiresAt);
      
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  private setupRefreshTimer(expiresAt: number) {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    const refreshTime = Math.max(timeUntilExpiry - this.config.refreshThreshold, 0);

    this.refreshTimer = setTimeout(async () => {
      await this.refreshSession();
    }, refreshTime);
  }

  private async refreshSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabaseBrowser.auth.getSession();
      
      if (error || !session) {
        console.log('Cannot refresh - no session');
        return false;
      }

      // Refresh the session
      const { data: refreshData, error: refreshError } = await supabaseBrowser.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.log('Session refresh failed:', refreshError);
        await this.logout();
        return false;
      }

      console.log('Session refreshed successfully');
      this.setupRefreshTimer(refreshData.session.expires_at * 1000);
      return true;
    } catch (error) {
      console.error('Session refresh error:', error);
      await this.logout();
      return false;
    }
  }

  public async logout(): Promise<void> {
    try {
      // Clear timers
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer);
        this.inactivityTimer = null;
      }

      // Sign out from Supabase
      await supabaseBrowser.auth.signOut();

      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('session_data');
        sessionStorage.clear();
        
        // Clear cookies
        document.cookie = 'userType=; Max-Age=0; Path=/; SameSite=Lax';
        document.cookie = 'session_token=; Max-Age=0; Path=/; SameSite=Lax';
        
        // Prevent back button navigation
        window.history.replaceState(null, '', '/auth');
        
        // Redirect to auth page
        window.location.href = '/auth';
      }
    } catch (error) {
      console.error('SessionManager logout error:', error);
      // Force redirect even if logout fails
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    }
  }

  public updateActivity(): void {
    this.lastActivity = Date.now();
    this.isActive = true;
    this.setupInactivityTimer();
  }

  public destroy(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
  }
}

// Default configuration
export const defaultSessionConfig: SessionConfig = {
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  refreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
  maxInactivity: 2 * 60 * 60 * 1000, // 2 hours of inactivity
};

// Create singleton instance
let sessionManagerInstance: SessionManager | null = null;

export function getSessionManager(config: SessionConfig = defaultSessionConfig): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager(config);
  }
  return sessionManagerInstance;
}

// Utility function to prevent back button after logout
export function preventBackNavigation(): void {
  if (typeof window === 'undefined') return;
  
  // Push a new state to prevent back navigation
  window.history.pushState(null, '', window.location.href);
  
  // Listen for back button
  window.addEventListener('popstate', (event) => {
    // Push the state again to prevent going back
    window.history.pushState(null, '', window.location.href);
    
    // Optionally redirect to auth page
    if (window.location.pathname !== '/auth') {
      window.location.href = '/auth';
    }
  });
}
