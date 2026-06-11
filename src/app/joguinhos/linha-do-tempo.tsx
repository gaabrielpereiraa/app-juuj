import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableTimelineList from '../../components/games/DraggableTimelineList';
import GameHeader from '../../components/games/GameHeader';
import TimelineResultRow from '../../components/games/TimelineResultRow';
import { usePoints } from '../../context/pointsContext';
import { useRecordGameSession, useTodayGameSessions } from '../../hooks/gameSessions';
import { useMemoriesWithPhotos } from '../../hooks/memories';
import {
  buildTimelineRound,
  PlayableMemory,
  scoreTimeline,
  TIMELINE_POINTS_PER_HIT,
  TimelineSlot,
  toPlayable,
} from '../../lib/gameLogic';
import { GameSession } from '../../lib/supabase';

type SaveState =
  | { status: 'saving' }
  | { status: 'done'; pointsAwarded: number }
  | { status: 'error' };

export default function LinhaDoTempo() {
  const router = useRouter();
  const { data: memories, isLoading } = useMemoriesWithPhotos();
  const { hasScoredToday } = useTodayGameSessions();
  const recordSession = useRecordGameSession();
  const { addPoints } = usePoints();

  const playable = useMemo(() => (memories ? toPlayable(memories) : []), [memories]);

  const [roundItems, setRoundItems] = useState<PlayableMemory[] | null>(null);
  const [slots, setSlots] = useState<TimelineSlot[] | null>(null);
  const [saveState, setSaveState] = useState<SaveState | null>(null);

  const orderIdsRef = useRef<string[]>([]);
  const sessionRef = useRef<GameSession | null>(null);
  const creditedRef = useRef(false);
  const cosmeticRef = useRef(false);

  useEffect(() => {
    if (!roundItems && playable.length > 0) {
      cosmeticRef.current = hasScoredToday('timeline');
      const round = buildTimelineRound(playable);
      setRoundItems(round);
      orderIdsRef.current = round.map((m) => m.id);
    }
  }, [roundItems, playable, hasScoredToday]);

  const saveResults = useCallback(
    async (result: TimelineSlot[]) => {
      setSaveState({ status: 'saving' });
      const correct = result.filter((s) => s.isCorrect).length;
      try {
        if (!sessionRef.current) {
          sessionRef.current = await recordSession.mutateAsync({
            game_key: 'timeline',
            correct_count: correct,
            total_count: result.length,
            points: correct * TIMELINE_POINTS_PER_HIT,
            eligible: !cosmeticRef.current,
          });
        }
        const session = sessionRef.current;
        if (session.points_awarded > 0 && !creditedRef.current) {
          await addPoints(session.points_awarded);
          creditedRef.current = true;
        }
        setSaveState({ status: 'done', pointsAwarded: session.points_awarded });
      } catch {
        setSaveState({ status: 'error' });
      }
    },
    [recordSession, addPoints]
  );

  const confirmOrder = () => {
    if (!roundItems) return;
    const byId = new Map(roundItems.map((m) => [m.id, m]));
    const ordered = orderIdsRef.current.map((id) => byId.get(id)!);
    const result = scoreTimeline(ordered);
    setSlots(result);
    saveResults(result);
  };

  const playAgain = () => {
    if (playable.length === 0) return;
    sessionRef.current = null;
    creditedRef.current = false;
    cosmeticRef.current = true; // rodada nova na mesma visita já é cosmética
    setSlots(null);
    setSaveState(null);
    const round = buildTimelineRound(playable);
    setRoundItems(round);
    orderIdsRef.current = round.map((m) => m.id);
  };

  if (isLoading || (!roundItems && playable.length > 0)) {
    return (
      <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
        <GameHeader title="Linha do tempo" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f47b25" />
        </View>
      </SafeAreaView>
    );
  }

  if (!roundItems || roundItems.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
        <GameHeader title="Linha do tempo" />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base text-text-secondary">
            Ainda não tem fotos suficientes pra montar a linha do tempo. Volta depois! 💛
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ------- fase resultado -------
  if (slots) {
    const correct = slots.filter((s) => s.isCorrect).length;
    const allCorrect = correct === slots.length;
    return (
      <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
        <GameHeader title="Linha do tempo" />

        <ScrollView className="flex-1" contentContainerClassName="px-6 pb-28">
          <View className="mt-2 items-center">
            <Text className="text-4xl font-bold text-text-light">
              {correct} de {slots.length} certos
            </Text>

            <View className="mt-3 min-h-[40px] items-center justify-center">
              {saveState?.status === 'saving' && <ActivityIndicator color="#f47b25" />}
              {saveState?.status === 'done' &&
                (saveState.pointsAwarded > 0 ? (
                  <View className="rounded-full border border-[#e6dfdb] bg-card-light px-4 py-2 shadow-soft">
                    <Text className="text-lg font-bold text-primary">
                      +{saveState.pointsAwarded} pontos 💛
                    </Text>
                  </View>
                ) : (
                  <Text className="text-center text-sm text-text-secondary">
                    Rodada cosmética — os pontos de amanhã te esperam 😴
                  </Text>
                ))}
              {saveState?.status === 'error' && (
                <TouchableOpacity onPress={() => saveResults(slots)} activeOpacity={0.8}>
                  <Text className="text-center text-sm font-bold text-red-500">
                    Não consegui salvar os pontos. Toca pra tentar de novo.
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View className="mt-6">
            {slots.map((slot, i) => (
              <TimelineResultRow key={slot.memory.id} slot={slot} isLast={i === slots.length - 1} />
            ))}
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 bg-background-light p-4 pb-8 pt-3">
          {allCorrect ? (
            <TouchableOpacity
              onPress={() => router.replace('/joguinhos/de-qual-date')}
              activeOpacity={0.8}
              className="h-14 w-full items-center justify-center rounded-full bg-primary shadow-lg active:scale-95"
            >
              <Text className="text-lg font-bold text-white">Próximo Jogo</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={playAgain}
              activeOpacity={0.8}
              className="h-14 w-full items-center justify-center rounded-full bg-primary shadow-lg active:scale-95"
            >
              <Text className="text-lg font-bold text-white">Jogar de novo</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ------- fase ordenação -------
  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      <GameHeader title="Linha do tempo" />

      <View className="flex-1 px-6">
        <Text className="mt-2 text-base text-text-secondary">
          Arraste pra ordenar do mais antigo ao mais recente
        </Text>

        <View className="mt-6">
          <DraggableTimelineList
            items={roundItems}
            onOrderChange={(ids) => {
              orderIdsRef.current = ids;
            }}
          />
        </View>
      </View>

      <View className="absolute bottom-0 left-0 right-0 bg-background-light p-4 pb-8 pt-3">
        <TouchableOpacity
          onPress={confirmOrder}
          activeOpacity={0.8}
          className="h-14 w-full items-center justify-center rounded-full bg-primary shadow-lg active:scale-95"
        >
          <Text className="text-lg font-bold text-white">Confirmar ordem</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
