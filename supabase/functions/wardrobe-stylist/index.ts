// Chat estilista: recebe { messages: [{ role, content }] } e devolve { message, looks }.
// O catálogo inteiro vai no system prompt (cabe folgado até ~1500 peças; com prompt caching).
// ponytail: sem pgvector; trocar por busca vetorial só se o catálogo passar de ~1500 peças.
import Anthropic from 'npm:@anthropic-ai/sdk';
import { cors, db, json } from '../_shared/supabase.ts';

const MODEL = 'claude-sonnet-5-5';
const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

const PERSONA = `Você é a estilista pessoal da Juju. Monte looks usando SOMENTE as peças do catálogo (cite pelo id exato).
Cada look precisa ter peça de cima + peça de baixo (ou vestido/macacão) + calçado; bolsa e acessórios são opcionais.
Leve em conta a ocasião, a formalidade (1 = casa, 5 = gala) e o clima, se ela informar.
Se faltar peça para a ocasião, diga com carinho o que falta, sem inventar peças.
Tom leve, carinhoso e direto, em português do Brasil. Sugira de 1 a 3 looks.
Se ela só estiver conversando (sem pedir look), responda com looks vazio.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['message', 'looks'],
  properties: {
    message: { type: 'string' },
    looks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'item_ids', 'why'],
        properties: {
          title: { type: 'string' },
          item_ids: { type: 'array', items: { type: 'string' } },
          why: { type: 'string' },
        },
      },
    },
  },
};

type ChatMessage = { role: 'user' | 'assistant'; content: string };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const { messages } = await req.json();
  const valid = Array.isArray(messages) && messages.length > 0 && messages.length <= 40 &&
    messages.every((m: ChatMessage) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.length <= 4000) &&
    messages[0].role === 'user';
  if (!valid) return json({ error: 'messages inválido' }, 400);

  // ordenado por id → mesmo texto entre chamadas → cache do prompt funciona
  const { data: items, error } = await db.from('wardrobe_items')
    .select('id, category, name, colors, formality, description')
    .eq('status', 'ready')
    .order('id');
  if (error) return json({ error: error.message }, 500);
  if (!items.length) return json({ message: 'Seu armário ainda está vazio! Cadastra umas pecinhas que eu monto os looks 💛', looks: [] });

  const catalog = items
    .map((i) => [i.id, i.category, i.name, (i.colors ?? []).join('/'), i.formality, i.description].join(' | '))
    .join('\n');

  try {
    const res = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: RESPONSE_SCHEMA } },
      system: [
        { type: 'text', text: PERSONA },
        { type: 'text', text: `CATÁLOGO (id | categoria | nome | cores | formalidade | descrição):\n${catalog}`, cache_control: { type: 'ephemeral' } },
      ],
      messages,
    });

    if (res.stop_reason === 'refusal') return json({ message: 'Hmm, não consegui ajudar com esse pedido. Tenta de outro jeito?', looks: [] });
    const text = res.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') throw new Error('Resposta sem texto');

    const out = JSON.parse(text.text) as { message: string; looks: { title: string; item_ids: string[]; why: string }[] };
    // anti-alucinação: descarta ids que não existem e looks que ficaram vazios
    const ids = new Set(items.map((i) => i.id));
    out.looks = out.looks
      .map((l) => ({ ...l, item_ids: l.item_ids.filter((id) => ids.has(id)) }))
      .filter((l) => l.item_ids.length > 0);
    return json(out);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
