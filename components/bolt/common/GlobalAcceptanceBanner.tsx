"use client";
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSentConnectionRequests } from '../../../hooks/connections';
import ConnectionAcceptedBanner from './ConnectionAcceptedBanner';

export default function GlobalAcceptanceBanner() {
  const { user } = useAuth();
  const { data: sentReqData } = useSentConnectionRequests(user?.id);
  const [acceptedFriendName, setAcceptedFriendName] = React.useState<string | null>(null);
  const [showAcceptedBanner, setShowAcceptedBanner] = React.useState(false);
  const previousSentRequests = React.useRef<any[]>([]);
  const hasProcessedNotifications = React.useRef(false);

  React.useEffect(() => {
    // DISABLED: Friend acceptance notifications
    // TODO: Fix the notification logic to show only once per login session
    /*
    if (sentReqData?.items && user?.id) {
      const currentSentRequests = sentReqData.items;
      console.log('GlobalAcceptanceBanner - Current sent requests:', currentSentRequests);
      console.log('GlobalAcceptanceBanner - Previous sent requests:', previousSentRequests.current);
      console.log('GlobalAcceptanceBanner - Detailed sent requests:', JSON.stringify(currentSentRequests, null, 2));
      console.log('GlobalAcceptanceBanner - Has processed notifications:', hasProcessedNotifications.current);
      
      // Check for real-time status changes (when user is actively on the page)
      if (previousSentRequests.current.length > 0) {
        currentSentRequests.forEach((currentReq: any) => {
          const previousReq = previousSentRequests.current.find((prev: any) => prev.id === currentReq.id);
          console.log('GlobalAcceptanceBanner - Checking request:', currentReq.id, 'Current status:', currentReq.status, 'Previous status:', previousReq?.status);
          
          // Only show notification if status changed from pending to approved
          if (previousReq && previousReq.status === 'pending' && currentReq.status === 'approved') {
            console.log('GlobalAcceptanceBanner - Request accepted! Showing notification for:', currentReq.name);
            // Request was accepted! Show notification
            setAcceptedFriendName(currentReq.name || 'Someone');
            setShowAcceptedBanner(true);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
              setShowAcceptedBanner(false);
            }, 5000);
          }
        });
      } else {
        // First time loading - check for requests that were accepted while user was away
        const lastSeenKey = `lastSeenSentRequests:${user.id}`;
        const lastSeenData = localStorage.getItem(lastSeenKey);
        console.log('GlobalAcceptanceBanner - Last seen data:', lastSeenData);
        
        if (lastSeenData) {
          try {
            const lastSeenRequests = JSON.parse(lastSeenData);
            console.log('GlobalAcceptanceBanner - Parsed last seen requests:', lastSeenRequests);
            
            currentSentRequests.forEach((currentReq: any) => {
              const lastSeenReq = lastSeenRequests.find((prev: any) => prev.id === currentReq.id);
              console.log('GlobalAcceptanceBanner - Checking stored request:', currentReq.id, 'Current status:', currentReq.status, 'Last seen status:', lastSeenReq?.status);
              
              // If this request was pending when we last saw it, but is now approved
              if (lastSeenReq && lastSeenReq.status === 'pending' && currentReq.status === 'approved') {
                console.log('GlobalAcceptanceBanner - Request was accepted while away! Showing notification for:', currentReq.name);
                // Request was accepted while user was away! Show notification
                setAcceptedFriendName(currentReq.name || 'Someone');
                setShowAcceptedBanner(true);
                
                // Auto-hide after 5 seconds
                setTimeout(() => {
                  setShowAcceptedBanner(false);
                }, 5000);
              }
            });
          } catch (e) {
            console.error('Error parsing last seen requests:', e);
          }
        } else {
          // No localStorage data - check if any requests were recently approved (within last 10 minutes)
          console.log('GlobalAcceptanceBanner - No localStorage data, checking for recently approved requests');
          
          // Only process notifications once per session
          if (hasProcessedNotifications.current) {
            console.log('GlobalAcceptanceBanner - Already processed notifications in this session, skipping');
            return;
          }
          
          // Use a simpler approach - check if we've shown notifications in this session
          const sessionNotificationsKey = `sessionNotifications:${user.id}`;
          const sessionNotifications = JSON.parse(sessionStorage.getItem(sessionNotificationsKey) || '[]');
          console.log('GlobalAcceptanceBanner - Session notifications:', sessionNotifications);
          
          currentSentRequests.forEach((currentReq: any) => {
            if (currentReq.status === 'approved') {
              const requestDate = new Date(currentReq.requestDate);
              const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
              
              // Check if we've already shown notification for this request in this session
              const alreadyShownInSession = sessionNotifications.includes(currentReq.id);
              console.log('GlobalAcceptanceBanner - Request:', currentReq.id, 'Already shown in session:', alreadyShownInSession, 'Recent:', requestDate > tenMinutesAgo);
              
              if (requestDate > tenMinutesAgo && !alreadyShownInSession) {
                console.log('GlobalAcceptanceBanner - Found recently approved request! Showing notification for:', currentReq.name);
                setAcceptedFriendName(currentReq.name || 'Someone');
                setShowAcceptedBanner(true);
                
                // Mark this notification as shown in this session
                const updatedSessionNotifications = [...sessionNotifications, currentReq.id];
                sessionStorage.setItem(sessionNotificationsKey, JSON.stringify(updatedSessionNotifications));
                console.log('GlobalAcceptanceBanner - Marked notification as shown in session:', updatedSessionNotifications);
                
                // Mark that we've processed notifications for this session
                hasProcessedNotifications.current = true;
                
                // Auto-hide after 5 seconds
                setTimeout(() => {
                  setShowAcceptedBanner(false);
                }, 5000);
                
                // Only show one notification at a time
                return;
              } else if (alreadyShownInSession) {
                console.log('GlobalAcceptanceBanner - Skipping notification for', currentReq.name, '- already shown in session');
              }
            }
          });
        }
        
        // Save current state for next time, but mark approved requests as "seen"
        const requestsToSave = currentSentRequests.map(req => ({
          ...req,
          status: req.status === 'approved' ? 'seen' : req.status
        }));
        localStorage.setItem(lastSeenKey, JSON.stringify(requestsToSave));
        
        // Also ensure we don't lose the shown notifications
        const shownNotificationsKey = `shownNotifications:${user.id}`;
        const currentShownNotifications = JSON.parse(localStorage.getItem(shownNotificationsKey) || '[]');
        console.log('GlobalAcceptanceBanner - Preserving shown notifications:', currentShownNotifications);
      }
      
      previousSentRequests.current = currentSentRequests;
    }
    */
  }, [sentReqData, user?.id]);

  return (
    <ConnectionAcceptedBanner
      isVisible={showAcceptedBanner}
      onClose={() => setShowAcceptedBanner(false)}
      friendName={acceptedFriendName || ''}
    />
  );
}
