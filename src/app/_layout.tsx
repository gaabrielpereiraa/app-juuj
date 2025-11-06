import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { Stack } from 'expo-router';
import 'react-native-reanimated';
import "../../global.css";
import { PointsProvider } from "../context/pointsContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {

  // Configuração do React Query com persistência em AsyncStorage
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,     // 5 minutos
        gcTime: 1000 * 60 * 10,       // 10 minutos
        retry: 3,
        refetchOnWindowFocus: false,
      },
    },
  });

  // Configuração do persister para AsyncStorage
  const asyncStoragePersister = createAsyncStoragePersister({
    storage: AsyncStorage,
    throttleTime: 1000 * 60 * 5, // 5 minutos
    key: '@tanstack-query',
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  });

  // Ativa a persistência do QueryClient
  persistQueryClient({
    queryClient,
    persister: asyncStoragePersister,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PointsProvider>
          <Stack screenOptions={{ headerShown: false, animation: "none" }} />
        </PointsProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
