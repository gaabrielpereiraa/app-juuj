import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import HistoryItem from './HistoryItem';

export interface HistoryActivity {
  id: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  quantity: number;
  points: number;
  time: string;
}

interface HistorySectionProps {
  title: string;
  activities: HistoryActivity[];
}

export default function HistorySection({ title, activities }: HistorySectionProps) {
  return (
    <View>
      <Text className="text-text-light text-lg font-bold leading-tight pb-3 pt-4">
        {title}
      </Text>
      <View className="bg-card-light/70 rounded-xl shadow-sm">
        {activities.map((activity, index) => (
          <View key={activity.id}>
            <HistoryItem
              icon={activity.icon}
              title={activity.title}
              quantity={activity.quantity}
              points={activity.points}
              time={activity.time}
            />
            {index < activities.length - 1 && (
              <View className="mx-4 border-b border-text-light/10" />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}