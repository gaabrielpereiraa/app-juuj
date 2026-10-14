import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { wardrobeImageUrl } from '../../hooks/wardrobe';
import { WardrobeItem } from '../../lib/supabase';

interface ItemTileProps {
  item: WardrobeItem;
  onPress: () => void;
  /** tamanho do quadrado; sem isso ocupa a largura do pai */
  size?: number;
  showName?: boolean;
}

/** Imagem da peça: a de catálogo quando pronta, senão a foto original. */
export function itemImageUri(item: WardrobeItem) {
  return wardrobeImageUrl(item.image_path ?? item.raw_path);
}

function Pulse() {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.9, { duration: 900 }), -1, true);
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style} className="absolute inset-0 bg-[#ffdbc9]" />;
}

export default function ItemTile({ item, onPress, size, showName = true }: ItemTileProps) {
  const processing = item.status === 'processing';
  const failed = item.status === 'error';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={size ? { width: size } : undefined}>
      <View
        className="aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-white shadow-soft"
        style={size ? { width: size, height: size } : undefined}
      >
        <Image
          source={{ uri: itemImageUri(item) }}
          style={{ width: '88%', height: '88%', opacity: processing || failed ? 0.35 : 1 }}
          contentFit="contain"
          cachePolicy="disk"
          transition={200}
        />
        {processing && (
          <>
            <Pulse />
            <Text className="absolute text-xs font-bold text-text-secondary">arrumando ✨</Text>
          </>
        )}
        {failed && (
          <View className="absolute items-center gap-1">
            <Ionicons name="alert-circle" size={28} color="#f47b25" />
            <Text className="text-xs font-bold text-text-secondary">deu ruim, toca aqui</Text>
          </View>
        )}
      </View>
      {showName && (
        <Text className="mt-1.5 px-1 text-sm text-text-light" numberOfLines={1}>
          {item.name ?? (processing ? ' ' : 'Peça')}
        </Text>
      )}
    </TouchableOpacity>
  );
}
