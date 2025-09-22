-- Fix RLS Performance Issues
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation for each row

-- ========================================
-- USERS TABLE POLICIES
-- ========================================

-- Fix users_select_self policy
DROP POLICY IF EXISTS "users_select_self" ON public.users;
CREATE POLICY "users_select_self" ON public.users
FOR SELECT USING ((select auth.uid())::text = id::text);

-- Fix users_insert_self policy  
DROP POLICY IF EXISTS "users_insert_self" ON public.users;
CREATE POLICY "users_insert_self" ON public.users
FOR INSERT WITH CHECK ((select auth.uid())::text = id::text);

-- Fix users_update_self policy
DROP POLICY IF EXISTS "users_update_self" ON public.users;
CREATE POLICY "users_update_self" ON public.users
FOR UPDATE USING ((select auth.uid())::text = id::text);

-- ========================================
-- PROVIDER TABLE POLICIES
-- ========================================

-- Fix provider_insert_auth policy
DROP POLICY IF EXISTS "provider_insert_auth" ON public.provider;
CREATE POLICY "provider_insert_auth" ON public.provider
FOR INSERT WITH CHECK ((select auth.uid())::text = owner_user_id::text);

-- Fix provider_update_owner policy
DROP POLICY IF EXISTS "provider_update_owner" ON public.provider;
CREATE POLICY "provider_update_owner" ON public.provider
FOR UPDATE USING ((select auth.uid())::text = owner_user_id::text);

-- Fix provider_delete_owner policy
DROP POLICY IF EXISTS "provider_delete_owner" ON public.provider;
CREATE POLICY "provider_delete_owner" ON public.provider
FOR DELETE USING ((select auth.uid())::text = owner_user_id::text);

-- ========================================
-- RECOMMENDATION TABLE POLICIES
-- ========================================

-- Fix recommendation_insert_auth policy
DROP POLICY IF EXISTS "recommendation_insert_auth" ON public.recommendation;
CREATE POLICY "recommendation_insert_auth" ON public.recommendation
FOR INSERT WITH CHECK ((select auth.uid())::text = recommender_user_id::text);

-- Fix recommendation_update_author policy
DROP POLICY IF EXISTS "recommendation_update_author" ON public.recommendation;
CREATE POLICY "recommendation_update_author" ON public.recommendation
FOR UPDATE USING ((select auth.uid())::text = recommender_user_id::text);

-- Fix recommendation_delete_author policy
DROP POLICY IF EXISTS "recommendation_delete_author" ON public.recommendation;
CREATE POLICY "recommendation_delete_author" ON public.recommendation
FOR DELETE USING ((select auth.uid())::text = recommender_user_id::text);

-- ========================================
-- PROVIDER_ATTRIBUTE_VOTE TABLE POLICIES
-- ========================================

-- Fix pav_insert_auth policy
DROP POLICY IF EXISTS "pav_insert_auth" ON public.provider_attribute_vote;
CREATE POLICY "pav_insert_auth" ON public.provider_attribute_vote
FOR INSERT WITH CHECK ((select auth.uid())::text = voter_user_id::text);

-- Fix pav_update_author policy
DROP POLICY IF EXISTS "pav_update_author" ON public.provider_attribute_vote;
CREATE POLICY "pav_update_author" ON public.provider_attribute_vote
FOR UPDATE USING ((select auth.uid())::text = voter_user_id::text);

-- Fix pav_delete_author policy
DROP POLICY IF EXISTS "pav_delete_author" ON public.provider_attribute_vote;
CREATE POLICY "pav_delete_author" ON public.provider_attribute_vote
FOR DELETE USING ((select auth.uid())::text = voter_user_id::text);

-- ========================================
-- CONTACT_REQUEST TABLE POLICIES
-- ========================================

-- Fix cr_select_requester_or_owner policy
DROP POLICY IF EXISTS "cr_select_requester_or_owner" ON public.contact_request;
CREATE POLICY "cr_select_requester_or_owner" ON public.contact_request
FOR SELECT USING (
  (select auth.uid())::text = requester_user_id::text OR 
  (select auth.uid())::text = (SELECT owner_user_id::text FROM public.provider WHERE id = provider_id)
);

