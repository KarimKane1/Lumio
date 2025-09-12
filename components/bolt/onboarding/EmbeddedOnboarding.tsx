"use client";
import React, { useState, useEffect } from 'react';
import { useI18n } from '../../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useSentConnectionRequests } from '../../../hooks/connections';
import { useAddRecommendation } from '../../../hooks/recommendations';
import { useCategories } from '../../../lib/hooks/useCategories';
import { X, Users, UserPlus, ArrowRight, CheckCircle, Plus, User, Briefcase, Phone } from 'lucide-react';

interface EmbeddedOnboardingProps {
  onComplete: () => void;
  userType: 'seeker' | 'provider';
  onTabChange?: (tab: string) => void;
}

export default function EmbeddedOnboarding({ onComplete, userType, onTabChange }: EmbeddedOnboardingProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: sentReqData } = useSentConnectionRequests(user?.id);
  const addRecommendation = useAddRecommendation();
  const { categories, loading: categoriesLoading, getLocalizedCategoryName } = useCategories();
  const [currentStep, setCurrentStep] = useState(0);
  const [friendsAdded, setFriendsAdded] = useState(false);
  const [providerAdded, setProviderAdded] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
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

  // Quality options (same as real modal)
  const qualityOptions = [
    'Job quality',
    'Timeliness',
    'Clean & organized',
    'Professional',
    'Reliable & trustworthy',
    'Fair pricing'
  ];

  const qualityHelp: Record<string, string> = {
    'Job quality': 'Work done well, meets expectations',
    'Timeliness': 'Shows up on time, completes work on schedule',
    'Clean & organized': 'Keeps work area clean, organized',
    'Professional': 'Polite, respectful, good communication',
    'Reliable & trustworthy': 'Can count on them, honest',
    'Fair pricing': 'Reasonable rates, good value'
  };

  const watchForOptions = [
    'Expensive',
    'Limited availability',
    'Punctuality',
    'Communication'
  ];

  const watchHelp: Record<string, string> = {
    'Expensive': 'Higher rates than expected',
    'Limited availability': 'Hard to schedule, busy schedule',
    'Punctuality': 'May be late or miss appointments',
    'Communication': 'Hard to reach or slow to respond'
  };

  const maxQualities = 3;
  const maxWatch = 2;
  const [limitMsg, setLimitMsg] = useState('');

  const toggleQuality = (quality: string) => {
    setProviderForm(prev => {
      const newQualities = prev.qualities.includes(quality)
        ? prev.qualities.filter(q => q !== quality)
        : [...prev.qualities, quality];
      
      if (newQualities.length > maxQualities) {
        setLimitMsg(`You can select up to ${maxQualities} qualities`);
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
        setLimitMsg(`You can select up to ${maxWatch} things to watch out for`);
        return prev;
      } else {
        setLimitMsg('');
        return { ...prev, watchFor: newWatchFor };
      }
    });
  };

  // Check if a friend request has been sent (using real API data)
  const isFriendRequestSent = (friendId: string) => {
    const sentRequests = ((sentReqData as any)?.items || []);
    return sentRequests.some((req: any) => req.id === friendId && req.status === 'pending');
  };

  const checkConnectionStatus = async (friendId: string) => {
    try {
      // Check if there's already a connection
      const response = await fetch(`/api/connections?network=1&userId=${user?.id}`);
      const data = await response.json();
      const isConnected = (data.items || []).some((item: any) => item.id === friendId);
      
      // Check if there's a pending request
      const sentResponse = await fetch(`/api/connections?sentRequests=1&userId=${user?.id}`);
      const sentData = await sentResponse.json();
      const hasPendingRequest = (sentData.items || []).some((item: any) => item.id === friendId);
      
      console.log('Connection status for', friendId, ':', { isConnected, hasPendingRequest });
      return { isConnected, hasPendingRequest };
    } catch (error) {
      console.error('Error checking connection status:', error);
      return { isConnected: false, hasPendingRequest: false };
    }
  };

  // Check if both required friends have been added
  const checkFriendsAdded = () => {
    const karimId = '8cdb51a1-4e0c-498d-b5fc-bc5celldcaa9';
    const maymounaId = 'ce599012-6457-4e6b-b81a-81da8e740f74';
    
    const karimAdded = isFriendRequestSent(karimId);
    const maymounaAdded = isFriendRequestSent(maymounaId);
    
    console.log('Onboarding Debug: Karim added:', karimAdded, 'Maymouna added:', maymounaAdded);
    console.log('Onboarding Debug: Current step:', currentStep, 'Friends added state:', friendsAdded);
    console.log('Onboarding Debug: Sent requests data:', sentReqData);
    
    if (karimAdded && maymounaAdded && !friendsAdded) {
      console.log('Onboarding Debug: Both friends added, moving to step 2');
      setFriendsAdded(true);
      setTimeout(() => setCurrentStep(2), 1500);
    } else {
      console.log('Onboarding Debug: Not moving to step 2 yet. Karim:', karimAdded, 'Maymouna:', maymounaAdded, 'FriendsAdded:', friendsAdded);
    }
  };

  // Check friends status when sent requests data changes
  useEffect(() => {
    if (currentStep === 1 && sentReqData) {
      checkFriendsAdded();
    }
  }, [sentReqData, currentStep]);

  // Navigate to appropriate page when step changes (with delay to prevent flashing)
  useEffect(() => {
    if (currentStep === 2) {
      // Navigate to providers page when starting step 2
      setTimeout(() => {
        onTabChange?.('recommendations');
      }, 500);
    } else if (currentStep === 3) {
      // Navigate to services page when starting step 3
      setTimeout(() => {
        onTabChange?.('services');
      }, 500);
    }
  }, [currentStep, onTabChange]);

  const autoAcceptOnboardingFriends = async () => {
    try {
      const karimId = '8cdb51a1-4e0c-498d-b5fc-bc5celldcaa9';
      const maymounaId = 'ce599012-6457-4e6b-b81a-81da8e740f74';
      
      // Accept friend requests from Karim and Maymouna
      const acceptPromises = [karimId, maymounaId].map(async (friendId) => {
        try {
          const response = await fetch('/api/connections', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requester_user_id: friendId,
              recipient_user_id: user?.id,
              action: 'approve'
            })
          });
          
          if (!response.ok) {
            console.log(`Could not auto-accept ${friendId}:`, await response.text());
          }
        } catch (error) {
          console.log(`Error auto-accepting ${friendId}:`, error);
        }
      });
      
      await Promise.all(acceptPromises);
      console.log('Auto-accepted friend requests from Karim and Maymouna');
    } catch (error) {
      console.error('Error auto-accepting friends:', error);
    }
  };

  const handleComplete = async () => {
    // Auto-accept friend requests from Karim and Maymouna
    await autoAcceptOnboardingFriends();
    onComplete?.();
  };

  // Fetch suggestions for step 1
  useEffect(() => {
    if (currentStep === 0) {
      fetchSuggestions();
    }
  }, [currentStep]);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(`/api/connections?discover=1&userId=${user?.id}`);
      const data = await response.json();
      
      // Filter to only show Karim and Maymouna for onboarding
      const karimId = '8cdb51a1-4e0c-498d-b5fc-bc5celldcaa9';
      const maymounaId = 'ce599012-6457-4e6b-b81a-81da8e740f74';
      
      const filteredSuggestions = (data.items || []).filter((item: any) => 
        item.id === karimId || item.id === maymounaId
      );
      
      // If we don't have both users from API, create fallback cards for onboarding
      if (filteredSuggestions.length < 2) {
        const fallbackSuggestions = [
          {
            id: karimId,
            name: 'Karim Kane',
            location: 'Dakar',
            avatar: null,
            mutualConnections: 0,
            mutualNames: [],
            recommendationCount: 0,
            masked_phone: '+1 *****3750'
          },
          {
            id: maymounaId,
            name: 'Maymouna Kane',
            location: 'Dakar',
            avatar: null,
            mutualConnections: 0,
            mutualNames: [],
            recommendationCount: 0,
            masked_phone: '+1 *****4440'
          }
        ];
        
        // Merge API results with fallback (prioritize API data if available)
        const mergedSuggestions = [];
        const apiIds = new Set(filteredSuggestions.map(item => item.id));
        
        // Add API results first
        mergedSuggestions.push(...filteredSuggestions);
        
        // Add fallback for missing users
        fallbackSuggestions.forEach(fallback => {
          if (!apiIds.has(fallback.id)) {
            mergedSuggestions.push(fallback);
          }
        });
        
        setSuggestions(mergedSuggestions);
      } else {
        setSuggestions(filteredSuggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      // Fallback to hardcoded suggestions if API fails
      setSuggestions([
        {
          id: '8cdb51a1-4e0c-498d-b5fc-bc5celldcaa9',
          name: 'Karim Kane',
          location: 'Dakar',
          avatar: null,
          mutualConnections: 0,
          mutualNames: [],
          recommendationCount: 0,
          masked_phone: '+1 *****3750'
        },
        {
          id: 'ce599012-6457-4e6b-b81a-81da8e740f74',
          name: 'Maymouna Kane',
          location: 'Dakar',
          avatar: null,
          mutualConnections: 0,
          mutualNames: [],
          recommendationCount: 0,
          masked_phone: '+1 *****4440'
        }
      ]);
    }
  };

  const handleAddFriend = async (friendId: string, friendName: string) => {
    setLoading(true);
    try {
      console.log('Adding friend:', friendId, friendName, 'from user:', user?.id);
      
      // Check connection status first
      const { isConnected, hasPendingRequest } = await checkConnectionStatus(friendId);
      
      if (isConnected) {
        console.log('Already connected to', friendName);
        // Refresh data to update UI
        queryClient.refetchQueries({ queryKey: ['sent-connection-requests'] });
        return;
      }
      
      if (hasPendingRequest) {
        console.log('Request already pending to', friendName);
        // Refresh data to update UI
        queryClient.refetchQueries({ queryKey: ['sent-connection-requests'] });
        return;
      }
      
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester_user_id: user?.id,
          recipient_user_id: friendId,
          requester_name: user?.name,
          recipient_name: friendName,
        }),
      });

      console.log('Add friend response:', response.status);
      
      if (response.ok) {
        // Refresh the sent requests data (same as regular app)
        queryClient.refetchQueries({ queryKey: ['sent-connection-requests'] });
        console.log('Request sent successfully, refreshing data...');
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        
        // Show user-friendly error message
        if (response.status === 409) {
          if (errorData.error === 'Request already sent') {
            console.log('Request already sent to', friendName);
          } else if (errorData.error === 'Already connected') {
            console.log('Already connected to', friendName);
          }
        }
      }
    } catch (error) {
      console.error('Error adding friend:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProvider = async () => {
    // Clear previous errors
    setFormErrors({});
    setSubmitError('');

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!providerForm.name.trim()) {
      errors.name = 'Provider name is required';
    }
    if (!providerForm.serviceType) {
      errors.serviceType = 'Service type is required';
    }
    if (!providerForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const recommendationData = {
        name: providerForm.name,
        serviceType: providerForm.serviceType,
        phone: `${providerForm.countryCode} ${providerForm.phone}`,
        location: providerForm.location,
        qualities: providerForm.qualities,
        watchFor: providerForm.watchFor,
      };

      await addRecommendation.mutateAsync(recommendationData);
      
      setProviderAdded(true);
      setTimeout(() => setCurrentStep(3), 1500);
    } catch (error) {
      console.error('Error adding provider:', error);
      setSubmitError('Failed to add provider. Please try again.');
    }
  };

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Lumio! 🎉',
      description: 'Let\'s get you set up quickly. We\'ll add some friends and providers to get you started.',
    },
    {
      id: 'add-friends',
      title: 'Add Your First Friends 👥',
      description: 'This is where you add friends. Start with Maymouna and Karim.',
    },
    {
      id: 'add-provider',
      title: 'Add a Trusted Provider 🛠️',
      description: 'Add a service provider you trust and would want to recommend to your friends. This helps build your network and helps others find great services.',
    },
    {
      id: 'complete',
      title: 'You\'re All Set! 🎉',
      description: 'Welcome to Lumio! You can now explore services and connect with your network.',
    },
  ];

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-indigo-600 font-bold text-sm">{currentStep + 1}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{currentStepData.title}</h2>
          </div>
          {currentStep === 3 && (
            <button
              onClick={handleComplete}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <p className="text-gray-600 mb-6">{currentStepData.description}</p>

        {/* Step 0: Welcome */}
        {currentStep === 0 && (
          <div className="mb-6">
            <button
              onClick={() => setCurrentStep(1)}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Let's Get Started
            </button>
          </div>
        )}

        {/* Step 1: Add Friends */}
        {currentStep === 1 && (
          <div className="mb-6">
            {!friendsAdded ? (
              <div className="space-y-3">
                {suggestions.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-indigo-600 font-bold text-sm">
                          {friend.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{friend.name}</div>
                        <div className="text-sm text-gray-500">Dakar</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddFriend(friend.id, friend.name)}
                      disabled={loading || isFriendRequestSent(friend.id)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm ${
                        isFriendRequestSent(friend.id)
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                      }`}
                    >
                      {loading ? 'Adding...' : isFriendRequestSent(friend.id) ? 'Request Sent' : 'Add Friend'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-green-800 font-medium">Great! You've added friends!</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Add Provider */}
        {currentStep === 2 && (
          <div className="mb-6">
            {!providerAdded ? (
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
                    Provider Name *
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
                      placeholder="Enter provider name"
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
                    Service Type *
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={providerForm.serviceType}
                      onChange={(e) => setProviderForm({ ...providerForm, serviceType: e.target.value })}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none text-gray-900 ${
                        formErrors.serviceType ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                      disabled={categoriesLoading}
                    >
                      <option value="">{categoriesLoading ? 'Loading...' : 'Select service type'}</option>
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
                    Provider's Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <div className="flex space-x-2 pl-10">
                      <select
                        value={providerForm.countryCode}
                        onChange={(e) => setProviderForm({ ...providerForm, countryCode: e.target.value })}
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
                        value={providerForm.phone}
                        onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })}
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
                    What You Liked (Optional)
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {qualityOptions.map((quality) => (
                      <button
                        key={quality}
                        type="button"
                        onClick={() => toggleQuality(quality)}
                        className={`text-center p-3 rounded-lg border transition-colors ${
                          providerForm.qualities.includes(quality)
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-300 text-gray-800 hover:border-gray-400'
                        }`}
                      >
                        <div className="font-medium text-sm">{quality}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Things to Watch Out For */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-3">
                    Things to Watch Out For (Optional)
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {watchForOptions.map((watch) => (
                      <button
                        key={watch}
                        type="button"
                        onClick={() => toggleWatchFor(watch)}
                        className={`text-center p-3 rounded-lg border transition-colors ${
                          providerForm.watchFor.includes(watch)
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-300 text-gray-800 hover:border-gray-400'
                        }`}
                      >
                        <div className="font-medium text-sm">{watch}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {limitMsg && (
                  <p className="text-xs text-red-600">{limitMsg}</p>
                )}
                
                <button
                  type="submit"
                  disabled={addRecommendation.isPending}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {addRecommendation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding Provider...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Provider
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-green-800 font-medium">Perfect! Provider added!</span>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Complete */}
        {currentStep === 3 && (
          <div className="mb-6">
            <button
              onClick={handleComplete}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Start Using Lumio
            </button>
          </div>
        )}

        {/* Progress indicator */}
        <div className="mt-6 flex justify-center space-x-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index <= currentStep ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
