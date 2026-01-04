import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CalendarGrid from '../components/calendar/CalendarGrid';
import CalendarLegend from '../components/calendar/CalendarLegend';
import CalendarStats from '../components/calendar/CalendarStats';
import HabitCheckModal from '../components/calendar/HabitCheckModal';
import { usePoints } from '../context/pointsContext';
import { useDayCompletions, useHabitCalendar, useSaveDayCompletions } from '../hooks/habitCalendar';
import CalendarHeader from '../components/calendar/CalendarHeader';

export default function Calendario() {
    const router = useRouter();
    const { totalPointsEarned, addPoints, refreshPoints } = usePoints();

    // Estado do calendário
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Dados do calendário
    const {
        tasks,
        completionsByDay,
        streak,
        perfectDays,
        isLoading,
        refetch: refetchCalendar,
    } = useHabitCalendar(currentDate);

    // Completions do dia selecionado
    const {
        completedTaskIds,
        isLoading: isLoadingDay,
        refetch: refetchDay,
    } = useDayCompletions(currentDate, selectedDay);

    // Mutation para salvar
    const saveMutation = useSaveDayCompletions();

    // Navegação de meses
    const handlePrevMonth = useCallback(() => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
        setSelectedDay(null);
    }, []);

    const handleNextMonth = useCallback(() => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
        setSelectedDay(null);
    }, []);

    // Selecionar dia
    const handleDayPress = useCallback((day: number) => {
        if (day === 0) return;
        setSelectedDay(day);
        setModalVisible(true);
    }, []);

    // Fechar modal
    const handleCloseModal = useCallback(() => {
        setModalVisible(false);
    }, []);

    // Salvar progresso
    const handleSave = useCallback(async (completedIds: string[]) => {
        if (selectedDay === null) return;

        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);

        // Calcular pontos a adicionar (novos tasks marcados)
        const previousIds = completedTaskIds;
        const newlyCompleted = completedIds.filter(id => !previousIds.includes(id));
        const pointsToAdd = tasks
            .filter(t => newlyCompleted.includes(t.id))
            .reduce((sum, t) => sum + t.points_per_unit, 0);

        await saveMutation.mutateAsync({
            date,
            taskIds: completedIds,
            allTasks: tasks,
        });

        // Adicionar pontos se houver novas completions
        if (pointsToAdd > 0) {
            await addPoints(pointsToAdd);
        }

        // Atualizar dados
        await Promise.all([
            refetchCalendar(),
            refetchDay(),
            refreshPoints(),
        ]);
    }, [selectedDay, currentDate, tasks, completedTaskIds, saveMutation, addPoints, refetchCalendar, refetchDay, refreshPoints]);

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
                    Calendário de Hábitos
                </Text>

                <View className="w-12" />
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerClassName="pb-10"
            >
                {/* Stats */}
                <CalendarStats
                    streak={streak}
                    totalPoints={totalPointsEarned}
                    perfectDays={perfectDays}
                />

                {/* Calendário */}
                <View className="px-4">
                    <View className="bg-card-light rounded-3xl shadow-soft p-5 border border-stone-100">
                        <CalendarHeader
                            currentDate={currentDate}
                            onPrevMonth={handlePrevMonth}
                            onNextMonth={handleNextMonth}
                        />

                        <CalendarGrid
                            currentDate={currentDate}
                            selectedDay={selectedDay}
                            completionsByDay={completionsByDay}
                            totalTasks={tasks.length}
                            onDayPress={handleDayPress}
                        />
                    </View>

                    {/* Legenda */}
                    <CalendarLegend />
                </View>
            </ScrollView>

            {/* Modal */}
            <HabitCheckModal
                visible={modalVisible}
                onClose={handleCloseModal}
                selectedDate={selectedDay !== null
                    ? new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay)
                    : null
                }
                tasks={tasks}
                completedTaskIds={completedTaskIds}
                onSave={handleSave}
                isSaving={saveMutation.isPending}
            />
        </SafeAreaView>
    );
}
