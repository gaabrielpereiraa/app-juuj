import express from 'express';
import { randomUUID } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename, extname } from 'node:path';
import sharp from 'sharp';
import { supabase, BUCKET } from './lib/supabase.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROGRESS_PATH = join(__dirname, 'progress.json');
const PHOTOS_DIR = process.env.PHOTOS_DIR;
const PORT = process.env.PORT || 5173;
const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

if (!PHOTOS_DIR || !existsSync(PHOTOS_DIR)) {
  console.error(`PHOTOS_DIR inválido ou não existe: ${PHOTOS_DIR}`);
  console.error('Ajuste PHOTOS_DIR no .env (caminho absoluto da pasta de fotos).');
  process.exit(1);
}

// --- progresso (parar/retomar) ---
function loadProgress() {
  if (!existsSync(PROGRESS_PATH)) return {};
  try {
    return JSON.parse(readFileSync(PROGRESS_PATH, 'utf8'));
  } catch {
    return {};
  }
}
function saveProgress(p) {
  writeFileSync(PROGRESS_PATH, JSON.stringify(p, null, 2));
}
let progress = loadProgress();

// Extrai a data de ENVIO do nome do arquivo do WhatsApp (mais confiável que mtime,
// que vira a data do download quando se baixa em lote). Retorna { iso, key } ou null.
function waSendInfo(name) {
  // IMG-20250215-WA0007.jpg  (Android)
  let m = name.match(/(?:IMG|VID|AUD|PTT|STK)-(\d{4})(\d{2})(\d{2})-WA(\d+)/i);
  if (m) return { iso: `${m[1]}-${m[2]}-${m[3]}`, key: `${m[1]}${m[2]}${m[3]}-${m[4].padStart(6, '0')}` };
  // "WhatsApp Image 2025-02-15 at 12.30.00" / "PHOTO-2025-02-15-12-30-00" (iOS)
  m = name.match(/(\d{4})-(\d{2})-(\d{2})\D+(\d{2})\D(\d{2})\D(\d{2})/);
  if (m) return { iso: `${m[1]}-${m[2]}-${m[3]}`, key: `${m[1]}${m[2]}${m[3]}-${m[4]}${m[5]}${m[6]}` };
  // data nua em qualquer lugar do nome
  m = name.match(/(\d{4})-?(\d{2})-?(\d{2})/);
  if (m) return { iso: `${m[1]}-${m[2]}-${m[3]}`, key: `${m[1]}${m[2]}${m[3]}-000000` };
  return null;
}

// --- fila de fotos: ordena pela data de envio do WhatsApp (fallback: mtime) ---
const sendDates = {}; // filename -> 'YYYY-MM-DD' (pista mostrada na UI)
const files = readdirSync(PHOTOS_DIR)
  .filter((f) => IMG_EXT.has(extname(f).toLowerCase()))
  .map((f) => {
    const wa = waSendInfo(f);
    if (wa) sendDates[f] = wa.iso;
    // chave ordenável: nome WA quando houver, senão mtime em ISO
    const key = wa ? wa.key : new Date(statSync(join(PHOTOS_DIR, f)).mtimeMs).toISOString();
    return { f, key };
  })
  .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
  .map((x) => x.f);

const usingWaNames = Object.keys(sendDates).length;
console.log(
  `Ordenação: ${usingWaNames}/${files.length} fotos pelo nome do WhatsApp` +
    (usingWaNames ? '' : ' (nenhum nome WA reconhecido — usando mtime)')
);

console.log(`${files.length} imagens encontradas em ${PHOTOS_DIR}`);

function nextPending() {
  return files.find((f) => !progress[f]) ?? null;
}
// estado completo da fila para as respostas da API (inclui a data de envio como pista)
function queueState() {
  const current = nextPending();
  return { ...counts(), current, currentDate: current ? sendDates[current] ?? null : null };
}
function counts() {
  let done = 0;
  let skipped = 0;
  for (const f of files) {
    const s = progress[f]?.status;
    if (s === 'done') done++;
    else if (s === 'skipped') skipped++;
  }
  return { total: files.length, done, skipped, remaining: files.length - done - skipped };
}

// resolve um arquivo da fila com segurança (sem path traversal)
function safeFile(name) {
  const base = basename(String(name || ''));
  if (!files.includes(base)) return null;
  return base;
}

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

app.get('/api/memories', async (_req, res) => {
  const { data, error } = await supabase
    .from('memories')
    .select('id, event_date, title, category, location')
    .order('event_date', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/queue', (_req, res) => {
  res.json(queueState());
});

// fila completa de pendentes (em ordem) + contagens — o cliente avança otimista
app.get('/api/init', (_req, res) => {
  const pending = files
    .filter((f) => !progress[f])
    .map((f) => ({ file: f, date: sendDates[f] ?? null }));
  res.json({ ...counts(), pending });
});

app.get('/api/photo/:file', (req, res) => {
  const f = safeFile(req.params.file);
  if (!f) return res.status(404).end();
  res.sendFile(join(PHOTOS_DIR, f));
});

app.post('/api/assign', async (req, res) => {
  const f = safeFile(req.body.file);
  const memoryId = String(req.body.memoryId || '');
  if (!f) return res.status(400).json({ error: 'arquivo inválido' });
  if (!memoryId) return res.status(400).json({ error: 'memoryId obrigatório' });

  let storage_path = null;
  try {
    // 1) comprime (1080px, q72, corrige orientação EXIF e remove metadata)
    const buffer = await sharp(join(PHOTOS_DIR, f))
      .rotate()
      .resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer();

    // 2) ordem dentro da memória
    const { count } = await supabase
      .from('memory_photos')
      .select('*', { count: 'exact', head: true })
      .eq('memory_id', memoryId);

    // 3) upload
    storage_path = `${memoryId}/${randomUUID()}.jpg`;
    const up = await supabase.storage
      .from(BUCKET)
      .upload(storage_path, buffer, { contentType: 'image/jpeg', upsert: false });
    if (up.error) throw up.error;

    // 4) insere row (rollback do arquivo se falhar)
    const { data: row, error: insErr } = await supabase
      .from('memory_photos')
      .insert({ memory_id: memoryId, storage_path, sort_order: count ?? 0 })
      .select('id')
      .single();
    if (insErr) {
      await supabase.storage.from(BUCKET).remove([storage_path]);
      throw insErr;
    }

    progress[f] = { status: 'done', photoId: row.id, storage_path, memoryId, kb: Math.round(buffer.length / 1024) };
    saveProgress(progress);
    res.json({ ok: true, kb: progress[f].kb, ...queueState() });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.post('/api/skip', (req, res) => {
  const f = safeFile(req.body.file);
  if (!f) return res.status(400).json({ error: 'arquivo inválido' });
  progress[f] = { status: 'skipped' };
  saveProgress(progress);
  res.json({ ok: true, ...queueState() });
});

app.post('/api/undo', async (req, res) => {
  const f = safeFile(req.body.file);
  if (!f) return res.status(400).json({ error: 'arquivo inválido' });
  const entry = progress[f];
  if (!entry) return res.json({ ok: true, ...queueState() });

  try {
    if (entry.status === 'done') {
      if (entry.storage_path) await supabase.storage.from(BUCKET).remove([entry.storage_path]);
      if (entry.photoId) await supabase.from('memory_photos').delete().eq('id', entry.photoId);
    }
    delete progress[f];
    saveProgress(progress);
    res.json({ ok: true, ...queueState() });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Tagger rodando em http://localhost:${PORT}`);
  console.log(counts());
});
