-- AffiBase Initial Schema
-- Run order: 001_initial.sql → 002_seed.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users / Members ──────────────────────────────────────────────────────────

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  password_hash TEXT,
  plan        TEXT NOT NULL DEFAULT 'free',  -- free | pro | business
  status      TEXT NOT NULL DEFAULT 'active', -- active | suspended | deleted
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Themes ───────────────────────────────────────────────────────────────────

CREATE TABLE themes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  slug                TEXT UNIQUE NOT NULL,
  description         TEXT,
  genre               TEXT NOT NULL,  -- 転職 | 副業 | AIツール | オンライン学習 | 投資
  monthly_searches    INTEGER,
  competition_level   TEXT,           -- low | medium | high
  avg_affiliate_price INTEGER,        -- yen
  aeo_potential       TEXT,           -- high | medium | low
  difficulty_score    INTEGER,        -- 1-100
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Sites (Member Sites) ─────────────────────────────────────────────────────

CREATE TABLE sites (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme_id       UUID NOT NULL REFERENCES themes(id),
  subdomain      TEXT UNIQUE NOT NULL,   -- e.g. "abc123" → abc123.affibase.jp
  custom_domain  TEXT,
  status         TEXT NOT NULL DEFAULT 'generating', -- generating | active | paused | error
  site_config    JSONB NOT NULL DEFAULT '{}',         -- operator_name, operator_bio, etc.
  aeo_config     JSONB NOT NULL DEFAULT '{}',         -- llms_txt, robots_txt generated
  build_log      TEXT,
  published_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Affiliate Offers ─────────────────────────────────────────────────────────

CREATE TABLE offers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asp             TEXT NOT NULL,        -- a8 | accesstrade | valuecommerce | moshimo
  external_id     TEXT,
  name            TEXT NOT NULL,
  description     TEXT,
  genre           TEXT NOT NULL,
  commission      INTEGER,              -- yen per conversion
  approval_rate   NUMERIC(5,2),         -- %
  epc             NUMERIC(10,2),        -- yen per click
  affiliate_url   TEXT,
  product_url     TEXT,
  logo_url        TEXT,
  status          TEXT NOT NULL DEFAULT 'active', -- active | paused | terminated
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (asp, external_id)
);

-- ─── Site ↔ Offer Mappings ────────────────────────────────────────────────────

CREATE TABLE site_offers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id             UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  offer_id            UUID NOT NULL REFERENCES offers(id),
  diagnosis_patterns  TEXT[],     -- pattern keys this offer is linked to
  is_featured         BOOLEAN NOT NULL DEFAULT false,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (site_id, offer_id)
);

-- ─── Articles ─────────────────────────────────────────────────────────────────

CREATE TABLE articles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id           UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL,
  content           TEXT,
  meta_description  TEXT,
  focus_keyword     TEXT,
  category          TEXT,               -- 始め方系 | ノウハウ系 | ツール系 | 比較系
  faq_data          JSONB,              -- [{q, a}, ...]
  json_ld           JSONB,              -- structured data payload
  status            TEXT NOT NULL DEFAULT 'draft', -- draft | published | archived
  search_rank       INTEGER,
  pv_count          INTEGER NOT NULL DEFAULT 0,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (site_id, slug)
);

-- ─── Diagnosis Patterns ───────────────────────────────────────────────────────

CREATE TABLE diagnosis_patterns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id            UUID NOT NULL REFERENCES themes(id),
  pattern_key         TEXT NOT NULL,  -- "age:20s,job:office,time:1h,goal:50k"
  result_title        TEXT NOT NULL,
  result_description  TEXT,
  result_icon         TEXT,           -- emoji or icon name
  recommended_offers  UUID[],         -- offer ids
  aeo_faq             JSONB,          -- [{q, a}, ...]
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (theme_id, pattern_key)
);

-- ─── Revenue Reports ──────────────────────────────────────────────────────────

CREATE TABLE revenue_reports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id               UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  report_date           DATE NOT NULL,
  pv_count              INTEGER NOT NULL DEFAULT 0,
  uu_count              INTEGER NOT NULL DEFAULT 0,
  affiliate_conversions INTEGER NOT NULL DEFAULT 0,
  affiliate_revenue     NUMERIC(12,2) NOT NULL DEFAULT 0,
  ad_revenue            NUMERIC(12,2) NOT NULL DEFAULT 0,
  pdf_revenue           NUMERIC(12,2) NOT NULL DEFAULT 0,
  ai_citations          INTEGER NOT NULL DEFAULT 0,
  agent_visits          INTEGER NOT NULL DEFAULT 0,
  metadata              JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (site_id, report_date)
);

-- ─── Generation Jobs ──────────────────────────────────────────────────────────

CREATE TABLE generation_jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,  -- site_init | article_generate | aeo_refresh | offer_sync
  status      TEXT NOT NULL DEFAULT 'queued', -- queued | running | done | failed
  payload     JSONB NOT NULL DEFAULT '{}',
  result      JSONB,
  error       TEXT,
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_sites_user_id       ON sites(user_id);
CREATE INDEX idx_sites_status        ON sites(status);
CREATE INDEX idx_articles_site_id    ON articles(site_id);
CREATE INDEX idx_articles_status     ON articles(status);
CREATE INDEX idx_offers_genre        ON offers(genre);
CREATE INDEX idx_offers_status       ON offers(status);
CREATE INDEX idx_revenue_site_date   ON revenue_reports(site_id, report_date DESC);
CREATE INDEX idx_gen_jobs_site       ON generation_jobs(site_id);
CREATE INDEX idx_gen_jobs_status     ON generation_jobs(status);

-- ─── Updated-at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated   BEFORE UPDATE ON users   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_sites_updated   BEFORE UPDATE ON sites   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_offers_updated  BEFORE UPDATE ON offers  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_articles_updated BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
