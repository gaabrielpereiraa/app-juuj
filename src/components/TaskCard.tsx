import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

interface TaskCardProps {
  title: string;
  points: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onAdd: () => void;
}

export default function TaskCard({ title, points, icon, onAdd }: TaskCardProps) {
  return (
    <View className="w-full">
      <View className="flex flex-row items-center justify-between rounded-xl shadow-soft bg-card-light p-4">
        {/* Ícone da Tarefa */}
        <View className="flex size-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
          <MaterialCommunityIcons 
            name={icon}
            size={24}
            color="#f47b25"
          />
        </View>

        {/* Textos */}
        <View className="flex flex-col gap-1 flex-1 px-4">
          <Text className="text-text-secondary text-sm font-normal">
            {points}
          </Text>
          <Text className="text-text-light text-lg font-bold tracking-tight">
            {title}
          </Text>
        </View>

        {/* Botão Adicionar */}
        <TouchableOpacity 
          onPress={onAdd}
          className="flex size-12 items-center justify-center rounded-full border-2 border-primary bg-primary/20 shrink-0"
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color="#f47b25" />
        </TouchableOpacity>
      </View>
    </View>
  );
}