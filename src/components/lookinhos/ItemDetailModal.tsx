import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
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

interface ItemDetailModalProps {
  item: WardrobeItem | null;
  onClose: () => void;
}

export default function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
  const update = useUpdateWardrobeItem();
  const reprocess = useReprocessWardrobeItem();
  const remove = useDeleteWardrobeItem();
  const [showOriginal, setShowOriginal] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    setShowOriginal(false);
    setName(item?.name ?? '');
  }, [item?.id, item?.name]);

  if (!item) return <DraggableModal visible={false} onClose={onClose}>{null}</DraggableModal>;

  const processing = item.status === 'processing';
  const hasGenerated = !!item.image_path && item.image_path !== item.raw_path;
  const shownPath = showOriginal || !item.image_path ? item.raw_path : item.image_path;
  const details = [item.colors?.join(', '), item.material, item.pattern].filter(Boolean).join(' · ');

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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
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

        {!!details && <Text className="text-sm text-text-secondary">{details}</Text>}
        {!!item.description && <Text className="text-base leading-6 text-text-light/80">{item.description}</Text>}
        {item.status === 'error' && (
          <Text className="text-sm text-red-500">A IA não conseguiu arrumar essa foto. Tenta de novo ou usa a original.</Text>
        )}

        <View className="flex-row gap-3">
          <TouchableOpacity
            disabled={processing}
            onPress={() => retry(item.status !== 'error')}
            className="flex-1 items-center rounded-2xl bg-button-light py-3 shadow-soft"
            style={{ opacity: processing ? 0.5 : 1 }}
          >
            <Text className="font-bold text-text-light">
              {item.status === 'error' ? 'Tentar de novo' : '✨ Refazer caprichado'}
            </Text>
          </TouchableOpacity>
          {item.image_path !== item.raw_path && (
            <TouchableOpacity
              disabled={processing}
              onPress={() => update.mutate({ id: item.id, image_path: item.raw_path, status: 'ready', error: null })}
              className="flex-1 items-center rounded-2xl bg-card-light py-3 shadow-soft"
              style={{ opacity: processing ? 0.5 : 1 }}
            >
              <Text className="font-bold text-text-light">Usar a original</Text>
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
