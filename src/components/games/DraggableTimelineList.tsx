import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { photoUrl } from '../../hooks/memories';
import { PlayableMemory } from '../../lib/gameLogic';
import PhotoPreviewModal from '../PhotoPreviewModal';

const ROW_HEIGHT = 84; // card 72 + gap 12

type Positions = Record<string, number>;

function clampWorklet(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

// Troca a posição de `id` com quem ocupa `newIndex`. Retorna objeto NOVO —
// substituir (não mutar) é o que dispara o useAnimatedReaction das outras rows.
function swapPositions(positions: Positions, id: string, newIndex: number): Positions {
  'worklet';
  const next: Positions = { ...positions };
  const oldIndex = positions[id];
  for (const key in positions) {
    if (key !== id && positions[key] === newIndex) {
      next[key] = oldIndex;
      break;
    }
  }
  next[id] = newIndex;
  return next;
}

function hapticSwap() {
  Haptics.selectionAsync();
}

interface DraggableRowProps {
  item: PlayableMemory;
  positions: SharedValue<Positions>;
  count: number;
  onDrop: () => void;
}

function DraggableRow({ item, positions, count, onDrop }: DraggableRowProps) {
  const [previewing, setPreviewing] = useState(false);
  const top = useSharedValue(positions.value[item.id] * ROW_HEIGHT);
  const startY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // rows não arrastadas seguem a troca de posições com spring
  useAnimatedReaction(
    () => positions.value[item.id],
    (index, prevIndex) => {
      if (prevIndex !== null && index !== prevIndex && !isDragging.value) {
        top.value = withSpring(index * ROW_HEIGHT, { damping: 20 });
      }
    }
  );

  const pan = Gesture.Pan()
    .activateAfterLongPress(120)
    .onStart(() => {
      isDragging.value = true;
      startY.value = top.value;
    })
    .onUpdate((e) => {
      top.value = startY.value + e.translationY;
      const newIndex = clampWorklet(Math.round(top.value / ROW_HEIGHT), 0, count - 1);
      if (newIndex !== positions.value[item.id]) {
        positions.value = swapPositions(positions.value, item.id, newIndex);
        runOnJS(hapticSwap)();
      }
    })
    .onEnd(() => {
      top.value = withSpring(positions.value[item.id] * ROW_HEIGHT, { damping: 20 });
    })
    .onFinalize(() => {
      isDragging.value = false;
      runOnJS(onDrop)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    top: top.value,
    zIndex: isDragging.value ? 10 : 0,
    transform: [
      { scale: withSpring(isDragging.value ? 1.03 : 1) },
      { rotate: withSpring(isDragging.value ? '1.5deg' : '0deg') },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[{ position: 'absolute', left: 0, right: 0, height: ROW_HEIGHT - 12 }, animatedStyle]}
      >
        <View className="h-full flex-row items-center gap-4 rounded-2xl border border-[#e6dfdb]/60 bg-card-light p-3 shadow-soft">
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={!item.photoPath}
            onPress={() => setPreviewing(true)}
            className="h-12 w-12 overflow-hidden rounded-xl bg-[#ffdbc9]"
          >
            {item.photoPath && (
              <Image
                source={{ uri: photoUrl(item.photoPath) }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                cachePolicy="disk"
                transition={150}
              />
            )}
          </TouchableOpacity>
          <Text className="flex-1 text-base font-bold text-text-light" numberOfLines={2}>
            {item.title}
          </Text>
          <Ionicons name="reorder-three-outline" size={26} color="#9E6B47" />
        </View>

        <PhotoPreviewModal
          uri={previewing && item.photoPath ? photoUrl(item.photoPath) : null}
          onClose={() => setPreviewing(false)}
        />
      </Animated.View>
    </GestureDetector>
  );
}

interface DraggableTimelineListProps {
  items: PlayableMemory[]; // ordem inicial (embaralhada)
  onOrderChange: (orderedIds: string[]) => void;
}

export default function DraggableTimelineList({ items, onOrderChange }: DraggableTimelineListProps) {
  const initialPositions = useMemo(() => {
    const p: Positions = {};
    items.forEach((m, i) => {
      p[m.id] = i;
    });
    return p;
  }, [items]);

  const positions = useSharedValue<Positions>(initialPositions);

  useEffect(() => {
    positions.value = initialPositions;
  }, [initialPositions, positions]);

  const emitOrder = () => {
    const ordered = Object.entries(positions.value)
      .sort((a, b) => a[1] - b[1])
      .map(([id]) => id);
    onOrderChange(ordered);
  };

  return (
    <View style={{ height: items.length * ROW_HEIGHT }}>
      {items.map((item) => (
        <DraggableRow
          key={item.id}
          item={item}
          positions={positions}
          count={items.length}
          onDrop={emitOrder}
        />
      ))}
    </View>
  );
}
