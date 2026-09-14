import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Reward, RewardRedemption, supabase } from '../lib/supabase';

const REWARDS_QUERY_KEY = ['rewards'];
const REDEMPTIONS_QUERY_KEY = ['rewardRedemptions'];

// Buscar todas as recompensas disponíveis
async function fetchRewards(): Promise<Reward[]> {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('is_available', true)
    .order('points_cost', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Resgatar uma recompensa
interface RedeemRewardData {
  reward_id: string;
  points_spent: number;
  status?: 'PENDENTE' | 'CONCEDIDA';
}

async function redeemReward(redemptionData: RedeemRewardData): Promise<RewardRedemption> {
  const { data, error } = await supabase
    .from('reward_redemptions')
    .insert({
      ...redemptionData,
      status: redemptionData.status || 'PENDENTE',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Buscar histórico de resgates
async function fetchRedemptions(): Promise<RewardRedemption[]> {
  const { data, error } = await supabase
    .from('reward_redemptions')
    .select(`
      *,
      rewards (
        id,
        title,
        icon
      )
    `)
    .order('redeemed_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}

// Buscar resgates agrupados por data
interface GroupedRedemption {
  date: string;
  date_label: string;
  rewards: Array<{
    id: string;
    title: string;
    points: number;
    time: string;
    status: string;
    icon: string;
    isGranted: boolean;
  }>;
}

async function fetchGroupedRedemptions(): Promise<GroupedRedemption[]> {
  const redemptions = await fetchRedemptions();
  return groupRedemptionsByDate(redemptions);
}

function groupRedemptionsByDate(redemptions: any[]): GroupedRedemption[] {
  const grouped = new Map<string, GroupedRedemption>();

  redemptions.forEach((redemption: any) => {
    const date = new Date(redemption.redeemed_at).toISOString().split('T')[0];
    const time = new Date(redemption.redeemed_at).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (!grouped.has(date)) {
      const dateObj = new Date(date);
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let dateLabel = '';
      if (date === today) dateLabel = 'Hoje';
      else if (date === yesterday) dateLabel = 'Ontem';
      else {
        dateLabel = dateObj.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
        });
      }

      grouped.set(date, {
        date,
        date_label: dateLabel,
        rewards: [],
      });
    }

    grouped.get(date)!.rewards.push({
      id: redemption.id,
      title: redemption.rewards?.title || 'Recompensa',
      points: redemption.points_spent,
      time: time,
      status: redemption.status,
      icon: redemption.rewards?.icon || 'gift-outline',
      isGranted: redemption.status === 'CONCEDIDA',
    });
  });

  return Array.from(grouped.values()).sort((a, b) => 
    b.date.localeCompare(a.date)
  );
}

// Conceder uma recompensa
async function grantReward(redemptionId: string): Promise<RewardRedemption> {
  const { data, error } = await supabase
    .from('reward_redemptions')
    .update({ status: 'CONCEDIDA', granted_at: new Date().toISOString() })
    .eq('id', redemptionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// --- Admin: recompensas incluindo as indisponíveis + escrita ---

async function fetchAllRewards(): Promise<Reward[]> {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .order('points_cost', { ascending: true });

  if (error) throw error;
  return data || [];
}

export type RewardInput = Partial<Reward> & { title: string };

async function saveReward(reward: RewardInput): Promise<Reward> {
  const payload = { ...reward, updated_at: new Date().toISOString() };

  const query = reward.id
    ? supabase.from('rewards').update(payload).eq('id', reward.id)
    : supabase.from('rewards').insert(payload);

  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

async function deleteReward(id: string): Promise<void> {
  const { error } = await supabase.from('rewards').delete().eq('id', id);
  if (error) throw error;
}

// Reverter uma concessão
async function revokeReward(redemptionId: string): Promise<RewardRedemption> {
  const { data, error } = await supabase
    .from('reward_redemptions')
    .update({ status: 'PENDENTE', granted_at: null })
    .eq('id', redemptionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function useRewards() {
  return useQuery({
    queryKey: REWARDS_QUERY_KEY,
    queryFn: fetchRewards,
  });
}

export function useRedeemReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: redeemReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REDEMPTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });
}

export function useRedemptions() {
  return useQuery({
    queryKey: REDEMPTIONS_QUERY_KEY,
    queryFn: fetchRedemptions,
  });
}

export function useGroupedRedemptions() {
  return useQuery({
    queryKey: [...REDEMPTIONS_QUERY_KEY, 'grouped'],
    queryFn: fetchGroupedRedemptions,
  });
}

export function useGrantReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: grantReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REDEMPTIONS_QUERY_KEY });
    },
  });
}

export function useRevokeReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REDEMPTIONS_QUERY_KEY });
    },
  });
}

export function useAllRewards() {
  return useQuery({
    queryKey: [...REWARDS_QUERY_KEY, 'all'],
    queryFn: fetchAllRewards,
  });
}

export function useSaveReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveReward,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REWARDS_QUERY_KEY }),
  });
}

export function useDeleteReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReward,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REWARDS_QUERY_KEY }),
  });
}