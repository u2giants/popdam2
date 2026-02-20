/*
  # Core Tables: shares, assets, tags, characters, properties

  ## Summary
  Establishes the foundational data model for POPDAM.

  ## Design Decisions
  - Option A canonical path: `relative_path` (posix-normalised, no leading slash) is the stored
    canonical identifier. UNC / IP-UNC paths are derived at display time from the share's
    `host` and `ip` columns – they are NEVER stored on the asset row.
  - `share` is a first-class table so multiple NAS shares can be managed independently.
  - Enum-like values use TEXT + CHECK so new values can be added without enum ALTER.

  ## New Tables
  1. `shares`         – NAS share definitions (host, ip, share name, container mount root)
  2. `assets`         – Core asset rows; canonical path = (share_id, relative_path)
  3. `asset_tags`     – Normalised tag rows (value, source, confidence)
  4. `characters`     – Character reference master table
  5. `properties`     – Property (IP/franchise) master table
  6. `character_refs` – Asset ↔ character join with source/confidence
  7. `property_refs`  – Asset ↔ property join with source/confidence

  ## Security
  - RLS enabled on every table.
  - Viewer role: read-only on non-deleted assets.
  - Editor role: read + write assets/tags/refs.
  - Admin role: full access including deletes and share management.
*/

-- ─────────────────────────────────────────────
-- SHARES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shares (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  host             text NOT NULL,
  ip               text,
  share_name       text NOT NULL,
  container_mount  text NOT NULL DEFAULT '/mnt/nas',
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read shares"
  ON shares FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert shares"
  ON shares FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update shares"
  ON shares FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete shares"
  ON shares FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- ─────────────────────────────────────────────
-- PROPERTIES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  studio     text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read properties"
  ON properties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "Admins and editors can update properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "Admins can delete properties"
  ON properties FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- ─────────────────────────────────────────────
-- CHARACTERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS characters (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  aliases     text[] NOT NULL DEFAULT '{}',
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read characters"
  ON characters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert characters"
  ON characters FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "Admins and editors can update characters"
  ON characters FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "Admins can delete characters"
  ON characters FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- ─────────────────────────────────────────────
-- ASSETS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id         uuid NOT NULL REFERENCES shares(id) ON DELETE RESTRICT,
  -- Canonical path: posix-normalised, no leading slash, relative to share root
  relative_path    text NOT NULL,
  file_name        text NOT NULL,
  file_type        text NOT NULL DEFAULT 'UNKNOWN'
                   CHECK (file_type IN ('PSD', 'AI', 'UNKNOWN')),
  file_size_bytes  bigint,
  quick_hash       text,
  quick_hash_v     smallint NOT NULL DEFAULT 1,
  thumbnail_status text NOT NULL DEFAULT 'PENDING'
                   CHECK (thumbnail_status IN ('PENDING','GENERATING','DONE','ERROR','RENDER_QUEUED')),
  thumbnail_key    text,
  thumbnail_error  text CHECK (thumbnail_error IN (
                     'NO_PDF_COMPAT','UNSUPPORTED_FORMAT','TIMEOUT',
                     'SPACES_UPLOAD_FAILED','UNKNOWN'
                   )),
  is_deleted       boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (share_id, relative_path)
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read non-deleted assets"
  ON assets FOR SELECT
  TO authenticated
  USING (is_deleted = false);

CREATE POLICY "Admins and editors can insert assets"
  ON assets FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "Admins and editors can update assets"
  ON assets FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "Admins can hard-delete assets"
  ON assets FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- ─────────────────────────────────────────────
-- ASSET TAGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS asset_tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id   uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  value      text NOT NULL,
  source     text NOT NULL DEFAULT 'MANUAL'
             CHECK (source IN ('AI', 'MANUAL', 'PROPOSED')),
  confidence real CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_id, value, source)
);

ALTER TABLE asset_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read asset tags"
  ON asset_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_tags.asset_id AND assets.is_deleted = false
    )
  );

CREATE POLICY "Admins and editors can insert asset tags"
  ON asset_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "Admins and editors can update asset tags"
  ON asset_tags FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "Admins and editors can delete asset tags"
  ON asset_tags FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

-- ─────────────────────────────────────────────
-- CHARACTER REFS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS character_refs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id     uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  source       text NOT NULL DEFAULT 'MANUAL'
               CHECK (source IN ('AI', 'MANUAL', 'PROPOSED')),
  confidence   real CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_id, character_id, source)
);

ALTER TABLE character_refs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read character refs"
  ON character_refs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = character_refs.asset_id AND assets.is_deleted = false
    )
  );

CREATE POLICY "Admins and editors can insert character refs"
  ON character_refs FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "Admins and editors can update character refs"
  ON character_refs FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "Admins and editors can delete character refs"
  ON character_refs FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

-- ─────────────────────────────────────────────
-- PROPERTY REFS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_refs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id    uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  source      text NOT NULL DEFAULT 'MANUAL'
              CHECK (source IN ('AI', 'MANUAL', 'PROPOSED')),
  confidence  real CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_id, property_id, source)
);

ALTER TABLE property_refs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read property refs"
  ON property_refs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = property_refs.asset_id AND assets.is_deleted = false
    )
  );

CREATE POLICY "Admins and editors can insert property refs"
  ON property_refs FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "Admins and editors can update property refs"
  ON property_refs FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );

CREATE POLICY "Admins and editors can delete property refs"
  ON property_refs FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'editor')
  );
