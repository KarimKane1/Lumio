"use client";
import { useQuery } from '@tanstack/react-query';

export function useConnections(userId?: string) {
  const qp = new URLSearchParams();
  if (userId) qp.set('userId', userId);
  qp.set('network', '1');
  return useQuery({
    queryKey: ['connections', userId || 'me'],
    queryFn: async () => {
      const res = await fetch(`/api/connections?${qp.toString()}`);
      if (!res.ok) throw new Error('Failed to load connections');
      return res.json();
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useConnectionRequests(userId?: string) {
  const qp = new URLSearchParams();
  if (userId) qp.set('userId', userId);
  qp.set('requests', '1');
  return useQuery({
    queryKey: ['connection-requests', userId || 'me'],
    queryFn: async () => {
      const res = await fetch(`/api/connections?${qp.toString()}`);
      if (!res.ok) throw new Error('Failed to load requests');
      return res.json();
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds (requests change more frequently)
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useSentConnectionRequests(userId?: string) {
  const qp = new URLSearchParams();
  if (userId) qp.set('userId', userId);
  qp.set('sentRequests', '1');
  return useQuery({
    queryKey: ['sent-connection-requests', userId || 'me'],
    queryFn: async () => {
      const res = await fetch(`/api/connections?${qp.toString()}`);
      if (!res.ok) throw new Error('Failed to load sent requests');
      return res.json();
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useDiscoverUsers(currentUserId?: string) {
  const qp = new URLSearchParams();
  qp.set('discover', '1');
  if (currentUserId) qp.set('userId', currentUserId);
  return useQuery({
    queryKey: ['discover-users', currentUserId || 'anon'],
    queryFn: async () => {
      const res = await fetch(`/api/connections?${qp.toString()}`);
      if (!res.ok) throw new Error('Failed to load users');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}


