import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GameHeader from '../../components/games/GameHeader';
import ItemDetailModal from '../../components/lookinhos/ItemDetailModal';
import TryOnView from '../../components/lookinhos/TryOnView';
import { useDeleteLook, useSavedLooks, useUpdateLook, useWardrobeItems } from '../../hooks/wardrobe';
import { SavedLook, WardrobeItem } from '../../lib/supabase';

function SavedLookCard({ look, itemsById, onPressItem }: {
  look: SavedLook; itemsById: Map<string, WardrobeItem>; onPressItem: (i: WardrobeItem) => void;
}) {
  const deleteLook = useDeleteLook();
  const updateLook = useUpdateLook();
  // peças apagadas do armário somem do look
  const items = look.item_ids.map((id) => itemsById.get(id)).filter((x): x is WardrobeItem => !!x);
  const date = new Date(look.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });

  const confirmRemove = () =>
    Alert.alert('Tirar dos salvos?', look.title, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Tirar', style: 'destructive', onPress: () => deleteLook.mutate(look.id) },
    ]);

  return (
    <View className="gap-2 rounded-2xl bg-card-light p-4 shadow-soft">
      {!!look.occasion && (
        <Text className="text-xs font-bold uppercase tracking-widest text-text-secondary" numberOfLines={2}>
          {look.occasion}
        </Text>
      )}
      <View className="flex-row items-start gap-2">
        <Text className="flex-1 text-xl font-bold text-text-light">{look.title}</Text>
        <TouchableOpacity onPress={confirmRemove} hitSlop={10} accessibilityLabel="Tirar dos looks salvos">
          <Ionicons name="heart" size={26} color="#f47b25" />
        </TouchableOpacity>
      </View>

      {items.length > 0 ? (
        <TryOnView
          items={items}
          onPressItem={onPressItem}
          tryonPath={look.tryon_path}
          onGenerated={(path) => updateLook.mutate({ id: look.id, tryon_path: path })}
        />
      ) : (
        <Text className="py-4 text-center text-sm text-text-secondary">As peças desse look saíram do armário 👋</Text>
      )}

      {!!look.why && <Text className="text-base leading-6 text-text-light/80">{look.why}</Text>}
      <Text className="text-xs text-text-secondary">salvo em {date}</Text>
    </View>
  );
}

export default function SalvosScreen() {
  const { data: looks = [], isLoading } = useSavedLooks();
  const { data: items = [] } = useWardrobeItems();
  const [selected, setSelected] = useState<WardrobeItem | null>(null);
  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      <GameHeader title="Looks salvos" />
      <FlatList
        data={looks}
        keyExtractor={(l) => l.id}
        contentContainerClassName="gap-4 px-4 pb-10"
        renderItem={({ item }) => <SavedLookCard look={item} itemsById={itemsById} onPressItem={setSelected} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator className="mt-16" size="large" color="#f47b25" />
          ) : (
            <View className="mt-16 items-center gap-3 px-8">
              <Ionicons name="heart-outline" size={56} color="#FFAC81" />
              <Text className="text-center text-base text-text-secondary">
                Nenhum look salvo ainda.{'\n'}Toca no ♡ dos looks da estilista pra guardar aqui
              </Text>
            </View>
          )
        }
      />
      <ItemDetailModal key={selected?.id} item={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}
