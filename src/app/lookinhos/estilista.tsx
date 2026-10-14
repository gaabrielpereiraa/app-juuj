import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import ItemDetailModal from '../../components/lookinhos/ItemDetailModal';
import LookBoard from '../../components/lookinhos/LookBoard';
import TryOnView from '../../components/lookinhos/TryOnView';
import {
  StylistMessage,
  streamStylist,
  useDeleteLook,
  useSaveLook,
  useUpdateLook,
  useWardrobeItems,
} from '../../hooks/wardrobe';
import { parseStylist, StylistBlock } from '../../lib/lookinhos';
import { WardrobeItem } from '../../lib/supabase';

interface Section {
  question: string;
  answer: string;
  done: boolean;
}

const MAX_SECTIONS_IN_CONTEXT = 10; // a function aceita até 40 mensagens

function AskInput({ placeholder, onSubmit, disabled, big }: {
  placeholder: string; onSubmit: (q: string) => void; disabled: boolean; big?: boolean;
}) {
  const [text, setText] = useState('');
  const send = () => {
    const q = text.trim();
    if (!q || disabled) return;
    setText('');
    onSubmit(q);
  };

  return (
    <View className={`flex-row items-end gap-2 rounded-2xl bg-card-light shadow-soft ${big ? 'p-4' : 'px-4 py-3'}`}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="#9E6B47"
        multiline
        onSubmitEditing={send}
        submitBehavior="submit"
        returnKeyType="send"
        className={`flex-1 text-text-light ${big ? 'min-h-[56px] text-lg' : 'text-base'}`}
      />
      <TouchableOpacity
        onPress={send}
        disabled={disabled || !text.trim()}
        className="h-10 w-10 items-center justify-center rounded-full bg-primary"
        style={{ opacity: disabled || !text.trim() ? 0.4 : 1 }}
        accessibilityLabel="Perguntar"
      >
        <Ionicons name="arrow-up" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function LookCard({ block, items, occasion, done, cursor, onPressItem }: {
  block: Extract<StylistBlock, { type: 'look' }>;
  items: WardrobeItem[];
  occasion: string;
  done: boolean;
  cursor: string;
  onPressItem: (i: WardrobeItem) => void;
}) {
  const saveLook = useSaveLook();
  const deleteLook = useDeleteLook();
  const updateLook = useUpdateLook();
  const [savedId, setSavedId] = useState<string | null>(null);
  const [tryonPath, setTryonPath] = useState<string | null>(null);

  const toggleSave = () => {
    if (savedId) {
      deleteLook.mutate(savedId, { onSuccess: () => setSavedId(null) });
    } else {
      saveLook.mutate(
        { title: block.title, item_ids: items.map((i) => i.id), why: block.why || null, occasion, tryon_path: tryonPath },
        { onSuccess: (look) => setSavedId(look.id) },
      );
    }
  };

  const onGenerated = (path: string) => {
    setTryonPath(path);
    if (savedId) updateLook.mutate({ id: savedId, tryon_path: path });
  };

  return (
    <Animated.View entering={FadeInDown.duration(400)} className="gap-2 rounded-2xl bg-card-light p-4 shadow-soft">
      <View className="flex-row items-start gap-2">
        <Text className="flex-1 text-xl font-bold text-text-light">{block.title}</Text>
        {done && items.length > 0 && (
          <TouchableOpacity
            onPress={toggleSave}
            disabled={saveLook.isPending || deleteLook.isPending}
            hitSlop={10}
            accessibilityLabel={savedId ? 'Tirar dos looks salvos' : 'Salvar look'}
          >
            <Ionicons name={savedId ? 'heart' : 'heart-outline'} size={26} color="#f47b25" />
          </TouchableOpacity>
        )}
      </View>
      {items.length > 0 &&
        (done ? (
          <TryOnView items={items} onPressItem={onPressItem} onGenerated={onGenerated} />
        ) : (
          <LookBoard items={items} onPressItem={onPressItem} />
        ))}
      {!!block.why && <Text className="text-base leading-6 text-text-light/80">{block.why}{cursor}</Text>}
    </Animated.View>
  );
}

function Answer({ section, itemsById, onPressItem }: {
  section: Section; itemsById: Map<string, WardrobeItem>; onPressItem: (i: WardrobeItem) => void;
}) {
  const blocks = parseStylist(section.answer);
  const thinking = !section.done && blocks.length === 0;

  return (
    <View className="gap-4">
      <Text className="text-xs font-bold uppercase tracking-widest text-text-secondary">{section.question}</Text>

      {thinking && (
        <Animated.Text entering={FadeIn} className="text-lg italic text-text-secondary">
          pensando no seu look…
        </Animated.Text>
      )}

      {blocks.map((block, i) => {
        const last = i === blocks.length - 1;
        const cursor = !section.done && last ? ' ▍' : '';

        if (block.type === 'text') {
          return (
            <Animated.Text key={i} entering={FadeIn.duration(300)} className="text-lg leading-7 text-text-light">
              {block.text}{cursor}
            </Animated.Text>
          );
        }

        // ids que não existem no armário são descartados (anti-alucinação)
        const items = block.ids.map((id) => itemsById.get(id)).filter((x): x is WardrobeItem => !!x);
        return (
          <LookCard
            key={i}
            block={block}
            items={items}
            occasion={section.question}
            done={section.done}
            cursor={cursor}
            onPressItem={onPressItem}
          />
        );
      })}
    </View>
  );
}

export default function EstilistaScreen() {
  const router = useRouter();
  const { data: items = [] } = useWardrobeItems();
  const [sections, setSections] = useState<Section[]>([]);
  const [selected, setSelected] = useState<WardrobeItem | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const abortRef = useRef<AbortController | null>(null);

  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const streaming = sections.some((s) => !s.done);

  useEffect(() => () => abortRef.current?.abort(), []);

  const ask = async (question: string) => {
    const history: StylistMessage[] = sections.slice(-MAX_SECTIONS_IN_CONTEXT).flatMap((s) => [
      { role: 'user' as const, content: s.question },
      { role: 'assistant' as const, content: s.answer },
    ]);
    const index = sections.length;
    const setAnswer = (answer: string, done: boolean) =>
      setSections((prev) => prev.map((s, i) => (i === index ? { ...s, answer, done } : s)));

    setSections((prev) => [...prev, { question, answer: '', done: false }]);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const full = await streamStylist(
        [...history, { role: 'user', content: question }],
        (text) => !controller.signal.aborted && setAnswer(text, false),
        controller.signal,
      );
      if (!controller.signal.aborted) setAnswer(full, true);
    } catch {
      // cancelado por "nova pergunta" ou ao sair da tela: não mexe na página nova
      if (!controller.signal.aborted) setAnswer('Ops, não consegui falar com a estilista agora. Tenta de novo?', true);
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setSections([]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between p-4">
        <TouchableOpacity onPress={() => router.back()} className="size-10 items-center justify-center" aria-label="Voltar">
          <Ionicons name="arrow-back" size={28} color="#5d4037" />
        </TouchableOpacity>
        {sections.length > 0 && (
          <TouchableOpacity onPress={reset} className="flex-row items-center gap-1" aria-label="Nova pergunta">
            <Ionicons name="refresh" size={18} color="#9E6B47" />
            <Text className="text-sm font-bold text-text-secondary">nova pergunta</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {sections.length === 0 ? (
          <View className="flex-1 justify-center gap-6 px-6 pb-24">
            <Text className="text-center text-3xl font-bold text-text-light">O que eu visto? ✨</Text>
            <AskInput big placeholder="Pra onde você vai? Conta a ocasião, o clima…" onSubmit={ask} disabled={false} />
          </View>
        ) : (
          <>
            <ScrollView
              ref={scrollRef}
              className="flex-1"
              contentContainerClassName="gap-10 px-6 pb-6"
              onContentSizeChange={() => streaming && scrollRef.current?.scrollToEnd({ animated: true })}
              keyboardShouldPersistTaps="handled"
            >
              {sections.map((s, i) => (
                <Answer key={i} section={s} itemsById={itemsById} onPressItem={setSelected} />
              ))}
            </ScrollView>
            <View className="px-4 pb-2 pt-2">
              <AskInput placeholder="Quer ajustar algo? Mais casual, sem salto…" onSubmit={ask} disabled={streaming} />
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      <ItemDetailModal key={selected?.id} item={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}
