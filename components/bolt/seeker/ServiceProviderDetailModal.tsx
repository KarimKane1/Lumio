import React, { useEffect } from 'react';
import { X, MapPin, Phone, MessageCircle } from 'lucide-react';
import { useProvider } from '../../../hooks/providers';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../../context/I18nContext';

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
}

interface ServiceProviderDetailModalProps {
  provider: ServiceProvider;
  onClose: () => void;
}

export default function ServiceProviderDetailModal({ provider, onClose }: ServiceProviderDetailModalProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { data } = useProvider(provider.id);
  const detail = data || {} as any;

  // Track provider view when modal opens
  useEffect(() => {
    const trackProviderView = async () => {
      try {
        await fetch('/api/track-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'provider_view',
            payload: {
              provider_id: provider.id,
              provider_name: provider.name,
              service_type: provider.serviceType,
              user_id: user?.id
            }
          })
        });
      } catch (error) {
        console.error('Failed to track provider view:', error);
      }
    };

    trackProviderView();
  }, [provider.id, provider.name, provider.serviceType, user?.id]);

  // Get translated service type name
  const getTranslatedServiceType = (serviceType: string) => {
    const serviceTypeMap: { [key: string]: string } = {
      'plumber': 'Plombier',
      'cleaner': 'Femme/Homme de ménage',
      'nanny': 'Nounou',
      'electrician': 'Électricien',
      'carpenter': 'Menuisier',
      'hair': 'Coiffure',
      'henna': 'Henné',
      'chef': 'Chef',
      'other': 'Autre'
    };
    
    return serviceTypeMap[serviceType.toLowerCase()] || serviceType;
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

  const handleWhatsAppContact = async () => {
    // Track the contact click event
    try {
      await fetch('/api/track-event', {
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
    } catch (error) {
      console.error('Failed to track contact click:', error);
    }
    
    if (detail.whatsapp_intent) {
      window.open(`${detail.whatsapp_intent}?text=${encodeURIComponent(`Hi ${provider.name}, I found you through Lumio, it's an app for friends to refer ${provider.serviceType.toLowerCase()} they like. I would like to inquire about your ${provider.serviceType.toLowerCase()} services.`)}`, '_blank');
      return;
    }
    // create contact request when not public
    await fetch(`/api/providers/${provider.id}/contact-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester_user_id: user?.id }),
    });
    alert('Contact request sent to provider');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('provider.providerDetails')}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Provider Info */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-20 h-20 rounded-full mr-6 bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl">
                  {provider.name?.charAt(0) || 'P'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{provider.name}</h3>
                  <span className="bg-indigo-100 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full">
                    {getTranslatedServiceType(provider.serviceType)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-3" />
                  <span>{provider.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="w-5 h-5 mr-3" />
                  <span>{detail.masked_tail || t('provider.privateNumber')}</span>
                </div>
              </div>
            </div>

            {/* Recommendation Info */}
            {provider.recommendedBy && (
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-green-800 font-medium">
                  {t('provider.recommendedBy')} {provider.recommendedBy}
                </p>
              </div>
            )}

            {/* What They Liked */}
            {provider.qualities.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  {t('recs.whatYouLiked')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {provider.qualities.map((quality) => (
                    <span key={quality} className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-full">
                      {getTranslatedQuality(quality)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Things to Watch For */}
            {provider.watchFor.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  {t('recs.watchFor')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {provider.watchFor.map((item) => (
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
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {t('connections.contactViaWhatsApp')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}