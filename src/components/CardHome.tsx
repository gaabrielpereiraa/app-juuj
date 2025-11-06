import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { TouchableOpacity, Text } from "react-native";

interface props {
    titulo: string;
    icone: string;
    redirectTo?: string;
}

export default function CardHome({ titulo, icone, redirectTo }: props) {
    const router = useRouter();
    return (
        <TouchableOpacity 
            className="flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl bg-button-light p-4 shadow-md"
            activeOpacity={0.7}
            onPress={() => router.push(redirectTo as string || "/")}
        >
            <Ionicons name={icone as any} size={36} color="#42281b" />
            <Text className="text-text-light text-center text-sm font-bold">
                {titulo}
            </Text>
        </TouchableOpacity>
    )
}