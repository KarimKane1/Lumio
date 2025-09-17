import React, { useState } from 'react';
import { MapPin, MessageCircle, Phone, Users, ChevronRight } from 'lucide-react';
import { useI18n } from '../../../context/I18nContext';
import { useCategories } from '../../../lib/hooks/useCategories';
import RecommendationsModal from './RecommendationsModal';

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

interface ServiceProviderCardProps {
  provider: ServiceProvider;
  onViewDetails: () => void;
  onContact?: () => void;
  isGuest?: boolean;
}

export default function ServiceProviderCard({ provider, onViewDetails, onContact, isGuest = false }: ServiceProviderCardProps) {
  const { t } = useI18n();
  const { categories, getLocalizedCategoryName } = useCategories();
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);

  // Get translated service type name
  const getTranslatedServiceType = (serviceType: string) => {
    if (!serviceType) return serviceType;
    
    // Normalize the service type to match translation keys
    const normalizedType = serviceType.toLowerCase().replace(/[^a-z]/g, '_');
    
    // Try the exact match first
    let translationKey = `category.${normalizedType}`;
    let translatedName = t(translationKey);
    
    // If no exact match, try common variations
    if (!translatedName || translatedName === translationKey) {
      const variations: { [key: string]: string } = {
        'plumber': 'category.plumber',
        'electrician': 'category.electrician',
        'hvac': 'category.hvac',
        'carpenter': 'category.carpenter',
        'handyman': 'category.handyman'
      };
      
      const variationKey = variations[normalizedType];
      if (variationKey) {
        translatedName = t(variationKey);
      }
    }
    
    // If translation exists and is different from the key, use it
    if (translatedName && translatedName !== translationKey && translatedName !== `category.${normalizedType}`) {
      return translatedName;
    }
    
    // Fallback to original service type if no translation found
    return serviceType;
  };

  // Get translated quality attribute
  const getTranslatedQuality = (quality: string) => {
    // Handle both English text and translation keys
    const qualityMap: { [key: string]: string } = {
      // English text mappings
      'Job quality': t('recs.jobQuality'),
      'Timeliness': t('recs.timeliness'),
      'Clean & Organized': t('recs.cleanOrganized'),
      'Professional': t('recs.professional'),
      'Reliable & Trustworthy': t('recs.reliableTrustworthy'),
      'Fair pricing': t('recs.fairPricing'),
      'Expensive': t('recs.expensive'),
      'Limited availability': t('recs.limitedAvailability'),
      'Punctuality': t('recs.punctuality'),
      'Communication': t('recs.communication'),
      // Translation key mappings (fallback)
      'quality.jobQuality': t('recs.jobQuality'),
      'quality.timeliness': t('recs.timeliness'),
      'quality.cleanOrganized': t('recs.cleanOrganized'),
      'quality.professional': t('recs.professional'),
      'quality.reliableTrustworthy': t('recs.reliableTrustworthy'),
      'quality.fairPricing': t('recs.fairPricing'),
      'quality.expensive': t('recs.expensive'),
      'quality.limitedAvailability': t('recs.limitedAvailability'),
      'quality.punctuality': t('recs.punctuality'),
      'quality.communication': t('recs.communication')
    };
    
    return qualityMap[quality] || quality;
  };

  const handleCardClick = () => {
    onViewDetails();
  };

  const handleWhatsAppContact = async () => {
    if (isGuest && onContact) {
      onContact();
      return;
    }
    const message = `Hi ${provider.name}, I found you through Lumio, it's an app for friends to refer ${provider.serviceType.toLowerCase()} they like. I would like to inquire about your ${provider.serviceType.toLowerCase()} services.`;
    
    // Always fetch provider details to get whatsapp_intent
    try {
      const res = await fetch(`/api/providers/${provider.id}?any=1`);
      const info = await res.json();
      if (info?.whatsapp_intent) {
        window.open(`${info.whatsapp_intent}?text=${encodeURIComponent(message)}`, '_blank');
        return;
      }
    } catch (error) {
      console.error('Error fetching provider details:', error);
    }
    alert('No phone number on file for this provider');
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex items-center mb-3 md:mb-4">
        <div className="w-12 h-12 md:w-16 md:h-16 mr-3 md:mr-4 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-lg md:text-2xl">
          {provider.name?.charAt(0) || 'P'}
        </div>
        <div className="flex-1">
          <div>
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">{provider.name}</h3>
            <p className="text-indigo-600 font-medium mb-1 text-sm md:text-base">{getTranslatedServiceType(provider.serviceType)}</p>
            <div className="flex items-center text-gray-500 text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              {provider.location}
            </div>
          </div>
        </div>
      </div>

      {/* Network Recommendations Section */}
      {!isGuest && (
        <div className="mb-3 md:mb-4">
          {provider.networkRecommenders && provider.networkRecommenders.length > 0 ? (
            <div 
              className="bg-green-50 rounded-lg p-2 md:p-3 cursor-pointer hover:bg-green-100 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowRecommendationsModal(true);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-green-600 mr-2" />
                  <p className="text-sm text-green-800">
                    <span className="font-medium">
                      {(() => {
                        const recommenders = provider.networkRecommenders;
                        if (recommenders.length === 1) {
                          return `${t('services.recommendedBy')} ${recommenders[0].name} in your network`;
                        } else if (recommenders.length === 2) {
                          return `${t('services.recommendedBy')} ${recommenders[0].name} and ${recommenders[1].name} in your network`;
                        } else if (recommenders.length > 2) {
                          return `${t('services.recommendedBy')} ${recommenders[0].name}, ${recommenders[1].name} and ${recommenders.length - 2} other${recommenders.length - 2 === 1 ? '' : 's'} in your network`;
                        }
                        return '';
                      })()}
                    </span>
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-green-600" />
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-2 md:p-3">
              <p className="text-sm text-gray-600">
                {t('services.noNetworkRecommendations')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Legacy single recommender display (for backward compatibility) */}
      {provider.recommendedBy && !provider.recommenders && (
        <div className="bg-green-50 rounded-lg p-2 md:p-3 mb-3 md:mb-4">
          <p className="text-sm text-green-800">
            <span className="font-medium">
              {isGuest ? 'Recommended by ***' : `Recommended by ${provider.recommendedBy}`}
            </span>
          </p>
        </div>
      )}

      {/* Qualities */}
      {provider.qualities.length > 0 && (
        <div className="mb-3 md:mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t('recs.whatYouLiked')}</p>
          <div className="flex flex-wrap gap-2">
            {provider.qualities.map((quality) => (
              <span key={quality} className="bg-green-50 text-green-700 text-xs md:text-sm px-2 md:px-3 py-1 rounded-full">
                {getTranslatedQuality(quality)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Things to Watch For */}
      {provider.watchFor.length > 0 && (
        <div className="mb-3 md:mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t('recs.watchFor')}</p>
          <div className="flex flex-wrap gap-2">
            {provider.watchFor.map((item) => (
              <span key={item} className="bg-orange-50 text-orange-700 text-xs md:text-sm px-2 md:px-3 py-1 rounded-full">
                {getTranslatedQuality(item)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Contact Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleWhatsAppContact();
        }}
        className="w-full py-2 md:py-3 px-3 md:px-4 rounded-lg transition-all duration-200 font-medium flex items-center justify-center text-sm md:text-base bg-green-600 text-white hover:bg-green-700"
      >
        <MessageCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
        Contact via WhatsApp
      </button>

      <div className="text-center mt-2">
        <span className="text-xs md:text-sm text-gray-500">
          {provider.phone}
        </span>
      </div>

      {/* Recommendations Modal */}
      {showRecommendationsModal && provider.networkRecommenders && (
        <RecommendationsModal
          providerName={provider.name}
          recommenders={provider.networkRecommenders}
          onClose={() => setShowRecommendationsModal(false)}
        />
      )}
    </div>
  );
}