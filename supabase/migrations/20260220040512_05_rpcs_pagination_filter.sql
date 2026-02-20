/*
  # RPCs: Visibility Logic, Server-Side Pagination, Filter-Count

  ## Summary
  Implements three server-side RPC functions that power the asset browser:

  1. `list_assets`       – Paginated, filtered asset listing with joined tag/ref data.
  2. `count_assets`      – Returns total count matching the same filter set (no pagination),
                           used for pagination controls.
  3. `get_asset_detail`  – Single asset with all tags, character refs, property refs joined.

  ## Visibility Logic
  - All three functions respect `is_deleted = false`.
  - They run as SECURITY DEFINER but call `auth.uid()` internally for role checks.
  - Results match exactly what the RLS policies permit; the functions are additive helpers
    for efficient server-side pagination and aggregation – NOT a bypass.

  ## Filter Parameters (list_assets + count_assets)
  - `p_share_id`       uuid        – filter by share
  - `p_file_type`      text        – PSD | AI | UNKNOWN
  - `p_thumbnail_status` text      – PENDING | GENERATING | DONE | ERROR | RENDER_QUEUED
  - `p_search`         text        – ILIKE on file_name, or tag value match
  - `p_tag`            text        – exact tag value filter
  - `p_character_id`   uuid        – character ref filter
  - `p_property_id`    uuid        – property ref filter

  ## Pagination (list_assets only)
  - `p_limit`   integer  – page size (default 50, max 200)
  - `p_offset`  integer  – row offset (default 0)
  - `p_sort_by` text     – created_at | updated_at | file_name (default: updated_at)
  - `p_sort_dir` text    – asc | desc (default: desc)
*/

-- ─────────────────────────────────────────────
-- Helper: current user role
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$;

-- ─────────────────────────────────────────────
-- list_assets
-- Returns paginated rows with aggregated tag values and ref IDs.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION list_assets(
  p_share_id          uuid      DEFAULT NULL,
  p_file_type         text      DEFAULT NULL,
  p_thumbnail_status  text      DEFAULT NULL,
  p_search            text      DEFAULT NULL,
  p_tag               text      DEFAULT NULL,
  p_character_id      uuid      DEFAULT NULL,
  p_property_id       uuid      DEFAULT NULL,
  p_limit             integer   DEFAULT 50,
  p_offset            integer   DEFAULT 0,
  p_sort_by           text      DEFAULT 'updated_at',
  p_sort_dir          text      DEFAULT 'desc'
)
RETURNS TABLE (
  id                uuid,
  share_id          uuid,
  relative_path     text,
  file_name         text,
  file_type         text,
  file_size_bytes   bigint,
  thumbnail_status  text,
  thumbnail_key     text,
  thumbnail_error   text,
  is_deleted        boolean,
  created_at        timestamptz,
  updated_at        timestamptz,
  tags              jsonb,
  character_ids     uuid[],
  property_ids      uuid[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := current_user_role();
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);
  v_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
BEGIN
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY EXECUTE format(
    $q$
    SELECT
      a.id,
      a.share_id,
      a.relative_path,
      a.file_name,
      a.file_type,
      a.file_size_bytes,
      a.thumbnail_status,
      a.thumbnail_key,
      a.thumbnail_error,
      a.is_deleted,
      a.created_at,
      a.updated_at,
      COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
          'value', t.value,
          'source', t.source,
          'confidence', t.confidence
        ))
         FROM asset_tags t WHERE t.asset_id = a.id),
        '[]'::jsonb
      ) AS tags,
      COALESCE(
        (SELECT array_agg(DISTINCT cr.character_id)
         FROM character_refs cr WHERE cr.asset_id = a.id),
        '{}'::uuid[]
      ) AS character_ids,
      COALESCE(
        (SELECT array_agg(DISTINCT pr.property_id)
         FROM property_refs pr WHERE pr.asset_id = a.id),
        '{}'::uuid[]
      ) AS property_ids
    FROM assets a
    WHERE a.is_deleted = false
      AND ($1 IS NULL OR a.share_id = $1)
      AND ($2 IS NULL OR a.file_type = $2)
      AND ($3 IS NULL OR a.thumbnail_status = $3)
      AND ($4 IS NULL OR a.file_name ILIKE '%%' || $4 || '%%'
                      OR EXISTS (
                           SELECT 1 FROM asset_tags st
                           WHERE st.asset_id = a.id
                             AND st.value ILIKE '%%' || $4 || '%%'
                         ))
      AND ($5 IS NULL OR EXISTS (
             SELECT 1 FROM asset_tags ft
             WHERE ft.asset_id = a.id AND ft.value = $5
           ))
      AND ($6 IS NULL OR EXISTS (
             SELECT 1 FROM character_refs frc
             WHERE frc.asset_id = a.id AND frc.character_id = $6
           ))
      AND ($7 IS NULL OR EXISTS (
             SELECT 1 FROM property_refs frp
             WHERE frp.asset_id = a.id AND frp.property_id = $7
           ))
    ORDER BY
      CASE WHEN %s = 'file_name'   AND %s = 'asc'  THEN a.file_name   END ASC,
      CASE WHEN %s = 'file_name'   AND %s = 'desc' THEN a.file_name   END DESC,
      CASE WHEN %s = 'created_at'  AND %s = 'asc'  THEN a.created_at  END ASC,
      CASE WHEN %s = 'created_at'  AND %s = 'desc' THEN a.created_at  END DESC,
      CASE WHEN %s = 'updated_at'  AND %s = 'asc'  THEN a.updated_at  END ASC,
      a.updated_at DESC
    LIMIT $8 OFFSET $9
    $q$,
    quote_literal(p_sort_by), quote_literal(p_sort_dir),
    quote_literal(p_sort_by), quote_literal(p_sort_dir),
    quote_literal(p_sort_by), quote_literal(p_sort_dir),
    quote_literal(p_sort_by), quote_literal(p_sort_dir),
    quote_literal(p_sort_by), quote_literal(p_sort_dir)
  )
  USING
    p_share_id,
    p_file_type,
    p_thumbnail_status,
    p_search,
    p_tag,
    p_character_id,
    p_property_id,
    v_limit,
    v_offset;
