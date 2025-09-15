import React, { useMemo, useState, useRef, useEffect } from 'react';
import { X, Search, MapPin, Users, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../../context/I18nContext';
import InitialsAvatar from '../common/InitialsAvatar';
import { useDiscoverUsers, useSentConnectionRequests } from '../../../hooks/connections';
import { useQueryClient } from '@tanstack/react-query';

interface FindPeopleModalProps {
  onClose: () => void;
}

// Data now comes from the API via useConnections (returns all users when no userId provided)

export default function FindPeopleModal({ onClose }: FindPeopleModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const { addConnection, user } = useAuth();
  const { t } = useI18n();
  const { data } = useDiscoverUsers(user?.id);
  const { data: sentReqData } = useSentConnectionRequests(user?.id);
  const queryClient = useQueryClient();
  
  // Get sent request recipient IDs from the API data
  const sentRequests = ((sentReqData as any)?.items || []).map((req: any) => req.id);
  console.log('sentRequests array:', sentRequests);
  console.log('Amadou Kane ID:', '56f06ee9-dcca-42cc-ba0a-a060eb355d20');
  console.log('Is Amadou in sentRequests?', sentRequests.includes('56f06ee9-dcca-42cc-ba0a-a060eb355d20'));
  const apiPeople = (data?.items as any[]) || [];
  const people = useMemo(() => apiPeople.map(p => ({
    id: p.id,
    name: p.name || 'Member',
    location: p.location || 'Dakar',
    avatar: p.avatar || p.photo_url || null,
    phone: p.masked_phone || '',
    mutualConnections: p.mutualConnections || 0,
    mutualNames: p.mutualNames || [],
    recommendationCount: p.recommendationCount || 0,
  })), [apiPeople]);

  const maskPhoneNumber = (phone: string) => {
    // The API already returns properly masked phone numbers with real last 4 digits
    return phone || '**** **** ****';
  };

  // Click outside to close modal
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
  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.phone.includes(searchTerm)
  );

  const handleSendRequest = async (personId: string) => {
    const person = people.find(p => p.id === personId);
    if (!person || !user?.id) return;
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_user_id: user.id, recipient_user_id: person.id, requester_name: user.name, recipient_name: person.name }),
      });
      if (res.ok) {
        // Request sent successfully - refresh the data
        console.log('Request sent to:', personId);
        queryClient.refetchQueries({ queryKey: ['sent-connection-requests'] });
      } else {
        console.error('API error:', await res.json());
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div ref={modalRef} className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t('findPeople.title')}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4 md:mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('findPeople.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 md:pl-12 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
            />
          </div>

          {/* Suggested People */}
          <div className="mb-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">{t('findPeople.suggestedFriends')}</h3>
            <div className="space-y-3 md:space-y-4">
              {filteredPeople.map((person) => (
                <div key={person.id} className="bg-gray-50 rounded-lg p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      {person.avatar ? (
                        <img
                          src={person.avatar}
                          alt={person.name}
                          className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover mr-3 md:mr-4"
                        />
                      ) : (
                        <InitialsAvatar
                          name={person.name}
                          className="w-10 h-10 md:w-12 md:h-12 mr-3 md:mr-4"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="text-sm md:text-base font-semibold text-gray-900">{person.name}</h4>
                        <div className="flex items-center text-gray-500 text-xs md:text-sm mb-1">
                          <MapPin className="w-3 md:w-4 h-3 md:h-4 mr-1" />
                          {person.location}
                        </div>
                        <div className="flex items-center text-gray-500 text-xs md:text-sm">
                          <Users className="w-3 md:w-4 h-3 md:h-4 mr-1" />
                          {person.mutualConnections} {t('findPeople.mutualConnections')}
                          {person.mutualConnections > 0 && (
                            <span className="ml-1 text-gray-400">
                              ({person.mutualNames.join(', ')})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-indigo-600 mt-1">
                          {person.recommendationCount} {t('findPeople.recommendations')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {maskPhoneNumber(person.phone)}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleSendRequest(person.id)}
                      disabled={sentRequests.includes(person.id)}
                      className={`ml-3 px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium text-xs md:text-sm transition-colors ${
                        sentRequests.includes(person.id)
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {sentRequests.includes(person.id) ? (
                        t('connections.requestSent')
                      ) : (
                        <>
                          <UserPlus className="w-3 md:w-4 h-3 md:h-4 mr-1 inline" />
                          {t('findPeople.addFriend')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}