-- Fix cr_insert_requester policy
DROP POLICY IF EXISTS "cr_insert_requester" ON public.contact_request;
CREATE POLICY "cr_insert_requester" ON public.contact_request
FOR INSERT WITH CHECK ((select auth.uid())::text = requester_user_id::text);

-- Fix cr_update_owner policy
DROP POLICY IF EXISTS "cr_update_owner" ON public.contact_request;
CREATE POLICY "cr_update_owner" ON public.contact_request
FOR UPDATE USING (
  (select auth.uid())::text = (SELECT owner_user_id::text FROM public.provider WHERE id = provider_id)
);

-- ========================================
-- USER_CONTACT_HASH TABLE POLICIES
-- ========================================

-- Fix uch_select_owner policy
DROP POLICY IF EXISTS "uch_select_owner" ON public.user_contact_hash;
CREATE POLICY "uch_select_owner" ON public.user_contact_hash
FOR SELECT USING ((select auth.uid())::text = user_id::text);

-- Fix uch_insert_owner policy
DROP POLICY IF EXISTS "uch_insert_owner" ON public.user_contact_hash;
CREATE POLICY "uch_insert_owner" ON public.user_contact_hash
FOR INSERT WITH CHECK ((select auth.uid())::text = user_id::text);

-- Fix uch_update_owner policy
DROP POLICY IF EXISTS "uch_update_owner" ON public.user_contact_hash;
CREATE POLICY "uch_update_owner" ON public.user_contact_hash
FOR UPDATE USING ((select auth.uid())::text = user_id::text);

-- Fix uch_delete_owner policy
DROP POLICY IF EXISTS "uch_delete_owner" ON public.user_contact_hash;
CREATE POLICY "uch_delete_owner" ON public.user_contact_hash
FOR DELETE USING ((select auth.uid())::text = user_id::text);

-- ========================================
-- CONNECTION TABLE POLICIES
-- ========================================

-- Fix "Users can view their own connections" policy
DROP POLICY IF EXISTS "Users can view their own connections" ON public.connection;
CREATE POLICY "Users can view their own connections" ON public.connection
FOR SELECT USING (
  (select auth.uid())::text = user1_id::text OR 
  (select auth.uid())::text = user2_id::text
);

-- Fix "Users can insert connections" policy
DROP POLICY IF EXISTS "Users can insert connections" ON public.connection;
CREATE POLICY "Users can insert connections" ON public.connection
FOR INSERT WITH CHECK (
  (select auth.uid())::text = user1_id::text OR 
  (select auth.uid())::text = user2_id::text
);

-- ========================================
-- CONNECTION_REQUEST TABLE POLICIES
-- ========================================

-- Fix "Users can view their own connection requests" policy
DROP POLICY IF EXISTS "Users can view their own connection requests" ON public.connection_request;
CREATE POLICY "Users can view their own connection requests" ON public.connection_request
FOR SELECT USING (
  (select auth.uid())::text = requester_user_id::text OR 
  (select auth.uid())::text = recipient_user_id::text
);

-- Fix "Users can insert connection requests" policy
DROP POLICY IF EXISTS "Users can insert connection requests" ON public.connection_request;
CREATE POLICY "Users can insert connection requests" ON public.connection_request
FOR INSERT WITH CHECK ((select auth.uid())::text = requester_user_id::text);

-- Fix "Users can update their own connection requests" policy
DROP POLICY IF EXISTS "Users can update their own connection requests" ON public.connection_request;
CREATE POLICY "Users can update their own connection requests" ON public.connection_request
FOR UPDATE USING (
  (select auth.uid())::text = requester_user_id::text OR 
  (select auth.uid())::text = recipient_user_id::text
);

-- ========================================
-- EVENTS TABLE POLICIES (Consolidated)
-- ========================================

-- Remove duplicate policies and create single optimized policy
DROP POLICY IF EXISTS "Users can insert their own events" ON public.events;
DROP POLICY IF EXISTS "Service role can insert any events" ON public.events;
DROP POLICY IF EXISTS "Users can read their own events" ON public.events;
DROP POLICY IF EXISTS "Service role can read all events" ON public.events;

-- Create single optimized policy for events
CREATE POLICY "events_optimized" ON public.events
FOR ALL USING (
  (select auth.uid())::text = user_id::text OR 
  (select auth.role()) = 'service_role'
);

