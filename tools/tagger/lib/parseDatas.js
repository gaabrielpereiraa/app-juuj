import { readFileSync } from 'node:fs';
import { categorize } from './categorize.js';

// Tenta extrair um "lugar" do título (best-effort; pode ficar null).
function extractLocation(title) {
  // "Pizza no Zona Sul", "Churras na Luiza", "Risotto no GB"
  const prep = title.match(/\b(?:no|na|nos|nas)\s+([A-ZÀ-Ÿ][^,()]+?)(?:\s*\(|$)/);
  if (prep) return prep[1].trim();
  return null;
}

/**
 * Faz parse da lista "DATAS" em um array de memórias.
 * Tolerante a:
 *  - marcadores de ano: *2025*, *2026*
 *  - linhas grudadas (sem quebra) entre eventos
 *  - separador "-" opcional e títulos entre parênteses: "15/01 (Início)"
 *  - dia/mês com 1 ou 2 dígitos
 *
 * Retorna { memories: [{event_date, title, location, category}], unmatched: [] }
 */
export function parseDatas(text) {
  // 1) quebra antes de cada token de data (separa entradas grudadas)
  let s = text.replace(/(\d{1,2}\/\d{1,2})/g, '\n$1');

  const lines = s
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let year = null;
  const memories = [];
  const unmatched = [];
  const seen = new Set();

  for (const line of lines) {
    // marcador de ano: linha que é só "2025" / "*2026*" / "2025"
    const ym = line.match(/^\*{0,2}\s*(20\d{2})\s*\*{0,2}$/);
    if (ym) {
      year = parseInt(ym[1], 10);
      continue;
    }

    const m = line.match(/^(\d{1,2})\/(\d{1,2})\s*-?\s*(.+)$/);
    if (!m) {
      unmatched.push(line);
      continue;
    }
    if (!year) {
      unmatched.push(`(sem ano) ${line}`);
      continue;
    }

    const day = m[1].padStart(2, '0');
    const month = m[2].padStart(2, '0');
    let title = m[3].trim();
    // "(Início)" -> "Início"
    title = title.replace(/^\((.*)\)$/, '$1').trim();
    if (!title) {
      unmatched.push(line);
      continue;
    }

    const event_date = `${year}-${month}-${day}`;
    const key = `${event_date}|${title.toLowerCase()}`;
    if (seen.has(key)) continue; // dedup intra-arquivo
    seen.add(key);

    memories.push({
      event_date,
      title,
      location: extractLocation(title),
      category: categorize(title),
    });
  }

  return { memories, unmatched };
}

export function parseDatasFile(path) {
  return parseDatas(readFileSync(path, 'utf8'));
}
