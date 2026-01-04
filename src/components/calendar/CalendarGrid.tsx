import { Text, View } from 'react-native';
import CalendarDay from './CalendarDay';

interface CalendarGridProps {
    currentDate: Date;
    selectedDay: number | null;
    completionsByDay: Record<number, number>; // dia -> quantidade de tarefas completadas
    totalTasks: number;
    onDayPress: (day: number) => void;
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function CalendarGrid({
    currentDate,
    selectedDay,
    completionsByDay,
    totalTasks,
    onDayPress,
}: CalendarGridProps) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Primeiro dia do mês (0 = Domingo, 1 = Segunda, etc.)
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    // Total de dias no mês
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Verificar se é hoje
    const today = new Date();
    const isCurrentMonthAndYear = today.getMonth() === month && today.getFullYear() === year;
    const todayDay = today.getDate();

    // Gerar array de dias para o grid
    const generateCalendarDays = () => {
        const days: number[] = [];

        // Dias vazios antes do primeiro dia do mês
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(0);
        }

        // Dias do mês
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    const calendarDays = generateCalendarDays();

    return (
        <View>
            {/* Cabeçalho dos dias da semana */}
            <View className="flex flex-row mb-2">
                {WEEKDAYS.map((day, index) => (
                    <View key={index} className="flex-1 items-center">
                        <Text className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                            {day}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Grid do calendário */}
            <View className="flex flex-row flex-wrap">
                {calendarDays.map((day, index) => (
                    <View key={index} className="w-[14.28%] items-center py-1">
                        <CalendarDay
                            day={day}
                            isSelected={selectedDay === day}
                            completedCount={completionsByDay[day] || 0}
                            totalTasks={totalTasks}
                            onPress={onDayPress}
                            isCurrentMonth={day > 0}
                            isToday={isCurrentMonthAndYear && day === todayDay}
                        />
                    </View>
                ))}
            </View>
        </View>
    );
}
