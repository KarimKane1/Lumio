"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// Removed mock data import - using real data only
import { supabaseBrowser } from '../lib/supabase/client';
import { getSessionManager, preventBackNavigation } from '../lib/sessionManager';

interface Connection {
  id: string;
  name: string;
  location: string;
  avatar: string;
  recommendationCount: number;
  recommendations: any[];
  phone?: string;
}

interface ServiceProvider {
  id: string;
  name: string;
  serviceType: string;
  location: string;
  avatar: string;
  phone: string;
  whatsapp_intent?: string;
  recommendedBy?: string;
  isNetworkRecommendation: boolean;
  qualities: string[];
  watchFor: string[];
  recommenders?: { id: string; name: string }[];
  networkRecommenders?: { id: string; name: string }[];
}

interface User {
  id: string;
  name: string;
  phone: string;
  city: string;
  userType: 'seeker' | 'provider';
  isGuest?: boolean;
  isFirstLogin?: boolean;
  language?: 'en' | 'fr' | 'wo' | string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string, password: string, userType: 'seeker' | 'provider') => Promise<void>;
  signup: (data: {
    phone: string;
    password: string;
    name: string;
    city: string;
    userType: 'seeker' | 'provider';
    countryCode: string;
    language?: string;
  }) => Promise<void>;
  logout: () => void;
  connections: Connection[];
  availableProviders: ServiceProvider[];
  addConnection: (connection: Connection) => void;
  isGuest: boolean;
  showAuthPrompt: boolean;
  setShowAuthPrompt: (show: boolean) => void;
  promptSignIn: () => void;
  markOnboardingComplete: () => void;
  isFirstLogin: boolean;
  continueAsGuest: (userType: 'seeker' | 'provider') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [availableProviders, setAvailableProviders] = useState<ServiceProvider[]>([]);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(true);
  const [sessionManager] = useState(() => getSessionManager());

  const normalizePhone = (raw: string) => {
    if (!raw) return '';
    const digits = raw.replace(/\s+/g, '');
    if (digits.startsWith('+')) return digits;
    return `+221${digits.replace(/[^0-9]/g, '')}`;
  };

  const useEmailFallback = process.env.NEXT_PUBLIC_AUTH_EMAIL_FALLBACK === '1';
  const devEmailDomain = process.env.NEXT_PUBLIC_DEV_EMAIL_DOMAIN || 'dev.jokko.local';
  const phoneToDevEmail = (e164: string) => `${e164.replace(/[^0-9]/g, '')}@${devEmailDomain}`;

  const getCookieUserType = (): 'seeker' | 'provider' | undefined => {
    try {
      if (typeof document === 'undefined') return undefined;
      const m = (document.cookie || '').match(/(?:^|; )userType=([^;]+)/);
      const v = m ? decodeURIComponent(m[1]) : undefined;
      return v === 'provider' ? 'provider' : v === 'seeker' ? 'seeker' : undefined;
    } catch {
      return undefined;
    }
  };

  const upsertUserRow = async (
    supabaseUserId: string,
    phone: string,
    name?: string,
    city?: string,
    userType?: 'seeker' | 'provider'
  ) => {
    await supabaseBrowser.from('users').upsert({
      id: supabaseUserId,
      phone_e164: phone || null,
      name: name || null,
      user_type: userType || null,
    }, { onConflict: 'id' });
  };

  const login = async (_email: string, _password: string) => {
    // Not used in UI; keeping for compatibility
    throw new Error('Email login not implemented. Use phone login.');
  };

  const loginWithPhone = async (phone: string, password: string, userType: 'seeker' | 'provider') => {
    setLoading(true);
    try {
      const e164 = normalizePhone(phone);
      const { data, error } = useEmailFallback
        ? await supabaseBrowser.auth.signInWithPassword({ email: phoneToDevEmail(e164), password })
        : await supabaseBrowser.auth.signInWithPassword({ phone: e164, password });
      if (error) throw error;
      const sessionUser = data.user;
      if (!sessionUser) throw new Error('No user returned');
      const storedType = (sessionUser.user_metadata?.userType as 'seeker' | 'provider' | undefined) || undefined;
      if (storedType && storedType !== userType) {
        // Prevent cross-role login
        const msg = storedType === 'provider'
          ? 'This account is a Provider. Switch to Provider and sign in.'
          : 'This account is a Seeker. Switch to Seeker and sign in.';
        throw new Error(msg);
      }
      await upsertUserRow(
        sessionUser.id,
        e164,
        sessionUser.user_metadata?.name || undefined,
        sessionUser.user_metadata?.city || undefined,
        (storedType || userType)
      );
      // If logging in as provider, attempt to claim existing provider by phone
      if (userType === 'provider') {
        try {
          await fetch('/api/providers/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: sessionUser.id, phone_e164: e164 })
          });
        } catch {}
      }
      setUser({
        id: sessionUser.id,
        name: sessionUser.user_metadata?.name || '',
        phone: e164,
        city: sessionUser.user_metadata?.city || '',
        userType: (storedType || userType),
        isFirstLogin: false,
        language: (sessionUser.user_metadata?.language as any) || 'en',
      });
      try {
        if (typeof document !== 'undefined') {
          document.cookie = `userType=${storedType || userType}; Path=/; SameSite=Lax`;
        }
      } catch {}
      setIsFirstLogin(false);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: {
    phone: string;
    password: string;
    name: string;
    city: string;
    userType: 'seeker' | 'provider';
    countryCode: string;
    language?: string;
  }) => {
    setLoading(true);
    try {
      const fullPhone = normalizePhone(`${data.countryCode}${data.phone}`);
      
      // TODO: Add phone number validation back after fixing TypeScript issues
      // For now, we'll rely on Supabase's unique constraint to prevent duplicates
      
      const signUpCall = useEmailFallback
        ? supabaseBrowser.auth.signUp({
            email: phoneToDevEmail(fullPhone),
            password: data.password,
            options: { data: { name: data.name, city: data.city, userType: data.userType, phone_e164: fullPhone, language: data.language || (typeof window !== 'undefined' && localStorage.getItem('pref:lang')) || 'en' } },
          })
        : supabaseBrowser.auth.signUp({
            phone: fullPhone,
            password: data.password,
            options: { data: { name: data.name, city: data.city, userType: data.userType, language: data.language || (typeof window !== 'undefined' && localStorage.getItem('pref:lang')) || 'en' } },
          });
      const { data: signUpRes, error } = await signUpCall;
      if (error) throw error;
      const supaUser = signUpRes.user;
      if (supaUser) {
        await upsertUserRow(supaUser.id, fullPhone, data.name, data.city, data.userType);
        setUser({
          id: supaUser.id,
          name: data.name,
          phone: fullPhone,
          city: data.city,
          userType: data.userType,
          isFirstLogin: true,
          language: (data.language as any) || 'en',
        });
        try {
          if (typeof document !== 'undefined') {
            document.cookie = `userType=${data.userType}; Path=/; SameSite=Lax`;
          }
        } catch {}
        setIsFirstLogin(true);
      }
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const continueAsGuest = async (userType: 'seeker' | 'provider') => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser({
        id: 'guest',
        name: 'Guest User',
        phone: '',
        city: '',
        userType: 'seeker',
        isGuest: true,
        isFirstLogin: true
      });
      setIsFirstLogin(true);
    } catch (error) {
      console.error('Guest login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear local state first
      setUser(null);
      setConnections([]);
      setIsFirstLogin(false);
      
      // Clear any cached data
      if (typeof window !== 'undefined') {
        // Clear React Query cache
        const queryClient = (window as any).__REACT_QUERY_CLIENT__;
        if (queryClient) {
          queryClient.clear();
        }
        
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear cookies
        document.cookie = 'userType=; Max-Age=0; Path=/; SameSite=Lax';
        document.cookie = 'session_token=; Max-Age=0; Path=/; SameSite=Lax';
        
        // Sign out from Supabase
        await supabaseBrowser.auth.signOut();
        
        // Prevent back button navigation
        window.history.replaceState(null, '', '/auth');
        
        // Force redirect to auth page
        window.location.href = '/auth';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    }
  };

  const addConnection = (connection: Connection) => {
    setConnections(prev => [...prev, connection]);
  };

  const promptSignIn = () => {
    setShowAuthPrompt(true);
  };

  const markOnboardingComplete = async () => {
    setIsFirstLogin(false);
    // Save onboarding completion to user metadata
    if (user) {
      supabaseBrowser.auth.updateUser({
        data: { hasCompletedOnboarding: true }
      }).catch(error => {
        console.error('Failed to update onboarding status:', error);
      });
    }
  };

  // Initialize session and listen for changes
  useEffect(() => {
    let unsub: any;
    const init = async () => {
      try {
        const { data } = await supabaseBrowser.auth.getSession();
        const sessionUser = data?.session?.user;
        if (sessionUser) {
          const derivedType = (sessionUser.user_metadata?.userType as any) || getCookieUserType() || 'seeker';
          setUser({
            id: sessionUser.id,
            name: sessionUser.user_metadata?.name || '',
            phone: (sessionUser.phone || sessionUser.user_metadata?.phone_e164 || ''),
            city: sessionUser.user_metadata?.city || '',
            userType: derivedType,
            isFirstLogin: !sessionUser.user_metadata?.hasCompletedOnboarding,
            language: (sessionUser.user_metadata?.language as any) || 'en',
          });
          setIsFirstLogin(false);
        }
      } finally {
        setLoading(false);
      }
      
      const sub = supabaseBrowser.auth.onAuthStateChange((event, session) => {
        const sessionUser = session?.user;
        if (!sessionUser) {
          setUser(null);
          return;
        }
        
        const derivedType = (sessionUser.user_metadata?.userType as any) || getCookieUserType() || 'seeker';
        setUser((prev) => ({
          id: sessionUser.id,
          name: sessionUser.user_metadata?.name || prev?.name || '',
          phone: (sessionUser.phone || sessionUser.user_metadata?.phone_e164 || prev?.phone || ''),
          city: sessionUser.user_metadata?.city || prev?.city || '',
          userType: derivedType,
          isFirstLogin: !sessionUser.user_metadata?.hasCompletedOnboarding,
          language: (sessionUser.user_metadata?.language as any) || prev?.language || 'en',
        }));
      });
      unsub = sub.data.subscription;
    };
    init();
    
    return () => {
      try { 
        unsub?.unsubscribe?.(); 
        sessionManager.destroy();
      } catch {}
    };
  }, [sessionManager]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      loginWithPhone,
      signup,
      logout,
      continueAsGuest,
      connections,
      availableProviders,
      addConnection,
      isGuest: user?.isGuest || false,
      showAuthPrompt,
      setShowAuthPrompt,
      promptSignIn,
      markOnboardingComplete,
      isFirstLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}