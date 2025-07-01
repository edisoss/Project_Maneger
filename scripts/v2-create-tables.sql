-- ============================================================================
--  Construction-Management DB - v2 schema (adds material_transactions)
-- ============================================================================

-- ----------   SECURITY PREREQUISITES ----------------------------------------
ALTER DATABASE postgres
  SET "app.jwt_secret" = 'replace-with-your-32+-char-jwt-secret';

-- ----------   TABLES --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.materials (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT        NOT NULL,
  category      TEXT        NOT NULL,
  current_stock INTEGER     NOT NULL DEFAULT 0,
  min_stock     INTEGER     NOT NULL DEFAULT 0,
  unit          TEXT        NOT NULL,
  location      TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'In Stock',
  last_updated  DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.material_transactions (
  id               BIGSERIAL PRIMARY KEY,
  material_id      BIGINT       NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  transaction_type TEXT         NOT NULL CHECK (transaction_type IN ('added','used','adjusted','returned')),
  quantity         INTEGER      NOT NULL,
  previous_stock   INTEGER      NOT NULL,
  new_stock        INTEGER      NOT NULL,
  reference_type   TEXT,
  reference_id     BIGINT,
  project          TEXT,
  notes            TEXT,
  created_by       TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.workers (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT        NOT NULL,
  email      TEXT UNIQUE,
  phone      TEXT,
  role       TEXT        NOT NULL,
  skills     TEXT[]      NOT NULL DEFAULT '{}',
  status     TEXT        NOT NULL DEFAULT 'Active',
  hire_date  DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.projects (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'Planning',
  start_date  DATE,
  end_date    DATE,
  progress    INTEGER     NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.daily_logs (
  id               BIGSERIAL PRIMARY KEY,
  date             DATE        NOT NULL,
  project          TEXT        NOT NULL,
  work_description TEXT        NOT NULL,
  workers_present  TEXT[]      NOT NULL DEFAULT '{}',
  hours_worked     NUMERIC(4,2) NOT NULL DEFAULT 0,
  materials_used   JSONB       NOT NULL DEFAULT '[]',
  notes            TEXT,
  weather          TEXT,
  status           TEXT        NOT NULL DEFAULT 'Completed',
  created_by       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ----------   TRIGGERS (update updated_at / last_updated) -------------------
CREATE OR REPLACE FUNCTION public.fn_touch_row()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  IF TG_TABLE_NAME = 'materials' THEN
    NEW.last_updated := CURRENT_DATE;
  END IF;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_touch_materials  ON public.materials;
DROP TRIGGER IF EXISTS trg_touch_workers    ON public.workers;
DROP TRIGGER IF EXISTS trg_touch_projects   ON public.projects;
DROP TRIGGER IF EXISTS trg_touch_daily_logs ON public.daily_logs;

CREATE TRIGGER trg_touch_materials
  BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE PROCEDURE public.fn_touch_row();

CREATE TRIGGER trg_touch_workers
  BEFORE UPDATE ON public.workers
  FOR EACH ROW EXECUTE PROCEDURE public.fn_touch_row();

CREATE TRIGGER trg_touch_projects
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE PROCEDURE public.fn_touch_row();

CREATE TRIGGER trg_touch_daily_logs
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW EXECUTE PROCEDURE public.fn_touch_row();

-- ----------   INDEXES -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_materials_category        ON public.materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_status          ON public.materials(status);
CREATE INDEX IF NOT EXISTS idx_material_transactions_mid ON public.material_transactions(material_id);
CREATE INDEX IF NOT EXISTS idx_material_transactions_cat ON public.material_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_workers_status            ON public.workers(status);
CREATE INDEX IF NOT EXISTS idx_projects_status           ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date           ON public.daily_logs(date);

-- ----------   SECURITY (Row-Level Security) ---------------------------------
ALTER TABLE public.materials              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs            ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated-all" ON public.materials
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated-all" ON public.material_transactions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated-all" ON public.workers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated-all" ON public.projects
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated-all" ON public.daily_logs
  FOR ALL USING (auth.role() = 'authenticated');
