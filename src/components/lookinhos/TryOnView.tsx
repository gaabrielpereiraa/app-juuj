import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { tryOn, useMyPhoto, usePrivateImageUrl, useUploadMyPhoto } from '../../hooks/wardrobe';
import { WardrobeItem } from '../../lib/supabase';
import DraggableModal from '../DraggableModal';
import PhotoPreviewModal from '../PhotoPreviewModal';
import { SheetOption } from './AddItemSheet';
import LookBoard from './LookBoard';

interface TryOnViewProps {
  items: WardrobeItem[];
  onPressItem: (item: WardrobeItem) => void;
  /** prévia já gerada (look salvo) */
  tryonPath?: string | null;
  /** avisa o pai quando gerar uma prévia nova (para salvar no look) */
  onGenerated?: (path: string) => void;
}

function MyPhotoSheet({ visible, onClose, onPicked }: {
  visible: boolean; onClose: () => void; onPicked: (uri: string) => void;
}) {
  const pick = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    onClose();
    onPicked(result.assets[0].uri);
  };

  const fromCamera = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return Alert.alert('Câmera bloqueada', 'Libera a câmera nas configurações do celular.');
    pick(await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 }));
  };
  const fromGallery = async () =>
    pick(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 }));

  return (
    <DraggableModal visible={visible} onClose={onClose}>
      <View className="gap-3 px-6 pb-4">
        <Text className="text-center text-lg font-bold text-text-light">Sua foto pro provador</Text>
        <Text className="mb-1 text-center text-sm text-text-secondary">
          Corpo inteiro, de frente, em pé, com roupa justinha e fundo liso. Fica só no app 💛
        </Text>
        <SheetOption icon="camera" title="Tirar foto" subtitle="Pede ajuda ou usa o espelho" onPress={fromCamera} />
        <SheetOption icon="images" title="Escolher da galeria" subtitle="Uma foto de corpo inteiro" onPress={fromGallery} />
      </View>
    </DraggableModal>
  );
}

/** Look em "Peças" (montado no corpo) ou "Em mim" (prévia gerada pela IA na foto dela). */
export default function TryOnView({ items, onPressItem, tryonPath = null, onGenerated }: TryOnViewProps) {
  const [path, setPath] = useState(tryonPath);
  const [showMe, setShowMe] = useState(!!tryonPath);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoSheet, setPhotoSheet] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { data: myPhoto } = useMyPhoto();
  const uploadPhoto = useUploadMyPhoto();
  const { data: imageUrl } = usePrivateImageUrl(showMe ? path : null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setShowMe(true);
    try {
      const newPath = await tryOn(items.map((i) => i.id));
      setPath(newPath);
      onGenerated?.(newPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não consegui gerar a prévia');
      setShowMe(false);
    } finally {
      setLoading(false);
    }
  };

  const onPhotoPicked = (uri: string) =>
    uploadPhoto.mutate(uri, {
      onSuccess: () => generate(),
      onError: () => Alert.alert('Ops', 'Não consegui enviar sua foto. Tenta de novo?'),
    });

  const askForPhotoOrGenerate = () => (myPhoto ? generate() : setPhotoSheet(true));

  return (
    <View className="gap-3">
      {(path || loading) && (
        <View className="flex-row self-center rounded-full bg-background-light p-1">
          {['Peças', 'Em mim'].map((label, i) => {
            const active = showMe === (i === 1);
            return (
              <TouchableOpacity
                key={label}
                onPress={() => setShowMe(i === 1)}
                className={`rounded-full px-4 py-1.5 ${active ? 'bg-primary' : ''}`}
              >
                <Text className={`text-center text-sm font-bold ${active ? 'text-white' : 'text-text-secondary'}`}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {showMe ? (
        <View className="aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-2xl bg-white">
          {loading || uploadPhoto.isPending || !imageUrl ? (
            <View className="items-center gap-2">
              <ActivityIndicator color="#f47b25" />
              <Text className="text-center text-sm text-text-secondary">vestindo você… uns 20 segundinhos ✨</Text>
            </View>
          ) : (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setExpanded(true)} className="h-full w-full">
              <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={300} />
              <View className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-0.5">
                <Text className="text-xs font-bold text-white">prévia</Text>
              </View>
              <View className="absolute bottom-3 right-3 rounded-full bg-black/40 p-1.5">
                <Ionicons name="expand" size={16} color="#ffffff" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <LookBoard items={items} onPressItem={onPressItem} />
      )}

      {!path && !loading && !uploadPhoto.isPending && (
        <TouchableOpacity
          onPress={askForPhotoOrGenerate}
          activeOpacity={0.8}
          className="flex-row items-center justify-center gap-2 self-center rounded-full bg-button-light px-5 py-2.5 shadow-soft"
        >
          <Ionicons name="sparkles" size={16} color="#5d4037" />
          <Text className="text-center font-bold text-text-light">ver em mim</Text>
        </TouchableOpacity>
      )}
      {!!error && <Text className="text-center text-sm text-red-500">{error}</Text>}
      {showMe && !!path && !loading && (
        <TouchableOpacity onPress={() => setPhotoSheet(true)} className="self-center">
          <Text className="text-xs font-bold text-text-secondary underline">trocar minha foto</Text>
        </TouchableOpacity>
      )}

      <PhotoPreviewModal uri={expanded ? imageUrl ?? null : null} onClose={() => setExpanded(false)} />
      <MyPhotoSheet visible={photoSheet} onClose={() => setPhotoSheet(false)} onPicked={onPhotoPicked} />
    </View>
  );
}
