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
  specialties?: { specialty: string }[];
}

interface ServiceProviderCardProps {
  provider: ServiceProvider;
  user?: any;
  onViewDetails: () => void;
  onContact?: () => void;
  isGuest?: boolean;
}

export default function ServiceProviderCard({ provider, user, onViewDetails, onContact, isGuest = false }: ServiceProviderCardProps) {
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
      'quality.communication': t('recs.communication'),
      // New watchFor translation key mappings
      'watchFor.expensive': t('watchFor.expensive'),
      'watchFor.limitedAvailability': t('watchFor.limitedAvailability'),
      'watchFor.punctuality': t('watchFor.punctuality'),
      'watchFor.communication': t('watchFor.communication')
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
    
    // Track the contact click event
    try {
      const response = await fetch('/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'contact_click',
          payload: {
            provider_id: provider.id,
            provider_name: provider.name,
            service_type: provider.serviceType,
            contact_method: 'whatsapp',
            user_id: user?.id,
            user_name: user?.name
          }
        })
      });
      
      if (!response.ok) {
        console.error('Failed to track contact click:', await response.text());
      }
    } catch (error) {
      console.error('Failed to track contact click:', error);
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
      className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-4 md:p-6 hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full group"
      onClick={handleCardClick}
    >
      <div className="flex-1 flex flex-col">
        <div className="flex items-center mb-3 md:mb-4">
          <div className="w-12 h-12 md:w-16 md:h-16 mr-3 md:mr-4 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-lg md:text-2xl font-semibold shadow-md group-hover:shadow-lg transition-shadow duration-300">
            {provider.name?.charAt(0) || 'P'}
          </div>
          <div className="flex-1">
            <div>
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">{provider.name}</h3>
              <div className="mb-2">
                <p className="text-indigo-600 font-medium text-sm md:text-base mb-1">{getTranslatedServiceType(provider.serviceType)}</p>
                {provider.specialties && provider.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {provider.specialties.slice(0, 3).map((specialty) => (
                      <span key={specialty.specialty} className="bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 text-xs px-3 py-1.5 rounded-full border border-indigo-200 font-medium">
                        {specialty.specialty}
                      </span>
                    ))}
                    {provider.specialties.length > 3 && (
                      <span className="text-xs text-gray-500 px-3 py-1.5 bg-gray-100 rounded-full font-medium">
                        +{provider.specialties.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
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
              className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 md:p-4 cursor-pointer hover:from-green-100 hover:to-emerald-100 transition-all duration-200 border border-green-200 group-hover:border-green-300"
              onClick={(e) => {
                e.stopPropagation();
                setShowRecommendationsModal(true);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm text-green-800 font-semibold">
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
                <ChevronRight className="w-4 h-4 text-green-600 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-3 md:p-4 border border-gray-200">
              <p className="text-sm text-gray-500 italic text-center">
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
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-2 font-semibold">{t('recs.whatYouLiked')}</p>
          <div className="flex flex-wrap gap-2">
            {provider.qualities.map((quality) => (
              <span key={quality} className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 text-xs md:text-sm px-3 py-1.5 rounded-full border border-green-200 font-medium">
                {getTranslatedQuality(quality)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Things to Watch For */}
      {provider.watchFor.length > 0 && (
        <div className="mb-3 md:mb-4">
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-2 font-semibold">{t('recs.watchFor')}</p>
          <div className="flex flex-wrap gap-2">
            {provider.watchFor.map((item) => (
              <span key={item} className="bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 text-xs md:text-sm px-3 py-1.5 rounded-full border border-amber-200 font-medium">
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
          className="w-full py-3 md:py-4 px-4 md:px-6 rounded-xl transition-all duration-300 font-semibold flex items-center justify-center text-sm md:text-base bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:shadow-lg transform hover:-translate-y-0.5 mt-auto"
        >
          <MessageCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          Contact via WhatsApp
        </button>
      </div>

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