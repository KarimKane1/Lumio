import React, { useEffect, useState, useRef } from 'react';
import { X, User, Briefcase, Phone } from 'lucide-react';
import { supabaseBrowser } from '../../../lib/supabase/client';
import { useAddRecommendation } from '../../../hooks/recommendations';
import { useCategories } from '../../../lib/hooks/useCategories';
import { useAuth } from '../../../context/AuthContext';
import { useI18n } from '../../../context/I18nContext';

interface AddRecommendationModalProps {
  onClose: () => void;
}

const qualityOptions = [
  'Job quality',
  'Timeliness',
  'Clean & Organized',
  'Professional',
  'Reliable & Trustworthy',
  'Fair pricing'
];

const qualityHelp: Record<string, string> = {
  'Job quality': 'Did the provider do solid, long‑lasting work?',
  'Timeliness': 'Arrived on time and finished on schedule',
  'Clean & Organized': 'Kept the area tidy and organized',
  'Professional': 'Polite, respectful, easy to work with',
  'Reliable & Trustworthy': 'Showed up when promised, can be trusted',
  'Fair pricing': 'Charged a reasonable, transparent price',
};

const watchForOptions = [
  'Expensive',
  'Limited availability',
  'Punctuality',
  'Communication'
];

const watchHelp: Record<string, string> = {
  'Expensive': 'Costs may be higher than average',
  'Limited availability': 'May be booked up or slow to schedule',
  'Punctuality': 'Has arrived late or missed times before',
  'Communication': 'Hard to reach or slow to respond',
};

