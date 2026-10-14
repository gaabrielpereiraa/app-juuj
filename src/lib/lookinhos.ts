import type { WardrobeCategory } from './supabase';

// ---------- Resposta da estilista (texto em streaming) ----------
// Formato combinado com a function wardrobe-stylist:
//   parágrafos soltos
//   ## Título do look
//   [[id1, id2, id3]]
//   explicação do look

export type StylistBlock =
  | { type: 'text'; text: string }
  | { type: 'look'; title: string; ids: string[]; why: string };

export function parseStylist(raw: string): StylistBlock[] {
  const blocks: StylistBlock[] = [];
  let look: Extract<StylistBlock, { type: 'look' }> | null = null;

  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t) continue;

    if (t.startsWith('##')) {
      look = { type: 'look', title: t.replace(/^#+\s*/, ''), ids: [], why: '' };
      blocks.push(look);
    } else if (t.startsWith('[[')) {
      // linha de ids ainda chegando ("[[c9d0, d4") fica escondida até fechar
      const m = t.match(/^\[\[(.*)\]\]$/);
      if (m && look) look.ids = m[1].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (look) {
      look.why = look.why ? `${look.why} ${t}` : t;
    } else {
      blocks.push({ type: 'text', text: t });
    }
  }
  return blocks;
}

// ---------- Look montado "no corpo" ----------

export type BodyZone = 'head' | 'full' | 'top' | 'bottom' | 'side' | 'feet';

const ZONE: Record<WardrobeCategory, BodyZone> = {
  acessorios: 'head',
  vestidos: 'full',
  macacoes: 'full',
  casacos: 'top',
  blusas: 'top',
  tube_tops: 'top',
  regatas: 'top',
  camisetas: 'top',
  camisas: 'top',
  calcas: 'bottom',
  shorts: 'bottom',
  saias: 'bottom',
  bolsas: 'side',
  calcados: 'feet',
};

/** Agrupa as peças do look por região do corpo, de cima para baixo. */
export function outfitZones<T extends { category: WardrobeCategory | null }>(items: T[]) {
  const zones: Record<BodyZone, T[]> = { head: [], full: [], top: [], bottom: [], side: [], feet: [] };
  for (const item of items) zones[item.category ? ZONE[item.category] : 'top'].push(item);
  // casaco por fora: fica à esquerda da blusa
  zones.top.sort((a, b) => Number(b.category === 'casacos') - Number(a.category === 'casacos'));
  return zones;
}

export const CATEGORY_LABEL: Record<WardrobeCategory, string> = {
  blusas: 'Blusas',
  tube_tops: 'Tube tops',
  regatas: 'Regatas',
  camisetas: 'Camisetas',
  camisas: 'Camisas',
  calcas: 'Calças',
  shorts: 'Shorts',
  saias: 'Saias',
  vestidos: 'Vestidos',
  macacoes: 'Macacões',
  casacos: 'Casacos',
  calcados: 'Calçados',
  bolsas: 'Bolsas',
  acessorios: 'Acessórios',
};