END;
$$;

-- ─────────────────────────────────────────────
-- count_assets
-- Returns total matching row count for the same filter set.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION count_assets(
  p_share_id          uuid    DEFAULT NULL,
  p_file_type         text    DEFAULT NULL,
  p_thumbnail_status  text    DEFAULT NULL,
  p_search            text    DEFAULT NULL,
  p_tag               text    DEFAULT NULL,
  p_character_id      uuid    DEFAULT NULL,
  p_property_id       uuid    DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := current_user_role();
  v_count bigint;
BEGIN
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT COUNT(*)
  INTO v_count
  FROM assets a
  WHERE a.is_deleted = false
    AND (p_share_id         IS NULL OR a.share_id         = p_share_id)
    AND (p_file_type        IS NULL OR a.file_type        = p_file_type)
    AND (p_thumbnail_status IS NULL OR a.thumbnail_status = p_thumbnail_status)
    AND (p_search IS NULL OR
         a.file_name ILIKE '%' || p_search || '%'
         OR EXISTS (
              SELECT 1 FROM asset_tags st
              WHERE st.asset_id = a.id
                AND st.value ILIKE '%' || p_search || '%'
            ))
    AND (p_tag IS NULL OR EXISTS (
           SELECT 1 FROM asset_tags ft
           WHERE ft.asset_id = a.id AND ft.value = p_tag
         ))
    AND (p_character_id IS NULL OR EXISTS (
           SELECT 1 FROM character_refs frc
           WHERE frc.asset_id = a.id AND frc.character_id = p_character_id
         ))
    AND (p_property_id IS NULL OR EXISTS (
           SELECT 1 FROM property_refs frp
           WHERE frp.asset_id = a.id AND frp.property_id = p_property_id
         ));

  RETURN v_count;
END;
$$;

-- ─────────────────────────────────────────────
-- get_asset_detail
-- Single asset row with full tag/ref detail.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_asset_detail(p_asset_id uuid)
RETURNS TABLE (
  id                uuid,
  share_id          uuid,
  relative_path     text,
  file_name         text,
  file_type         text,
  file_size_bytes   bigint,
  quick_hash        text,
  thumbnail_status  text,
  thumbnail_key     text,
  thumbnail_error   text,
  is_deleted        boolean,
  created_at        timestamptz,
  updated_at        timestamptz,
  tags              jsonb,
  characters        jsonb,
  properties        jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := current_user_role();
BEGIN
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.share_id,
    a.relative_path,
    a.file_name,
    a.file_type,
    a.file_size_bytes,
    a.quick_hash,
    a.thumbnail_status,
    a.thumbnail_key,
    a.thumbnail_error,
    a.is_deleted,
    a.created_at,
    a.updated_at,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id',         t.id,
        'value',      t.value,
        'source',     t.source,
        'confidence', t.confidence
      ) ORDER BY t.source, t.value)
       FROM asset_tags t WHERE t.asset_id = a.id),
      '[]'::jsonb
    ) AS tags,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'refId',       cr.id,
        'characterId', cr.character_id,
        'name',        c.name,
        'aliases',     c.aliases,
        'source',      cr.source,
        'confidence',  cr.confidence
      ) ORDER BY c.name)
       FROM character_refs cr
       JOIN characters c ON c.id = cr.character_id
       WHERE cr.asset_id = a.id),
      '[]'::jsonb
    ) AS characters,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'refId',      pr.id,
        'propertyId', pr.property_id,
        'name',       p.name,
        'studio',     p.studio,
        'source',     pr.source,
        'confidence', pr.confidence
      ) ORDER BY p.name)
       FROM property_refs pr
       JOIN properties p ON p.id = pr.property_id
       WHERE pr.asset_id = a.id),
      '[]'::jsonb
    ) AS properties
  FROM assets a
  WHERE a.id = p_asset_id
    AND a.is_deleted = false;
END;
$$;

-- Grant execute on RPCs to authenticated users
GRANT EXECUTE ON FUNCTION list_assets TO authenticated;
GRANT EXECUTE ON FUNCTION count_assets TO authenticated;
GRANT EXECUTE ON FUNCTION get_asset_detail TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_role TO authenticated;
