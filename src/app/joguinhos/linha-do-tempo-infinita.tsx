import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DraggableTimelineList from "../../components/games/DraggableTimelineList";
import GameHeader from "../../components/games/GameHeader";
import TimelineResultRow from "../../components/games/TimelineResultRow";
import { usePoints } from "../../context/pointsContext";
import {
  useGameRecord,
  useRecordGameSession,
  useTodayGameSessions,
} from "../../hooks/gameSessions";
import { useMemoriesWithPhotos } from "../../hooks/memories";
import {
  buildInfiniteTimelineDeck,
  INFINITE_TIMELINE_POINTS_CAP,
  INFINITE_TIMELINE_POINTS_PER_HIT,
  INFINITE_TIMELINE_START_SIZE,
  insertNextCard,
  PlayableMemory,
  scoreTimeline,
  TimelineSlot,
  toPlayable,
} from "../../lib/gameLogic";
import { GameSession } from "../../lib/supabase";

type SaveState =
  | { status: "saving" }
  | { status: "done"; pointsAwarded: number }
  | { status: "error" };

export default function LinhaDoTempoInfinita() {
  const router = useRouter();
  const { data: memories, isLoading } = useMemoriesWithPhotos();
  const { hasScoredToday } = useTodayGameSessions();
  const { data: record } = useGameRecord("timeline_infinite");
  const recordSession = useRecordGameSession();
  const { addPoints } = usePoints();

  const playable = useMemo(
    () => (memories ? toPlayable(memories) : []),
    [memories],
  );

  const [deck, setDeck] = useState<PlayableMemory[] | null>(null);
  const [sequence, setSequence] = useState<PlayableMemory[] | null>(null);
  const [momentos, setMomentos] = useState(0);
  const [slots, setSlots] = useState<TimelineSlot[] | null>(null);
  const [saveState, setSaveState] = useState<SaveState | null>(null);

  const orderIdsRef = useRef<string[]>([]);
  const sessionRef = useRef<GameSession | null>(null);
  const creditedRef = useRef(false);
  const cosmeticRef = useRef(false);

  useEffect(() => {
    if (!sequence && playable.length > 0) {
      cosmeticRef.current = hasScoredToday("timeline_infinite");
      const newDeck = buildInfiniteTimelineDeck(playable);
      const start = newDeck.slice(0, INFINITE_TIMELINE_START_SIZE);
      setDeck(newDeck.slice(INFINITE_TIMELINE_START_SIZE));
      setSequence(start);
      setMomentos(0);
      orderIdsRef.current = start.map((m) => m.id);
    }
  }, [sequence, playable, hasScoredToday]);

  const finishGame = useCallback(
    async (result: TimelineSlot[]) => {
      setSlots(result);
      setSaveState({ status: "saving" });
      try {
        if (!sessionRef.current) {
          sessionRef.current = await recordSession.mutateAsync({
            game_key: "timeline_infinite",
            correct_count: momentos,
            total_count: result.length,
            points:
              Math.min(momentos, INFINITE_TIMELINE_POINTS_CAP) *
              INFINITE_TIMELINE_POINTS_PER_HIT,
            eligible: !cosmeticRef.current,
          });
        }
        const session = sessionRef.current;
        if (session.points_awarded > 0 && !creditedRef.current) {
          await addPoints(session.points_awarded);
          creditedRef.current = true;
        }
        setSaveState({ status: "done", pointsAwarded: session.points_awarded });
      } catch {
        setSaveState({ status: "error" });
      }
    },
    [momentos, recordSession, addPoints],
  );

  const retrySave = () => {
    if (slots) finishGame(slots);
  };

  const confirmOrder = () => {
    if (!sequence) return;
    const byId = new Map(sequence.map((m) => [m.id, m]));
    const ordered = orderIdsRef.current.map((id) => byId.get(id)!);
    const result = scoreTimeline(ordered);
    const allCorrect = result.every((s) => s.isCorrect);

    if (!allCorrect) {
      finishGame(result);
      return;
    }

    const newMomentos = ordered.length;
    setMomentos(newMomentos);

    if (!deck || deck.length === 0) {
      finishGame(result);
      return;
    }

    const [next, ...rest] = deck;
    const nextSequence = insertNextCard(ordered, next);
    setDeck(rest);
    setSequence(nextSequence);
    orderIdsRef.current = nextSequence.map((m) => m.id);
  };

  const playAgain = () => {
    if (playable.length === 0) return;
    sessionRef.current = null;
    creditedRef.current = false;
    cosmeticRef.current = true; // rodada nova na mesma visita já é cosmética
    setSlots(null);
    setSaveState(null);
    const newDeck = buildInfiniteTimelineDeck(playable);
    const start = newDeck.slice(0, INFINITE_TIMELINE_START_SIZE);
    setDeck(newDeck.slice(INFINITE_TIMELINE_START_SIZE));
    setSequence(start);
    setMomentos(0);
    orderIdsRef.current = start.map((m) => m.id);
  };

  if (isLoading || (!sequence && playable.length > 0)) {
    return (
      <SafeAreaView className="flex-1 bg-background-light" edges={["top"]}>
        <GameHeader title="Linha do tempo infinita" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f47b25" />
        </View>
      </SafeAreaView>
    );
  }

  if (!sequence || sequence.length < INFINITE_TIMELINE_START_SIZE) {
    return (
      <SafeAreaView className="flex-1 bg-background-light" edges={["top"]}>
        <GameHeader title="Linha do tempo infinita" />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base text-text-secondary">
            Ainda não tem fotos suficientes pra montar a linha do tempo. Volta
            depois! 💛
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ------- fase resultado -------
  if (slots) {
    return (
      <SafeAreaView className="flex-1 bg-background-light" edges={["top"]}>
        <GameHeader title="Linha do tempo infinita" />

        <ScrollView className="flex-1" contentContainerClassName="px-6 pb-28">
          <View className="mt-2 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full border-2 border-primary bg-card-light shadow-soft">
              <Ionicons name="trophy" size={40} color="#f47b25" />
            </View>

            <Text className="text-center text-3xl font-bold text-text-light">
              Você chegou a {momentos} {momentos === 1 ? "data" : "datas"}!
            </Text>

            {!!record && record > 0 && (
              <View className="mt-3 flex-row items-center gap-1 rounded-full bg-primary px-4 py-1.5 shadow-soft">
                <Text className="text-sm font-bold text-white">
                  Recorde: {record}
                </Text>
                <Text className="text-sm">🏆</Text>
              </View>
            )}

            <View className="mt-3 min-h-[40px] items-center justify-center">
              {saveState?.status === "saving" && (
                <ActivityIndicator color="#f47b25" />
              )}
              {saveState?.status === "done" &&
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
              {saveState?.status === "error" && (
                <TouchableOpacity onPress={retrySave} activeOpacity={0.8}>
                  <Text className="text-center text-sm font-bold text-red-500">
                    Não consegui salvar os pontos. Toca pra tentar de novo.
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View className="mt-6">
            {slots.map((slot, i) => (
              <TimelineResultRow
                key={slot.memory.id}
                slot={slot}
                isLast={i === slots.length - 1}
              />
            ))}
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 bg-background-light p-4 pb-8 pt-3">
          <TouchableOpacity
            onPress={playAgain}
            activeOpacity={0.8}
            className="h-14 w-full items-center justify-center rounded-full bg-primary shadow-lg active:scale-95"
          >
            <Text className="text-lg font-bold text-white">Jogar de novo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ------- fase ordenação -------
  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={["top"]}>
      <GameHeader title="Linha do tempo infinita" />

      <View className="flex-1 px-6">
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="flex-1 text-base text-text-secondary">
            Arraste pra ordenar do mais antigo ao mais recente
          </Text>
          <View className="ml-2 flex-row items-center gap-1 rounded-full bg-primary-container/20 px-3 py-1">
            <Ionicons name="flame" size={16} color="#f47b25" />
            <Text className="text-sm font-bold text-primary">{momentos}</Text>
          </View>
        </View>

        <View className="mt-6">
          <DraggableTimelineList
            key={sequence.map((m) => m.id).join("-")}
            items={sequence}
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
