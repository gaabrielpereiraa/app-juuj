/**
 * Utilitários de data para garantir consistência de timezone
 * O app usa o fuso horário local do dispositivo (Brasil: UTC-3)
 */

/**
 * Formata uma data para o formato YYYY-MM-DD usando o fuso horário local
 * Isso evita problemas com UTC que podem colocar a data no dia errado
 */
export function formatLocalDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Obtém a data de hoje no formato YYYY-MM-DD (fuso local)
 */
export function getTodayDateKey(): string {
    return formatLocalDateKey(new Date());
}

/**
 * Obtém a data de ontem no formato YYYY-MM-DD (fuso local)
 */
export function getYesterdayDateKey(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return formatLocalDateKey(yesterday);
}

/**
 * Cria as datas de início e fim do dia para queries no Supabase
 * Usa o fuso horário local para definir o início/fim do dia
 */
export function getDayBoundaries(date: Date): { startOfDay: string; endOfDay: string } {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    // Início do dia no fuso local (meia-noite)
    const startOfDay = new Date(year, month, day, 0, 0, 0, 0);

    // Fim do dia no fuso local (23:59:59.999)
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

    return {
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString(),
    };
}

/**
 * Cria as datas de início e fim do mês para queries no Supabase
 * Usa o fuso horário local
 */
export function getMonthBoundaries(year: number, month: number): { startOfMonth: string; endOfMonth: string } {
    // Primeiro dia do mês às 00:00:00 local
    const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);

    // Último dia do mês às 23:59:59 local
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endOfMonth = new Date(year, month, lastDay, 23, 59, 59, 999);

    return {
        startOfMonth: startOfMonth.toISOString(),
        endOfMonth: endOfMonth.toISOString(),
    };
}

/**
 * Converte uma string ISO de data para o dia do mês no fuso local
 */
export function getLocalDayFromISO(isoString: string): number {
    const date = new Date(isoString);
    return date.getDate();
}

/**
 * Formata uma string ISO de data para exibição de horário local
 */
export function formatLocalTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Formata uma data YYYY-MM-DD como DD/MM (ex: '2025-02-12' -> '12/02')
 */
export function formatDayMonth(dateKey: string): string {
    const [, month, day] = dateKey.split('-');
    return `${day}/${month}`;
}

/**
 * Formata uma data para label amigável (Hoje, Ontem, ou data formatada)
 */
export function formatDateLabel(dateKey: string): string {
    const today = getTodayDateKey();
    const yesterday = getYesterdayDateKey();

    if (dateKey === today) return 'Hoje';
    if (dateKey === yesterday) return 'Ontem';

    // Parse a data do formato YYYY-MM-DD
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
    });
}
