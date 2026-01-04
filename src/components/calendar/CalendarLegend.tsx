import { Text, View } from 'react-native';

export default function CalendarLegend() {
    return (
        <View className="mt-4 flex flex-row justify-center items-center gap-6">
            <View className="flex flex-row items-center gap-2">
                <View className="size-3 rounded-full bg-yellow-100 border border-yellow-200" />
                <Text className="text-text-secondary text-xs font-medium">Parcial</Text>
            </View>
            <View className="flex flex-row items-center gap-2">
                <View className="size-3 rounded-full bg-primary" />
                <Text className="text-text-secondary text-xs font-medium">Perfeito</Text>
            </View>
        </View>
    );
}
