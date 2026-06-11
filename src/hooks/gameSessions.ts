import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTodayDateKey } from '../lib/dateUtils';
import { GameKey, GameSession, supabase } from '../lib/supabase';

const GAME_SESSIONS_QUERY_KEY = ['gameSessions'];

// Sessões PONTUADAS de hoje (decide se a próxima rodada vale pontos reais)
async function fetchTodayScoredSessions(): Promise<GameSession[]> {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('played_on', getTodayDateKey())
    .gt('points_awarded', 0);

  if (error) throw error;
  return data || [];
}

export function useTodayGameSessions() {
  const query = useQuery({
    queryKey: [...GAME_SESSIONS_QUERY_KEY, getTodayDateKey()],
    queryFn: fetchTodayScoredSessions,
    staleTime: 0,
  });

  const hasScoredToday = (gameKey: GameKey) =>
    (query.data ?? []).some((s) => s.game_key === gameKey);

  return { ...query, hasScoredToday };
}

// Recorde histórico (maior correct_count já salvo) para um jogo
async function fetchGameRecord(gameKey: GameKey): Promise<number> {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('correct_count')
    .eq('game_key', gameKey)
    .order('correct_count', { ascending: false })
    .limit(1);

  if (error) throw error;
  return data?.[0]?.correct_count ?? 0;
}

export function useGameRecord(gameKey: GameKey) {
  return useQuery({
    queryKey: [...GAME_SESSIONS_QUERY_KEY, 'record', gameKey],
    queryFn: () => fetchGameRecord(gameKey),
  });
}

interface RecordGameSessionData {
  game_key: GameKey;
  correct_count: number;
  total_count: number;
  points: number;
  eligible: boolean;
}

async function insertSession(
  s: RecordGameSessionData,
  pointsAwarded: number
): Promise<GameSession> {
  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      game_key: s.game_key,
      played_on: getTodayDateKey(),
      correct_count: s.correct_count,
      total_count: s.total_count,
      points_awarded: pointsAwarded,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function recordGameSession(s: RecordGameSessionData): Promise<GameSession> {
  try {
    return await insertSession(s, s.eligible ? s.points : 0);
  } catch (err: any) {
    // 23505 = índice único pegou uma corrida (outra sessão já pontuou hoje);
    // regrava como rodada cosmética
    if (err?.code === '23505') return insertSession(s, 0);
    throw err;
  }
}

export function useRecordGameSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recordGameSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GAME_SESSIONS_QUERY_KEY });
    },
  });
}
