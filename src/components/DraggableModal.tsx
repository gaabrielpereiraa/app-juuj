import { ReactNode } from 'react';
import { Dimensions, Modal, Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DraggableModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function DraggableModal({ visible, onClose, children }: DraggableModalProps) {
  const translateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = event.translationY + context.value.y;
      // Só permite arrastar para baixo
      translateY.value = Math.max(translateY.value, 0);
    })
    .onEnd(() => {
      // Se arrastar mais de 100px, fecha o modal
      if (translateY.value > 100) {
        runOnJS(onClose)();
        translateY.value = withSpring(SCREEN_HEIGHT);
      } else {
        // Senão, volta para a posição original
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Reset position quando modal fecha/abre
  if (!visible && translateY.value !== 0) {
    translateY.value = 0;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable 
        className="flex-1 bg-black/50 justify-end"
        onPress={onClose}
      >
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[animatedStyle]}
            className="bg-card-light rounded-t-3xl shadow-2xl pb-6 max-h-[90%]"
            onStartShouldSetResponder={() => true}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              {/* Handle arrastável */}
              <View className="flex h-8 w-full items-center justify-center pt-3 pb-2">
                <View className="h-1.5 w-12 rounded-full bg-text-light/30" />
              </View>

              {children}
            </Pressable>
          </Animated.View>
        </GestureDetector>
      </Pressable>
    </Modal>
  );
}