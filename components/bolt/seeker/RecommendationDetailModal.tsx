import React from 'react';
import { X, MapPin, Phone, Edit } from 'lucide-react';
import { useCategories } from '../../../lib/hooks/useCategories';
import { useI18n } from '../../../context/I18nContext';

interface Recommendation {
  id: string;
  name: string;
  serviceType: string;
  location: string;
  phone: string;
  qualities: string[];
  watchFor: string[];
}

interface RecommendationDetailModalProps {
  recommendation: Recommendation;
  onClose: () => void;
  onEdit: () => void;
}

export default function RecommendationDetailModal({ recommendation, onClose, onEdit }: RecommendationDetailModalProps) {
  const { categories, getLocalizedCategoryName } = useCategories();
  const { t } = useI18n();

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
  const handleWhatsAppContact = async () => {
    // Track the contact click event
    try {
      await fetch('/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'contact_click',
          payload: {
            provider_id: (recommendation as any).providerId || recommendation.id,
            provider_name: recommendation.name,
            service_type: recommendation.serviceType,
            contact_method: 'whatsapp'
          }
        })
      });
    } catch (error) {
      console.error('Failed to track contact click:', error);
    }
    
    const message = `Hi ${recommendation.name}, I found you through Lumio, it's an app for friends to refer ${recommendation.serviceType.toLowerCase()} they like. I would like to inquire about your ${recommendation.serviceType.toLowerCase()} services.`;
    // Prefer a precomputed intent from the API if present
    const preIntent = (recommendation as any).whatsapp_intent as string | undefined;
    if (preIntent) {
      window.open(`${preIntent}?text=${encodeURIComponent(message)}`, '_blank');
      return;
    }
    // Phone numbers are now hashed, so we skip direct phone usage
    const providerId = (recommendation as any).providerId || recommendation.id;
    try {
      const res = await fetch(`/api/providers/${providerId}?any=1`);
      const info = await res.json();
      if (info?.whatsapp_intent) {
        window.open(`${info.whatsapp_intent}?text=${encodeURIComponent(message)}`, '_blank');
        return;
      }
    } catch {}
    const manual = prompt("Enter provider's WhatsApp number (e.g. +221701234567):");
    const digits = (manual || '').replace(/\D/g, '');
    if (digits) {
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, '_blank');
      try {
        await fetch(`/api/providers/${providerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: manual })
        });
      } catch {}
      return;
    }
    alert('No phone number on file for this provider');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('recs.recommendationDetails') || 'Recommendation Details'}</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={onEdit}
                className="text-indigo-600 hover:text-indigo-700 p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Edit recommendation"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Provider Info */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{recommendation.name}</h3>
                  <span className="bg-indigo-100 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full">
                    {getTranslatedServiceType(recommendation.serviceType)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-3" />
                  <span>{recommendation.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="w-5 h-5 mr-3" />
                  <span>{recommendation.phone || (recommendation as any).phone_e164 || 'No phone number available'}</span>
                </div>
              </div>
            </div>

            {/* What You Liked */}
            {recommendation.qualities.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  {t('recs.whatYouLiked') || 'What You Liked'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {recommendation.qualities.map((quality) => (
                    <span key={quality} className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-full">
                      {getTranslatedQuality(quality)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Things to Watch For */}
            {recommendation.watchFor.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  {t('recs.watchFor') || 'Things to Watch For'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {recommendation.watchFor.map((item) => (
                    <span key={item} className="bg-orange-50 text-orange-700 text-sm px-3 py-2 rounded-full">
                      {getTranslatedQuality(item)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Button */}
            <div className="pt-4">
              <button
                onClick={handleWhatsAppContact}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
{t('connections.contactViaWhatsApp') || 'Contact via WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}