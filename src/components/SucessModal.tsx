import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function SuccessModal({
  visible,
  onClose,
  title = 'Sucesso!',
  message = 'Recompensa resgatada com sucesso! 🎉',
  autoClose = true,
  autoCloseDelay = 2500,
}: SuccessModalProps) {
  useEffect(() => {
    if (visible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [visible, autoClose, autoCloseDelay, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        className="flex-1 bg-black/50 justify-center items-center p-4"
        onPress={onClose}
      >
        <Pressable 
          className="bg-card-light rounded-2xl w-full max-w-sm shadow-2xl p-8"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Animação de Sucesso */}
          <View className="items-center mb-6">
            <View className="bg-green-500/10 rounded-full p-6 mb-4">
              <Ionicons name="checkmark-circle" size={80} color="#22c55e" />
            </View>
            <Text className="text-text-light text-2xl font-bold text-center mb-2">
              {title}
            </Text>
            <Text className="text-text-secondary text-base text-center">
              {message}
            </Text>
          </View>

          {/* Botão de Fechar (opcional) */}
          {!autoClose && (
            <TouchableOpacity
              onPress={onClose}
              className="bg-primary rounded-full py-4 active:scale-95"
              activeOpacity={0.8}
            >
              <Text className="text-white text-base font-bold text-center">
                Fechar
              </Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}