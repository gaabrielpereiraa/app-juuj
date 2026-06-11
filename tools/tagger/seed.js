import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseDatasFile } from './lib/parseDatas.js';
import { supabase } from './lib/supabase.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATAS_PATH = join(__dirname, 'datas.txt');

async function main() {
  if (!existsSync(DATAS_PATH)) {
    console.error(`Arquivo não encontrado: ${DATAS_PATH}`);
    console.error('Cole a lista DATAS em tools/tagger/datas.txt e rode de novo.');
    process.exit(1);
  }

  const { memories, unmatched } = parseDatasFile(DATAS_PATH);
  console.log(`Parse: ${memories.length} memórias, ${unmatched.length} linhas ignoradas.`);
  if (unmatched.length) {
    console.log('\n--- linhas ignoradas (confira se alguma deveria virar memória) ---');
    unmatched.forEach((l) => console.log('  •', l));
    console.log('-------------------------------------------------------------------\n');
  }

  // upsert idempotente por (event_date, title) — exige unique no schema
  const { data, error } = await supabase
    .from('memories')
    .upsert(memories, { onConflict: 'event_date,title', ignoreDuplicates: true })
    .select('id');

  if (error) {
    console.error('Erro no upsert:', error.message);
    process.exit(1);
  }

  const { count } = await supabase
    .from('memories')
    .select('*', { count: 'exact', head: true });

  console.log(`Inseridas/atualizadas nesta rodada: ${data?.length ?? 0}`);
  console.log(`Total de memórias no banco agora: ${count}`);

  // amostra de categorias pra conferência rápida
  const sample = memories.slice(0, 8).map((m) => `${m.event_date} ${m.title} -> ${m.category ?? '—'}`);
  console.log('\nAmostra:\n  ' + sample.join('\n  '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
