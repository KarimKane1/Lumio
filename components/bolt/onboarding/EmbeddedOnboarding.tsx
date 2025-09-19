"use client";
import React, { useState } from 'react';
import { useI18n } from '../../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useAddRecommendation } from '../../../hooks/recommendations';
import { useCategories } from '../../../lib/hooks/useCategories';
import { X, ArrowRight, CheckCircle, Plus, User, Briefcase, Phone, Search, Users, Share2, MessageSquare } from 'lucide-react';

interface EmbeddedOnboardingProps {
  onComplete: () => void;
  userType: 'seeker' | 'provider';
  onTabChange?: (tab: string) => void;
}

export default function EmbeddedOnboarding({ onComplete, userType, onTabChange }: EmbeddedOnboardingProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addRecommendation = useAddRecommendation();
  const { categories, loading: categoriesLoading, getLocalizedCategoryName } = useCategories();
  const [currentStep, setCurrentStep] = useState(0);
  const [providerAdded, setProviderAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [providerForm, setProviderForm] = useState({
    name: '',
    serviceType: '',
    countryCode: '+221',
    phone: '',
    location: 'Dakar',
    qualities: [] as string[],
    watchFor: [] as string[]
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  // Quality options
  const qualityOptions = [
    'quality.jobQuality',
    'quality.timeliness',
    'quality.cleanOrganized',
    'quality.professional',
    'quality.reliableTrustworthy',
    'quality.fairPricing'
  ];

  // Watch out options
  const watchOutOptions = [
    'watchFor.expensive',
    'watchFor.limitedAvailability',
    'watchFor.punctuality',
    'watchFor.communication'
  ];

  const maxQualities = 3;
  const maxWatch = 2;
  const [limitMsg, setLimitMsg] = useState('');

  const toggleQuality = (quality: string) => {
    setProviderForm(prev => {
      const newQualities = prev.qualities.includes(quality)
        ? prev.qualities.filter(q => q !== quality)
        : [...prev.qualities, quality];
      
      if (newQualities.length > maxQualities) {
        setLimitMsg(`You can select up to ${maxQualities} pros`);
        return prev;
      } else {
        setLimitMsg('');
        return { ...prev, qualities: newQualities };
      }
    });
  };

  const toggleWatchFor = (watch: string) => {
    setProviderForm(prev => {
      const newWatchFor = prev.watchFor.includes(watch)
        ? prev.watchFor.filter(w => w !== watch)
        : [...prev.watchFor, watch];
      
      if (newWatchFor.length > maxWatch) {
        setLimitMsg(`You can select up to ${maxWatch} cons`);
        return prev;
      } else {
        setLimitMsg('');
        return { ...prev, watchFor: newWatchFor };
      }
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!providerForm.name.trim()) {
      errors.name = t('addRec.providerNameRequired') || 'Provider name is required';
    }
    
    if (!providerForm.serviceType) {
      errors.serviceType = t('addRec.serviceTypeRequired') || 'Service type is required';
    }
    
    if (!providerForm.phone.trim()) {
      errors.phone = t('addRec.phoneRequired') || 'Phone number is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddProvider = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setSubmitError('');
    
    try {
      const fullPhone = `${providerForm.countryCode}${providerForm.phone}`;
      
      await addRecommendation.mutateAsync({
        name: providerForm.name.trim(),
        serviceType: providerForm.serviceType,
        phone: fullPhone,
        location: providerForm.location,
        qualities: providerForm.qualities,
        watchFor: providerForm.watchFor
      });

      setProviderAdded(true);
      setTimeout(() => {
        onTabChange?.('services');
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Error adding provider:', error);
      setSubmitError(t('addRec.failedToAdd') || 'Failed to add provider. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onTabChange?.('services');
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-indigo-600 p-2 rounded-lg mr-3">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {currentStep === 0 ? (t('onboarding.seeker.welcome') || 'Welcome to Lumio! 🎉') : (t('addRec.addTitle') || 'Add Service Provider')}
              </h2>
              <p className="text-sm text-gray-600">
                {currentStep === 0 ? 'Step 1 of 2' : currentStep === 1 ? 'Step 2 of 2' : 'Add Provider'}
              </p>
            </div>
          </div>
          {currentStep === 1 && (
            <button
              onClick={handleComplete}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 0: Welcome & Tab Overview */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t('onboarding.seeker.welcome') || 'Welcome to Lumio! 🎉'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t('onboarding.tabOverview') || 'Let\'s quickly show you how to navigate the app'}
                </p>
              </div>

              {/* Tab Features */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{t('onboarding.friendsTab') || 'Friends Tab'}</h4>
                    <p className="text-sm text-gray-600">{t('onboarding.friendsTabDesc') || 'Connect with friends to see their trusted providers'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Search className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{t('onboarding.servicesTab') || 'Services Tab'}</h4>
                    <p className="text-sm text-gray-600">{t('onboarding.servicesTabDesc') || 'Browse and contact service providers from your network'}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep(1)}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                {t('common.getStarted') || 'Get Started'}
              </button>
            </div>
          )}

          {/* Step 1: Add Provider Choice */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('addRec.addTitle') || 'Add Service Provider'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t('addRec.addSubtitle') || 'Know a great service provider? Share them with your network on Lumio'}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('addRec.addProvider') || 'Add Provider'}
                </button>
                
                <button
                  onClick={handleComplete}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Add Provider Form */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <form onSubmit={(e) => { e.preventDefault(); handleAddProvider(); }} className="space-y-4">
                {/* General error message */}
                {submitError && (
                  <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <span className="text-red-600 mr-3 text-xl">⚠️</span>
                      <p className="text-red-800 font-semibold text-base">{submitError}</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    {t('addRec.providerName')} *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={providerForm.name}
                      onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500 text-gray-900 ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('addRec.enterProviderName')}
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
                    {t('addRec.serviceType')} *
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={providerForm.serviceType}
                      onChange={(e) => setProviderForm({ ...providerForm, serviceType: e.target.value })}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 ${
                        formErrors.serviceType ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">{t('addRec.selectServiceType')}</option>
                      {categories?.map((category) => (
                        <option key={category.id} value={category.slug}>
                          {getLocalizedCategoryName(category)}
                        </option>
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
                    {t('addRec.phoneNumber')} *
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={providerForm.countryCode}
                      onChange={(e) => setProviderForm({ ...providerForm, countryCode: e.target.value })}
                      className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    >
                      <option value="+221">SN +221</option>
                      <option value="+33">FR +33</option>
                      <option value="+1">US +1</option>
                    </select>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={providerForm.phone}
                        onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500 text-gray-900 ${
                          formErrors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={t('addRec.enterPhoneNumber')}
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

                {/* Pros */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    {t('addRec.whatYouLiked')} <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {qualityOptions.map((quality) => (
                      <button
                        key={quality}
                        type="button"
                        onClick={() => toggleQuality(quality)}
                        className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                          providerForm.qualities.includes(quality)
                            ? 'bg-green-100 text-green-800 border-2 border-green-300'
                            : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {t(quality)}
                      </button>
                    ))}
                  </div>
                  {limitMsg && (
                    <p className="text-sm text-orange-600 mt-2">{limitMsg}</p>
                  )}
                </div>

                {/* Cons */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    {t('addRec.thingsToWatch')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {watchOutOptions.map((watch) => (
                      <button
                        key={watch}
                        type="button"
                        onClick={() => toggleWatchFor(watch)}
                        className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                          providerForm.watchFor.includes(watch)
                            ? 'bg-orange-100 text-orange-800 border-2 border-orange-300'
                            : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {t(watch)}
                      </button>
                    ))}
                  </div>
                  {limitMsg && (
                    <p className="text-sm text-orange-600 mt-2">{limitMsg}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={addRecommendation.isPending}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {addRecommendation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('addRec.addingProvider')}
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('addRec.addProvider')}
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center"
                  >
                    Back
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}