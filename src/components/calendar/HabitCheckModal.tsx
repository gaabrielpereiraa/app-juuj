import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Task } from '../../lib/supabase';
import DraggableModal from '../DraggableModal';
import HabitCheckItem from './HabitCheckItem';

interface HabitCheckModalProps {
    visible: boolean;
    onClose: () => void;
    selectedDate: Date | null;
    tasks: Task[];
    completedTaskIds: string[];
    onSave: (completedTaskIds: string[]) => Promise<void>;
    isSaving?: boolean;
}

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function HabitCheckModal({
    visible,
    onClose,
    selectedDate,
    tasks,
    completedTaskIds,
    onSave,
    isSaving = false,
}: HabitCheckModalProps) {
    const [localCompletedIds, setLocalCompletedIds] = useState<string[]>([]);

    // Sincronizar estado local com props quando o modal abre
    useEffect(() => {
        if (visible) {
            setLocalCompletedIds(completedTaskIds);
        }
    }, [visible, completedTaskIds]);

    const handleToggle = (taskId: string, completed: boolean) => {
        if (completed) {
            setLocalCompletedIds(prev => [...prev, taskId]);
        } else {
            setLocalCompletedIds(prev => prev.filter(id => id !== taskId));
        }
    };

    const handleSave = async () => {
        await onSave(localCompletedIds);
        onClose();
    };

    // Calcular pontos ganhos
    const pointsEarned = tasks
        .filter(task => localCompletedIds.includes(task.id))
        .reduce((sum, task) => sum + task.points_per_unit, 0);

    // Formatar data selecionada
    const formatSelectedDate = () => {
        if (!selectedDate) return '';
        const day = selectedDate.getDate();
        const month = MONTH_NAMES[selectedDate.getMonth()];
        return `${day} de ${month}`;
    };

    return (
        <DraggableModal visible={visible} onClose={onClose}>
            <View className="px-6 pb-6">
                {/* Header */}
                <View className="flex flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-text-secondary text-sm font-medium uppercase tracking-wider">
                            Selecionado
                        </Text>
                        <Text className="text-text-light text-2xl font-bold">
                            {formatSelectedDate()}
                        </Text>
                    </View>
                    <View className="bg-primary/10 px-3 py-1 rounded-full">
                        <Text className="text-primary font-bold text-sm">
                            +{pointsEarned} pts
                        </Text>
                    </View>
                </View>

                {/* Lista de Hábitos */}
                <ScrollView
                    className="max-h-80"
                    showsVerticalScrollIndicator={false}
                    contentContainerClassName="gap-3"
                >
                    {tasks.map((task) => (
                        <HabitCheckItem
                            key={task.id}
                            task={task}
                            isCompleted={localCompletedIds.includes(task.id)}
                            onToggle={handleToggle}
                        />
                    ))}
                </ScrollView>

                {/* Botão Salvar */}
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={isSaving}
                    activeOpacity={0.8}
                    className="mt-6 w-full bg-primary py-4 rounded-2xl shadow-lg flex flex-row items-center justify-center gap-2"
                    style={{ shadowColor: '#f47b25', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 }}
                >
                    {isSaving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text className="text-white font-bold text-lg">
                                Salvar Progresso
                            </Text>
                            <Ionicons name="save" size={20} color="white" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </DraggableModal>
    );
}
