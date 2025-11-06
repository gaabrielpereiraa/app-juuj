import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfirmRedeemModal from '../components/ConfirmRedeemModal';
import RewardCard from '../components/RewardCard';
import SuccessModal from '../components/SucessModal';
import { usePoints } from '../context/pointsContext';
import { useRedeemReward, useRewards } from '../hooks/rewards';
import { Reward } from '../lib/supabase';

export default function Lojinha() {
  const router = useRouter();
  const { currentPoints, subtractPoints } = usePoints();
  const { data: rewards, isLoading } = useRewards();
  const redeemMutation = useRedeemReward();

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isLoadingRedeem, setIsLoadingRedeem] = useState(false);

  const handleOpenConfirmModal = (reward: Reward) => {
    if (currentPoints < reward.points_cost) {
      // Você pode criar um modal de erro também, ou usar um Alert simples
      return;
    }
    setSelectedReward(reward);
    setConfirmModalVisible(true);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return;
    
    setIsLoadingRedeem(true);
    try {
      await redeemMutation.mutateAsync({
        reward_id: selectedReward.id,
        points_spent: selectedReward.points_cost,
      });
      subtractPoints(selectedReward.points_cost);
      setConfirmModalVisible(false);
      setSuccessModalVisible(true);
      setSelectedReward(null);
    } catch (error) {
      console.error('Erro ao resgatar:', error);
      setConfirmModalVisible(false);
      // Aqui você pode mostrar um modal de erro
    }
    finally {
        setIsLoadingRedeem(false);
    }
  };

  const handleCloseConfirmModal = () => {
    if (!isLoadingRedeem) {
      setConfirmModalVisible(false);
      setSelectedReward(null);
    }
  };

  const handleCloseSuccessModal = () => {
    setSuccessModalVisible(false);
  };

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
          Lojinha de Recompensas
        </Text>
        
        <View className="size-10 shrink-0" />
      </View>

      {/* Pontos Disponíveis */}
      <Text className="text-2xl font-bold leading-tight px-6 pb-2 pt-5 text-text-light">
        Disponível: {currentPoints.toLocaleString('pt-BR')} pontos
      </Text>

      {/* Grid de Recompensas */}
      {rewards && rewards.length > 0 ? (
        <ScrollView 
          className="flex-1"
          contentContainerClassName="p-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex flex-row flex-wrap justify-between">
            {rewards.map((reward: Reward) => (
              <View key={reward.id} className="w-[48%]">
                <RewardCard
                  imageUrl={reward.image_url || ''}
                  title={reward.title}
                  points={reward.points_cost}
                  currentPoints={currentPoints}
                  onRedeem={() => handleOpenConfirmModal(reward)}
                  isRedeeming={isLoadingRedeem && selectedReward?.id === reward.id}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View className="flex flex-col items-center justify-center text-center pt-20">
          <Ionicons name="cart-outline" size={72} color="#5d4037" style={{ opacity: 0.3 }} />
          <Text className="text-text-light text-lg font-bold mt-4">
            Nenhuma recompensa disponível
          </Text>
          <Text className="text-text-secondary mt-1 px-8">
            Volte mais tarde para ver novas recompensas na lojinha!
          </Text>
        </View>
      )}

      {/* Modais */}
      <ConfirmRedeemModal
        visible={confirmModalVisible}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmRedeem}
        rewardTitle={selectedReward?.title || ''}
        rewardPoints={selectedReward?.points_cost || 0}
        rewardImage={selectedReward?.image_url || undefined}
        isRedeeming={isLoadingRedeem}
      />

      <SuccessModal
        visible={successModalVisible}
        onClose={handleCloseSuccessModal}
        title="Sucesso!"
        message="Recompensa resgatada com sucesso!"
      />
    </SafeAreaView>
  );
}