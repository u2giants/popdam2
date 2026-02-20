/*
  # Operational Tables: scan_jobs, render_queue, ai_config, spaces_config

  ## Summary
  Adds tables for scan job tracking, render queue management, AI provider configuration,
  and DigitalOcean Spaces public configuration.

  ## Security Notes
  - `spaces_config` stores ONLY non-secret values: public base URL, endpoint, region, bucket.
    Secret keys (access key ID, secret access key) NEVER enter the database – they live only
    in worker environment variables and CI secrets.
  - `ai_config` stores provider + model preferences. API keys are NOT stored here.

  ## New Tables
  1. `scan_jobs`     – Scan job lifecycle tracking per share/agent
  2. `render_queue`  – Per-asset render task queue with claim/complete lifecycle
  3. `ai_config`     – AI provider + model config (no secrets)
  4. `spaces_config` – DO Spaces public configuration (no secrets)

  ## Security
  - RLS enabled on all tables.
  - Admins have full access to config tables.
  - Editors/viewers can read scan_jobs and render_queue status.
*/

-- ─────────────────────────────────────────────
-- SCAN JOBS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scan_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id        uuid NOT NULL REFERENCES shares(id) ON DELETE CASCADE,
  agent_id        uuid REFERENCES agents(id) ON DELETE SET NULL,
  status          text NOT NULL DEFAULT 'IDLE'
                  CHECK (status IN ('IDLE','RUNNING','COMPLETED','FAILED','PAUSED')),
  files_scanned   integer NOT NULL DEFAULT 0,
  files_added     integer NOT NULL DEFAULT 0,
  files_updated   integer NOT NULL DEFAULT 0,
  files_moved     integer NOT NULL DEFAULT 0,
  files_noop      integer NOT NULL DEFAULT 0,
  files_errored   integer NOT NULL DEFAULT 0,
  error_message   text,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE scan_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read scan jobs"
  ON scan_jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert scan jobs"
  ON scan_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update scan jobs"
  ON scan_jobs FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete scan jobs"
  ON scan_jobs FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- ─────────────────────────────────────────────
-- RENDER QUEUE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS render_queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','CLAIMED','DONE','ERROR')),
  claimed_by      uuid REFERENCES agents(id) ON DELETE SET NULL,
  claimed_at      timestamptz,
  completed_at    timestamptz,
  error_message   text,
  attempts        smallint NOT NULL DEFAULT 0,
  priority        smallint NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_id)
);

ALTER TABLE render_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read render queue"
  ON render_queue FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert render queue"
  ON render_queue FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update render queue"
  ON render_queue FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete render queue"
  ON render_queue FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- ─────────────────────────────────────────────
-- AI CONFIG
-- Stores AI provider preferences only. API keys are NOT stored here.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_config (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      text NOT NULL CHECK (provider IN ('GEMINI', 'OPENAI')),
  model         text NOT NULL DEFAULT '',
  tag_prompt    text NOT NULL DEFAULT '',
  enabled       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read ai_config"
  ON ai_config FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can insert ai_config"
  ON ai_config FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update ai_config"
  ON ai_config FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete ai_config"
  ON ai_config FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- ─────────────────────────────────────────────
-- SPACES CONFIG
-- ONLY non-secret values stored: public_base_url, endpoint, region, bucket.
-- Access key ID and secret access key are NEVER stored in the database.
-- They live exclusively in worker/agent environment variables and CI secrets.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spaces_config (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_base_url text NOT NULL DEFAULT '',
  endpoint        text NOT NULL DEFAULT '',
  region          text NOT NULL DEFAULT '',
  bucket          text NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE spaces_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read spaces_config"
  ON spaces_config FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can insert spaces_config"
  ON spaces_config FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update spaces_config"
  ON spaces_config FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete spaces_config"
  ON spaces_config FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );
