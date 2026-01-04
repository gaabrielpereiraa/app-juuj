import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

interface CalendarDayProps {
    day: number;
    isSelected: boolean;
    completedCount: number;
    totalTasks: number;
    onPress: (day: number) => void;
    isCurrentMonth: boolean;
    isToday: boolean;
}

// Cores para os indicadores de atividade
const ACTIVITY_COLORS = ['#f47b25', '#50B87A', '#3B82F6'];

export default function CalendarDay({
    day,
    isSelected,
    completedCount,
    totalTasks,
    onPress,
    isCurrentMonth,
    isToday,
}: CalendarDayProps) {
    if (day === 0) {
        // Célula vazia para dias fora do mês
        return <View className="size-10" />;
    }

    const isPerfect = completedCount > 0 && completedCount >= totalTasks;
    const isPartial = completedCount > 0 && completedCount < totalTasks;

    // Determina o estilo do dia baseado no estado
    const getDayStyle = () => {
        if (!isCurrentMonth) {
            return 'opacity-30';
        }
        if (isPerfect) {
            return 'bg-primary';
        }
        if (isPartial) {
            return 'bg-yellow-100';
        }
        return '';
    };

    const getTextStyle = () => {
        if (!isCurrentMonth) {
            return 'text-text-light opacity-30';
        }
        if (isPerfect) {
            return 'text-white font-bold';
        }
        return 'text-text-light';
    };

    const getSelectedStyle = () => {
        if (isSelected && !isPerfect) {
            return 'border-2 border-primary bg-primary/10';
        }
        if (isSelected && isPerfect) {
            return 'border-2 border-white';
        }
        return '';
    };

    return (
        <TouchableOpacity
            onPress={() => onPress(day)}
            activeOpacity={0.7}
            className={`size-10 rounded-full flex flex-col items-center justify-center ${getDayStyle()} ${getSelectedStyle()}`}
        >
            <Text className={`text-sm font-medium ${getTextStyle()} ${isPerfect || isPartial ? 'leading-none' : ''}`}>
                {day}
            </Text>

            {/* Indicador de dia perfeito */}
            {isPerfect && (
                <Ionicons name="checkmark" size={12} color="white" style={{ marginTop: -2 }} />
            )}

            {/* Indicadores de atividades parciais */}
            {isPartial && (
                <View className="flex flex-row gap-0.5 mt-0.5">
                    {Array.from({ length: Math.min(completedCount, 3) }).map((_, index) => (
                        <View
                            key={index}
                            className="size-1 rounded-full"
                            style={{ backgroundColor: ACTIVITY_COLORS[index % ACTIVITY_COLORS.length] }}
                        />
                    ))}
                </View>
            )}

            {/* Indicador de hoje */}
            {isToday && !isPerfect && !isPartial && (
                <View className="absolute bottom-1 size-1 rounded-full bg-primary" />
            )}
        </TouchableOpacity>
    );
}
