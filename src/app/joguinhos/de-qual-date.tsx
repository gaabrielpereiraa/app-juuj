import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnswerOptionButton from '../../components/games/AnswerOptionButton';
import FeedbackOverlay from '../../components/games/FeedbackOverlay';
import GameHeader from '../../components/games/GameHeader';
import GameProgressBar from '../../components/games/GameProgressBar';
import { usePoints } from '../../context/pointsContext';
import { useRecordGameSession, useTodayGameSessions } from '../../hooks/gameSessions';
import { photoUrl, useMemoriesWithPhotos } from '../../hooks/memories';
import { formatDayMonth } from '../../lib/dateUtils';
import {
  buildPhotoQuizRound,
  QUIZ_POINTS_PER_HIT,
  QuizQuestion,
  toPlayable,
} from '../../lib/gameLogic';
import { GameSession } from '../../lib/supabase';

type SaveState =
  | { status: 'saving' }
  | { status: 'done'; pointsAwarded: number }
  | { status: 'error' };

export default function DeQualDate() {
  const router = useRouter();
  const { data: memories, isLoading } = useMemoriesWithPhotos();
  const { hasScoredToday } = useTodayGameSessions();
  const recordSession = useRecordGameSession();
  const { addPoints } = usePoints();

  const playable = useMemo(() => (memories ? toPlayable(memories) : []), [memories]);

  const [round, setRound] = useState<QuizQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean } | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [saveState, setSaveState] = useState<SaveState | null>(null);

  const correctRef = useRef(0);
  const sessionRef = useRef<GameSession | null>(null);
  const creditedRef = useRef(false);

  // rodada cosmética = já pontuou hoje (decidido na entrada da rodada)
  const cosmeticRef = useRef(false);

  useEffect(() => {
    if (!round && playable.length > 0) {
      cosmeticRef.current = hasScoredToday('photo_quiz');
      setRound(buildPhotoQuizRound(playable));
    }
  }, [round, playable, hasScoredToday]);

  // prefetch da próxima foto
  useEffect(() => {
    const next = round?.[index + 1];
    if (next) Image.prefetch(photoUrl(next.photoPath));
  }, [round, index]);

  const question = round?.[index] ?? null;

  const saveResults = useCallback(async () => {
    if (!round) return;
    setSaveState({ status: 'saving' });
    try {
      if (!sessionRef.current) {
        sessionRef.current = await recordSession.mutateAsync({
          game_key: 'photo_quiz',
          correct_count: correctRef.current,
          total_count: round.length,
          points: correctRef.current * QUIZ_POINTS_PER_HIT,
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
  }, [round, recordSession, addPoints]);

  const answer = (optionId: string) => {
    if (!question || feedback) return; // locked durante o feedback
    const isCorrect = optionId === question.correct.id;
    if (isCorrect) correctRef.current += 1;
    setFeedback({ isCorrect });
  };

  const onFeedbackDone = useCallback(() => {
    setFeedback(null);
    if (round && index + 1 < round.length) {
      setIndex(index + 1);
    } else {
      setShowSummary(true);
      saveResults();
    }
  }, [round, index, saveResults]);

  const playAgain = () => {
    correctRef.current = 0;
    sessionRef.current = null;
    creditedRef.current = false;
    cosmeticRef.current = true; // mesma sessão de app: rodada nova já é cosmética
    setIndex(0);
    setShowSummary(false);
    setSaveState(null);
    setRound(buildPhotoQuizRound(playable));
  };

  if (isLoading || (!round && playable.length > 0)) {
    return (
      <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
        <GameHeader title="De qual date é a foto?" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f47b25" />
        </View>
      </SafeAreaView>
    );
  }

  if (!round || round.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
        <GameHeader title="De qual date é a foto?" />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base text-text-secondary">
            Ainda não tem fotos suficientes pra jogar. Volta depois! 💛
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showSummary) {
    const total = round.length;
    const correct = correctRef.current;
    return (
      <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
        <GameHeader title="De qual date é a foto?" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-4xl font-bold text-text-light">
            {correct} de {total} certos
          </Text>

          <View className="mt-4 min-h-[40px] items-center justify-center">
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
              <TouchableOpacity onPress={saveResults} activeOpacity={0.8}>
                <Text className="text-center text-sm font-bold text-red-500">
                  Não consegui salvar os pontos. Toca pra tentar de novo.
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={playAgain}
            activeOpacity={0.8}
            className="mt-10 h-14 w-full items-center justify-center rounded-full bg-primary shadow-lg active:scale-95"
          >
            <Text className="text-lg font-bold text-white">Jogar de novo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="mt-3 h-14 w-full items-center justify-center rounded-full border-2 border-text-light/20 bg-card-light active:scale-95"
          >
            <Text className="text-lg font-bold text-text-light">Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      <GameHeader title="De qual date é a foto?" />

      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10">
        <GameProgressBar current={index + 1} total={round.length} />

        <View className="mt-6 aspect-[4/5] w-full overflow-hidden rounded-3xl border-4 border-card-light bg-[#ffdbc9] shadow-soft">
          {question && (
            <Image
              source={{ uri: photoUrl(question.photoPath) }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              cachePolicy="disk"
              transition={200}
            />
          )}
        </View>

        <Text className="mt-8 text-center text-xl font-bold text-text-light">
          Quando foi essa?
        </Text>

        <View className="mt-6 flex-row flex-wrap justify-between gap-y-4">
          {question?.options.map((option) => (
            <AnswerOptionButton
              key={option.id}
              option={option}
              state={feedback ? 'disabled' : 'idle'}
              onPress={() => answer(option.id)}
            />
          ))}
        </View>
      </ScrollView>

      <FeedbackOverlay
        visible={feedback !== null}
        isCorrect={feedback?.isCorrect ?? false}
        correctLabel={
          question ? `${formatDayMonth(question.correct.event_date)} · ${question.correct.title}` : ''
        }
        points={cosmeticRef.current ? null : QUIZ_POINTS_PER_HIT}
        onDone={onFeedbackDone}
      />
    </SafeAreaView>
  );
}
