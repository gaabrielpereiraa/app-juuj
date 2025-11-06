import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RewardHistorySection from '../components/RewardHistorySection';
import { useGroupedRedemptions } from '../hooks/rewards';

export default function HistoricoCompras() {
  const router = useRouter();
  const { data: groupedCompletions, isLoading } = useGroupedRedemptions();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background-light justify-center items-center">
        <ActivityIndicator size="large" color="#f47b25" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      {/* Header */}
      <View className="sticky top-0 z-10 flex flex-row items-center justify-between bg-background-light/80 p-4 backdrop-blur-sm">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex size-10 shrink-0 items-center justify-center"
          activeOpacity={0.7}
          aria-label="Voltar"
        >
          <Ionicons name="arrow-back" size={28} color="#5d4037" />
        </TouchableOpacity>
        
        <Text className="flex-1 text-center text-lg font-bold text-text-light">
          Recompensas Resgatadas
        </Text>
        
        <View className="size-10 shrink-0" />
      </View>

      {/* Conteúdo */}
      <ScrollView 
        className="flex-1 px-4 pb-8 pt-2 mb-[5vh]"
        showsVerticalScrollIndicator={false}
      >
        {groupedCompletions && groupedCompletions.length > 0 ? (
          groupedCompletions.map((group: any, index: number) => (
            <View key={group.date} className={index > 0 ? 'mt-6' : ''}>
                <RewardHistorySection
                    title={group.date_label}
                    rewards={group.rewards}
                />
            </View>
          ))
        ) : (
        <View className="flex flex-col items-center justify-center text-center py-20 px-8">
            <Ionicons name="happy-outline" size={72} color="#757575" style={{ opacity: 0.5 }} />
            <Text className="mt-4 text-lg font-bold text-text-light text-center">
                Nenhuma recompensa por aqui... ainda!
            </Text>
            <Text className="mt-1 text-sm text-text-secondary max-w-xs text-center">
                Continue acumulando pontos para resgatar algo especial!
            </Text>
        </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}