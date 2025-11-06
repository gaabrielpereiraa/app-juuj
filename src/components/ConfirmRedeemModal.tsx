import { Modal, View, Text, TouchableOpacity, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface ConfirmRedeemModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  rewardTitle: string;
  rewardPoints: number;
  rewardImage?: string;
  isRedeeming?: boolean;
}

export default function ConfirmRedeemModal({
  visible,
  onClose,
  onConfirm,
  rewardTitle,
  rewardPoints,
  rewardImage,
  isRedeeming = false,
}: ConfirmRedeemModalProps) {
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
          className="bg-background-light rounded-2xl w-full max-w-sm shadow-2xl"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header com Imagem */}
          {rewardImage && (
            <View className="relative h-40 rounded-t-2xl overflow-hidden">
              <Image
                source={{ uri: rewardImage }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/20" />
              <TouchableOpacity
                onPress={onClose}
                className="absolute top-3 right-3 bg-white/90 rounded-full p-2"
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#5d4037" />
              </TouchableOpacity>
            </View>
          )}

          {/* Conteúdo */}
          <View className="p-6">
            {!rewardImage && (
              <View className="flex flex-row justify-between items-start mb-4">
                <View className="flex-1" />
                <TouchableOpacity
                  onPress={onClose}
                  className="bg-card-light rounded-full p-2"
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color="#5d4037" />
                </TouchableOpacity>
              </View>
            )}

            {/* Ícone Central */}
            <View className="items-center mb-4">
              <View className="bg-primary/10 rounded-full p-4 mb-3">
                <Ionicons name="gift" size={48} color="#f47b25" />
              </View>
              <Text className="text-text-light text-xl font-bold text-center mb-2">
                Confirmar Resgate?
              </Text>
            </View>

            {/* Info da Recompensa */}
            <View className="bg-card-light rounded-xl p-4 mb-6">
              <Text className="text-text-light text-base font-medium text-center mb-2">
                {rewardTitle}
              </Text>
              <View className="flex flex-row items-center justify-center gap-2">
                <Ionicons name="star" size={20} color="#f47b25" />
                <Text className="text-primary text-2xl font-bold">
                  {rewardPoints.toLocaleString('pt-BR')}
                </Text>
                <Text className="text-text-secondary text-base">
                  pontos
                </Text>
              </View>
            </View>

            {/* Botões */}
            <View className="flex flex-col gap-3">
              <TouchableOpacity
                onPress={onConfirm}
                disabled={isRedeeming}
                className={`bg-primary rounded-full py-4 ${
                  isRedeeming ? 'opacity-70' : 'active:scale-95'
                }`}
                activeOpacity={0.8}
              >
                <Text className="text-white text-base font-bold text-center">
                  {isRedeeming ? 'Resgatando...' : 'Confirmar Resgate'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                disabled={isRedeeming}
                className="bg-card-light border-2 border-text-light/20 rounded-full py-4 active:scale-95"
                activeOpacity={0.8}
              >
                <Text className="text-text-light text-base font-bold text-center">
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}