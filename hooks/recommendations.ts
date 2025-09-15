"use client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseBrowser } from '../lib/supabase/client';

export function useRecommendations(userId?: string) {
  const qp = new URLSearchParams();
  if (userId) qp.set('userId', userId);
  
  return useQuery({
    queryKey: ['recommendations', userId || 'me'],
    queryFn: async () => {
      const url = `/api/recommendations?${qp.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load recommendations');
      return res.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAddRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      // Get the current session token
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      const token = session?.access_token;
      
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/recommendations', { 
        method: 'POST', 
        headers, 
        body: JSON.stringify(body) 
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to add recommendation: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate both recommendations and providers queries
      // This ensures the ServicesTab refreshes when recommendations are added
      qc.invalidateQueries({ queryKey: ['recommendations'] });
      qc.invalidateQueries({ queryKey: ['providers'] });
      // Also invalidate all provider queries with different parameters
      qc.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'providers' });
    },
  });
}

export function useDeleteRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/recommendations?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete recommendation');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate both recommendations and providers queries
      // This ensures the ServicesTab refreshes when recommendations are deleted
      qc.invalidateQueries({ queryKey: ['recommendations'] });
      qc.invalidateQueries({ queryKey: ['providers'] });
      // Also invalidate all provider queries with different parameters
      qc.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'providers' });
    },
  });
}


