import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

interface TaskCardProps {
  title: string;
  points: string;
  onAdd: () => void;
}

export default function TaskCard({ title, points, onAdd }: TaskCardProps) {
  return (
    <View className="w-full">
      <View className="flex flex-row items-center justify-between rounded-xl shadow-soft bg-card-light p-4">
        <View className="flex flex-col gap-1 flex-1">
          <Text className="text-text-secondary text-sm font-normal">
            {points}
          </Text>
          <Text className="text-text-light text-lg font-bold tracking-tight pr-6">
            {title}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={onAdd}
          className="flex size-12 items-center justify-center rounded-full border-2 border-primary bg-primary/20"
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color="#f47b25" />
        </TouchableOpacity>
      </View>
    </View>
  );
}