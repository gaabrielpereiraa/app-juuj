// Recebe { id, hq? } de uma peça já inserida com status 'processing' e foto em raw_path.
// Em paralelo: Gemini gera a imagem de catálogo e Claude Haiku reconhece a peça.
// hq = true → só refaz a imagem com o modelo Pro (botão "refazer em alta qualidade").
import Anthropic from 'npm:@anthropic-ai/sdk';
import { encodeBase64 } from 'jsr:@std/encoding@1/base64';
import { generateImage, IMAGE_MODEL, IMAGE_MODEL_HQ } from '../_shared/gemini.ts';
import { CATEGORIES, cors, db, json } from '../_shared/supabase.ts';

const TAG_MODEL = 'claude-haiku-5-5';
const DAILY_LIMIT = 60; // ponytail: trava de custo simples, já que a anon key vai no APK

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

// a foto pode ter a pessoa vestindo várias peças: o Claude escolhe uma e o Gemini isola só ela
const imagePrompt = (garment: string) => `Product photo for an online clothing catalog.
The photo may show several clothes. Extract ONLY this garment: "${garment}". Ignore and remove every other
piece of clothing, shoes and accessories. Show it alone, front-facing, flat and wrinkle-free, centered,
fully visible, on a pure white (#FFFFFF) background with a soft natural shadow. No person, no hanger, no props.
Preserve the garment EXACTLY: same colors, print, texture, buttons, straps, length and details. Do not redesign it.`;

const TAG_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['category', 'name', 'colors', 'pattern', 'material', 'formality', 'seasons', 'occasions', 'description'],
  properties: {
    category: { type: 'string', enum: CATEGORIES },
    name: { type: 'string', description: 'Nome curto em PT-BR, ex: "Regata canelada branca"' },
    colors: { type: 'array', items: { type: 'string' } },
    pattern: { type: 'string', description: 'liso, listrado, floral miúdo...' },
    material: { type: 'string' },
    formality: { type: 'integer', description: '1 = ficar em casa ... 5 = gala' },
    seasons: { type: 'array', items: { type: 'string' } },
    occasions: { type: 'array', items: { type: 'string' } },
    description: { type: 'string', description: 'Uma frase rica: modelagem, comprimento, decote, detalhes' },
  },
};

async function tagGarment(photo: string, pick?: string) {
  const focus = pick
    ? `A peça certa é da categoria "${pick}": descreva só ela e ignore as outras roupas.`
    : 'Se a pessoa estiver vestindo várias peças, escolha a que a foto destaca (a mais centralizada/enquadrada; ex: foto das pernas = a calça) e descreva só ela.';
  const res = await anthropic.messages.create({
    model: TAG_MODEL,
    max_tokens: 2000,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: TAG_SCHEMA } },
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: photo } },
        { type: 'text', text: `Identifique a peça de roupa principal desta foto para um guarda-roupa virtual. ${focus} Responda em português do Brasil.` },
      ],
    }],
  });
  if (res.stop_reason === 'refusal') throw new Error('Claude recusou a classificação');
  const text = res.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') throw new Error('Claude não retornou JSON');
  const tags = JSON.parse(text.text);
  tags.formality = Math.min(5, Math.max(1, tags.formality));
  if (pick) tags.category = pick;
  return tags;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  // pick = categoria escolhida no "pegou a peça errada?": refaz tags e imagem focando nela
  const { id, hq = false, pick } = await req.json();
  if (typeof id !== 'string') return json({ error: 'id obrigatório' }, 400);
  if (pick !== undefined && !CATEGORIES.includes(pick)) return json({ error: 'categoria inválida' }, 400);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await db.from('wardrobe_items').select('id', { count: 'exact', head: true }).gte('created_at', since);
  if ((count ?? 0) > DAILY_LIMIT) return json({ error: 'Limite diário atingido' }, 429);

  const { data: item, error } = await db.from('wardrobe_items').select('raw_path, category, name').eq('id', id).single();
  if (error || !item) return json({ error: 'Peça não encontrada' }, 404);

  try {
    const { data: file, error: dlError } = await db.storage.from('wardrobe').download(item.raw_path);
    if (dlError) throw dlError;
    const photo = encodeBase64(new Uint8Array(await file.arrayBuffer()));

    // ponytail: sequencial (tags antes da imagem) custa uns segundos, mas o app já espera via polling
    const tags = hq && item.category && !pick ? null : await tagGarment(photo, pick); // refazer só a imagem se já tem tags
    const garment = tags ? `${tags.name} — ${tags.description}` : item.name ?? item.category;
    const image = await generateImage([{ mimeType: 'image/jpeg', data: photo }], imagePrompt(garment), hq ? IMAGE_MODEL_HQ : IMAGE_MODEL);

    // timestamp no nome: o "refazer" gera URL nova e fura o cache de imagem do app
    const imagePath = `clean/${id}-${Date.now()}.png`;
    const { error: upError } = await db.storage.from('wardrobe').upload(imagePath, image, { contentType: 'image/png' });
    if (upError) throw upError;

    const update = { ...(tags ?? {}), image_path: imagePath, status: 'ready', error: null };
    const { data: updated, error: updError } = await db.from('wardrobe_items').update(update).eq('id', id).select().single();
    if (updError) throw updError;
    return json(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // a foto original continua salva; o app oferece "tentar de novo" ou "usar foto original"
    await db.from('wardrobe_items').update({ status: 'error', error: message }).eq('id', id);
    return json({ error: message }, 500);
  }
});
