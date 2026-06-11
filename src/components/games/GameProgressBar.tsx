import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface GameProgressBarProps {
  current: number; // 1-based
  total: number;
}

export default function GameProgressBar({ current, total }: GameProgressBarProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(total > 0 ? current / total : 0, { duration: 300 });
  }, [current, total, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View>
      <Text className="text-sm text-text-secondary">
        Foto {current} de {total}
      </Text>
      <View className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#ffdbc9]">
        <Animated.View className="h-full rounded-full bg-primary" style={fillStyle} />
      </View>
    </View>
  );
}
