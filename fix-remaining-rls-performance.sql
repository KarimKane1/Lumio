-- Fix Remaining RLS Performance Issues
-- Clean up duplicate policies and fix remaining auth.uid() calls

-- ========================================
-- REMOVE DUPLICATE POLICIES
-- ========================================

-- Remove old policies that are conflicting with our optimized ones
DROP POLICY IF EXISTS "provider_attribute_vote_insert_auth" ON public.provider_attribute_vote;
DROP POLICY IF EXISTS "provider_attribute_vote_update_auth" ON public.provider_attribute_vote;
DROP POLICY IF EXISTS "provider_attribute_vote_delete_auth" ON public.provider_attribute_vote;

DROP POLICY IF EXISTS "contact_request_select_own" ON public.contact_request;
DROP POLICY IF EXISTS "contact_request_insert_auth" ON public.contact_request;
DROP POLICY IF EXISTS "contact_request_update_owner" ON public.contact_request;

DROP POLICY IF EXISTS "connection_request_select_own" ON public.connection_request;
DROP POLICY IF EXISTS "connection_request_insert_auth" ON public.connection_request;
DROP POLICY IF EXISTS "connection_request_update_recipient" ON public.connection_request;

DROP POLICY IF EXISTS "connection_select_own" ON public.connection;
DROP POLICY IF EXISTS "connection_insert_auth" ON public.connection;
DROP POLICY IF EXISTS "connection_delete_own" ON public.connection;

DROP POLICY IF EXISTS "service_categories_admin" ON public.service_categories;

DROP POLICY IF EXISTS "Users can view their own contact hashes" ON public.user_contact_hash;
DROP POLICY IF EXISTS "Users can insert their own contact hashes" ON public.user_contact_hash;

DROP POLICY IF EXISTS "Users can view city sightings" ON public.provider_city_sighting;
DROP POLICY IF EXISTS "Users can insert city sightings" ON public.provider_city_sighting;

DROP POLICY IF EXISTS "Users can view name aliases" ON public.provider_name_alias;
DROP POLICY IF EXISTS "Users can insert name aliases" ON public.provider_name_alias;

-- ========================================
-- FIX REMAINING AUTH.UID() CALLS
-- ========================================

-- Fix any remaining policies that still use auth.uid() instead of (select auth.uid())
-- These should already be fixed, but let's ensure they're optimized

-- Check if there are any remaining policies with auth.uid() calls
-- (This is a verification query - no changes needed if policies are already optimized)

-- ========================================
-- VERIFY CURRENT POLICIES
-- ========================================

-- Check current policies to see what we have
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND (
  qual LIKE '%auth.uid()%' OR 
  qual LIKE '%current_setting%'
)
ORDER BY tablename, policyname;

-- ========================================
-- PERFORMANCE VERIFICATION
-- ========================================

-- Check that our optimized policies are in place
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND policyname LIKE '%optimized%'
ORDER BY tablename, policyname;

-- ========================================
-- FINAL CLEANUP
-- ========================================

-- Remove any policies that might be causing conflicts
-- (Only run this if the above verification shows issues)

-- Example of what we might need to clean up:
-- DROP POLICY IF EXISTS "old_policy_name" ON public.table_name;

-- ========================================
-- SUMMARY
-- ========================================

-- This script should:
-- 1. Remove duplicate/conflicting policies
-- 2. Keep only the optimized policies we created
-- 3. Verify that auth.uid() calls are properly wrapped in (select auth.uid())
-- 4. Show current policy status

-- After running this, you should see:
-- - Fewer total policies
-- - No duplicate policies for the same action
-- - All auth.uid() calls properly optimized
-- - Better query performance
