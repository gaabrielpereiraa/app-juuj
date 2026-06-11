import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

interface GameHubCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  scoredToday?: boolean;
  onPress: () => void;
}

export default function GameHubCard({ title, subtitle, icon, scoredToday, onPress }: GameHubCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex flex-row items-center gap-4 rounded-2xl bg-card-light p-4 shadow-soft active:scale-[0.98]"
    >
      <View className="h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#ffdbc9]">
        <Ionicons name={icon} size={28} color="#f47b25" />
      </View>

      <View className="flex-1">
        <Text className="text-lg font-bold text-text-light">{title}</Text>
        <Text className="text-sm text-text-secondary">{subtitle}</Text>
        {scoredToday && (
          <View className="mt-1 flex-row items-center gap-1 self-start rounded-full bg-green-500/15 px-2 py-0.5">
            <Ionicons name="checkmark-circle" size={14} color="#50B87A" />
            <Text className="text-xs font-bold text-green-500">Pontos de hoje garantidos</Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={22} color="#9E6B47" />
    </TouchableOpacity>
  );
}
