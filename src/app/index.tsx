import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CardHome from '../components/CardHome';
import { useUserSettings } from '../hooks/user';
import { usePoints } from '../context/pointsContext';

export default function HomeScreen() {
    const { 
      currentPoints, 
      totalPointsEarned,
      userName,
      avatarUrl,
      addPoints,
      subtractPoints,
      setPoints,
      refreshPoints,
      loading 
  } = usePoints();

  const cardValues = [
    { titulo: 'Registrar Tarefas', icone: 'checkmark-done-outline', redirectTo: '/registrar' },
    { titulo: 'Meu Histórico', icone: 'time-outline', redirectTo: '/historico' },
    { titulo: 'Lojinha', icone: 'storefront-outline', redirectTo: '/lojinha' },
    { titulo: 'Histórico de Compras', icone: 'cart-outline', redirectTo: '/historico-compras' },
  ];

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background-light justify-center items-center">
        <ActivityIndicator size="large" color="#f47b25" />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-background-light">
      <ScrollView 
        className="flex-1"
        contentContainerClassName="items-center justify-start p-4 pt-8"
      >
        <View className="flex flex-col items-stretch justify-start w-full max-w-md mx-auto space-y-6">
          <View className="flex flex-row items-center gap-4 px-4">
            <Image 
              source={
                avatarUrl
                  ? { uri: encodeURI(avatarUrl) }
                  : require('../../assets/images/perfil.jpeg')
              }
              className="h-16 w-16 rounded-full"
              accessibilityLabel="Foto da usuária"
            />
            <View>
              <Text className="text-base text-text-light/80">
                HELLOO
              </Text>
              <Text className="text-2xl font-bold leading-tight text-text-light">
                {userName || 'JuuJ'}
              </Text>
            </View>
          </View>

          <View className="p-4 w-full">
            <View className="flex flex-col items-center justify-center rounded-3xl bg-card-light shadow-lg p-8">
              <Text className="text-text-light/90 text-lg font-medium">
                Seus Pontos
              </Text>
              <Text className="text-text-light text-6xl font-bold tracking-tighter mt-1">
                {currentPoints.toLocaleString('pt-BR') || 0}
              </Text>
            </View>
          </View>

          <View className="flex flex-row flex-wrap p-4">
            {cardValues.map((card, index) => (
              <View key={index} className="w-1/2 pr-2 pb-3">
                <CardHome
                  titulo={card.titulo}
                  icone={card.icone}
                  redirectTo={card.redirectTo}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}