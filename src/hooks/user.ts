import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, UserSettings } from '../lib/supabase';

const QUERY_KEY = ['userSettings'];

// Buscar configurações do usuário
async function fetchUserSettings(): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .limit(1)
    .single();
  if (error) throw error;
  return data;
}

// Atualizar pontos
async function updatePoints(points: Partial<UserSettings>): Promise<UserSettings> {
  const { data: currentData } = await supabase
    .from('user_settings')
    .select('id')
    .limit(1)
    .single();

  if (!currentData) throw new Error('Usuário não encontrado');

  const { data, error } = await supabase
    .from('user_settings')
    .update(points)
    .eq('id', currentData.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function useUserSettings() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchUserSettings,
  });
}

export function useUpdatePoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePoints,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });
}