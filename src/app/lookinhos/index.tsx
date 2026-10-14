import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GameHeader from '../../components/games/GameHeader';
import AddItemSheet from '../../components/lookinhos/AddItemSheet';
import ItemDetailModal from '../../components/lookinhos/ItemDetailModal';
import ItemTile from '../../components/lookinhos/ItemTile';
import { useWardrobeItems } from '../../hooks/wardrobe';
import { CATEGORY_LABEL } from '../../lib/lookinhos';
import { WARDROBE_CATEGORIES, WardrobeCategory } from '../../lib/supabase';

export default function LookinhosScreen() {
  const router = useRouter();
  const { data: items = [], isLoading } = useWardrobeItems();
  const [category, setCategory] = useState<WardrobeCategory | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // só mostra chips de categorias que têm peça, na ordem fixa
  const counts = useMemo(() => {
    const c = new Map<WardrobeCategory, number>();
    for (const i of items) if (i.category) c.set(i.category, (c.get(i.category) ?? 0) + 1);
    return WARDROBE_CATEGORIES.filter((cat) => c.has(cat)).map((cat) => ({ cat, n: c.get(cat)! }));
  }, [items]);

  // peças ainda sem categoria (processando) aparecem em "Tudo"
  const visible = category ? items.filter((i) => i.category === category) : items;
  const selected = items.find((i) => i.id === selectedId) ?? null;

  const header = (
    <View className="gap-4 pb-2">
      <TouchableOpacity
        onPress={() => router.push('/lookinhos/estilista')}
        activeOpacity={0.8}
        className="flex-row items-center gap-4 rounded-2xl bg-card-light p-4 shadow-soft"
      >
        <View className="h-14 w-14 items-center justify-center rounded-full bg-[#ffdbc9]">
          <Ionicons name="sparkles" size={26} color="#f47b25" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-text-light">O que eu visto hoje?</Text>
          <Text className="text-sm text-text-secondary">Pergunta pra sua estilista</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#9E6B47" />
      </TouchableOpacity>

      {counts.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="grow-0" contentContainerClassName="items-center gap-2">
          {[{ cat: null, n: items.length }, ...counts].map(({ cat, n }) => {
            const active = category === cat;
            return (
              <TouchableOpacity
                key={cat ?? 'all'}
                onPress={() => setCategory(cat)}
                className={`rounded-full px-4 py-2 ${active ? 'bg-primary' : 'bg-card-light'}`}
              >
                <Text className={`text-sm font-bold ${active ? 'text-white' : 'text-text-secondary'}`}>
                  {cat ? CATEGORY_LABEL[cat] : 'Tudo'} {n}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  const empty = isLoading ? (
    <ActivityIndicator className="mt-16" size="large" color="#f47b25" />
  ) : (
    <View className="mt-16 items-center gap-3 px-8">
      <Ionicons name="shirt-outline" size={56} color="#FFAC81" />
      <Text className="text-center text-base text-text-secondary">
        Seu armário tá vazio 👀{'\n'}Tira foto das suas roupas que a mágica acontece
      </Text>
      <TouchableOpacity onPress={() => setAdding(true)} className="mt-2 rounded-2xl bg-primary px-6 py-3 shadow-md">
        <Text className="font-bold text-white">Adicionar peça</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      <GameHeader title="Lookinhos" />

      <FlatList
        data={visible}
        keyExtractor={(i) => i.id}
        numColumns={2}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerClassName="px-4 pb-28"
        columnWrapperClassName="gap-3"
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => (
          <View className="flex-1" style={{ maxWidth: '50%' }}>
            <ItemTile
              item={item}
              onPress={() => setSelectedId(item.id)}
            />
          </View>
        )}
      />

      {items.length > 0 && (
        <TouchableOpacity
          onPress={() => setAdding(true)}
          activeOpacity={0.85}
          className="absolute bottom-8 right-6 h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg"
          accessibilityLabel="Adicionar peça"
        >
          <Ionicons name="add" size={34} color="#fff" />
        </TouchableOpacity>
      )}

      <AddItemSheet visible={adding} onClose={() => setAdding(false)} />
      <ItemDetailModal key={selected?.id} item={selected} onClose={() => setSelectedId(null)} />
    </SafeAreaView>
  );
}