export default function AddRecommendationModal({ onClose }: AddRecommendationModalProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const addRecommendation = useAddRecommendation();
  const { categories, loading: categoriesLoading, getLocalizedCategoryName } = useCategories();

  // Get translated quality options
  const getTranslatedQualityOptions = () => [
    t('recs.jobQuality'),
    t('recs.timeliness'),
    t('recs.cleanOrganized'),
    t('recs.professional'),
    t('recs.reliableTrustworthy'),
    t('recs.fairPricing')
  ];

  // Get translated watch for options
  const getTranslatedWatchForOptions = () => [
    t('recs.expensive'),
    t('recs.limitedAvailability'),
    t('recs.punctuality'),
    t('recs.communication')
  ];
  // Prefill from URL params (e.g., providerName, providerId)
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const prefillName = params.get('providerName') || '';
  const prefillId = params.get('providerId') || '';
  const [formData, setFormData] = useState({
    name: prefillName,
    serviceType: '',
    countryCode: '+221',
    phone: '',
    location: 'Dakar',
    qualities: [] as string[],
    watchFor: [] as string[]
  });
  const maxQualities = 3;
  const maxWatch = 2;
  const [limitMsg, setLimitMsg] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const modalRef = useRef<HTMLDivElement>(null);

  // If providerId is present, try to prefill name and phone from users table
  useEffect(() => {
    const fetchProvider = async () => {
      if (!prefillId) return;
      try {
        const response = await (supabaseBrowser as any)
          .from('users')
          .select('name, phone_e164')
          .eq('id', prefillId)
          .maybeSingle();
        const data = response?.data;
        const error = response?.error;
        if (error) return;
        if (data) {
          const e164 = data.phone_e164 || '';
          const m = String(e164).match(/^(\+\d{1,3})(\d+)$/);
          const cc = m ? m[1] : formData.countryCode;
          const rest = m ? m[2] : '';
          setFormData(prev => ({
            ...prev,
            name: prev.name || data.name || '',
            countryCode: cc as any,
            phone: rest
          }));
        }
      } catch {}
    };
    fetchProvider();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillId]);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Please enter the provider\'s name';
    }
    
    if (!formData.serviceType) {
      errors.serviceType = 'Please choose what type of service this provider offers';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Please enter the provider\'s phone number';
    } else if (formData.phone.length < 8) {
      errors.phone = 'Please enter a complete phone number (at least 8 digits)';
    }
    
    if (formData.qualities.length === 0) {
      errors.qualities = 'Please select at least one thing you liked about this provider';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setFormErrors({});
    
    if (!validateForm()) {
      setSubmitError('Please complete all required fields to add your recommendation');
      return;
    }
    
    try {
      const payload = {
        name: formData.name,
        serviceType: formData.serviceType,
        phone: `${formData.countryCode} ${formData.phone}`,
        location: formData.location,
        qualities: formData.qualities,
        watchFor: formData.watchFor,
      };
      console.log('Adding recommendation with payload:', payload);
      await addRecommendation.mutateAsync(payload);
      onClose();
    } catch (error: any) {
      console.error('Error adding recommendation:', error);
      setSubmitError(error?.message || 'Failed to add recommendation. Please try again.');
    }
  };

  const toggleQuality = (quality: string) => {
    setFormData(prev => ({
      ...prev,
      qualities: prev.qualities.includes(quality)
        ? prev.qualities.filter(q => q !== quality)
        : prev.qualities.length >= maxQualities
          ? (setLimitMsg(`Select up to ${maxQualities} items for Pros`), prev.qualities)
          : [...prev.qualities, quality]
    }));
  };

  const toggleWatchFor = (item: string) => {
    setFormData(prev => ({
      ...prev,
      watchFor: prev.watchFor.includes(item)
        ? prev.watchFor.filter(w => w !== item)
        : prev.watchFor.length >= maxWatch
          ? (setLimitMsg(`Select up to ${maxWatch} items for Cons`), prev.watchFor)
          : [...prev.watchFor, item]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div ref={modalRef} className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('recs.addTitle')}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General error message */}
            {submitError && (
              <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <span className="text-red-600 mr-3 text-xl">⚠️</span>
                  <p className="text-red-800 font-semibold text-base">{submitError}</p>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                {t('recs.providerName')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500 text-gray-900 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('recs.enterProviderName')}
                  required
                />
              </div>
              {formErrors.name && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-medium flex items-center">
                    <span className="mr-2 text-lg">⚠️</span>
                    {formErrors.name}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                {t('recs.serviceType')}
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none text-gray-900 ${
                    formErrors.serviceType ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                  disabled={categoriesLoading}
                >
                  <option value="">{categoriesLoading ? t('recs.adding') : t('recs.selectServiceType')}</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.slug}>{getLocalizedCategoryName(category)}</option>
                  ))}
                </select>
              </div>
              {formErrors.serviceType && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-medium flex items-center">
                    <span className="mr-2 text-lg">⚠️</span>
                    {formErrors.serviceType}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Provider's Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <div className="flex space-x-2 pl-10">
                  <select
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  >
                    <option value="+221">🇸🇳 +221</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+234">🇳🇬 +234</option>
                    <option value="+27">🇿🇦 +27</option>
                  </select>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`flex-1 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500 text-gray-900 ${
                      formErrors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>
              {formErrors.phone && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-medium flex items-center">
                    <span className="mr-2 text-lg">⚠️</span>
                    {formErrors.phone}
                  </p>
                </div>
              )}
            </div>


            {/* What You Liked */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-3">
                {t('recs.whatYouLiked')} <span className="text-red-500">*</span>
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                {getTranslatedQualityOptions().map((quality, index) => {
                  const originalQuality = qualityOptions[index];
                  return (
                    <button
                      key={originalQuality}
                      type="button"
                      onClick={() => toggleQuality(originalQuality)}
                      title={qualityHelp[originalQuality]}
                      className={`text-left p-3 rounded-lg border transition-colors ${
                        formData.qualities.includes(originalQuality)
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : formErrors.qualities
                            ? 'border-red-500 text-gray-800 hover:border-red-400'
                            : 'border-gray-300 text-gray-800 hover:border-gray-400'
                      }`}
                    >
                      {quality}
                    </button>
                  );
                })}
              </div>
              {formErrors.qualities && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-medium flex items-center">
                    <span className="mr-2 text-lg">⚠️</span>
                    {formErrors.qualities}
                  </p>
                </div>
              )}
            </div>

            {/* Things to Watch For */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-3">
                {t('recs.watchFor')} ({t('recs.optional')})
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                {getTranslatedWatchForOptions().map((item, index) => {
                  const originalItem = watchForOptions[index];
                  return (
                    <button
                      key={originalItem}
                      type="button"
                      onClick={() => toggleWatchFor(originalItem)}
                      title={watchHelp[originalItem]}
                      className={`text-left p-3 rounded-lg border transition-colors ${
                        formData.watchFor.includes(originalItem)
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-300 text-gray-800 hover:border-gray-400'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {limitMsg && (
              <p className="text-xs text-red-600">{limitMsg}</p>
            )}

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
{t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={addRecommendation.isPending}
                className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addRecommendation.isPending ? t('recs.adding') : t('recs.addRecommendation')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}