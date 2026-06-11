import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

interface GameHeaderProps {
  title: string;
}

export default function GameHeader({ title }: GameHeaderProps) {
  const router = useRouter();

  return (
    <View className="flex flex-row items-center justify-between bg-background-light p-4">
      <TouchableOpacity
        onPress={() => router.back()}
        className="flex size-10 shrink-0 items-center justify-center"
        activeOpacity={0.7}
        aria-label="Voltar"
      >
        <Ionicons name="arrow-back" size={28} color="#5d4037" />
      </TouchableOpacity>

      <Text className="flex-1 text-center text-lg font-bold text-text-light">
        {title}
      </Text>

      <View className="size-10 shrink-0" />
    </View>
  );
}
