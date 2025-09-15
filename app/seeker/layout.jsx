"use client";
import React from 'react';
import Header from '../../components/bolt/layout/Header';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../components/context/AuthContext';
import EmbeddedOnboarding from '../../components/bolt/onboarding/EmbeddedOnboarding';
import { useI18n } from '../../context/I18nContext';
import RequestsBanner from '../../components/bolt/common/RequestsBanner';
import GlobalAcceptanceBanner from '../../components/bolt/common/GlobalAcceptanceBanner';
import SessionGuard from '../../components/common/SessionGuard';
import SessionTimeoutWarning from '../../components/common/SessionTimeoutWarning';

const tabs = [
  { id: 'services', label: 'Services', href: '/seeker/services' },
  { id: 'connections', label: 'Connections', href: '/seeker/connections' },
  { id: 'recommendations', label: 'My Recommendations', href: '/seeker/recommendations' },
  { id: 'profile', label: 'Profile', href: '/seeker/profile' },
];

export default function SeekerLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = tabs.find(t => pathname?.startsWith(t.href))?.id || 'services';
  const { user, isFirstLogin, markOnboardingComplete, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const { t } = useI18n();

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = user?.id ? `onboardingShown:${user.id}` : 'onboardingShown';
    const alreadyShown = localStorage.getItem(key) === '1';
    const path = window.location?.pathname || '';
    // Do not show onboarding when deep-linked to add recommendation flow
    const isDeepLinkAdd = path.includes('/seeker/recommendations/new');
    
    if (!alreadyShown && user?.isFirstLogin && !isDeepLinkAdd) {
      // Automatically navigate to connections tab and show onboarding
      if (path !== '/seeker/connections') {
        router.push('/seeker/connections');
        // Wait for navigation to complete before showing onboarding
        setTimeout(() => setShowOnboarding(true), 100);
      } else {
        // Only show onboarding on the connections page initially
        setShowOnboarding(true);
      }
    } else if (path !== '/seeker/connections' && path !== '/seeker/recommendations' && path !== '/seeker/services') {
      // Hide onboarding if not on one of the onboarding pages
      setShowOnboarding(false);
    }
  }, [user?.id, user?.isFirstLogin, isFirstLogin, pathname, router]);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    markOnboardingComplete?.();
    if (typeof window !== 'undefined') {
      const key = user?.id ? `onboardingShown:${user.id}` : 'onboardingShown';
      localStorage.setItem(key, '1');
    }
  };

  // Redirect to /auth when logged out (but wait for session to resolve)
  React.useEffect(() => {
    // Only redirect after we know auth status for sure
    if (loading) return;
    if (!user) {
      router.replace('/auth');
      return;
    }
    if (user.userType !== 'seeker') {
      router.replace('/auth');
    }
  }, [user, loading, router]);

  const handleOnboardingTabChange = (tabId) => {
    const t = tabs.find(t => t.id === tabId);
    if (t) router.push(t.href);
  };
  if (loading) return <div className="min-h-screen bg-gray-50" />;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header userType="seeker" />
      <div className="max-w-6xl mx-auto px-2 md:px-4">
        <RequestsBanner />
      </div>
      <GlobalAcceptanceBanner />
      <div className="max-w-6xl mx-auto px-2 md:px-4">
        <div className="py-4 pb-24 md:pb-28">{children}</div>
      </div>
      {/* Bottom navigation (Bolt-style) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-1 md:px-4 py-1 md:py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-around">
            <Link
              href="/seeker/connections"
              className={`flex flex-col items-center py-1 md:py-2 px-1 md:px-4 rounded-lg transition-colors ${active === 'connections' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600'}`}
            >
              <span className="text-base md:text-2xl mb-0.5 md:mb-1">👥</span>
              <span className="text-xs font-medium leading-tight">{t('nav.connections')}</span>
            </Link>
            <Link
              href="/seeker/services"
              className={`flex flex-col items-center py-1 md:py-2 px-1 md:px-4 rounded-lg transition-colors ${active === 'services' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600'}`}
            >
              <span className="text-base md:text-2xl mb-0.5 md:mb-1">🔍</span>
              <span className="text-xs font-medium leading-tight">{t('nav.services')}</span>
            </Link>
            <Link
              href="/seeker/recommendations"
              className={`flex flex-col items-center py-1 md:py-2 px-1 md:px-4 rounded-lg transition-colors ${active === 'recommendations' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600'}`}
            >
              <span className="text-base md:text-2xl mb-0.5 md:mb-1">➕</span>
              <span className="text-xs font-medium leading-tight hidden sm:inline">{t('nav.recommendations')}</span>
              <span className="text-xs font-medium leading-tight sm:hidden">{t('nav.recommendations')}</span>
            </Link>
            <Link
              href="/seeker/profile"
              className={`flex flex-col items-center py-1 md:py-2 px-1 md:px-4 rounded-lg transition-colors ${active === 'profile' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600'}`}
            >
              <span className="text-base md:text-2xl mb-0.5 md:mb-1">👤</span>
              <span className="text-xs font-medium leading-tight">{t('nav.profile')}</span>
            </Link>
          </div>
        </div>
      </div>
      {showOnboarding && (
        <EmbeddedOnboarding onComplete={handleCloseOnboarding} userType="seeker" onTabChange={handleOnboardingTabChange} />
      )}
    </div>
  );
}


