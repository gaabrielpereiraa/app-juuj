import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HistorySection from '../components/HistorySection';
import { useGroupedTaskCompletions } from '../hooks/task';

export default function Historico() {
  const router = useRouter();
  const { data: groupedCompletions, isLoading } = useGroupedTaskCompletions();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background-light justify-center items-center">
        <ActivityIndicator size="large" color="#f47b25" />
      </SafeAreaView>
    );
  }

  const hasActivities = groupedCompletions && groupedCompletions.length > 0;

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
          Histórico de Atividades
        </Text>
        
        <View className="size-10 shrink-0" />
      </View>

      {/* Conteúdo */}
      {hasActivities ? (
        <ScrollView 
          className="flex-1 px-4 py-4 mb-[5vh]"
          showsVerticalScrollIndicator={false}
        >
          {groupedCompletions.map((group: any, index: number) => (
            <View key={group.date} className={index > 0 ? 'mt-6' : ''}>
              <HistorySection 
                title={group.date_label} 
                activities={group.activities} 
              />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View className="flex flex-col items-center justify-center text-center pt-20">
          <Ionicons name="time-outline" size={72} color="#5d4037" style={{ opacity: 0.3 }} />
          <Text className="text-text-light text-lg font-bold mt-4">
            Nenhuma atividade ainda
          </Text>
          <Text className="text-text-secondary mt-1">
            Complete uma tarefa para ver seu histórico aqui!
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}