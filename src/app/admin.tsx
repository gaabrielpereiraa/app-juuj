import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminEditModal from '../components/admin/AdminEditModal';
import {
  useAllRewards,
  useDeleteReward,
  useGrantReward,
  useRedemptions,
  useRevokeReward,
  useSaveReward,
} from '../hooks/rewards';
import { useAllTasks, useDeleteTask, useSaveTask } from '../hooks/task';
import { Field, isUnlocked, tryUnlock } from '../lib/admin';
import { formatDateLabel, formatLocalDateKey } from '../lib/dateUtils';
import { Reward, Task } from '../lib/supabase';

const TASK_FIELDS: Field[] = [
  { key: 'title', label: 'Título', type: 'text', required: true, placeholder: 'Ex: Beber água' },
  { key: 'description', label: 'Descrição', type: 'text', placeholder: 'Opcional' },
  { key: 'points_per_unit', label: 'Pontos por unidade', type: 'number', required: true },
  { key: 'unit_label', label: 'Rótulo da unidade', type: 'text', required: true, placeholder: 'copo, página...' },
  { key: 'icon', label: 'Ícone (MaterialCommunityIcons)', type: 'text', required: true, placeholder: 'water' },
  { key: 'is_active', label: 'Ativa', type: 'switch' },
];

const REWARD_FIELDS: Field[] = [
  { key: 'title', label: 'Título', type: 'text', required: true, placeholder: 'Ex: Cinema' },
  { key: 'description', label: 'Descrição', type: 'text', placeholder: 'Opcional' },
  { key: 'points_cost', label: 'Custo em pontos', type: 'number', required: true },
  { key: 'image_url', label: 'URL da imagem', type: 'text', placeholder: 'https://...' },
  { key: 'icon', label: 'Ícone (MaterialCommunityIcons)', type: 'text', required: true, placeholder: 'gift' },
  { key: 'is_available', label: 'Disponível', type: 'switch' },
];

const NEW_TASK = { points_per_unit: 1, unit_label: 'vez', icon: 'star', is_active: true };
const NEW_REWARD = { points_cost: 100, icon: 'gift', is_available: true };

type Tab = 'tasks' | 'rewards' | 'redemptions';

export default function Admin() {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(isUnlocked());

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} onCancel={() => router.back()} />;
  }

  return <AdminPanel onBack={() => router.back()} />;
}

