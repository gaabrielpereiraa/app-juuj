import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useAddWardrobeItems } from '../../hooks/wardrobe';
import DraggableModal from '../DraggableModal';

interface AddItemSheetProps {
  visible: boolean;
  onClose: () => void;
}

function Option({ icon, title, subtitle, onPress }: {
  icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-row items-center gap-4 rounded-2xl bg-card-light p-4 shadow-soft"
    >
      <View className="h-14 w-14 items-center justify-center rounded-full bg-[#ffdbc9]">
        <Ionicons name={icon} size={26} color="#f47b25" />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-text-light">{title}</Text>
        <Text className="text-sm text-text-secondary">{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AddItemSheet({ visible, onClose }: AddItemSheetProps) {
  const addItems = useAddWardrobeItems();

  const upload = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    onClose();
    addItems.mutate(result.assets.map((a) => a.uri), {
      onError: () => Alert.alert('Ops', 'Não consegui enviar a foto. Confere a internet e tenta de novo.'),
    });
  };

  const fromCamera = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return Alert.alert('Câmera bloqueada', 'Libera a câmera nas configurações do celular.');
    upload(await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 }));
  };

  const fromGallery = async () => {
    upload(await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 20,
      quality: 0.9,
    }));
  };

  return (
    <DraggableModal visible={visible} onClose={onClose}>
      <View className="gap-3 px-6 pb-4">
        <Text className="mb-1 text-center text-lg font-bold text-text-light">Nova peça</Text>
        <Option icon="camera" title="Tirar foto" subtitle="Pode ser na cama, no cabide, do jeito que der" onPress={fromCamera} />
        <Option icon="images" title="Escolher da galeria" subtitle="Dá pra escolher várias de uma vez" onPress={fromGallery} />
      </View>
    </DraggableModal>
  );
}
