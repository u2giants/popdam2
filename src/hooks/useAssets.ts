import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { AssetRow, ListAssetsParams } from '../lib/types';

const PAGE_SIZE = 48;

export function useAssets(params: ListAssetsParams) {
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const {
      search,
      fileType,
      propertyId,
      characterId,
      thumbnailStatus,
      needsReview,
      limit = PAGE_SIZE,
      offset = 0,
      sortBy = 'created_at',
      sortDir = 'desc',
    } = params;

    const [listResult, countResult] = await Promise.all([
      supabase.rpc('list_assets', {
        p_search: search ?? null,
        p_file_type: fileType?.[0] ?? null,
        p_thumbnail_status: thumbnailStatus ?? null,
        p_character_id: characterId ?? null,
        p_property_id: propertyId ?? null,
        p_needs_review: needsReview ?? null,
        p_limit: limit,
        p_offset: offset,
        p_sort_by: sortBy,
        p_sort_dir: sortDir,
      }),
      supabase.rpc('count_assets', {
        p_search: search ?? null,
        p_file_type: fileType?.[0] ?? null,
        p_thumbnail_status: thumbnailStatus ?? null,
        p_character_id: characterId ?? null,
        p_property_id: propertyId ?? null,
        p_needs_review: needsReview ?? null,
      }),
    ]);

    if (listResult.error) {
      setError(listResult.error.message);
      setLoading(false);
      return;
    }

    const rows = (listResult.data ?? []) as AssetRow[];
    setAssets(rows);
    setTotal(Number(countResult.data ?? 0));
    setLoading(false);
  }, [JSON.stringify(params)]); // eslint-disable-line

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { assets, total, loading, error, refetch: fetch };
}