-- ========================================
-- SERVICE_CATEGORIES TABLE POLICIES (Consolidated)
-- ========================================

-- Remove duplicate policies and create single optimized policy
DROP POLICY IF EXISTS "service_categories_admin_all" ON public.service_categories;
DROP POLICY IF EXISTS "service_categories_select_all" ON public.service_categories;

-- Create single optimized policy for service categories
CREATE POLICY "service_categories_optimized" ON public.service_categories
FOR ALL USING (true);

-- ========================================
-- PROVIDER_NAME_ALIAS TABLE POLICIES (Consolidated)
-- ========================================

-- Remove duplicate policies and create single optimized policy
DROP POLICY IF EXISTS "Service role can read provider_name_alias" ON public.provider_name_alias;
DROP POLICY IF EXISTS "Service role can insert provider_name_alias" ON public.provider_name_alias;
DROP POLICY IF EXISTS "Service role can update provider_name_alias" ON public.provider_name_alias;
DROP POLICY IF EXISTS "Service role can delete provider_name_alias" ON public.provider_name_alias;

-- Create single optimized policy for provider name alias
CREATE POLICY "provider_name_alias_optimized" ON public.provider_name_alias
FOR ALL USING ((select auth.role()) = 'service_role');

-- ========================================
-- PROVIDER_CITY_SIGHTING TABLE POLICIES (Consolidated)
-- ========================================

-- Remove duplicate policies and create single optimized policy
DROP POLICY IF EXISTS "Service role can read provider_city_sighting" ON public.provider_city_sighting;
DROP POLICY IF EXISTS "Service role can insert provider_city_sighting" ON public.provider_city_sighting;
DROP POLICY IF EXISTS "Service role can update provider_city_sighting" ON public.provider_city_sighting;
DROP POLICY IF EXISTS "Service role can delete provider_city_sighting" ON public.provider_city_sighting;

-- Create single optimized policy for provider city sighting
CREATE POLICY "provider_city_sighting_optimized" ON public.provider_city_sighting
FOR ALL USING ((select auth.role()) = 'service_role');

-- ========================================
-- ADD MISSING INDEXES FOR FOREIGN KEYS
-- ========================================

-- Add indexes on foreign keys to improve query performance
CREATE INDEX IF NOT EXISTS "idx_connection_user2_id" ON public.connection(user2_id);
CREATE INDEX IF NOT EXISTS "idx_connection_request_recipient_user_id" ON public.connection_request(recipient_user_id);
CREATE INDEX IF NOT EXISTS "idx_connection_request_requester_user_id" ON public.connection_request(requester_user_id);
CREATE INDEX IF NOT EXISTS "idx_contact_request_provider_id" ON public.contact_request(provider_id);
CREATE INDEX IF NOT EXISTS "idx_contact_request_requester_user_id" ON public.contact_request(requester_user_id);
CREATE INDEX IF NOT EXISTS "idx_provider_owner_user_id" ON public.provider(owner_user_id);
CREATE INDEX IF NOT EXISTS "idx_provider_attribute_vote_voter_user_id" ON public.provider_attribute_vote(voter_user_id);
CREATE INDEX IF NOT EXISTS "idx_provider_city_sighting_provider_id" ON public.provider_city_sighting(provider_id);
CREATE INDEX IF NOT EXISTS "idx_recommendation_provider_id" ON public.recommendation(provider_id);
CREATE INDEX IF NOT EXISTS "idx_recommendation_recommender_user_id" ON public.recommendation(recommender_user_id);
CREATE INDEX IF NOT EXISTS "idx_user_contact_hash_user_id" ON public.user_contact_hash(user_id);

-- ========================================
-- REMOVE UNUSED INDEXES
-- ========================================

-- Remove unused indexes to clean up the database
DROP INDEX IF EXISTS "idx_provider_neighborhoods_city";
DROP INDEX IF EXISTS "idx_provider_service_category_id";
DROP INDEX IF EXISTS "idx_service_categories_slug";
DROP INDEX IF EXISTS "idx_service_categories_active";
DROP INDEX IF EXISTS "idx_events_user_id";
DROP INDEX IF EXISTS "idx_provider_neighborhood";

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check that policies are working correctly
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
ORDER BY tablename, policyname;

-- Check that indexes are created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
