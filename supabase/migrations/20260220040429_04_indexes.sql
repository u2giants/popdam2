/*
  # Indexes

  ## Summary
  Creates all performance-critical indexes across the schema.
  Covers: asset lookup patterns, tag/ref filtering, render queue polling,
  scan job status queries, agent heartbeat lookups, and invitation validation.

  ## Index Strategy
  - Partial indexes on `is_deleted = false` for all asset-derived queries (saves index size).
  - Composite indexes match the exact column order used in WHERE + ORDER BY clauses.
  - GIN index on `asset_tags.value` array for full-text tag search.
  - `render_queue` PENDING status partial index for efficient agent polling.
*/

-- Assets: primary lookup patterns
CREATE INDEX IF NOT EXISTS idx_assets_share_id
  ON assets (share_id)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_assets_file_type
  ON assets (file_type)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_assets_thumbnail_status
  ON assets (thumbnail_status)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_assets_updated_at
  ON assets (updated_at DESC)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_assets_created_at
  ON assets (created_at DESC)
  WHERE is_deleted = false;

-- Assets: file_name text search (trigram for ILIKE support)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_assets_file_name_trgm
  ON assets USING GIN (file_name gin_trgm_ops)
  WHERE is_deleted = false;

-- Asset tags: value lookup and per-asset listing
CREATE INDEX IF NOT EXISTS idx_asset_tags_asset_id
  ON asset_tags (asset_id);

CREATE INDEX IF NOT EXISTS idx_asset_tags_value
  ON asset_tags (value);

CREATE INDEX IF NOT EXISTS idx_asset_tags_value_trgm
  ON asset_tags USING GIN (value gin_trgm_ops);

-- Character refs: asset and character lookup
CREATE INDEX IF NOT EXISTS idx_character_refs_asset_id
  ON character_refs (asset_id);

CREATE INDEX IF NOT EXISTS idx_character_refs_character_id
  ON character_refs (character_id);

-- Property refs: asset and property lookup
CREATE INDEX IF NOT EXISTS idx_property_refs_asset_id
  ON property_refs (asset_id);

CREATE INDEX IF NOT EXISTS idx_property_refs_property_id
  ON property_refs (property_id);

-- Characters: name search
CREATE INDEX IF NOT EXISTS idx_characters_property_id
  ON characters (property_id);

CREATE INDEX IF NOT EXISTS idx_characters_name_trgm
  ON characters USING GIN (name gin_trgm_ops);

-- Properties: name search
CREATE INDEX IF NOT EXISTS idx_properties_name_trgm
  ON properties USING GIN (name gin_trgm_ops);

-- Render queue: agent polling (PENDING items ordered by priority + created_at)
CREATE INDEX IF NOT EXISTS idx_render_queue_pending
  ON render_queue (priority DESC, created_at ASC)
  WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_render_queue_asset_id
  ON render_queue (asset_id);

CREATE INDEX IF NOT EXISTS idx_render_queue_claimed_by
  ON render_queue (claimed_by)
  WHERE status = 'CLAIMED';

-- Scan jobs: share + status lookups
CREATE INDEX IF NOT EXISTS idx_scan_jobs_share_id
  ON scan_jobs (share_id);

CREATE INDEX IF NOT EXISTS idx_scan_jobs_status
  ON scan_jobs (status);

CREATE INDEX IF NOT EXISTS idx_scan_jobs_agent_id
  ON scan_jobs (agent_id);

-- Agents: type and status
CREATE INDEX IF NOT EXISTS idx_agents_agent_type
  ON agents (agent_type);

CREATE INDEX IF NOT EXISTS idx_agents_status
  ON agents (status);

-- Agent keys: hash lookup (for auth validation)
CREATE INDEX IF NOT EXISTS idx_agent_keys_key_hash
  ON agent_keys (key_hash)
  WHERE revoked = false;

CREATE INDEX IF NOT EXISTS idx_agent_keys_agent_id
  ON agent_keys (agent_id);

-- Invitations: token hash lookup + expiry
CREATE INDEX IF NOT EXISTS idx_invitations_token_hash
  ON invitations (token_hash)
  WHERE used = false;

CREATE INDEX IF NOT EXISTS idx_invitations_expires_at
  ON invitations (expires_at)
  WHERE used = false;
