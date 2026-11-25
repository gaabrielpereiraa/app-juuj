import { decodeBase64 } from 'jsr:@std/encoding@1/base64';

// Com GOOGLE_CLOUD_PROJECT → Agent Platform/Vertex (paga com créditos do Google Cloud); sem ele → AI Studio (pré-pago).
// Mesmo corpo de request/response nos dois.
const GCP_PROJECT = Deno.env.get('GOOGLE_CLOUD_PROJECT');
const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY')!;
const geminiUrl = (model: string) =>
  GCP_PROJECT
    ? `https://aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}/locations/global/publishers/google/models/${model}:generateContent?key=${GEMINI_KEY}`
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;

// gemini-2.5-flash-image é desativado em 15/03/2027; o 3.1 aceita até 14 imagens de referência
export const IMAGE_MODEL = 'gemini-3.1-flash-image-preview';
export const IMAGE_MODEL_HQ = 'gemini-3-pro-image-preview';

export type InlineImage = { mimeType: string; data: string }; // data em base64

/** Manda as imagens (na ordem) + o prompt e devolve a imagem gerada. */
export async function generateImage(images: InlineImage[], prompt: string, model = IMAGE_MODEL): Promise<Uint8Array> {
  let res = await callGemini(model, images, prompt);
  // Vertex só libera os "-preview" para projetos na allowlist (404); o ID GA sem sufixo costuma estar aberto
  if (res.status === 404 && model.endsWith('-preview')) res = await callGemini(model.replace(/-preview$/, ''), images, prompt);
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  const part = body.candidates?.[0]?.content?.parts?.find((p: { inlineData?: { data?: string } }) => p.inlineData?.data);
  if (!part) throw new Error('Gemini não retornou imagem');
  return decodeBase64(part.inlineData.data);
}

function callGemini(model: string, images: InlineImage[], prompt: string) {
  return fetch(geminiUrl(model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [...images.map((inlineData) => ({ inlineData })), { text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });
}
