import React from 'react';
import { ArrowLeft, MapPin, MessageCircle } from 'lucide-react';
import ServiceProviderDetailModal from './ServiceProviderDetailModal';
import { useRecommendations } from '../../../hooks/recommendations';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../../context/I18nContext';

interface Connection {
  id: string;
  name: string;
  location: string;
  avatar: string;
  phone?: string;
  recommendationCount: number;
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
}

interface ConnectionProfileProps {
  connection: Connection;
  onBack: () => void;
}

// Providers recommended by this connection

export default function ConnectionProfile({ connection, onBack }: ConnectionProfileProps) {
  const [selectedProvider, setSelectedProvider] = React.useState<ServiceProvider | null>(null);
  const { user } = useAuth();
  const { t } = useI18n();
  const { data } = useRecommendations(connection.id);

  const maskPhoneNumber = (phone: string) => {
    // Since phone numbers are now hashed, we can't display them
    return '**** **** ****';
  };

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
        'cleaner': 'category.cleaner',
        'plumber': 'category.plumber',
        'electrician': 'category.electrician',
        'carpenter': 'category.carpenter',
        'nanny': 'category.nanny',
        'hair': 'category.hair',
        'henna': 'category.henna',
        'chef': 'category.chef',
        'cook': 'category.cook',
        'tech_repair': 'category.tech_repair',
        'gardener': 'category.gardener',
        'driver': 'category.driver',
        'security': 'category.security',
        'painter': 'category.painter',
        'mechanic': 'category.mechanic'
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
  const providers: ServiceProvider[] = ((data as any)?.items || []).map((r: any) => ({
    id: r.providerId || r.id, // Use providerId if available, fallback to recommendation id
    name: r.name,
    serviceType: r.serviceType,
    location: r.location,
    avatar: r.avatar || '/default-avatar.png', // Default avatar if not provided
    phone: r.phone || '',
    recommendedBy: connection.name, // This connection recommended this provider
    isNetworkRecommendation: true, // All providers in connection profile are network recommendations
    qualities: r.qualities || [],
    watchFor: r.watchFor || [],
  }));

  const handleWhatsAppContact = async (provider: ServiceProvider) => {
    const message = `Hi ${provider.name}, I found you through ${connection.name} on Lumio, it's an app for friends to refer ${provider.serviceType.toLowerCase()} they like. I would like to inquire about your ${provider.serviceType.toLowerCase()} services.`;
    
    // Use whatsapp_intent if available
    if (provider.whatsapp_intent) {
      window.open(`${provider.whatsapp_intent}?text=${encodeURIComponent(message)}`, '_blank');
      return;
    }
    
    // Fetch whatsapp_intent from API
    try {
      const res = await fetch(`/api/providers/${provider.id}?any=1`);
      const info = await res.json();
      if (info?.whatsapp_intent) {
        window.open(`${info.whatsapp_intent}?text=${encodeURIComponent(message)}`, '_blank');
        return;
      }
    } catch {}
    
    alert('No phone number on file for this provider');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center text-indigo-600 hover:text-indigo-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        {t('connections.back')}
      </button>

      {/* Connection Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8 text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-indigo-100 flex items-center justify-center border-4 border-gray-100 text-indigo-700 text-2xl">
          {connection.name?.charAt(0) || 'C'}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{connection.name}</h1>
        <div className="flex items-center justify-center text-gray-600 mb-2">
          <MapPin className="w-5 h-5 mr-2" />
          {connection.location}
        </div>
        {connection.phone && (
          <div className="text-sm text-gray-500 mb-4">
            {maskPhoneNumber(connection.phone)}
          </div>
        )}
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full inline-block font-medium">
          {t('connections.connected')}
        </div>
      </div>

      {/* Their Trusted Providers */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('connections.theirTrustedProviders')}</h2>
        <p className="text-gray-600">{t('connections.serviceProvidersRecommendedBy')} {connection.name}</p>
      </div>

      {/* Providers List */}
      <div className="space-y-6">
        {providers.map((provider) => (
          <div 
            key={provider.id} 
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => setSelectedProvider(provider)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{provider.name}</h3>
                <p className="text-indigo-600 font-medium mb-2">{getTranslatedServiceType(provider.serviceType)}</p>
                <div className="flex items-center text-gray-500 text-sm">
                  <MapPin className="w-4 h-4 mr-1" />
                  {provider.location}
                </div>
              </div>
            </div>

            {/* What They Liked */}
            {provider.qualities.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t('connections.whatLiked').replace('{name}', connection.name)}</p>
                <div className="flex flex-wrap gap-2">
                  {provider.qualities.map((quality) => (
                    <span key={quality} className="bg-green-50 text-green-700 text-sm px-3 py-1 rounded-full">
                      {getTranslatedQuality(quality)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Things to Watch For */}
            {provider.watchFor.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t('recs.watchFor')}</p>
                <div className="flex flex-wrap gap-2">
                  {provider.watchFor.map((item) => (
                    <span key={item} className="bg-orange-50 text-orange-700 text-sm px-3 py-1 rounded-full">
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
                handleWhatsAppContact(provider);
              }}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-all duration-200 font-medium flex items-center justify-center"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {t('connections.contactViaWhatsApp')}
            </button>


          </div>
        ))}
      </div>

      {selectedProvider && (
        <ServiceProviderDetailModal 
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
        />
      )}
    </div>
  );
}