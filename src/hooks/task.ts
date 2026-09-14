import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDateLabel, formatLocalDateKey, formatLocalTime } from '../lib/dateUtils';
import { supabase, Task, TaskCompletion } from '../lib/supabase';

const TASKS_QUERY_KEY = ['tasks'];
const COMPLETIONS_QUERY_KEY = ['taskCompletions'];

// Buscar todas as tarefas ativas
async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_active', true)
    .order('title');

  if (error) throw error;
  return data || [];
}

// Completar uma tarefa
interface CompleteTaskData {
  task_id: string;
  quantity: number;
  points_earned: number;
}

async function completeTask(taskData: CompleteTaskData): Promise<TaskCompletion> {
  const { data, error } = await supabase
    .from('task_completions')
    .insert(taskData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Buscar histórico de conclusões
async function fetchTaskCompletions(): Promise<TaskCompletion[]> {
  const { data, error } = await supabase
    .from('task_completions')
    .select(`
      *,
      tasks (
        id,
        title,
        icon,
        unit_label
      )
    `)
    .order('completed_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}

// Buscar conclusões agrupadas por data
interface GroupedCompletion {
  date: string;
  date_label: string;
  activities: Array<{
    id: string;
    title: string;
    quantity: number;
    points: number;
    time: string;
    icon: string;
  }>;
}

async function fetchGroupedCompletions(): Promise<GroupedCompletion[]> {
  const { data, error } = await supabase
    .rpc('get_grouped_task_completions');

  if (error) {
    // Fallback se a RPC não existir
    const completions = await fetchTaskCompletions();
    return groupCompletionsByDate(completions);
  }

  return data || [];
}

// Helper para agrupar manualmente
function groupCompletionsByDate(completions: any[]): GroupedCompletion[] {
  const grouped = new Map<string, GroupedCompletion>();

  completions.forEach((completion: any) => {
    const completedAt = new Date(completion.completed_at);
    const date = formatLocalDateKey(completedAt);
    const time = formatLocalTime(completion.completed_at);

    if (!grouped.has(date)) {
      grouped.set(date, {
        date,
        date_label: formatDateLabel(date),
        activities: [],
      });
    }

    grouped.get(date)!.activities.push({
      id: completion.id,
      title: completion.tasks?.title || 'Tarefa',
      quantity: completion.quantity,
      points: completion.points_earned,
      time: time,
      icon: completion.tasks?.icon || 'checkmark-circle-outline',
    });
  });

  return Array.from(grouped.values()).sort((a, b) =>
    b.date.localeCompare(a.date)
  );
}

// --- Admin: tarefas incluindo as desativadas + escrita ---

async function fetchAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('title');

  if (error) throw error;
  return data || [];
}

export type TaskInput = Partial<Task> & { title: string };

async function saveTask(task: TaskInput): Promise<Task> {
  const payload = { ...task, updated_at: new Date().toISOString() };

  const query = task.id
    ? supabase.from('tasks').update(payload).eq('id', task.id)
    : supabase.from('tasks').insert(payload);

  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export function useTasks() {
  return useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: fetchTasks,
  });
}

export function useAllTasks() {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, 'all'],
    queryFn: fetchAllTasks,
  });
}

export function useSaveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPLETIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });
}

export function useTaskCompletions() {
  return useQuery({
    queryKey: COMPLETIONS_QUERY_KEY,
    queryFn: fetchTaskCompletions,
  });
}

export function useGroupedTaskCompletions() {
  return useQuery({
    queryKey: [...COMPLETIONS_QUERY_KEY, 'grouped'],
    queryFn: fetchGroupedCompletions,
  });
}