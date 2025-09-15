import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import ServiceProviderCard from './ServiceProviderCard';
import ServiceProviderDetailModal from './ServiceProviderDetailModal';
import GuestPromptModal from '../common/GuestPromptModal';
// Removed mock data import - using real data only
import { useProviders } from '../../../hooks/providers';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../../context/I18nContext';
import { useCategories } from '../../../lib/hooks/useCategories';
import { useConnections } from '../../../hooks/connections';
import { useQueryClient } from '@tanstack/react-query';

export default function ServicesTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const { availableProviders, isGuest, logout, user } = useAuth();
  const { t } = useI18n();
  const { data, isLoading: providersLoading } = useProviders({ q: searchTerm, service: selectedCategory === 'All' ? undefined : selectedCategory });
  const { categories, getLocalizedCategoryName } = useCategories();
  const { data: connectionsData, refetch: refetchConnections, isLoading: connectionsLoading } = useConnections(user?.id);
  
  const isLoading = providersLoading || connectionsLoading;
  const queryClient = useQueryClient();
  const liveProviders = (data?.items as any[]) || [];
  
  // Debug: Log the raw provider data
  // Combine mock providers with providers from accepted connections
  const mappedLive = liveProviders.map((p: any) => ({
    id: p.id,
    name: p.name,
    serviceType: p.service_type || p.serviceType,
    location: p.city || '',
    avatar: p.photo_url || 'https://placehold.co/64x64',
    phone: '',
    recommendedBy: undefined,
    // Filter out recommendations from the current user
    recommenders: (p.recommenders || [])
      .map((r: any) => ({ id: r.id, name: r.name }))
      .filter((r: any) => r.id !== user?.id), // Don't show current user's own recommendations
    isNetworkRecommendation: true,
    qualities: (p.top_likes || []).slice(0, 3),
    watchFor: (p.top_watch || []).slice(0, 2),
  }));
  
  // Show all providers (including user's own recommendations)
  const allProviders = [...mappedLive, ...availableProviders];

  // Get user's network connections
  const userConnections = (connectionsData as any)?.items || [];
  const connectionUserIds = userConnections.map((conn: any) => conn.id);
  
  // Only refresh connections data if it's stale
  React.useEffect(() => {
    if (user?.id && connectionsData === undefined) {
      refetchConnections();
    }
  }, [user?.id, connectionsData, refetchConnections]);

  // Debug logging
  React.useEffect(() => {
    console.log('ServicesTab Debug:', {
      userId: user?.id,
      userConnections: userConnections.length,
      connectionUserIds,
      availableProviders: availableProviders.length,
      liveProviders: liveProviders.length
    });
  }, [user?.id, userConnections.length, connectionUserIds, availableProviders.length, liveProviders.length]);

  const filteredProviders = allProviders.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.serviceType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' ||
      (provider.serviceType && provider.serviceType.toLowerCase() === selectedCategory.toLowerCase());

    // Show all providers that match search and category
    return matchesSearch && matchesCategory;
  }).map(provider => {
    // Check if this provider is recommended by people in the user's network
    const networkRecommenders = (provider as any).recommenders ? (provider as any).recommenders.filter((rec: any) => 
      connectionUserIds.includes(rec.id)
    ) : [];
    
    return {
      ...provider,
      isNetworkRecommendation: networkRecommenders.length > 0,
      networkRecommenders: networkRecommenders
    };
  });

  const allCategories = [
    { key: 'All', name: t('category.all') },
    ...categories.map(c => ({ key: c.slug, name: getLocalizedCategoryName(c) }))
  ];
  const visibleCategories = showAllCategories ? allCategories : allCategories.slice(0, 8);
  
  // Debug logging for categories
  React.useEffect(() => {
    console.log('Categories Debug:', {
      categories,
      allCategories,
      selectedCategory
    });
  }, [categories, allCategories, selectedCategory]);

  const handleGuestAction = () => {
    if (isGuest) {
      setShowGuestPrompt(true);
      return;
    }
  };

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">{t('services.title') || 'Service Providers'}</h2>
        <p className="text-sm md:text-base text-gray-600 px-2 md:px-0">{t('services.subtitle') || 'Find trusted service providers through your network'}</p>
      </div>

      {/* Search and Filter */}
      <div className="relative mb-4 md:mb-6 px-2 md:px-0">
        <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-gray-400" />
        <input
          className="search-input w-full pl-9 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          type="text"
          placeholder={t('services.search') || 'Search providers...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Categories */}
      <div className="mb-4 md:mb-6 px-2 md:px-0">
        <div className="flex flex-wrap gap-1 md:gap-2 mb-2 md:mb-4">
          {visibleCategories.map((category) => (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key)}
              className={`px-2 md:px-4 py-1 md:py-2 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === category.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        {!showAllCategories && allCategories.length > 8 && (
          <button
            onClick={() => setShowAllCategories(true)}
            className="text-indigo-600 text-xs md:text-sm font-medium hover:text-indigo-700"
          >
            {t('services.showMore') || 'Show more categories'}
          </button>
        )}
      </div>

      {/* Service Providers List */}
      {!isLoading && (
        <div className="space-y-2 md:space-y-4 px-2 md:px-0">
          {filteredProviders.length > 0 ? (
          (isGuest ? filteredProviders.slice(0, 3) : filteredProviders).map((provider) => (
            <ServiceProviderCard 
              key={provider.id} 
              provider={provider} 
              onViewDetails={() => {
                if (isGuest) {
                  handleGuestAction();
                } else {
                  setSelectedProvider(provider);
                }
              }}
              onContact={() => {
                if (isGuest) {
                  handleGuestAction();
                }
              }}
              isGuest={isGuest}
            />
          ))
        ) : (
          <div className="text-center py-12 px-4">
            <div className="bg-gray-50 rounded-2xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('services.noProvidersTitle') || 'No service providers yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('services.noProvidersDesc') || 'Add friends to your network to see their recommended service providers, or add your own recommendations to help others.'}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => onTabChange?.('connections')}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                >
                  {t('services.addFriends') || 'Add Friends'}
                </button>
                <button
                  onClick={() => onTabChange?.('recommendations')}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  {t('services.addRecommendations') || 'Add Recommendations'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {isGuest && filteredProviders.length > 3 && (
        <div className="bg-indigo-50 rounded-xl p-4 text-center mt-6 mx-2 md:mx-0">
          <p className="text-indigo-800 font-medium mb-2">{t('services.guestCtaText') || 'Want to see all available service providers?'}</p>
          <button
            onClick={logout}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
          >
            {t('auth.createAccount') || 'Create Account'}
          </button>
        </div>
      )}

      {selectedProvider && (
        <ServiceProviderDetailModal 
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
        />
      )}

      {showGuestPrompt && (
        <GuestPromptModal onClose={() => setShowGuestPrompt(false)} />
      )}
    </div>
  );
}