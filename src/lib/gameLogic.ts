import { Memory } from './supabase';

// Memória "jogável": forma achatada usada pelos joguinhos
export interface PlayableMemory {
  id: string;
  event_date: string;
  title: string;
  photoPath: string | null;
}

export interface QuizQuestion {
  photoPath: string;
  correct: PlayableMemory;
  options: PlayableMemory[]; // 4 opções embaralhadas (inclui a correta)
}

export interface TimelineSlot {
  memory: PlayableMemory;
  position: number;
  isCorrect: boolean;
}

export const QUIZ_ROUND_SIZE = 10;
// Calibrado contra as tarefas reais (1-8 pts) e as recompensas mais baratas (~20 pts):
// rodada perfeita = 20 pts (quiz) + 12 pts (timeline) = 32 pts/dia, ~1 recompensa pequena.
export const QUIZ_POINTS_PER_HIT = 2;
export const TIMELINE_ROUND_SIZE = 4;
export const TIMELINE_POINTS_PER_HIT = 3;

// Fisher-Yates em cópia
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

export function toPlayable(memories: Memory[]): PlayableMemory[] {
  return memories.map((m) => {
    const photos = [...(m.memory_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    return {
      id: m.id,
      event_date: m.event_date,
      title: m.title,
      photoPath: photos[0]?.storage_path ?? null,
    };
  });
}

/**
 * Monta uma rodada do "De qual date é a foto?": até 10 fotos, cada uma com
 * 3 distratores de event_date distintas entre si e da correta (várias memórias
 * compartilham a mesma data — duas opções com a mesma data seriam ambíguas).
 */
export function buildPhotoQuizRound(memories: PlayableMemory[]): QuizQuestion[] {
  const withPhoto = memories.filter((m) => m.photoPath);
  const picked = sample(withPhoto, Math.min(QUIZ_ROUND_SIZE, withPhoto.length));

  return picked.flatMap((correct) => {
    const usedDates = new Set([correct.event_date]);
    const distractors: PlayableMemory[] = [];
    for (const m of shuffle(memories)) {
      if (distractors.length === 3) break;
      if (usedDates.has(m.event_date)) continue;
      usedDates.add(m.event_date);
      distractors.push(m);
    }
    if (distractors.length < 3) return []; // sem distratores suficientes, pula
    return [{
      photoPath: correct.photoPath!,
      correct,
      options: shuffle([correct, ...distractors]),
    }];
  });
}

function isChronological(order: PlayableMemory[]): boolean {
  return order.every((m, i) => i === 0 || order[i - 1].event_date <= m.event_date);
}

/**
 * Monta uma rodada da "Linha do tempo": 4 memórias com foto de datas DISTINTAS,
 * embaralhadas (nunca já em ordem cronológica).
 */
export function buildTimelineRound(memories: PlayableMemory[]): PlayableMemory[] {
  const byDate = new Map<string, PlayableMemory[]>();
  for (const m of memories) {
    if (!m.photoPath) continue;
    const group = byDate.get(m.event_date) ?? [];
    group.push(m);
    byDate.set(m.event_date, group);
  }
  if (byDate.size < TIMELINE_ROUND_SIZE) return [];

  const dates = sample([...byDate.keys()], TIMELINE_ROUND_SIZE);
  const picked = dates.map((d) => sample(byDate.get(d)!, 1)[0]);

  let shuffled = shuffle(picked);
  while (isChronological(shuffled)) shuffled = shuffle(shuffled);
  return shuffled;
}

/** Corrige a ordem do usuário posição a posição contra a ordem cronológica. */
export function scoreTimeline(userOrder: PlayableMemory[]): TimelineSlot[] {
  const correctOrder = [...userOrder].sort((a, b) => a.event_date.localeCompare(b.event_date));
  return userOrder.map((memory, i) => ({
    memory,
    position: i + 1,
    isCorrect: memory.id === correctOrder[i].id,
  }));
}

export const INFINITE_TIMELINE_POINTS_PER_HIT = 1;
export const INFINITE_TIMELINE_POINTS_CAP = 10;
export const INFINITE_TIMELINE_START_SIZE = 2;

/**
 * Monta o "baralho" da Linha do tempo infinita: uma memória com foto por
 * data distinta, embaralhadas.
 */
export function buildInfiniteTimelineDeck(memories: PlayableMemory[]): PlayableMemory[] {
  const byDate = new Map<string, PlayableMemory[]>();
  for (const m of memories) {
    if (!m.photoPath) continue;
    const group = byDate.get(m.event_date) ?? [];
    group.push(m);
    byDate.set(m.event_date, group);
  }
  const oneByDate = [...byDate.values()].map((group) => sample(group, 1)[0]);
  return shuffle(oneByDate);
}

/** Insere a próxima carta do baralho numa posição aleatória da sequência atual. */
export function insertNextCard(sequence: PlayableMemory[], next: PlayableMemory): PlayableMemory[] {
  const result = [...sequence];
  const index = Math.floor(Math.random() * (result.length + 1));
  result.splice(index, 0, next);
  return result;
}
