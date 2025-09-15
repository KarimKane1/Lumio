import React, { useState } from 'react';
import { Plus, Search, Edit, Share, Trash2 } from 'lucide-react';
import AddRecommendationModal from './AddRecommendationModal';
import RecommendationDetailModal from './RecommendationDetailModal';
import EditRecommendationModal from './EditRecommendationModal';
import GuestPromptModal from '../common/GuestPromptModal';
import { useRecommendations, useDeleteRecommendation } from '../../../hooks/recommendations';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../../context/I18nContext';
import { useCategories } from '../../../lib/hooks/useCategories';
import { supabaseBrowser } from '../../../lib/supabase/client';

export default function RecommendationsTab() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [editingRecommendation, setEditingRecommendation] = useState<any>(null);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const { isGuest, logout, user } = useAuth();
  const { t } = useI18n();
  const { categories, getLocalizedCategoryName } = useCategories();
  const { data, error, isLoading } = useRecommendations(user?.id);
  const deleteRecommendation = useDeleteRecommendation();
  const queryClient = useQueryClient();
  const recommendations = ((data as any)?.items || []) as any[];

  // Debug logging
  console.log('RecommendationsTab - user:', user?.id, 'data:', data, 'error:', error, 'isLoading:', isLoading);

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
    const qualityMap: { [key: string]: string } = {
      'Job quality': t('recs.jobQuality'),
      'Timeliness': t('recs.timeliness'),
      'Clean & Organized': t('recs.cleanOrganized'),
      'Professional': t('recs.professional'),
      'Reliable & Trustworthy': t('recs.reliableTrustworthy'),
      'Fair pricing': t('recs.fairPricing'),
      'Expensive': t('recs.expensive'),
      'Limited availability': t('recs.limitedAvailability'),
      'Punctuality': t('recs.punctuality'),
      'Communication': t('recs.communication')
    };
    return qualityMap[quality] || quality;
  };

  const handleSaveEdit = async (updated: any) => {
    try {
      // Get the current session token
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        alert('You must be logged in to update recommendations');
        return;
      }

      // Update the recommendation using the new PATCH endpoint
      const response = await fetch('/api/recommendations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: updated.id,
          name: updated.name,
          phone: updated.phone,
          location: updated.location,
          serviceType: updated.serviceType,
          qualities: updated.qualities,
          watchFor: updated.watchFor
        })
      });

      if (response.ok) {
        // Invalidate recommendations cache to refresh the list
        queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      } else {
        const error = await response.json();
        console.error('Failed to update recommendation:', error);
        alert(`Failed to update recommendation: ${error.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Failed to update recommendation:', error);
      alert('Failed to update recommendation. Please try again.');
    }
  };

  const handleAddRecommendation = () => {
    if (isGuest) {
      setShowGuestPrompt(true);
    } else {
      setShowAddModal(true);
    }
  };

  const handleGuestAction = () => {
    if (isGuest) {
      setShowGuestPrompt(true);
      return;
    }
  };

  return (
    <div>
      <div className="mb-4 md:mb-8">
        <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">{t('recs.title') || 'My Recommendations'}</h2>
        <p className="text-sm md:text-base text-gray-600 px-2 md:px-0">{t('recs.subtitle') || 'Manage and share your trusted service providers'}</p>
      </div>

      {/* Add New Recommendation */}
      <div className="bg-green-50 rounded-xl md:rounded-2xl p-3 md:p-8 text-center mb-4 md:mb-8 mx-2 md:mx-0">
        <h3 className="text-base md:text-xl font-semibold text-gray-900 mb-1 md:mb-2">{t('recs.addTitle') || 'Add New Recommendation'}</h3>
        <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4 px-2 md:px-0">{t('recs.addSubtitle') || 'Know a great service provider? Share them with your network'}</p>
        <button
          onClick={handleAddRecommendation}
          className="add-recommendation-btn px-3 md:px-6 py-2 md:py-3 rounded-lg transition-colors font-medium text-sm bg-green-600 text-white hover:bg-green-700"
        >
          {t('recs.addCta') || 'Add Recommendation'}
        </button>
      </div>

      {/* Your Recommendations */}
      <div className="mb-4 md:mb-6 px-2 md:px-0">
        <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-1">
          {t('recs.listTitle') || 'Your Recommendations'} ({isGuest ? '***' : recommendations.length})
        </h3>
      </div>

      <div className="space-y-2 md:space-y-4 px-2 md:px-0">
        {(isGuest ? recommendations.slice(0, 1) : recommendations).map((recommendation) => (
          <div 
            key={recommendation.id} 
            className={`bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-3 md:p-6 hover:shadow-md transition-all duration-200 cursor-pointer ${
              isGuest ? 'opacity-75' : ''
            }`}
            onClick={() => {
              if (isGuest) {
                handleGuestAction();
              } else {
                setSelectedRecommendation(recommendation);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h4 className="text-sm md:text-lg font-semibold text-gray-900 mr-2">
                    {isGuest ? recommendation.name.replace(/\w/g, '*') : recommendation.name}
                  </h4>
                  <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                    {getTranslatedServiceType(recommendation.serviceType)}
                  </span>
                </div>
                <div className="flex items-center text-gray-500 text-xs md:text-sm mb-2 md:mb-3">
                  <span>{recommendation.location}</span>
                </div>

                {/* What You Liked */}
                {recommendation.qualities.length > 0 && (
                  <div className="mb-1 md:mb-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('recs.whatYouLiked') || 'What You Liked'}</p>
                    <div className="flex flex-wrap gap-1 md:gap-2">
                      {recommendation.qualities.map((quality) => (
                        <span key={quality} className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full">
                          {isGuest ? '***' : getTranslatedQuality(quality)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Things to Watch For */}
                {recommendation.watchFor.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('recs.watchFor') || 'Things to Watch For'}</p>
                    <div className="flex flex-wrap gap-1 md:gap-2">
                      {recommendation.watchFor.map((item) => (
                        <span key={item} className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-full">
                          {isGuest ? '***' : getTranslatedQuality(item)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row space-y-1 md:space-y-0 md:space-x-2 ml-2 md:ml-6" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => {
                    if (isGuest) {
                      handleGuestAction();
                    } else {
                      setEditingRecommendation(recommendation);
                    }
                  }}
                  className="p-1 rounded-md md:rounded-lg transition-colors text-xs text-indigo-600 hover:bg-indigo-50"
                  title="Edit"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <button 
                  onClick={async () => {
                    if (isGuest) {
                      handleGuestAction();
                    } else {
                      const text = `Hi ${recommendation.name}, I found you through Lumio, it's an app for friends to refer ${String(recommendation.serviceType || '').toLowerCase()} they like. I would like to inquire about your ${String(recommendation.serviceType || '').toLowerCase()} services.`;
                      const raw = (recommendation.phone || recommendation.phone_e164 || '');
                      const phone = raw.replace(/\D/g, ''); // WhatsApp expects digits only
                      if (phone) {
                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
                      } else if (recommendation.providerId) {
                        try {
                          const res = await fetch(`/api/providers/${recommendation.providerId}?any=1`);
                          const info = await res.json();
                          if (info?.whatsapp_intent) {
                            window.open(`${info.whatsapp_intent}?text=${encodeURIComponent(text)}`, '_blank');
                            return;
                          }
                        } catch {}
                        // Final fallback: ask user for a number and open WhatsApp
                        const manual = prompt('Enter provider\'s WhatsApp number (e.g. +221701234567):');
                        const digits = (manual || '').replace(/\D/g, '');
                        if (digits) {
                          window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, '_blank');
                          // Persist the phone for next time
                          try {
                            await fetch(`/api/providers/${recommendation.providerId}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ phone: manual })
                            });
                          } catch {}
                          return;
                        }
                        alert('No phone number on file for this provider');
                      }
                    }
                  }}
                  className="p-1 rounded-md md:rounded-lg transition-colors text-xs text-green-600 hover:bg-green-50"
                >
                  {t('common.contact') || 'Contact'}
                </button>
                <button 
                  onClick={async () => {
                    if (isGuest) {
                      handleGuestAction();
                    } else {
                      const link = `${window.location.origin}/seeker/recommendations/new?providerName=${encodeURIComponent(recommendation.name)}${recommendation.providerId ? `&providerId=${recommendation.providerId}` : ''}`;
                      if (navigator.share) {
                        try { await navigator.share({ title: 'Add Recommendation', url: link }); } catch {}
                      } else {
                        try { await navigator.clipboard.writeText(link); alert('Link copied'); } catch { alert(link); }
                      }
                    }
                  }}
                  className="p-1 rounded-md md:rounded-lg transition-colors text-xs text-blue-600 hover:bg-blue-50"
                >
                  {t('common.share') || 'Share'}
                </button>
                <button 
                  onClick={async () => {
                    if (isGuest) {
                      handleGuestAction();
                    } else {
                      if (!confirm('Delete this recommendation?')) return;
                      try {
                        await deleteRecommendation.mutateAsync(recommendation.id);
                      } catch (error: any) {
                        alert(error?.message || 'Failed to delete recommendation');
                      }
                    }
                  }}
                  disabled={deleteRecommendation.isPending}
                  className="p-1 rounded-md md:rounded-lg transition-colors text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteRecommendation.isPending ? 'Deleting...' : (t('common.delete') || 'Delete')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isGuest && (
        <div className="bg-indigo-50 rounded-xl p-4 text-center mt-6 mx-2 md:mx-0">
          <p className="text-indigo-800 font-medium mb-2">{t('recs.guestCtaText') || 'Want to see all your recommendations?'}</p>
          <button
            onClick={logout}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
          >
            {t('auth.createAccount') || 'Create Account'}
          </button>
        </div>
      )}

      {showAddModal && (
        <AddRecommendationModal onClose={() => setShowAddModal(false)} />
      )}

      {selectedRecommendation && (
        <RecommendationDetailModal 
          recommendation={selectedRecommendation}
          onClose={() => setSelectedRecommendation(null)}
          onEdit={() => {
            setEditingRecommendation(selectedRecommendation);
            setSelectedRecommendation(null);
          }}
        />
      )}

      {editingRecommendation && (
        <EditRecommendationModal 
          recommendation={editingRecommendation}
          onClose={() => setEditingRecommendation(null)}
          onSave={handleSaveEdit}
        />
      )}

      {showGuestPrompt && (
        <GuestPromptModal onClose={() => setShowGuestPrompt(false)} />
      )}
    </div>
  );
}