function PasswordGate({
  onUnlock,
  onCancel,
}: {
  onUnlock: () => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const submit = () => {
    if (tryUnlock(password)) onUnlock();
    else setError(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light justify-center px-8">
      <View className="rounded-3xl bg-card-light shadow-lg p-8 items-center">
        <Ionicons name="lock-closed-outline" size={40} color="#f47b25" />
        <Text className="text-xl font-bold text-text-light mt-3">Área restrita</Text>
        <Text className="text-text-secondary text-center mt-1 mb-5">
          Digite a senha para continuar
        </Text>

        <TextInput
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setError(false);
          }}
          onSubmitEditing={submit}
          secureTextEntry
          autoFocus
          placeholder="Senha"
          placeholderTextColor="#9E6B47"
          className="w-full rounded-xl bg-background-light border border-text-light/15 px-4 py-3 text-base text-text-light text-center"
        />
        {error ? <Text className="text-red-600 text-sm mt-2">Senha incorreta</Text> : null}

        <TouchableOpacity
          onPress={submit}
          activeOpacity={0.8}
          className="w-full rounded-2xl bg-primary py-4 items-center mt-5"
        >
          <Text className="text-white font-bold text-base">Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onCancel} activeOpacity={0.7} className="py-3 mt-1">
          <Text className="text-text-secondary">Voltar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function AdminPanel({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('tasks');
  const [editing, setEditing] = useState<Record<string, any> | null>(null);

  const tasks = useAllTasks();
  const rewards = useAllRewards();
  const redemptions = useRedemptions();

  const saveTask = useSaveTask();
  const deleteTask = useDeleteTask();
  const saveReward = useSaveReward();
  const deleteReward = useDeleteReward();
  const grant = useGrantReward();
  const revoke = useRevokeReward();

  const isTasks = tab === 'tasks';
  const list = isTasks ? tasks : rewards;

  // Excluir falha se houver histórico (FK 23503) — nesse caso só desativa,
  // apagar as completions/resgates junto apagaria pontos já registrados.
  const handleDelete = async (item: Record<string, any>) => {
    try {
      if (isTasks) await deleteTask.mutateAsync(item.id);
      else await deleteReward.mutateAsync(item.id);
    } catch (e: any) {
      if (e?.code !== '23503') throw e;
      if (isTasks) await saveTask.mutateAsync({ ...(item as Task), is_active: false });
      else await saveReward.mutateAsync({ ...(item as Reward), is_available: false });
      throw new Error('Tem histórico, não pode ser excluída. Foi desativada.');
    }
  };

  const handleSave = async (values: Record<string, any>) => {
    const payload = { ...values, id: editing?.id } as any;
    if (!payload.id) delete payload.id;
    if (isTasks) await saveTask.mutateAsync(payload);
    else await saveReward.mutateAsync(payload);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      <View className="flex flex-row items-center justify-between bg-background-light/80 p-4">
        <TouchableOpacity
          onPress={onBack}
          className="flex size-10 shrink-0 items-center justify-center"
          activeOpacity={0.7}
          aria-label="Voltar"
        >
          <Ionicons name="arrow-back" size={28} color="#5d4037" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-text-light">Admin</Text>
        <View className="size-10 shrink-0" />
      </View>

      {/* Abas */}
      <View className="flex flex-row mx-4 mb-2 rounded-2xl bg-card-light p-1">
        {(
          [
            ['tasks', 'Tarefas'],
            ['rewards', 'Recompensas'],
            ['redemptions', 'Resgates'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            onPress={() => setTab(key)}
            activeOpacity={0.8}
            className={`flex-1 items-center rounded-xl py-2.5 ${
              tab === key ? 'bg-primary' : ''
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                tab === key ? 'text-white' : 'text-text-secondary'
              }`}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'redemptions' ? (
        <RedemptionsTab
          query={redemptions}
          onGrant={(id) => grant.mutate(id)}
          onRevoke={(id) => revoke.mutate(id)}
        />
      ) : list.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f47b25" />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-28">
          {(list.data || []).map((item: any) => {
            const enabled = isTasks ? item.is_active : item.is_available;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setEditing(item)}
                activeOpacity={0.7}
                className="flex flex-row items-center gap-3 rounded-2xl bg-card-light p-4 mb-3"
                style={enabled ? undefined : { opacity: 0.5 }}
              >
                <MaterialCommunityIcons
                  name={item.icon || 'help-circle-outline'}
                  size={24}
                  color="#f47b25"
                />
                <View className="flex-1">
                  <Text className="text-base font-bold text-text-light">{item.title}</Text>
                  <Text className="text-sm text-text-secondary">
                    {isTasks
                      ? `${item.points_per_unit} pts / ${item.unit_label}`
                      : `${item.points_cost} pts`}
                    {enabled ? '' : ' · inativo'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9E6B47" />
              </TouchableOpacity>
            );
          })}
          {(list.data || []).length === 0 ? (
            <Text className="text-text-secondary text-center mt-10">Nada aqui ainda.</Text>
          ) : null}
        </ScrollView>
      )}

      {tab !== 'redemptions' ? (
        <TouchableOpacity
          onPress={() => setEditing(isTasks ? { ...NEW_TASK } : { ...NEW_REWARD })}
          activeOpacity={0.8}
          className="absolute bottom-8 right-6 size-14 rounded-full bg-primary items-center justify-center shadow-lg"
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      ) : null}

      <AdminEditModal
        visible={!!editing}
        onClose={() => setEditing(null)}
        title={`${editing?.id ? 'Editar' : 'Nova'} ${isTasks ? 'tarefa' : 'recompensa'}`}
        fields={isTasks ? TASK_FIELDS : REWARD_FIELDS}
        initial={editing || {}}
        onSave={handleSave}
        onDelete={editing?.id ? () => handleDelete(editing) : undefined}
        saving={saveTask.isPending || saveReward.isPending}
      />
    </SafeAreaView>
  );
}

function RedemptionsTab({
  query,
  onGrant,
  onRevoke,
}: {
  query: { data?: any[]; isLoading: boolean };
  onGrant: (id: string) => void;
  onRevoke: (id: string) => void;
}) {
  if (query.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#f47b25" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="p-4 pb-10">
      {(query.data || []).map((r: any) => {
        const granted = r.status === 'CONCEDIDA';
        return (
          <View
            key={r.id}
            className="flex flex-row items-center gap-3 rounded-2xl bg-card-light p-4 mb-3"
          >
            <View className="flex-1">
              <Text className="text-base font-bold text-text-light">
                {r.rewards?.title || 'Recompensa'}
              </Text>
              <Text className="text-sm text-text-secondary">
                {r.points_spent} pts ·{' '}
                {formatDateLabel(formatLocalDateKey(new Date(r.redeemed_at)))} ·{' '}
                {granted ? 'CONCEDIDA' : 'PENDENTE'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => (granted ? onRevoke(r.id) : onGrant(r.id))}
              activeOpacity={0.8}
              className={`rounded-xl px-4 py-2.5 ${granted ? 'bg-button-light' : 'bg-green-500'}`}
            >
              <Text className="text-white text-sm font-bold">
                {granted ? 'Reverter' : 'Conceder'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
      {(query.data || []).length === 0 ? (
        <Text className="text-text-secondary text-center mt-10">Nenhum resgate ainda.</Text>
      ) : null}
    </ScrollView>
  );
}
