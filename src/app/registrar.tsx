import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SuccessModal from '../components/SucessModal';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import { useTasks } from '../hooks/task';
import { Task } from '../lib/supabase';

export default function Registrar() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const { data: tasks, isLoading } = useTasks();

  const handleAddTask = (task: Task) => {
    console.log('Tarefa selecionada:', task.title);
    setSelectedTask(task);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedTask(null);
  };

  const handleSuccess = () => {
    setModalVisible(false);
    setSuccessModalVisible(true);
    setSelectedTask(null);
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
      <View className="flex flex-row items-center bg-background-light p-4 pb-2 justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex size-12 shrink-0 items-center justify-start"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#5d4037" />
        </TouchableOpacity>
        
        <Text className="text-text-light text-lg font-bold flex-1 text-center">
          Registrar Atividades
        </Text>
        
        <View className="w-12" />
      </View>

      {/* Lista de Tarefas */}
      {tasks && tasks.length > 0 ? (
        <ScrollView 
          className="flex-1 px-4 py-4 mb-[5vh]"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-3"
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              title={task.title}
              points={`${task.points_per_unit} pontos por ${task.unit_label}`}
              onAdd={() => handleAddTask(task)}
              icon={task.icon as keyof typeof MaterialCommunityIcons.glyphMap}
            />
          ))}
        </ScrollView>
      ) : (
        <View className="flex flex-col items-center justify-center text-center pt-20">
          <Ionicons name="clipboard-outline" size={72} color="#5d4037" style={{ opacity: 0.3 }} />
          <Text className="text-text-light text-lg font-bold mt-4">
            Nenhuma tarefa disponível
          </Text>
          <Text className="text-text-secondary mt-1">
            Volte mais tarde!
          </Text>
        </View>
      )}

      {/* Modal de Tarefa */}
      <TaskModal
        visible={modalVisible}
        onClose={handleCloseModal}
        task={selectedTask}
        onSuccess={handleSuccess}
      />

      {/* Modal de Sucesso */}
      <SuccessModal
        visible={successModalVisible}
        onClose={handleCloseSuccessModal}
        title="Parabéns!"
        message="Atividade registrada com sucesso! 🎉"
      />
    </SafeAreaView>
  );
}