// Estilista: recebe { messages: [{ role, content }] } e devolve TEXTO em streaming,
// no formato que src/lib/lookinhos.ts (parseStylist) entende.
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

FORMATO DA RESPOSTA (texto puro):
- Comece com 1 ou 2 frases curtas sobre a ocasião.
- Para cada look, exatamente estas 3 partes, cada uma em sua própria linha:
## Nome curto do look
[[id1, id2, id3]]
Uma ou duas frases dizendo por que o look funciona.
- Termine logo após a explicação do último look.
- Ids aparecem SOMENTE dentro de [[ ]]. No texto, chame as peças pelo nome.
- Não use listas, negrito ou outro markdown. No máximo um emoji na resposta toda.
- Se ela só estiver conversando (sem pedir look), responda só com texto, sem looks.`;

const TEXT_HEADERS = { ...cors, 'Content-Type': 'text/plain; charset=utf-8' };

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
    .select('id, category, name, colors, material, pattern, formality, description')
    .eq('status', 'ready')
    .order('id');
  if (error) return json({ error: error.message }, 500);
  if (!items.length) {
    return new Response('Seu armário ainda está vazio! Cadastra umas pecinhas que eu monto os looks 💛', { headers: TEXT_HEADERS });
  }

  const catalog = items
    .map((i) => [i.id, i.category, i.name, (i.colors ?? []).join('/'), i.material, i.pattern, i.formality, i.description].join(' | '))
    .join('\n');

  const stream = anthropic.beta.messages.stream({
    model: MODEL,
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    system: [
      { type: 'text', text: PERSONA },
      { type: 'text', text: `CATÁLOGO (id | categoria | nome | cores | material | estampa | formalidade | descrição):\n${catalog}`, cache_control: { type: 'ephemeral' } },
    ],
    messages,
  });

  // repassa só o texto, pedaço a pedaço; o app desenha conforme chega.
  // ids inexistentes são descartados no app (ele tem o catálogo).
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        if ((await stream.finalMessage()).stop_reason === 'refusal') {
          controller.enqueue(encoder.encode('\nHmm, não consegui ajudar com esse pedido. Tenta de outro jeito?'));
        }
      } catch (e) {
        console.error(e);
        controller.enqueue(encoder.encode('\nOps, deu um erro aqui. Tenta de novo?'));
      }
      controller.close();
    },
  });
  return new Response(body, { headers: TEXT_HEADERS });
});
