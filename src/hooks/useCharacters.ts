import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Character } from '../lib/types';

export function useCharacters(propertyId?: string) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let query = supabase
      .from('characters')
      .select('id, name, aliases, property_id, created_at')
      .order('name');

    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    query.then(({ data }) => {
      setCharacters(
        (data ?? []).map(r => ({
          id: r.id,
          name: r.name,
          aliases: r.aliases ?? [],
          propertyId: r.property_id,
          createdAt: r.created_at,
        }))
      );
      setLoading(false);
    });
  }, [propertyId]);

  return { characters, loading };
}
