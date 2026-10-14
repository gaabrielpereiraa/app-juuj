import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetch as streamingFetch } from 'expo/fetch';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { supabase, WardrobeItem } from '../lib/supabase';

const WARDROBE_QUERY_KEY = ['wardrobe'];
const BUCKET = 'wardrobe';

export type StylistMessage = { role: 'user' | 'assistant'; content: string };

export function wardrobeImageUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function fetchWardrobe(): Promise<WardrobeItem[]> {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useWardrobeItems() {
  return useQuery({
    queryKey: WARDROBE_QUERY_KEY,
    queryFn: fetchWardrobe,
    // enquanto alguma peça estiver na IA, checa a cada 3s; depois para
    refetchInterval: (query) =>
      query.state.data?.some((i) => i.status === 'processing') ? 3000 : false,
  });
}

// Dispara a IA sem esperar: a peça aparece como 'processing' e o polling acima pega o resultado.
function startProcessing(id: string, hq = false) {
  supabase.functions.invoke('wardrobe-process', { body: { id, hq } }).catch(() => {
    // a própria function marca status 'error' na linha; nada a fazer aqui
  });
}

/** uri = foto vinda do expo-image-picker. Redimensiona, sobe e manda processar. */
async function addWardrobeItem(uri: string): Promise<WardrobeItem> {
  const ref = await ImageManipulator.manipulate(uri).resize({ width: 1024 }).renderAsync();
  const resized = await ref.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });

  const rawPath = `raw/${Date.now()}.jpg`;
  const body = await (await fetch(resized.uri)).arrayBuffer();
  const { error: upError } = await supabase.storage
    .from(BUCKET)
    .upload(rawPath, body, { contentType: 'image/jpeg' });
  if (upError) throw upError;

  const { data, error } = await supabase
    .from('wardrobe_items')
    .insert({ raw_path: rawPath })
    .select()
    .single();
  if (error) throw error;

  startProcessing(data.id);
  return data;
}

/** Várias fotos de uma vez (galeria): sobe uma por uma; cada peça já aparece como 'processing'. */
export function useAddWardrobeItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (uris: string[]) => {
      for (const uri of uris) {
        await addWardrobeItem(uri);
        queryClient.invalidateQueries({ queryKey: WARDROBE_QUERY_KEY });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WARDROBE_QUERY_KEY }),
  });
}

/** Correções manuais na tela de revisão (categoria, nome...) ou "usar foto original". */
async function updateWardrobeItem({ id, ...changes }: Partial<WardrobeItem> & { id: string }) {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as WardrobeItem;
}

export function useUpdateWardrobeItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateWardrobeItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WARDROBE_QUERY_KEY }),
  });
}

/** "Tentar de novo" (hq = false) ou "refazer em alta qualidade" (hq = true, modelo Pro). */
export function useReprocessWardrobeItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, hq }: { id: string; hq: boolean }) => {
      await updateWardrobeItem({ id, status: 'processing', error: null });
      startProcessing(id, hq);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WARDROBE_QUERY_KEY }),
  });
}

export function useDeleteWardrobeItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: WardrobeItem) => {
      const { error } = await supabase.from('wardrobe_items').delete().eq('id', item.id);
      if (error) throw error;
      // image_path pode ser igual ao raw_path ("usar foto original")
      const paths = [...new Set([item.raw_path, item.image_path].filter((p): p is string => !!p))];
      await supabase.storage.from(BUCKET).remove(paths);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WARDROBE_QUERY_KEY }),
  });
}

/**
 * Estilista em streaming: chama onText com o texto acumulado a cada pedaço que chega.
 * O texto segue o formato de parseStylist (src/lib/lookinhos.ts). Respostas anteriores
 * voltam no histórico como o texto bruto, para a IA lembrar quais peças já sugeriu.
 */
export async function streamStylist(
  messages: StylistMessage[],
  onText: (fullText: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
  const res = await streamingFetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/wardrobe-stylist`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${anonKey}`, apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`Estilista indisponível (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onText(full);
  }
  return full;
}
