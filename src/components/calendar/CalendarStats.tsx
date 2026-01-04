import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';

interface CalendarStatsProps {
    streak: number;
    totalPoints: number;
    perfectDays: number;
}

interface StatCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBgColor: string;
    label: string;
    value: string | number;
    suffix?: string;
}

function StatCard({ icon, iconColor, iconBgColor, label, value, suffix }: StatCardProps) {
    return (
        <View
            className="flex-1 min-w-[120px] flex flex-col items-center justify-center gap-1 rounded-2xl p-4 bg-card-light shadow-soft border border-stone-100"
        >
            <View
                className="size-8 rounded-full flex items-center justify-center mb-1"
                style={{ backgroundColor: iconBgColor }}
            >
                <Ionicons name={icon} size={18} color={iconColor} />
            </View>
            <Text className="text-text-secondary text-xs font-semibold uppercase tracking-wider">
                {label}
            </Text>
            <Text className="text-text-light text-2xl font-extrabold">
                {value}
                {suffix && (
                    <Text className="text-sm font-medium text-text-secondary"> {suffix}</Text>
                )}
            </Text>
        </View>
    );
}

export default function CalendarStats({ streak, totalPoints, perfectDays }: CalendarStatsProps) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-4 gap-3"
            className="py-4"
        >
            <StatCard
                icon="flame"
                iconColor="#f47b25"
                iconBgColor="#FED7AA"
                label="Sequência"
                value={streak}
                suffix="dias"
            />
            <StatCard
                icon="star"
                iconColor="#EAB308"
                iconBgColor="#FEF08A"
                label="Pontos Totais"
                value={totalPoints.toLocaleString('pt-BR')}
            />
            <StatCard
                icon="checkmark-circle"
                iconColor="#22C55E"
                iconBgColor="#BBF7D0"
                label="Perfeitos"
                value={perfectDays}
            />
        </ScrollView>
    );
}
