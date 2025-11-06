import { ActivityIndicator, ImageBackground, Text, TouchableOpacity, View } from 'react-native';

interface RewardCardProps {
  imageUrl: string;
  title: string;
  points: number;
  currentPoints: number;
  onRedeem: () => void;
  isRedeeming?: boolean;
}

export default function RewardCard({ 
  imageUrl, 
  title, 
  points, 
  currentPoints, 
  onRedeem,
  isRedeeming = false
}: RewardCardProps) {
  const canRedeem = currentPoints >= points && !isRedeeming;

  return (
    <View className={`flex flex-col rounded-lg bg-card-light/50 p-4 shadow-soft ${!canRedeem && !isRedeeming ? 'opacity-60' : ''}`}>
      {/* Imagem */}
      <ImageBackground
        source={{ uri: imageUrl }}
        className="w-full aspect-square rounded-md overflow-hidden mb-3"
        resizeMode="cover"
      />

      {/* Conteúdo com altura fixa */}
      <View className="flex flex-col justify-between h-32">
        {/* Textos */}
        <View className="flex-1">
          <Text
            numberOfLines={2}
            className="text-base font-medium leading-normal text-text-light h-12"
          >
            {title}
          </Text>

          <Text className="text-sm font-normal leading-normal text-text-light/70 mt-1">
            {points.toLocaleString('pt-BR')} Pontos
          </Text>
        </View>

        {/* Botão */}
        <TouchableOpacity
          onPress={onRedeem}
          disabled={!canRedeem || isRedeeming}
          className={`w-full rounded-full py-2 flex items-center justify-center ${
            canRedeem && !isRedeeming
              ? 'bg-primary active:scale-95'
              : 'bg-gray-300'
          }`}
          activeOpacity={canRedeem ? 0.8 : 1}
        >
          {isRedeeming ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text
              className={`text-sm font-bold text-center ${
                canRedeem ? 'text-white' : 'text-gray-500'
              }`}
            >
              Resgatar
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}