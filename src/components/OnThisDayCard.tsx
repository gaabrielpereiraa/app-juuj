import { Ionicons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';
import { useOnThisDayMemories, photoUrl } from '../hooks/memories';

export default function OnThisDayCard() {
  const onThisDay = useOnThisDayMemories();
  const memory = onThisDay[0];

  if (!memory) return null;

  const photo = memory.memory_photos?.slice().sort((a, b) => a.sort_order - b.sort_order)[0];
  const yearsAgo = new Date().getFullYear() - Number(memory.event_date.slice(0, 4));

  return (
    <View className="px-4 w-full">
      <View className="flex-row items-center gap-4 rounded-2xl bg-card-light shadow-soft p-4">
        {photo ? (
          <Image
            source={{ uri: photoUrl(photo.storage_path) }}
            className="h-16 w-16 rounded-xl"
          />
        ) : (
          <View className="h-16 w-16 rounded-xl bg-button-light/40 items-center justify-center">
            <Ionicons name="heart" size={24} color="#f47b25" />
          </View>
        )}
        <View className="flex-1">
          <View className="flex-row items-center gap-1">
            <Ionicons name="sparkles" size={14} color="#f47b25" />
            <Text className="text-text-secondary text-xs font-bold uppercase tracking-wide">
              Hoje na nossa história
            </Text>
          </View>
          <Text className="text-text-light font-bold text-base mt-0.5" numberOfLines={1}>
            {memory.title}
          </Text>
          <Text className="text-text-secondary text-sm">
            {yearsAgo > 0 ? `Há ${yearsAgo} ano${yearsAgo > 1 ? 's' : ''} 💛` : 'Foi hoje! 💛'}
          </Text>
        </View>
      </View>
    </View>
  );
}
