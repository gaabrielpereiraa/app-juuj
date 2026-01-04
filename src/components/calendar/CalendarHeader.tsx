import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

interface CalendarHeaderProps {
    currentDate: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
}

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function CalendarHeader({
    currentDate,
    onPrevMonth,
    onNextMonth,
}: CalendarHeaderProps) {
    const month = MONTH_NAMES[currentDate.getMonth()];
    const year = currentDate.getFullYear();

    return (
        <View className="flex flex-row items-center justify-between mb-4">
            <TouchableOpacity
                onPress={onPrevMonth}
                className="size-10 rounded-full bg-stone-50 items-center justify-center"
                activeOpacity={0.7}
            >
                <Ionicons name="chevron-back" size={20} color="#5d4037" />
            </TouchableOpacity>

            <Text className="text-text-light text-lg font-bold">
                {month} {year}
            </Text>

            <TouchableOpacity
                onPress={onNextMonth}
                className="size-10 rounded-full bg-stone-50 items-center justify-center"
                activeOpacity={0.7}
            >
                <Ionicons name="chevron-forward" size={20} color="#5d4037" />
            </TouchableOpacity>
        </View>
    );
}
