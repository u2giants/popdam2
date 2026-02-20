import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Property } from '../lib/types';

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('properties')
      .select('id, name, studio, created_at')
      .order('name')
      .then(({ data }) => {
        setProperties(
          (data ?? []).map(r => ({
            id: r.id,
            name: r.name,
            studio: r.studio ?? '',
            createdAt: r.created_at,
          }))
        );
        setLoading(false);
      });
  }, []);

  return { properties, loading };
}
