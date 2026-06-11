import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GameHeader from '../../components/games/GameHeader';
import GameHubCard from '../../components/games/GameHubCard';
import { useTodayGameSessions } from '../../hooks/gameSessions';

export default function JoguinhosHub() {
  const router = useRouter();
  const { hasScoredToday } = useTodayGameSessions();

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      <GameHeader title="Joguinhos" />

      <View className="flex flex-col gap-4 p-4">
        <GameHubCard
          title="De qual date é a foto?"
          subtitle="Adivinha de qual rolê é a fotinha"
          icon="location"
          scoredToday={hasScoredToday('photo_quiz')}
          onPress={() => router.push('/joguinhos/de-qual-date')}
        />
        <GameHubCard
          title="Linha do tempo"
          subtitle="Coloca nossos momentos em ordem"
          icon="list"
          scoredToday={hasScoredToday('timeline')}
          onPress={() => router.push('/joguinhos/linha-do-tempo')}
        />
        <GameHubCard
          title="Linha do tempo infinita"
          subtitle="Até onde você consegue ir sem errar?"
          icon="infinite"
          scoredToday={hasScoredToday('timeline_infinite')}
          onPress={() => router.push('/joguinhos/linha-do-tempo-infinita')}
        />
      </View>
    </SafeAreaView>
  );
}
