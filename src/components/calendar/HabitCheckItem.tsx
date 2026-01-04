import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { Task } from '../../lib/supabase';

interface HabitCheckItemProps {
    task: Task;
    isCompleted: boolean;
    onToggle: (taskId: string, completed: boolean) => void;
}

// Cores para cada tarefa (baseado no índice ou pode ser expandido)
const TASK_COLORS: Record<string, { bg: string; bgChecked: string; border: string; icon: string }> = {
    default: {
        bg: '#FFF7ED',
        bgChecked: '#FFF7ED80',
        border: '#FDBA74',
        icon: '#f47b25',
    },
};

export default function HabitCheckItem({ task, isCompleted, onToggle }: HabitCheckItemProps) {
    const colors = TASK_COLORS.default;

    return (
        <TouchableOpacity
            onPress={() => onToggle(task.id, !isCompleted)}
            activeOpacity={0.8}
            className={`relative flex flex-row items-center p-4 rounded-2xl shadow-sm border ${isCompleted
                    ? 'bg-green-50 border-green-300'
                    : 'bg-card-light border-stone-200'
                }`}
        >
            {/* Ícone da tarefa */}
            <View
                className={`size-12 rounded-xl flex items-center justify-center mr-4 ${isCompleted ? 'bg-green-100' : 'bg-primary/10'
                    }`}
            >
                <MaterialCommunityIcons
                    name={task.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={24}
                    color={isCompleted ? '#22C55E' : '#f47b25'}
                />
            </View>

            {/* Textos */}
            <View className="flex-1">
                <Text className="text-text-light font-bold text-base">
                    {task.title}
                </Text>
                {task.description && (
                    <Text className="text-text-secondary text-xs">
                        {task.description}
                    </Text>
                )}
            </View>

            {/* Checkbox */}
            <View
                className={`size-6 rounded-full border-2 flex items-center justify-center ${isCompleted
                        ? 'bg-green-500 border-green-500'
                        : 'border-stone-300'
                    }`}
            >
                {isCompleted && (
                    <MaterialCommunityIcons name="check" size={14} color="white" />
                )}
            </View>

            {/* Borda de destaque quando selecionado */}
            {isCompleted && (
                <View className="absolute inset-0 rounded-2xl border-2 border-green-500 pointer-events-none" />
            )}
        </TouchableOpacity>
    );
}
