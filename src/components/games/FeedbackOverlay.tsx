import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Modal, Text, View } from 'react-native';

interface FeedbackOverlayProps {
  visible: boolean;
  isCorrect: boolean;
  correctLabel: string; // ex: "12/02 · Maraca"
  points: number | null; // null = rodada cosmética (não mostra pontos)
  onDone: () => void;
}

const DISMISS_MS = 1400;

export default function FeedbackOverlay({
  visible,
  isCorrect,
  correctLabel,
  points,
  onDone,
}: FeedbackOverlayProps) {
  useEffect(() => {
    if (!visible) return;
    Haptics.notificationAsync(
      isCorrect
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error
    );
    const timer = setTimeout(onDone, DISMISS_MS);
    return () => clearTimeout(timer);
  }, [visible, isCorrect, onDone]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <BlurView intensity={40} tint="light" className="flex-1 items-center justify-center">
        <View className="items-center rounded-3xl bg-card-light p-8 shadow-2xl">
          <View
            className={`mb-4 h-20 w-20 items-center justify-center rounded-full ${
              isCorrect ? 'bg-green-500/15' : 'bg-red-400/15'
            }`}
          >
            <Ionicons
              name={isCorrect ? 'checkmark-circle' : 'close-circle'}
              size={48}
              color={isCorrect ? '#50B87A' : '#f87171'}
            />
          </View>

          <Text className="text-xl font-bold text-text-light">
            {isCorrect ? 'Isso mesmo!' : 'Quase!'}
          </Text>

          {isCorrect ? (
            points != null && (
              <Text className="mt-2 text-base text-text-secondary">+{points} pontos 💛</Text>
            )
          ) : (
            <Text className="mt-2 text-base text-text-secondary">Era {correctLabel}</Text>
          )}
        </View>
      </BlurView>
    </Modal>
  );
}
