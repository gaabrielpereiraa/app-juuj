import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetch as streamingFetch } from 'expo/fetch';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { SavedLook, supabase, WardrobeCategory, WardrobeItem } from '../lib/supabase';

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
function startProcessing(id: string, hq = false, pick?: WardrobeCategory) {
  supabase.functions.invoke('wardrobe-process', { body: { id, hq, pick } }).catch(() => {
    // a própria function marca status 'error' na linha; nada a fazer aqui
  });
}

/** Redimensiona para 1024px de largura (upload rápido, menos tokens na IA) e devolve o JPEG. */
async function resizeJpeg(uri: string): Promise<ArrayBuffer> {
  const ref = await ImageManipulator.manipulate(uri).resize({ width: 1024 }).renderAsync();
  const resized = await ref.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  return (await fetch(resized.uri)).arrayBuffer();
}

/** uri = foto vinda do expo-image-picker. Redimensiona, sobe e manda processar. */
async function addWardrobeItem(uri: string): Promise<WardrobeItem> {
  const rawPath = `raw/${Date.now()}.jpg`;
  const body = await resizeJpeg(uri);
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

/** "Tentar de novo" (hq = false), "refazer em alta qualidade" (hq = true, modelo Pro)
 *  ou "pegou a peça errada" (pick = categoria certa; refaz tags e imagem focando nela). */
export function useReprocessWardrobeItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, hq, pick }: { id: string; hq: boolean; pick?: WardrobeCategory }) => {
      await updateWardrobeItem({ id, status: 'processing', error: null });
      startProcessing(id, hq, pick);
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

// ---------- Provador ("ver em mim") ----------

const PRIVATE_BUCKET = 'wardrobe-private';
const MY_PHOTO = 'me.jpg';
const MY_PHOTO_QUERY_KEY = ['wardrobe', 'myPhoto'];

/** Foto de corpo inteiro dela usada no provador; null se ainda não cadastrou. */
export function useMyPhoto() {
  return useQuery({
    queryKey: MY_PHOTO_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(PRIVATE_BUCKET).list('', { search: MY_PHOTO });
      if (error) throw error;
      return data.find((f) => f.name === MY_PHOTO)?.updated_at ?? null;
    },
  });
}

export function useUploadMyPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (uri: string) => {
      const { error } = await supabase.storage
        .from(PRIVATE_BUCKET)
        .upload(MY_PHOTO, await resizeJpeg(uri), { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_PHOTO_QUERY_KEY }),
  });
}

/** Gera (ou pega do cache) a imagem dela vestindo as peças. Devolve o path no bucket privado. */
export async function tryOn(itemIds: string[]): Promise<string> {
  const { data, error } = await supabase.functions.invoke('wardrobe-tryon', { body: { item_ids: itemIds } });
  if (error) {
    const body = await error.context?.json?.().catch(() => null);
    throw new Error(body?.error ?? 'Não consegui gerar a prévia');
  }
  return data.path as string;
}

/** URL assinada (1h) para imagens do bucket privado. */
export function usePrivateImageUrl(path: string | null) {
  return useQuery({
    queryKey: ['wardrobe', 'signed', path],
    enabled: !!path,
    staleTime: 1000 * 60 * 50,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(PRIVATE_BUCKET).createSignedUrl(path!, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

// ---------- Looks salvos ----------

const LOOKS_QUERY_KEY = ['wardrobe', 'looks'];

export function useSavedLooks() {
  return useQuery({
    queryKey: LOOKS_QUERY_KEY,
    queryFn: async (): Promise<SavedLook[]> => {
      const { data, error } = await supabase
        .from('wardrobe_looks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSaveLook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (look: Omit<SavedLook, 'id' | 'created_at'>): Promise<SavedLook> => {
      const { data, error } = await supabase.from('wardrobe_looks').insert(look).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LOOKS_QUERY_KEY }),
  });
}

export function useUpdateLook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...changes }: Partial<SavedLook> & { id: string }) => {
      const { error } = await supabase.from('wardrobe_looks').update(changes).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LOOKS_QUERY_KEY }),
  });
}

export function useDeleteLook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wardrobe_looks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LOOKS_QUERY_KEY }),
  });
}
