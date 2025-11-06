import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { usePoints } from '../context/pointsContext';
import { useCompleteTask } from '../hooks/task';
import { Task } from '../lib/supabase';
import { getTaskQuestion, getPluralUnitLabel } from '../utils/taskUtils';

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  task: Task | null;
  onSuccess: () => void;
}

export default function TaskModal({ visible, onClose, task, onSuccess }: TaskModalProps) {
  const [quantity, setQuantity] = useState(1);
  const completeTaskMutation = useCompleteTask();
  const { addPoints } = usePoints();

  if (!task) return null;

  const totalPoints = quantity * task.points_per_unit;
  const questionText = getTaskQuestion(task.unit_label);
  const pluralUnit = getPluralUnitLabel(task.unit_label, quantity);

  const handleConfirm = async () => {
    try {
      await completeTaskMutation.mutateAsync({
        task_id: task.id,
        quantity,
        points_earned: totalPoints,
      });
      setQuantity(1);
      onSuccess();
    } catch (error) {
      console.error('Erro ao completar tarefa:', error);
    }
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

          <View className="flex flex-col items-center justify-center p-6 gap-6">
            {/* Ícone + título */}
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

            {/* Descrição */}
            {task.description && (
              <Text className="text-text-light/70 text-base text-center px-4">
                {task.description}
              </Text>
            )}

            {/* Info de pontos por unidade */}
            <View className="bg-primary/10 rounded-full px-4 py-2">
              <Text className="text-primary text-sm font-bold">
                {task.points_per_unit} ponto{task.points_per_unit > 1 ? 's' : ''} por {task.unit_label}
              </Text>
            </View>

            {/* Pergunta */}
            <Text className="text-text-light/80 text-base font-normal text-center">
              {questionText}
            </Text>

            {/* Stepper */}
            <View className="flex w-full max-w-xs flex-row items-center justify-between gap-4 py-4">
              <TouchableOpacity
                onPress={handleDecrement}
                disabled={quantity <= 1}
                className={`flex size-16 items-center justify-center rounded-full ${
                  quantity <= 1 ? 'bg-text-light/5' : 'bg-text-light/10'
                }`}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="remove" 
                  size={32} 
                  color={quantity <= 1 ? '#42281b40' : '#42281b'} 
                />
              </TouchableOpacity>

              <Text className="text-6xl font-bold text-text-light">
                {quantity}
              </Text>

              <TouchableOpacity
                onPress={handleIncrement}
                className="flex size-16 items-center justify-center rounded-full bg-primary active:scale-95"
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={32} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Total de pontos com detalhes */}
            <View className="bg-green-500/10 rounded-xl p-4 w-full">
              <Text className="text-green-600 text-base font-medium text-center">
                {quantity} {pluralUnit} × {task.points_per_unit} pontos
              </Text>
              <Text className="text-green-600 text-2xl font-bold text-center mt-1">
                Total: +{totalPoints} Pontos
              </Text>
            </View>

            {/* Botão confirmar */}
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={completeTaskMutation.isPending}
              className={`w-full h-14 flex items-center justify-center rounded-full bg-green-500 shadow-lg active:scale-95 ${
                completeTaskMutation.isPending ? 'opacity-60' : ''
              }`}
              activeOpacity={0.8}
            >
              {completeTaskMutation.isPending ? (
                <Text className="text-white text-lg font-bold">
                  Registrando...
                </Text>
              ) : (
                <View className="flex flex-row items-center gap-2">
                  <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                  <Text className="text-white text-lg font-bold">
                    Confirmar e Ganhar Pontos!
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}