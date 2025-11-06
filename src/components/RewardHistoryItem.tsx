import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

interface RewardHistoryItemProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  time: string;
  isGranted?: boolean;
}

export default function RewardHistoryItem({ icon, title, time, isGranted = false }: RewardHistoryItemProps) {
  return (
    <View className="flex flex-row items-center gap-4 rounded-lg bg-card-light p-4 shadow-md">
      <View className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
        isGranted ? 'bg-green-500/30' : 'bg-primary/20'
      }`}>
        <MaterialCommunityIcons 
          name={icon} 
          size={24} 
          color={isGranted ? '#2e5a30' : '#f47b25'} 
        />
      </View>
      
      <View className="flex flex-1 flex-col justify-center">
        <Text className="text-base font-bold leading-normal text-text-light">
          {title}
        </Text>
        <Text className="text-sm font-medium leading-normal text-text-secondary">
          Resgatado às {time}
        </Text>
      </View>
      
      {isGranted && (
        <View className="flex shrink-0 flex-row items-center gap-1 rounded-full bg-green-500 px-3 py-1.5">
          <Ionicons name="checkmark-circle" size={14} color="#ffffff" />
          <Text className="text-xs font-bold text-white">
            Concedida
          </Text>
        </View>
      )}
    </View>
  );
}