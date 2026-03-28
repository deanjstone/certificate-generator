-- ============================================================
-- Migration: initial_schema
-- Created:   2026-03-27
-- Description: Creates all tables, types, indexes, and triggers
--              for the VET Certificate Generator.
-- ============================================================

-- ----------------------------------------------------------------
-- 1. Enum types
-- ----------------------------------------------------------------

CREATE TYPE public.cert_type AS ENUM (
  'qualification',
  'statement',
  'transcript'
);

CREATE TYPE public.cert_status AS ENUM (
  'draft',
  'issued',
  'revoked',
  'void'
);

-- ----------------------------------------------------------------
-- 2. students
-- ----------------------------------------------------------------

CREATE TABLE public.students (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  dob           date,
  usi           text,
  email         text,
  auth_user_id  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.students IS 'VET learner profiles. auth_user_id links to Supabase Auth when student self-service is enabled.';
COMMENT ON COLUMN public.students.usi IS 'Unique Student Identifier — Australian government-issued.';

-- ----------------------------------------------------------------
-- 3. certificates
-- ----------------------------------------------------------------

CREATE TABLE public.certificates (
  id             uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_number    text               NOT NULL UNIQUE,
  cert_type      public.cert_type   NOT NULL,
  student        jsonb              NOT NULL,
  qualification  jsonb              NOT NULL,
  rto            jsonb              NOT NULL,
  issued_by      jsonb,
  issued_at      timestamptz,
  security       jsonb              NOT NULL DEFAULT '{"watermark": false, "eseal": false}'::jsonb,
  pdf_url        text,
  status         public.cert_status NOT NULL DEFAULT 'draft',
  reissued_from  uuid               REFERENCES public.certificates(id) ON DELETE SET NULL,
  created_at     timestamptz        NOT NULL DEFAULT now(),
  updated_at     timestamptz        NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.certificates IS 'Issued VET certificates. Embedded jsonb snapshots preserve point-in-time data.';
COMMENT ON COLUMN public.certificates.cert_number   IS 'Format: CERT-<YYYY>-<6-digit-seq>, e.g. CERT-2026-000001. Unique across all certs.';
COMMENT ON COLUMN public.certificates.student       IS '{"name":"...", "dob":"YYYY-MM-DD", "usi":"...", "email":"..."}';
COMMENT ON COLUMN public.certificates.qualification IS '{"code":"...", "title":"...", "units":[{"code":"...","title":"..."},...]}';
COMMENT ON COLUMN public.certificates.rto           IS '{"name":"...", "number":"...", "cricos":"..."}';
COMMENT ON COLUMN public.certificates.issued_by     IS '{"name":"...", "signature_url":"..."}';
COMMENT ON COLUMN public.certificates.security      IS '{"watermark": bool, "eseal": bool, "eseal_url": "..."}';
COMMENT ON COLUMN public.certificates.pdf_url       IS 'Supabase Storage object path, e.g. certs/CERT-2026-000001.pdf';
COMMENT ON COLUMN public.certificates.reissued_from IS 'FK to the original certificate when this is a re-issue.';

-- ----------------------------------------------------------------
-- 4. webhook_log
-- ----------------------------------------------------------------

CREATE TABLE public.webhook_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_id      uuid        REFERENCES public.certificates(id) ON DELETE CASCADE,
  endpoint     text        NOT NULL,
  payload      jsonb       NOT NULL,
  status_code  integer,
  sent_at      timestamptz NOT NULL DEFAULT now(),
  response     jsonb
);

COMMENT ON TABLE  public.webhook_log IS 'Append-only log of outbound webhook deliveries from the webhook-push edge function.';
COMMENT ON COLUMN public.webhook_log.status_code IS 'HTTP response status code. NULL until response is received.';

-- ----------------------------------------------------------------
-- 5. updated_at trigger
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS 'Reusable BEFORE UPDATE trigger that stamps updated_at = now().';

CREATE TRIGGER trg_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------
-- 6. Indexes
-- ----------------------------------------------------------------

-- Status filter — used heavily in cert-table toolbar and dashboard counts
CREATE INDEX idx_certificates_status
  ON public.certificates (status);

-- Expression indexes on embedded jsonb student fields (cert-table search/filter)
CREATE INDEX idx_certificates_student_email
  ON public.certificates ((student->>'email'));

CREATE INDEX idx_certificates_student_name
  ON public.certificates ((student->>'name'));

-- Covering index for anon verify-card lookups:
-- WHERE cert_number = $1 → returns status, student, issued_at, cert_type
-- INCLUDE columns avoid a heap fetch for an index-only scan on the public verify route.
CREATE INDEX idx_certificates_verify
  ON public.certificates (cert_number, status)
  INCLUDE (student, issued_at, cert_type);

-- webhook_log — cert-scoped lookups in admin UI
CREATE INDEX idx_webhook_log_cert_id
  ON public.webhook_log (cert_id);

-- students — auth user linkage and email lookups
CREATE INDEX idx_students_auth_user_id
  ON public.students (auth_user_id);

CREATE INDEX idx_students_email
  ON public.students (email);
