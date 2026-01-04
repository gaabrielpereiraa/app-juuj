import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatLocalDateKey, getDayBoundaries, getMonthBoundaries } from '../lib/dateUtils';
import { supabase, Task, TaskCompletion } from '../lib/supabase';

const HABIT_CALENDAR_QUERY_KEY = ['habitCalendar'];

interface DailyCompletion {
    date: string; // YYYY-MM-DD
    taskIds: string[];
    totalPoints: number;
}

interface HabitCalendarData {
    completionsByDay: Record<number, number>; // dia -> quantidade de tarefas
    completionsByDate: Record<string, string[]>; // data ISO -> IDs das tarefas
    streak: number;
    perfectDays: number;
}

// Buscar completions de um mês específico (apenas das 3 tarefas do calendário)
async function fetchMonthCompletions(year: number, month: number, taskIds: string[]): Promise<TaskCompletion[]> {
    const { startOfMonth, endOfMonth } = getMonthBoundaries(year, month);

    const { data, error } = await supabase
        .from('task_completions')
        .select('*')
        .in('task_id', taskIds)
        .gte('completed_at', startOfMonth)
        .lte('completed_at', endOfMonth)
        .order('completed_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

// Tarefas que aparecem no calendário de hábitos
const CALENDAR_HABIT_IDS = [
    '25a517fa-bbe2-4886-b99a-9248fbbac9bf',
    'c0d17ab2-32f8-4115-b0c2-223c4a398afa',
    'fd178439-e725-499d-8856-97b1f9aeb302',
];

// Buscar apenas as tarefas de hábitos do calendário
async function fetchActiveTasks(): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .in('id', CALENDAR_HABIT_IDS)
        .order('title');

    if (error) throw error;
    return data || [];
}

// Processar dados do calendário
function processCalendarData(completions: TaskCompletion[], totalTasks: number): HabitCalendarData {
    const completionsByDay: Record<number, number> = {};
    const completionsByDate: Record<string, string[]> = {};

    completions.forEach(completion => {
        const date = new Date(completion.completed_at);
        // Usar data local para evitar problemas de timezone
        const day = date.getDate();
        const dateKey = formatLocalDateKey(date);

        // Contar por dia (só conta uma vez por tarefa por dia)
        if (!completionsByDate[dateKey]) {
            completionsByDate[dateKey] = [];
        }
        if (!completionsByDate[dateKey].includes(completion.task_id)) {
            completionsByDate[dateKey].push(completion.task_id);
            completionsByDay[day] = (completionsByDay[day] || 0) + 1;
        }
    });

    // Calcular dias perfeitos
    const perfectDays = Object.values(completionsByDay).filter(
        count => count >= totalTasks && totalTasks > 0
    ).length;

    return {
        completionsByDay,
        completionsByDate,
        streak: calculateStreak(completionsByDate, totalTasks),
        perfectDays,
    };
}

// Calcular sequência atual
function calculateStreak(completionsByDate: Record<string, string[]>, totalTasks: number): number {
    if (totalTasks === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateKey = formatLocalDateKey(checkDate);

        const completedTasks = completionsByDate[dateKey]?.length || 0;

        // Considera perfeito se completou todas as tarefas
        if (completedTasks >= totalTasks) {
            streak++;
        } else if (i === 0) {
            // Se hoje não está perfeito, ainda conta os dias anteriores
            continue;
        } else {
            break;
        }
    }

    return streak;
}

// Salvar/atualizar completions de um dia
interface SaveDayCompletionsParams {
    date: Date;
    taskIds: string[];
    allTasks: Task[];
}

async function saveDayCompletions({ date, taskIds, allTasks }: SaveDayCompletionsParams) {
    const { startOfDay, endOfDay } = getDayBoundaries(date);

    // Buscar completions existentes do dia (apenas das 3 tarefas do calendário)
    const { data: existingCompletions } = await supabase
        .from('task_completions')
        .select('*')
        .in('task_id', CALENDAR_HABIT_IDS)
        .gte('completed_at', startOfDay)
        .lte('completed_at', endOfDay);

    const existingTaskIds = (existingCompletions || []).map(c => c.task_id);

    // Tasks para adicionar (estão em taskIds mas não existem)
    const toAdd = taskIds.filter(id => !existingTaskIds.includes(id));

    // Tasks para remover (existem mas não estão em taskIds)
    const toRemove = existingTaskIds.filter(id => !taskIds.includes(id));

    // Adicionar novos
    if (toAdd.length > 0) {
        const tasksToAdd = allTasks.filter(t => toAdd.includes(t.id));
        const insertData = tasksToAdd.map(task => ({
            task_id: task.id,
            quantity: 1,
            points_earned: task.points_per_unit,
            completed_at: date.toISOString(),
        }));

        const { error: insertError } = await supabase
            .from('task_completions')
            .insert(insertData);

        if (insertError) throw insertError;
    }

    // Remover desmarcados
    if (toRemove.length > 0 && existingCompletions) {
        const idsToRemove = existingCompletions
            .filter(c => toRemove.includes(c.task_id))
            .map(c => c.id);

        const { error: deleteError } = await supabase
            .from('task_completions')
            .delete()
            .in('id', idsToRemove);

        if (deleteError) throw deleteError;
    }

    return { added: toAdd.length, removed: toRemove.length };
}

// Hook para dados do calendário de um mês
export function useHabitCalendar(currentDate: Date) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const tasksQuery = useQuery({
        queryKey: ['tasks'],
        queryFn: fetchActiveTasks,
    });

    const completionsQuery = useQuery({
        queryKey: [...HABIT_CALENDAR_QUERY_KEY, year, month],
        queryFn: () => fetchMonthCompletions(year, month, CALENDAR_HABIT_IDS),
    });

    const calendarData = completionsQuery.data && tasksQuery.data
        ? processCalendarData(completionsQuery.data, tasksQuery.data.length)
        : {
            completionsByDay: {},
            completionsByDate: {},
            streak: 0,
            perfectDays: 0,
        };

    return {
        tasks: tasksQuery.data || [],
        completionsByDay: calendarData.completionsByDay,
        completionsByDate: calendarData.completionsByDate,
        streak: calendarData.streak,
        perfectDays: calendarData.perfectDays,
        isLoading: tasksQuery.isLoading || completionsQuery.isLoading,
        refetch: () => {
            tasksQuery.refetch();
            completionsQuery.refetch();
        },
    };
}

