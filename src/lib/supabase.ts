import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Tipos do banco de dados
export interface Reward {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  image_url: string | null;
  icon: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  name: string;
  avatar_url: string | null;
  current_points: number;
  total_points_earned: number;
  created_at: string;
  updated_at: string;
}

export interface RewardRedemption {
  id: string;
  reward_id: string;
  points_spent: number;
  status: 'PENDENTE' | 'CONCEDIDA';
  redeemed_at: string;
  granted_at: string | null;
  created_at: string;
}

export interface Task {
    id: string;
    title: string;
    description: string | null;
    points_per_unit: number;
    unit_label: string;
    icon: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface TaskCompletion {
    id: string;
    task_id: string;
    quantity: number;
    points_earned: number;
    completed_at: string;
    created_at: string;
}