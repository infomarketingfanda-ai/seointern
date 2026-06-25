-- ═══════════════════════════════════════════════════════
--  SEO Intern – Supabase Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Workspaces ────────────────────────────────────────
CREATE TABLE workspaces (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  owner_id      UUID NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','starter','pro','agency','enterprise')),
  brand_name    TEXT,
  brand_logo    TEXT,
  brand_color   TEXT DEFAULT '#009E9E',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Profiles (extends Supabase auth.users) ────────────
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  workspace_id  UUID REFERENCES workspaces(id),
  role          TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','admin','analyst','client')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Sites ─────────────────────────────────────────────
CREATE TABLE sites (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  cms_detected    TEXT,
  scan_frequency  TEXT NOT NULL DEFAULT 'weekly' CHECK (scan_frequency IN ('daily','weekly','monthly','manual')),
  last_scan_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Scans ─────────────────────────────────────────────
CREATE TABLE scans (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id           UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  overall_score     INTEGER DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  category_scores   JSONB NOT NULL DEFAULT '{}',
  status            TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','complete','failed')),
  pages_crawled     INTEGER DEFAULT 0,
  error_message     TEXT,
  started_at        TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);

-- ── Findings (per scan) ───────────────────────────────
CREATE TABLE findings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id          UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  site_id          UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  category         TEXT NOT NULL,
  check_name       TEXT NOT NULL,
  severity         TEXT NOT NULL CHECK (severity IN ('critical','warning','info','pass')),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  affected_urls    JSONB DEFAULT '[]',
  why_it_matters   TEXT NOT NULL DEFAULT '',
  how_to_fix       JSONB DEFAULT '[]',
  cms_guides       JSONB DEFAULT '{}',
  estimated_impact TEXT DEFAULT 'medium',
  difficulty       TEXT DEFAULT 'medium',
  time_estimate    TEXT DEFAULT '30 minutes',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Blog topics ───────────────────────────────────────
CREATE TABLE blog_topics (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id           UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  relevance_score   INTEGER DEFAULT 50,
  source            TEXT DEFAULT 'AI Analysis',
  reasoning         TEXT NOT NULL DEFAULT '',
  difficulty        TEXT DEFAULT 'medium',
  suggested_outline JSONB DEFAULT '[]',
  status            TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested','planned','writing','published','skipped')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Copilot messages ──────────────────────────────────
CREATE TABLE copilot_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id    UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id),
  role       TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Off-page opportunity tracking ─────────────────────
CREATE TABLE backlink_progress (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id       UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  platform_name TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done','skipped')),
  notes         TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Alerts config ─────────────────────────────────────
CREATE TABLE alert_configs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  site_id       UUID REFERENCES sites(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  enabled       BOOLEAN DEFAULT TRUE,
  threshold     INTEGER,
  email         TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────
CREATE INDEX idx_sites_workspace      ON sites(workspace_id);
CREATE INDEX idx_scans_site           ON scans(site_id);
CREATE INDEX idx_scans_status         ON scans(status);
CREATE INDEX idx_findings_scan        ON findings(scan_id);
CREATE INDEX idx_findings_severity    ON findings(severity);
CREATE INDEX idx_blog_topics_site     ON blog_topics(site_id);
CREATE INDEX idx_copilot_site         ON copilot_messages(site_id);

-- ── Row Level Security ────────────────────────────────
ALTER TABLE workspaces      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites           ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans           ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_topics     ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlink_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_configs   ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update own profile
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

-- Workspaces: members can read their workspace
CREATE POLICY "workspace_member" ON workspaces FOR ALL
  USING (id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- Sites: workspace members can manage sites
CREATE POLICY "sites_workspace" ON sites FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- Scans: accessible if site is accessible
CREATE POLICY "scans_site" ON scans FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())));

-- Findings: accessible if scan is accessible
CREATE POLICY "findings_scan" ON findings FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())));

-- Blog topics
CREATE POLICY "blog_topics_site" ON blog_topics FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())));

-- Copilot messages
CREATE POLICY "copilot_site" ON copilot_messages FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())));

-- Backlink progress
CREATE POLICY "backlink_site" ON backlink_progress FOR ALL
  USING (site_id IN (SELECT id FROM sites WHERE workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid())));

-- Alert configs
CREATE POLICY "alerts_workspace" ON alert_configs FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- ── Trigger: auto-create profile + workspace on signup ─
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  INSERT INTO workspaces (name, owner_id) VALUES ('My Workspace', NEW.id) RETURNING id INTO new_workspace_id;
  INSERT INTO profiles (id, email, full_name, workspace_id, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), new_workspace_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
