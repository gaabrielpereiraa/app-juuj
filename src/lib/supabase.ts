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

export interface MemoryPhoto {
    id: string;
    memory_id: string;
    storage_path: string;
    sort_order: number;
}

export interface Memory {
    id: string;
    event_date: string;
    title: string;
    location: string | null;
    category: string | null;
    memory_photos?: MemoryPhoto[];
}

export type GameKey = 'photo_quiz' | 'timeline' | 'timeline_infinite';

export interface GameSession {
    id: string;
    game_key: GameKey;
    played_on: string;
    correct_count: number;
    total_count: number;
    points_awarded: number;
    created_at: string;
}
export const WARDROBE_CATEGORIES = [
    'blusas', 'tube_tops', 'regatas', 'camisetas', 'camisas', 'calcas', 'shorts', 'saias',
    'vestidos', 'macacoes', 'casacos', 'calcados', 'bolsas', 'acessorios',
] as const;

export type WardrobeCategory = typeof WARDROBE_CATEGORIES[number];

export interface WardrobeItem {
    id: string;
    status: 'processing' | 'ready' | 'error';
    raw_path: string;
    image_path: string | null;
    category: WardrobeCategory | null;
    name: string | null;
    colors: string[] | null;
    pattern: string | null;
    material: string | null;
    formality: number | null;
    seasons: string[] | null;
    occasions: string[] | null;
    description: string | null;
    error: string | null;
    created_at: string;
}

export interface SavedLook {
    id: string;
    title: string;
    item_ids: string[];
    why: string | null;
    occasion: string | null;
    tryon_path: string | null;
    created_at: string;
}
