-- ============================================================
-- Migration: rls_policies
-- Created:   2026-03-27
-- Description: Enables RLS on all tables and creates access
--              control policies for anon, authenticated, and
--              service_role.
--
-- Role summary:
--   anon          → SELECT non-draft certificates (verify-card only)
--   authenticated → full CRUD on certificates and students;
--                   SELECT on webhook_log
--   service_role  → bypasses RLS (Supabase built-in) — used by
--                   issue-cert and webhook-push edge functions
-- ============================================================

-- ----------------------------------------------------------------
-- 1. Enable RLS
-- ----------------------------------------------------------------

ALTER TABLE public.certificates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_log   ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 2. certificates policies
-- ----------------------------------------------------------------

-- Public (anon): read-only, non-draft rows only.
-- Supports the verify-card component (/verify/:cert_number route).
-- Drafts are never publicly visible, even if the cert_number is known.
CREATE POLICY "anon_can_select_non_draft_certs"
  ON public.certificates
  FOR SELECT
  TO anon
  USING (status <> 'draft');

-- Authenticated (RTO staff): full CRUD.
-- Single-tenant: all authenticated users access all certs.
-- Future multi-tenant: replace USING (true) with USING (rto_id = auth.jwt()->>'rto_id').
CREATE POLICY "auth_can_select_certs"
  ON public.certificates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_can_insert_certs"
  ON public.certificates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "auth_can_update_certs"
  ON public.certificates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_can_delete_certs"
  ON public.certificates
  FOR DELETE
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------
-- 3. students policies
-- ----------------------------------------------------------------

-- anon: no access (default deny — no explicit policy needed).

-- Authenticated: full CRUD.
-- Future: add self-access policy USING (auth_user_id = auth.uid()) when
-- student login is implemented.
CREATE POLICY "auth_can_select_students"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_can_insert_students"
  ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "auth_can_update_students"
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_can_delete_students"
  ON public.students
  FOR DELETE
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------
-- 4. webhook_log policies
-- ----------------------------------------------------------------

-- anon: no access (default deny).

-- Authenticated: read-only (audit log visibility in admin UI).
-- All writes come from the webhook-push edge function via service_role,
-- which bypasses RLS — no INSERT policy needed or wanted for this role.
CREATE POLICY "auth_can_select_webhook_log"
  ON public.webhook_log
  FOR SELECT
  TO authenticated
  USING (true);
