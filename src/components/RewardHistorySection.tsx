import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import RewardHistoryItem from './RewardHistoryItem';

interface RewardHistory {
  id: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  time: string;
  isGranted?: boolean;
}

interface RewardHistorySectionProps {
  title: string;
  rewards: RewardHistory[];
}

export default function RewardHistorySection({ title, rewards }: RewardHistorySectionProps) {
  return (
    <View className="mt-6">
      <Text className="px-2 pb-2 pt-4 text-base font-bold text-text-light">
        {title}
      </Text>
      <View className="space-y-3 gap-4">
        {rewards.map((reward) => (
          <RewardHistoryItem
            key={reward.id}
            icon={reward.icon}
            title={reward.title}
            time={reward.time}
            isGranted={reward.isGranted}
          />
        ))}
      </View>
    </View>
  );
}