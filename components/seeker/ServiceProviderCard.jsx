"use client";
import React from 'react';
import { MapPin, MessageCircle } from 'lucide-react';

export default function ServiceProviderCard({ provider, onViewDetails, onContact, isGuest = false }) {
  const handleCardClick = () => {
    if (onViewDetails) onViewDetails();
  };

  const handleWhatsAppContact = async () => {
    if (isGuest && onContact) {
      onContact();
      return;
    }
    
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
            service_type: provider.service_type || provider.serviceType,
            contact_method: 'whatsapp'
            // Note: This old component doesn't have user context, so user_id will be null
            // This should be updated to use the new ServiceProviderCard.tsx component
          }
        })
      });
    } catch (error) {
      console.error('Failed to track contact click:', error);
    }
    
    const message = `Hi ${provider.name}, I found you through Lumio, it's an app for friends to refer ${String(provider.service_type || provider.serviceType || '').toLowerCase()} they like. I would like to inquire about your ${String(provider.service_type || provider.serviceType || '').toLowerCase()} services.`;
    
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

  const avatar = provider.avatar || 'https://placehold.co/128x128?text=' + encodeURIComponent(provider.name?.[0] || '');
  const location = provider.city || provider.location || '';
  const service = provider.service_type || provider.serviceType || '';
  const maskedPhone = 'Phone available';

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex items-center mb-3 md:mb-4">
        <img
          src={avatar}
          alt={provider.name}
          className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover mr-3 md:mr-4"
        />
        <div className="flex-1">
          <div>
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">{provider.name}</h3>
            <p className="text-indigo-600 font-medium mb-1 text-sm md:text-base">{service}</p>
            <div className="flex items-center text-gray-500 text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              {location}
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
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
        <span className="text-xs md:text-sm text-gray-500">{maskedPhone}</span>
      </div>
    </div>
  );
}


