import { View } from 'react-native';
import { outfitZones } from '../../lib/lookinhos';
import { WardrobeItem } from '../../lib/supabase';
import ItemTile from './ItemTile';

interface LookBoardProps {
  items: WardrobeItem[];
  onPressItem: (item: WardrobeItem) => void;
}

// tamanhos por região: o corpo "lê" de cima para baixo
const SIZE = { head: 56, main: 128, side: 84, feet: 88 };

function Row({ items, size, onPressItem }: { items: WardrobeItem[]; size: number; onPressItem: LookBoardProps['onPressItem'] }) {
  if (!items.length) return null;
  return (
    <View className="flex-row items-end justify-center gap-2">
      {items.map((item) => (
        <ItemTile key={item.id} item={item} size={size} showName={false} onPress={() => onPressItem(item)} />
      ))}
    </View>
  );
}

/** Look montado como no corpo: acessórios → cima (ou vestido) → baixo + bolsa ao lado → calçado. */
export default function LookBoard({ items, onPressItem }: LookBoardProps) {
  const z = outfitZones(items);

  return (
    <View className="items-center gap-2 py-2">
      <Row items={z.head} size={SIZE.head} onPressItem={onPressItem} />
      <Row items={z.full} size={SIZE.main * 1.3} onPressItem={onPressItem} />
      <Row items={z.top} size={SIZE.main} onPressItem={onPressItem} />
      {(z.bottom.length > 0 || z.side.length > 0) && (
        <View className="flex-row items-center justify-center gap-2">
          {z.side.length > 0 && <Row items={z.side} size={SIZE.side} onPressItem={onPressItem} />}
          <Row items={z.bottom} size={SIZE.main} onPressItem={onPressItem} />
          {/* espaço espelhado para a calça ficar no eixo do corpo */}
          {z.side.length > 0 && z.bottom.length > 0 && <View style={{ width: SIZE.side * z.side.length }} />}
        </View>
      )}
      <Row items={z.feet} size={SIZE.feet} onPressItem={onPressItem} />
    </View>
  );
}
