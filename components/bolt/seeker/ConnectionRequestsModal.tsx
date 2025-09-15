import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, Check, UserX, MapPin, Users, Send, Inbox } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../../context/I18nContext';
import { useConnectionRequests, useSentConnectionRequests } from '../../../hooks/connections';
import InitialsAvatar from '../common/InitialsAvatar';

interface ConnectionRequestsModalProps {
  onClose: () => void;
}

// Data now fetched from API via hook

export default function ConnectionRequestsModal({ onClose }: ConnectionRequestsModalProps) {
  const qc = useQueryClient();
  const modalRef = useRef<HTMLDivElement>(null);
  const { addConnection, user } = useAuth();
  const { t } = useI18n();
  const { data: receivedData, refetch: refetchReceived } = useConnectionRequests(user?.id);
  const { data: sentData, refetch: refetchSent } = useSentConnectionRequests(user?.id);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  
  // Force refresh data when modal opens
  React.useEffect(() => {
    refetchReceived();
    refetchSent();
  }, [refetchReceived, refetchSent]);
  
  const receivedRequests = ((receivedData as any)?.items as any[]) || [];
  const sentRequests = ((sentData as any)?.items as any[]) || [];
  
  // Debug logging
  React.useEffect(() => {
    console.log('ConnectionRequestsModal Debug:', {
      userId: user?.id,
      receivedRequests: receivedRequests.length,
      sentRequests: sentRequests.length,
      receivedData,
      sentData,
      activeTab,
      currentRequests: activeTab === 'received' ? receivedRequests : sentRequests
    });
  }, [user?.id, receivedRequests.length, sentRequests.length, receivedData, sentData, activeTab]);

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

  const handleAcceptRequest = async (requesterId: string) => {
    try {
      console.log('Accepting connection request for:', requesterId);
      const response = await fetch('/api/connections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_user_id: requesterId, recipient_user_id: user?.id, action: 'approve' }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to accept request:', response.status, errorText);
        alert(`Failed to accept friend request: ${errorText}`);
        return;
      }
      
      const result = await response.json();
      console.log('Connection accepted:', result);
      
      // Force refetch all related queries
      await Promise.all([
        qc.refetchQueries({ queryKey: ['connection-requests', user?.id || 'me'] }),
        qc.refetchQueries({ queryKey: ['connections', user?.id || 'me'] }),
        qc.refetchQueries({ queryKey: ['sent-connection-requests', user?.id || 'me'] })
      ]);
      
      console.log('Queries refetched');
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleDeclineRequest = async (requesterId: string) => {
    try {
      console.log('Declining connection request for:', requesterId);
      const response = await fetch('/api/connections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_user_id: requesterId, recipient_user_id: user?.id, action: 'deny' }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to decline request:', errorText);
        return;
      }
      
      const result = await response.json();
      console.log('Connection declined:', result);
      
      // Force refetch connection requests
      await qc.refetchQueries({ queryKey: ['connection-requests', user?.id || 'me'] });
      
      console.log('Connection requests refetched');
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  const handleCancelRequest = async (recipientId: string) => {
    console.log('Cancel request called with:', {
      requester_user_id: user?.id,
      recipient_user_id: recipientId,
      action: 'cancel'
    });
    
    try {
      const response = await fetch('/api/connections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_user_id: user?.id, recipient_user_id: recipientId, action: 'cancel' }),
      });
      
      console.log('Cancel response status:', response.status);
      const responseText = await response.text();
      console.log('Cancel response:', responseText);
      
      if (!response.ok) {
        console.error('Failed to cancel request:', response.status, responseText);
        return;
      }
      
      // Invalidate all related queries to refresh data
      qc.invalidateQueries({ queryKey: ['sent-connection-requests', user?.id || 'me'] });
      qc.invalidateQueries({ queryKey: ['connection-requests', user?.id || 'me'] });
      qc.invalidateQueries({ queryKey: ['connections', user?.id || 'me'] });
    } catch (error) {
      console.error('Error canceling request:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div ref={modalRef} className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t('connections.friendRequests')}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'received'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Inbox className="w-4 h-4 mr-2" />
{t('connections.received')} ({receivedRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Send className="w-4 h-4 mr-2" />
{t('connections.sent')} ({sentRequests.length})
            </button>
          </div>

          {(activeTab === 'received' ? receivedRequests.length : sentRequests.length) === 0 ? (
            <div className="text-center py-8 md:py-12">
              <Users className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                {activeTab === 'received' ? t('connections.noPendingRequests') : t('connections.noSentRequests')}
              </h3>
              <p className="text-sm md:text-base text-gray-600">
                {activeTab === 'received' 
                  ? t('connections.allCaughtUp')
                  : t('connections.noSentRequestsYet')
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {(activeTab === 'received' ? receivedRequests : sentRequests).map((request) => (
                <div key={request.id} className="bg-gray-50 rounded-lg p-3 md:p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center flex-1">
                      {request.avatar ? (
                        <img
                          src={request.avatar}
                          alt={request.name}
                          className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover mr-3 md:mr-4"
                        />
                      ) : (
                        <InitialsAvatar
                          name={request.name}
                          className="w-10 h-10 md:w-12 md:h-12 mr-3 md:mr-4"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="text-sm md:text-base font-semibold text-gray-900">{request.name}</h4>
                        <div className="flex items-center text-gray-500 text-xs md:text-sm mb-1">
                          <MapPin className="w-3 md:w-4 h-3 md:h-4 mr-1" />
                          {request.location}
                        </div>
                        <div className="flex items-center text-gray-500 text-xs md:text-sm mb-1">
                          <Users className="w-3 md:w-4 h-3 md:h-4 mr-1" />
                          {request.mutualConnections} {request.mutualConnections === 1 ? t('connections.mutualConnection') : t('connections.mutualConnections')}
                          {request.mutualConnections > 0 && (
                            <span className="ml-1 text-gray-400">
                              ({request.mutualNames.join(', ')})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-indigo-600">
                          {request.recommendationCount} {t('connections.recommendations')}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {t('connections.requested')} {new Date(request.requestDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-3">
                      {activeTab === 'received' ? (
                        <>
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="bg-green-600 text-white px-2 md:px-3 py-1.5 md:py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-xs md:text-sm flex items-center"
                          >
                            <Check className="w-3 md:w-4 h-3 md:h-4 mr-1" />
{t('connections.accept')}
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(request.id)}
                            className="bg-gray-600 text-white px-2 md:px-3 py-1.5 md:py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium text-xs md:text-sm flex items-center"
                          >
                            <UserX className="w-3 md:w-4 h-3 md:h-4 mr-1" />
{t('connections.decline')}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          className="bg-red-600 text-white px-2 md:px-3 py-1.5 md:py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-xs md:text-sm flex items-center"
                        >
                          <X className="w-3 md:w-4 h-3 md:h-4 mr-1" />
{t('connections.cancel')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 rounded-lg p-3 md:p-4 mt-4 md:mt-6">
            <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-2">{t('connections.aboutFriendRequests')}</h4>
            <ul className="text-xs md:text-sm text-gray-600 space-y-1">
              <li>• {t('connections.onlyAcceptKnown')}</li>
              <li>• {t('connections.mutualConnectionsHelp')}</li>
              <li>• {t('connections.canRemoveLater')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}