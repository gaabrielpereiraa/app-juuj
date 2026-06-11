import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Memory, supabase } from '../lib/supabase';

const MEMORIES_QUERY_KEY = ['memories', 'withPhotos'];

async function fetchMemoriesWithPhotos(): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('memories')
    .select('id, event_date, title, location, category, memory_photos(id, memory_id, storage_path, sort_order)')
    .order('event_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export function useMemoriesWithPhotos() {
  return useQuery({
    queryKey: MEMORIES_QUERY_KEY,
    queryFn: fetchMemoriesWithPhotos,
    // dados quase estáticos; o persister em AsyncStorage dá cache offline
    staleTime: 1000 * 60 * 60,
  });
}

export function photoUrl(storagePath: string): string {
  return supabase.storage.from('memories').getPublicUrl(storagePath).data.publicUrl;
}

/** Memórias cujo dia/mês de event_date coincide com o de hoje (em qualquer ano). */
export function useOnThisDayMemories() {
  const { data: memories } = useMemoriesWithPhotos();

  return useMemo(() => {
    if (!memories) return [];
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    return memories
      .filter((m) => {
        const [, month, day] = m.event_date.split('-');
        return month === mm && day === dd;
      })
      .sort((a, b) => a.event_date.localeCompare(b.event_date));
  }, [memories]);
}
