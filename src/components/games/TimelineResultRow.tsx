import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { photoUrl } from '../../hooks/memories';
import { formatDayMonth } from '../../lib/dateUtils';
import { TimelineSlot } from '../../lib/gameLogic';
import PhotoPreviewModal from '../PhotoPreviewModal';

interface TimelineResultRowProps {
  slot: TimelineSlot;
  isLast: boolean;
}

export default function TimelineResultRow({ slot, isLast }: TimelineResultRowProps) {
  const { memory, position, isCorrect } = slot;
  const [previewing, setPreviewing] = useState(false);

  return (
    <View className="flex flex-row items-center gap-3">
      {/* indicador + linha conectora */}
      <View className="items-center self-stretch">
        <View
          className={`z-10 h-8 w-8 items-center justify-center rounded-full border-2 border-background-light ${
            isCorrect ? 'bg-green-500' : 'bg-[#c4b3a3]'
          }`}
        >
          <Ionicons name={isCorrect ? 'checkmark' : 'close'} size={16} color="#ffffff" />
        </View>
        {!isLast && <View className="w-0.5 flex-1 bg-[#e8d9c0]" />}
      </View>

      <View
        className={`mb-3 flex-1 flex-row items-center gap-4 rounded-2xl border p-4 shadow-soft ${
          isCorrect ? 'border-[#e6dfdb] bg-card-light' : 'border-red-400/40 bg-red-400/5'
        }`}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={!memory.photoPath}
          onPress={() => setPreviewing(true)}
          className="h-16 w-16 overflow-hidden rounded-xl bg-[#ffdbc9]"
        >
          {memory.photoPath && (
            <Image
              source={{ uri: photoUrl(memory.photoPath) }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              cachePolicy="disk"
              transition={150}
            />
          )}
        </TouchableOpacity>

        <PhotoPreviewModal
          uri={previewing && memory.photoPath ? photoUrl(memory.photoPath) : null}
          onClose={() => setPreviewing(false)}
        />

        <View className="flex-1">
          <Text className="text-xs font-bold uppercase tracking-widest text-text-secondary">
            Passo {position}
          </Text>
          <Text
            className={`text-base font-bold ${
              isCorrect ? 'text-text-light' : 'text-text-light/70 line-through'
            }`}
          >
            {formatDayMonth(memory.event_date)} · {memory.title}
          </Text>
          {!isCorrect && (
            <View className="mt-1 flex-row items-center gap-1">
              <Ionicons name="information-circle-outline" size={14} color="#ef4444" />
              <Text className="text-xs font-medium text-red-500">Ordem incorreta</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
