-- ============================================================================
--  Migration: create material_transactions table + supporting objects
--  Run this file once in the Supabase SQL editor or psql
-- ============================================================================

-- 1️⃣  TABLE ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.material_transactions (
  id               BIGSERIAL PRIMARY KEY,
  material_id      BIGINT      NOT NULL
                   REFERENCES public.materials(id) ON DELETE CASCADE,
  transaction_type TEXT        NOT NULL
                   CHECK (transaction_type IN ('added','used','adjusted','returned')),
  quantity         INTEGER     NOT NULL,
  previous_stock   INTEGER     NOT NULL,
  new_stock        INTEGER     NOT NULL,
  reference_type   TEXT,
  reference_id     BIGINT,
  project          TEXT,
  notes            TEXT,
  created_by       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2️⃣  INDEXES ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_material_transactions_material_id
  ON public.material_transactions(material_id);

CREATE INDEX IF NOT EXISTS idx_material_transactions_created_at
  ON public.material_transactions(created_at DESC);

-- 3️⃣  ROW-LEVEL SECURITY ----------------------------------------------------
ALTER TABLE public.material_transactions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access; tighten later if needed.
CREATE POLICY "authenticated_full_access"
  ON public.material_transactions
  FOR ALL
  USING (auth.role() = 'authenticated');
