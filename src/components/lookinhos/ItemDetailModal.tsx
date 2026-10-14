import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  useDeleteWardrobeItem,
  useReprocessWardrobeItem,
  useUpdateWardrobeItem,
  wardrobeImageUrl,
} from '../../hooks/wardrobe';
import { CATEGORY_LABEL } from '../../lib/lookinhos';
import { WARDROBE_CATEGORIES, WardrobeItem } from '../../lib/supabase';
import DraggableModal from '../DraggableModal';

const FORMALITY = ['Casa', 'Casual', 'Arrumada', 'Chique', 'Gala'];

/** Linha "rótulo | valor" editável; salva quando ela termina de digitar. */
function Field({ label, value, onSave, multiline }: {
  label: string; value: string; onSave: (v: string) => void; multiline?: boolean;
}) {
  const [text, setText] = useState(value);
  return (
    <View className={multiline ? 'gap-1 py-2' : 'flex-row items-center gap-3 py-2'}>
      <Text className={`text-xs font-bold uppercase tracking-wide text-text-secondary ${multiline ? '' : 'w-20'}`}>{label}</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        onEndEditing={() => text.trim() !== value && onSave(text.trim())}
        multiline={multiline}
        placeholder="—"
        placeholderTextColor="#9E6B47"
        className={`flex-1 text-base text-text-light ${multiline ? 'leading-6' : ''}`}
      />
    </View>
  );
}

interface ItemDetailModalProps {
  item: WardrobeItem | null;
  onClose: () => void;
}

export default function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
  const update = useUpdateWardrobeItem();
  const reprocess = useReprocessWardrobeItem();
  const remove = useDeleteWardrobeItem();
  // estado zera sozinho ao trocar de peça: os pais renderizam com key={item.id}
  const [showOriginal, setShowOriginal] = useState(false);
  const [name, setName] = useState(item?.name ?? '');

  if (!item) return <DraggableModal visible={false} onClose={onClose}>{null}</DraggableModal>;

  const processing = item.status === 'processing';
  const hasGenerated = !!item.image_path && item.image_path !== item.raw_path;
  const shownPath = showOriginal || !item.image_path ? item.raw_path : item.image_path;
  const save = (changes: Partial<WardrobeItem>) => update.mutate({ id: item.id, ...changes });

  const retry = (hq: boolean) => {
    reprocess.mutate({ id: item.id, hq });
    onClose();
  };

  const confirmDelete = () =>
    Alert.alert('Apagar peça?', 'Ela sai do armário e dos looks.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => { remove.mutate(item); onClose(); } },
    ]);

  return (
    <DraggableModal visible onClose={onClose}>
      <ScrollView className="px-6" contentContainerClassName="gap-4 pb-4">
        <View className="aspect-square w-full items-center justify-center rounded-2xl bg-white shadow-soft">
          <Image
            source={{ uri: wardrobeImageUrl(shownPath) }}
            style={{ width: '90%', height: '90%' }}
            contentFit="contain"
            cachePolicy="disk"
            transition={200}
          />
          {processing && <Text className="absolute bottom-3 text-xs font-bold text-text-secondary">arrumando ✨</Text>}
        </View>

        {hasGenerated && (
          <View className="flex-row self-center rounded-full bg-card-light p-1 shadow-soft">
            {['Catálogo', 'Original'].map((label, i) => {
              const active = showOriginal === (i === 1);
              return (
                <TouchableOpacity
                  key={label}
                  onPress={() => setShowOriginal(i === 1)}
                  className={`rounded-full px-4 py-1.5 ${active ? 'bg-primary' : ''}`}
                >
                  <Text className={`text-sm font-bold ${active ? 'text-white' : 'text-text-secondary'}`}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TextInput
          value={name}
          onChangeText={setName}
          onEndEditing={() => name.trim() && name !== item.name && update.mutate({ id: item.id, name: name.trim() })}
          placeholder="Nome da peça"
          placeholderTextColor="#9E6B47"
          className="text-2xl font-bold text-text-light"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="grow-0" contentContainerClassName="items-center gap-2">
          {WARDROBE_CATEGORIES.map((cat) => {
            const active = item.category === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => !active && update.mutate({ id: item.id, category: cat })}
                className={`rounded-full px-3 py-1.5 ${active ? 'bg-primary' : 'bg-card-light'}`}
              >
                <Text className={`text-sm font-bold ${active ? 'text-white' : 'text-text-secondary'}`}>
                  {CATEGORY_LABEL[cat]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* o que a IA entendeu; tudo editável e usado pela estilista */}
        <View className="rounded-2xl bg-card-light px-4 py-2 shadow-soft">
          <Field
            label="Cores"
            value={item.colors?.join(', ') ?? ''}
            onSave={(v) => save({ colors: v.split(',').map((c) => c.trim()).filter(Boolean) })}
          />
          <Field label="Material" value={item.material ?? ''} onSave={(v) => save({ material: v || null })} />
          <Field label="Estampa" value={item.pattern ?? ''} onSave={(v) => save({ pattern: v || null })} />
          <View className="gap-2 py-2">
            <Text className="text-xs font-bold uppercase tracking-wide text-text-secondary">Estilo</Text>
            <View className="flex-row flex-wrap gap-1.5">
              {FORMALITY.map((label, i) => {
                const active = item.formality === i + 1;
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => !active && save({ formality: i + 1 })}
                    className={`items-center justify-center rounded-full px-3 py-1.5 ${active ? 'bg-primary' : 'bg-background-light'}`}
                  >
                    <Text numberOfLines={1} className={`text-center text-xs font-bold ${active ? 'text-white' : 'text-text-secondary'}`}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <Field
            label="Descrição"
            multiline
            value={item.description ?? ''}
            onSave={(v) => save({ description: v || null })}
          />
        </View>
        {item.status === 'error' && (
          <Text className="text-sm text-red-500">A IA não conseguiu arrumar essa foto. Tenta de novo ou usa a original.</Text>
        )}

        <View className="flex-row gap-3">
          <TouchableOpacity
            disabled={processing}
            onPress={() => retry(item.status !== 'error')}
            className="min-h-[52px] flex-1 items-center justify-center rounded-2xl bg-button-light px-3 py-3 shadow-soft"
            style={{ opacity: processing ? 0.5 : 1 }}
          >
            <Text className="text-center font-bold text-text-light">
              {item.status === 'error' ? 'Tentar de novo' : '✨ Refazer caprichado'}
            </Text>
          </TouchableOpacity>
          {item.image_path !== item.raw_path && (
            <TouchableOpacity
              disabled={processing}
              onPress={() => update.mutate({ id: item.id, image_path: item.raw_path, status: 'ready', error: null })}
              className="min-h-[52px] flex-1 items-center justify-center rounded-2xl bg-card-light px-3 py-3 shadow-soft"
              style={{ opacity: processing ? 0.5 : 1 }}
            >
              <Text className="text-center font-bold text-text-light">Usar a original</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={confirmDelete} className="items-center py-2">
          <Text className="text-sm font-bold text-red-500/80">Apagar peça</Text>
        </TouchableOpacity>
      </ScrollView>
    </DraggableModal>
  );
}
