import { Text, TouchableOpacity } from 'react-native';
import { formatDayMonth } from '../../lib/dateUtils';
import { PlayableMemory } from '../../lib/gameLogic';

export type AnswerState = 'idle' | 'correct' | 'wrong' | 'disabled';

interface AnswerOptionButtonProps {
  option: PlayableMemory;
  state: AnswerState;
  onPress: () => void;
}

const STATE_CLASSES: Record<AnswerState, string> = {
  idle: 'border-transparent bg-card-light',
  correct: 'border-green-500 bg-green-500/10',
  wrong: 'border-red-400 bg-red-400/10',
  disabled: 'border-transparent bg-card-light opacity-50',
};

export default function AnswerOptionButton({ option, state, onPress }: AnswerOptionButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={state !== 'idle'}
      activeOpacity={0.8}
      className={`min-h-[72px] w-[48%] items-center justify-center rounded-2xl border-2 p-4 shadow-soft active:scale-95 ${STATE_CLASSES[state]}`}
    >
      <Text className="text-center text-base font-bold text-text-light">
        {formatDayMonth(option.event_date)} · {option.title}
      </Text>
    </TouchableOpacity>
  );
}
