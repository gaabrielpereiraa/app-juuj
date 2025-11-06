import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

interface HistoryItemProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  quantity: number;
  points: number;
  time: string;
}

export default function HistoryItem({ icon, title, quantity, points, time }: HistoryItemProps) {
  return (
    <View className="flex flex-col px-4 py-3">
      <View className="flex flex-row items-center gap-4 min-h-14 justify-between">
        <View className="flex flex-row items-center gap-4 flex-1">
          <View className="flex items-center justify-center rounded-lg bg-card-light/80 size-10">
            <MaterialCommunityIcons name={icon} size={24} color="#5d4037" />
          </View>
          <Text className="text-text-light text-base font-normal flex-1">
            {title} (x{quantity})
          </Text>
        </View>
        <View className="shrink-0">
          <Text className="text-green-500 text-base font-bold">
            +{points} pontos
          </Text>
        </View>
      </View>
      <Text className="text-text-secondary text-sm font-normal self-end">
        {time}
      </Text>
    </View>
  );
}