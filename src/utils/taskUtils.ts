/**
 * Retorna a pergunta apropriada baseada no unit_label da tarefa
 */
export function getTaskQuestion(unitLabel: string): string {
  const label = unitLabel.toLowerCase().trim();

  const questions: Record<string, string> = {
    'treino': 'Quantos treinos você fez?',
    'sessão': 'Quantas sessões você completou?',
    'noite': 'Quantas noites?',
    'apresentação': 'Quantas apresentações você leu?',
    'questões': 'Quantas questões você resolveu?',
    'ler': 'Quantas vezes você leu?',
    'vez': 'Quantas vezes você fez?',
    'hora': 'Quantas horas você dedicou?',
    'refeição': 'Quantas refeições você preparou?',
    'dia': 'Quantos dias você completou?',
    'página': 'Quantas páginas você leu?',
    'capítulo': 'Quantos capítulos você leu?',
    'minuto': 'Quantos minutos você praticou?',
    'exercício': 'Quantos exercícios você fez?',
    'tarefa': 'Quantas tarefas você completou?',
  };

  return questions[label] || `Quantas vezes você completou?`;
}

/**
 * Retorna o texto de confirmação para o total de pontos
 */
export function getPointsConfirmationText(quantity: number, unitLabel: string, points: number): string {
  return `${quantity} ${unitLabel}${quantity > 1 ? 's' : ''} = ${points} pontos`;
}

/**
 * Retorna o plural correto do unit_label
 */
export function getPluralUnitLabel(unitLabel: string, quantity: number): string {
  if (quantity === 1) return unitLabel;

  const label = unitLabel.toLowerCase();

  // Exceções específicas
  const exceptions: Record<string, string> = {
    'sessão': 'sessões',
    'apresentação': 'apresentações',
    'questões': 'questões', // já está no plural
    'refeição': 'refeições',
    'questão': 'questões',
  };

  if (exceptions[label]) {
    return exceptions[label];
  }

  // Regra geral: adiciona 's'
  return `${unitLabel}s`;
}

/**
 * Formata o texto de descrição de pontos
 */
export function formatPointsDescription(pointsPerUnit: number, unitLabel: string): string {
  return `${pointsPerUnit} ponto${pointsPerUnit > 1 ? 's' : ''} por ${unitLabel}`;
}