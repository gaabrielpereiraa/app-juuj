import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Modal, TouchableOpacity, View } from 'react-native';

interface PhotoPreviewModalProps {
  uri: string | null;
  onClose: () => void;
}

export default function PhotoPreviewModal({ uri, onClose }: PhotoPreviewModalProps) {
  return (
    <Modal visible={!!uri} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 items-center justify-center bg-black/85 p-6"
      >
        {uri && (
          <Image
            source={{ uri }}
            style={{ width: '100%', aspectRatio: 1 }}
            contentFit="contain"
            cachePolicy="disk"
            transition={150}
          />
        )}

        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.8}
          className="absolute right-6 top-14 h-10 w-10 items-center justify-center rounded-full bg-black/40"
        >
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