// Hook para obter completions de um dia específico
export function useDayCompletions(currentDate: Date, selectedDay: number | null) {
    const completionsQuery = useQuery({
        queryKey: [...HABIT_CALENDAR_QUERY_KEY, 'day', currentDate.getFullYear(), currentDate.getMonth(), selectedDay],
        queryFn: async () => {
            if (!selectedDay) return [];

            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);
            const { startOfDay, endOfDay } = getDayBoundaries(date);

            const { data, error } = await supabase
                .from('task_completions')
                .select('task_id')
                .in('task_id', CALENDAR_HABIT_IDS)
                .gte('completed_at', startOfDay)
                .lte('completed_at', endOfDay);

            if (error) throw error;
            return (data || []).map(c => c.task_id);
        },
        enabled: selectedDay !== null,
    });

    return {
        completedTaskIds: completionsQuery.data || [],
        isLoading: completionsQuery.isLoading,
        refetch: completionsQuery.refetch,
    };
}

// Hook para salvar completions de um dia
export function useSaveDayCompletions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: saveDayCompletions,
        onSuccess: () => {
            // Invalidar queries relacionadas
            queryClient.invalidateQueries({ queryKey: HABIT_CALENDAR_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['taskCompletions'] });
            queryClient.invalidateQueries({ queryKey: ['userSettings'] });
        },
    });
}
