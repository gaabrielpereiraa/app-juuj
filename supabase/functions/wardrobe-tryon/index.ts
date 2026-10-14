// Provador: recebe { item_ids } e devolve { path } de uma imagem dela vestindo o look,
// no bucket privado 'wardrobe-private'. Mesmo look + mesma foto = devolve o cache.
import { encodeBase64, encodeHex } from 'jsr:@std/encoding@1';
import { generateImage, InlineImage } from '../_shared/gemini.ts';
import { cors, db, json } from '../_shared/supabase.ts';

const PRIVATE = 'wardrobe-private';
const MY_PHOTO = 'me.jpg';
const DAILY_LIMIT = 20; // ~US$0,07 cada

// de cima para baixo, igual outfitZones em src/lib/lookinhos.ts
const BODY_ORDER = [
  'acessorios', 'casacos', 'vestidos', 'macacoes', 'blusas', 'tube_tops', 'regatas', 'camisetas', 'camisas',
  'calcas', 'shorts', 'saias', 'bolsas', 'calcados',
];

const PROMPT = (names: string[]) => `The FIRST image is a photo of a woman. The other images are clothing items from her closet:
${names.map((n, i) => `${i + 2}. ${n}`).join('\n')}
Create a photo of the SAME woman wearing exactly this outfit, all of these items together, styled naturally.
Keep her face, hair, skin tone, body shape and proportions exactly the same. Full body, standing, front-facing,
simple light neutral background, natural soft light, realistic photo.
Preserve every garment EXACTLY: same colors, prints, textures, lengths and details. Do not add other clothes or accessories.`;

async function download(bucket: string, path: string): Promise<InlineImage> {
  const { data, error } = await db.storage.from(bucket).download(path);
  if (error) throw error;
  return {
    mimeType: path.endsWith('.png') ? 'image/png' : 'image/jpeg',
    data: encodeBase64(new Uint8Array(await data.arrayBuffer())),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const { item_ids } = await req.json();
  if (!Array.isArray(item_ids) || !item_ids.length || item_ids.length > 10 || !item_ids.every((id) => typeof id === 'string')) {
    return json({ error: 'item_ids inválido' }, 400);
  }

  const { data: files } = await db.storage.from(PRIVATE).list('', { search: MY_PHOTO });
  const photo = files?.find((f) => f.name === MY_PHOTO);
  if (!photo) return json({ error: 'sem_foto' }, 409);

  // trocar a foto muda o updated_at → key nova → gera de novo
  const ids = [...new Set(item_ids as string[])].sort();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${ids.join(',')}|${photo.updated_at}`));
  const key = encodeHex(new Uint8Array(digest));

  const { data: cached } = await db.from('wardrobe_tryons').select('path').eq('key', key).maybeSingle();
  if (cached) return json({ path: cached.path });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await db.from('wardrobe_tryons').select('key', { count: 'exact', head: true }).gte('created_at', since);
  if ((count ?? 0) >= DAILY_LIMIT) return json({ error: 'Limite diário do provador atingido' }, 429);

  const { data: items, error } = await db.from('wardrobe_items')
    .select('id, name, category, image_path, raw_path')
    .in('id', ids)
    .eq('status', 'ready');
  if (error) return json({ error: error.message }, 500);
  if (!items.length) return json({ error: 'Nenhuma peça encontrada' }, 404);

  items.sort((a, b) => BODY_ORDER.indexOf(a.category) - BODY_ORDER.indexOf(b.category));

  try {
    const images = await Promise.all([
      download(PRIVATE, MY_PHOTO),
      ...items.map((i) => download('wardrobe', i.image_path ?? i.raw_path)),
    ]);
    const image = await generateImage(images, PROMPT(items.map((i) => i.name ?? i.category ?? 'peça')));

    const path = `tryon/${key}.png`;
    const { error: upError } = await db.storage.from(PRIVATE).upload(path, image, { contentType: 'image/png', upsert: true });
    if (upError) throw upError;
    await db.from('wardrobe_tryons').insert({ key, path });
    return json({ path });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
