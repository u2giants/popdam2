/*
  # Agents, Agent Keys, and Invitations

  ## Summary
  Adds tables for agent registration/heartbeat tracking, hashed agent API keys,
  and user invitation tokens.

  ## Security Rules
  - Agent keys: hashed value stored only; plaintext shown once at creation, never returned.
  - Invitation tokens: hashed; plaintext shown once at creation.
  - No secret material stored in plaintext anywhere in the DB.

  ## New Tables
  1. `agents`       – Registered NAS/RENDER agents with status and metadata
  2. `agent_keys`   – Hashed API keys for agent authentication; shown once at creation
  3. `invitations`  – Single-use invite tokens for user signup (hashed)

  ## Security
  - RLS enabled on all tables.
  - Only admins can manage agents and keys.
  - Invitations readable by admins only; creation by admins only.
*/

-- ─────────────────────────────────────────────
-- AGENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  agent_type    text NOT NULL CHECK (agent_type IN ('NAS', 'RENDER')),
  status        text NOT NULL DEFAULT 'OFFLINE'
                CHECK (status IN ('ONLINE', 'OFFLINE', 'DEGRADED')),
  share_id      uuid REFERENCES shares(id) ON DELETE SET NULL,
  last_seen_at  timestamptz,
  version       text,
  hostname      text,
  log_tail      text[] NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read agents"
  ON agents FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can insert agents"
  ON agents FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update agents"
  ON agents FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete agents"
  ON agents FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- ─────────────────────────────────────────────
-- AGENT KEYS
-- Rule: key_hash is SHA-256 of the plaintext key.
-- Plaintext NEVER stored. Shown once at creation via application layer.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_keys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  key_hash    text NOT NULL UNIQUE,
  label       text NOT NULL DEFAULT '',
  revoked     boolean NOT NULL DEFAULT false,
  last_used_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agent_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read agent keys"
  ON agent_keys FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can insert agent keys"
  ON agent_keys FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update agent keys"
  ON agent_keys FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete agent keys"
  ON agent_keys FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- ─────────────────────────────────────────────
-- INVITATIONS
-- token_hash is SHA-256 of the plaintext token.
-- Plaintext shown once at creation, never stored or returned again.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash    text NOT NULL UNIQUE,
  email         text,
  role          text NOT NULL DEFAULT 'viewer'
                CHECK (role IN ('admin', 'editor', 'viewer')),
  used          boolean NOT NULL DEFAULT false,
  used_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at       timestamptz,
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can insert invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update invitations"
  ON invitations FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete invitations"
  ON invitations FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );
