import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { usePoints } from '../context/pointsContext';
import { useCompleteTask } from '../hooks/task';
import { Task } from '../lib/supabase';

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  task: Task | null;
  onSuccess: () => void;
}

export default function TaskModal({ visible, onClose, task, onSuccess }: TaskModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const completeTaskMutation = useCompleteTask();
  const { addPoints } = usePoints();

  if (!task) return null;

  const totalPoints = quantity * task.points_per_unit;

  const handleConfirm = async () => {
    setIsLoading(true);
    await completeTaskMutation.mutateAsync({
      task_id: task.id,
      quantity,
      points_earned: totalPoints,
    });
    setIsLoading(false);
    addPoints(totalPoints);
    setQuantity(1);
    onSuccess();
  };

  const handleIncrement = () => setQuantity(prev => prev + 1);
  const handleDecrement = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/30 justify-end"
        onPress={onClose}
      >
        <Pressable
          className="bg-card-light rounded-t-3xl shadow-2xl pb-6"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle do modal */}
          <View className="flex h-5 w-full items-center justify-center pt-3 pb-2">
            <View className="h-1.5 w-10 rounded-full bg-text-light/20" />
          </View>

          <View className="flex flex-col items-center justify-center p-6 space-y-6 gap-6">

            {/* ✅ Ícone + título (IONICONS) */}
            <View className="flex flex-row items-center justify-center gap-3">
              {task.icon && (
                <MaterialCommunityIcons
                  name={task.icon as any}
                  size={36}
                  color="#42281b"
                />
              )}

              <Text className="text-text-light text-2xl font-bold leading-tight text-center">
                {task.title}
              </Text>
            </View>

            {/* ✅ Descrição */}
            {task.description && (
              <Text className="text-text-light/70 text-base text-center px-4">
                {task.description}
              </Text>
            )}

            {/* Pergunta */}
            <Text className="text-text-light/80 text-base font-normal text-center">
              {task.unit_label?.includes('treino') ? 'Quantos treinos você fez?' :
               task.unit_label?.includes('apresentação') ? 'Quantas apresentações você leu?' :
               task.unit_label?.includes('vez') ? 'Quantas vezes você fez?' :
               task.unit_label?.includes('hora') ? 'Quantas horas você estudou?' :
               task.unit_label?.includes('refeição') ? 'Quantas refeições você preparou?' :
               'Quantas vezes você completou?'}
            </Text>

            {/* Stepper */}
            <View className="flex w-full max-w-xs flex-row items-center justify-between gap-4 py-4">
              <TouchableOpacity
                onPress={handleDecrement}
                className="flex size-16 items-center justify-center rounded-full bg-text-light/10"
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={32} color="#42281b" />
              </TouchableOpacity>

              <Text className="text-6xl font-bold text-text-light">
                {quantity}
              </Text>

              <TouchableOpacity
                onPress={handleIncrement}
                className="flex size-16 items-center justify-center rounded-full bg-primary"
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={32} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Total de pontos */}
            <Text className="text-text-light/90 text-base font-medium text-center pb-2">
              Total a ganhar: {totalPoints} Pontos
            </Text>

            {/* Botão confirmar */}
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={completeTaskMutation.isPending}
              className={`w-full h-14 flex items-center justify-center rounded-full bg-green-500 shadow-lg ${
                completeTaskMutation.isPending ? 'opacity-60' : ''
              }`}
              activeOpacity={0.8}
            >
              {completeTaskMutation.isPending ? (
                <Text className="text-white text-lg font-bold">
                  Enviando...
                </Text>
              ) : (
                <Text className="text-white text-lg font-bold">
                  Confirmar e Ganhar Pontos!
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
