"use client";
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, Shield, Zap, UserCheck, Briefcase, Phone, Lock, User, Eye, EyeOff, Search, Share2, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../../../context/I18nContext';

const countryCodes = [
  { code: '+221', country: 'Senegal', flag: '🇸🇳' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
];


export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithPhone, signup, continueAsGuest, loading } = useAuth();
  const { t, lang, setLang } = useI18n();
  const [mode, setMode] = useState<'welcome' | 'signin' | 'signup'>('welcome');
  const [userType, setUserType] = useState<'seeker' | 'provider'>('seeker');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Sign in form
  const [signInData, setSignInData] = useState({
    countryCode: '+221',
    phone: '',
    password: ''
  });
  
  // Sign up form
  const [signUpData, setSignUpData] = useState({
    countryCode: '+221',
    phone: '',
    password: '',
    confirmPassword: '',
    name: '',
    userType: 'seeker' as 'seeker' | 'provider'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');


  const validateSignUp = () => {
    const newErrors: Record<string, string> = {};
    
    if (!signUpData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!signUpData.password) newErrors.password = 'Password is required';
    if (signUpData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (signUpData.password && !/(?=.*[a-zA-Z])/.test(signUpData.password)) newErrors.password = 'Password must contain at least one letter';
    if (signUpData.password && !/(?=.*\d)/.test(signUpData.password)) newErrors.password = 'Password must contain at least one number';
    if (signUpData.password !== signUpData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!signUpData.name.trim()) newErrors.name = 'Name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateSignIn = () => {
    const newErrors: Record<string, string> = {};
    
    if (!signInData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!signInData.password) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validateSignUp()) return;
    
    try {
      await signup({
        ...signUpData,
        userType: 'seeker',
        city: 'Dakar',
        language: lang,
      });
      const returnTo = searchParams?.get('returnTo');
      if (returnTo) {
        router.replace(returnTo);
      } else {
        router.replace('/seeker/services');
      }
    } catch (err: any) {
      setSubmitError(err?.message || t('auth.signupFailed') || 'Sign up failed. Please try again.');
    }
  };
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validateSignIn()) return;
    
    try {
      const fullPhone = `${signInData.countryCode}${signInData.phone}`;
      await loginWithPhone(fullPhone, signInData.password, 'seeker');
      const returnTo = searchParams?.get('returnTo');
      if (returnTo) {
        router.replace(returnTo);
      } else {
        router.replace('/seeker/services');
      }
    } catch (err: any) {
      setSubmitError(err?.message || t('auth.signinFailed') || 'Sign in failed. Please check credentials.');
    }
  };


  if (mode === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 ml-2">Lumio</h1>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('auth.createAccount') || 'Create Account'}</h2>
            <p className="text-gray-700 mb-4">{t('auth.join') || 'Join Lumio'}</p>
            {/* Language toggle (signup only) */}
            <div className="flex justify-center mb-2">
              <div className="inline-flex rounded-full bg-gray-100 p-1" role="radiogroup" aria-label="Language">
                {[
                  { id: 'en', label: 'English' },
                  { id: 'fr', label: 'Français' },
                  { id: 'wo', label: 'Wolof' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={lang === opt.id}
                    onClick={() => setLang(opt.id)}
                    className={`${lang === opt.id ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-700'} px-4 py-1.5 text-sm rounded-full mx-0.5 border ${lang === opt.id ? 'border-indigo-600' : 'border-transparent'} font-medium`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Avatar handled later in Profile tab. Default initial will be used. */}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.fullName') || 'Full Name'}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={signUpData.name}
                  onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500 text-gray-900"
                  placeholder={t('auth.fullNamePh') || 'Enter your full name'}
                />
              </div>
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.whatsAppPhone') || 'WhatsApp Phone Number'}</label>
              <div className="flex space-x-2">
                <select
                  value={signUpData.countryCode}
                  onChange={(e) => setSignUpData({ ...signUpData, countryCode: e.target.value })}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                >
                  {countryCodes.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.code}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={signUpData.phone}
                    onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500 text-gray-900"
                    placeholder={t('auth.phonePh') || '70 123 4567'}
                  />
                </div>
              </div>
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>


            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password') || 'Password'}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={signUpData.password}
                  onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500 text-gray-900"
                  placeholder={t('auth.createPassword') || 'Create a password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Password must be at least 8 characters with letters and numbers
              </p>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.confirmPassword') || 'Confirm Password'}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={signUpData.confirmPassword}
                  onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500 text-gray-900"
                  placeholder={t('auth.confirmPasswordPh') || 'Confirm your password'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            {submitError && (
              <p className="text-red-600 text-sm mt-2" role="alert">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (t('auth.creating') || 'Creating Account...') : (t('auth.createAccount') || 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-700">
              {t('auth.alreadyHave') || 'Already have an account?'}{' '}
              <button
                onClick={() => setMode('signin')}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {t('auth.signIn') || 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'signin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 ml-2">Lumio</h1>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('auth.welcomeBack') || 'Welcome Back'}</h2>
            <p className="text-gray-700 mb-4">{t('auth.signInSubtitle') || 'Sign in to your account'}</p>
            {/* Language is selected on profile after signup; no toggle here */}
          </div>


          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.phone') || 'Phone Number'}</label>
              <div className="flex space-x-2">
                <select
                  value={signInData.countryCode}
                  onChange={(e) => setSignInData({ ...signInData, countryCode: e.target.value })}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                >
                  {countryCodes.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.code}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={signInData.phone}
                    onChange={(e) => setSignInData({ ...signInData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500 text-gray-900"
                    placeholder={t('auth.phonePh') || '70 123 4567'}
                  />
                </div>
              </div>
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password') || 'Password'}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={signInData.password}
                  onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500 text-gray-900"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {submitError && (
              <p className="text-red-600 text-sm mt-2" role="alert">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (t('auth.signingIn') || 'Signing In...') : (t('auth.signIn') || 'Sign In')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-700">
              {t('auth.dontHave') || "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {t('auth.createAccount') || 'Create Account'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Public language toggle for visitors */}
      <div className="w-full bg-transparent">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-end">
          <div className="inline-flex rounded-full bg-gray-100 p-1" role="radiogroup" aria-label="Language">
            {[
              { id: 'en', label: 'English' },
              { id: 'fr', label: 'Français' },
              { id: 'wo', label: 'Wolof' },
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={lang === opt.id}
                onClick={() => setLang(opt.id)}
                className={`${lang === opt.id ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-700'} px-4 py-1.5 text-sm rounded-full mx-0.5 border ${lang === opt.id ? 'border-indigo-600' : 'border-transparent'} font-medium`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Auth Options - Only visible on mobile */}
          <div className="block md:hidden mb-8">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors font-medium text-sm"
              >
                {t('auth.createAccount') || 'Create Account'}
              </button>
              
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="flex-1 bg-white text-gray-900 py-3 px-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors font-medium text-sm"
              >
                {t('auth.signIn') || 'Sign In'}
              </button>
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-indigo-600 p-3 rounded-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 ml-3">{t('app.title')}</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto px-4">
              {t('landing.tagline') || 'Find and share reliable plumbers, electricians, HVAC specialists, carpenters and handymen'}
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-8 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl shadow-lg border-2 border-indigo-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-indigo-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Search className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-indigo-900 mb-4">{t('landing.trusted') || 'Find Providers'}</h3>
              <p className="text-indigo-800 text-lg leading-relaxed">{t('landing.trustedText') || 'Browse names, click to whatsapp or call directly'}</p>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg border-2 border-green-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-green-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Share2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-green-900 mb-4">{t('landing.verified') || 'Share Providers'}</h3>
              <p className="text-green-800 text-lg leading-relaxed">{t('landing.verifiedText') || 'Add your trusted service providers'}</p>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg border-2 border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-purple-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-purple-900 mb-4">{t('landing.quick') || 'Community Notes'}</h3>
              <p className="text-purple-800 text-lg leading-relaxed">{t('landing.quickText') || 'See pros and cons of each provider from the Lumio Community'}</p>
            </div>
          </div>

          {/* Auth Options - Hidden on mobile, visible on desktop */}
          <div className="hidden md:block max-w-lg mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('landing.getStarted') || 'Get Started'}</h2>
              <p className="text-gray-700">{t('landing.getStartedText') || 'Join Lumio to get started'}</p>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="w-full bg-indigo-600 text-white py-4 px-6 rounded-xl hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors font-medium text-lg"
              >
                {t('auth.createAccount') || 'Create Account'}
              </button>
              
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="w-full bg-white text-gray-900 py-4 px-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors font-medium text-lg"
              >
                {t('auth.signIn') || 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}