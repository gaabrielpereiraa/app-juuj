# Linha do tempo infinita — Design

## Objetivo
Novo joguinho no hub `/joguinhos`: modo infinito de ordenação cronológica.
Começa com 2 memórias, jogador ordena (drag), e a cada acerto soma-se uma
nova memória ao conjunto até errar (ou esgotar memórias disponíveis).

## Mecânica
1. Embaralha as memórias com foto disponíveis (`toPlayable` + filtro `photoPath`).
2. Estado: `sequence: PlayableMemory[]` (tamanho inicial 2) + `extraDeck` (resto embaralhado).
3. Jogador ordena `sequence` via `DraggableTimelineList` (já existente) e confirma.
4. `scoreTimeline(orderedSequence)`:
   - Todas corretas → `momentos = sequence.length`; se houver carta no `extraDeck`,
     pega a próxima e **acrescenta ao final** de `sequence` na ordem já confirmada
     (sem reembaralhar as existentes); jogador agora ordena `sequence.length + 1`
     itens (a nova entra numa posição embaralhada entre as existentes — ver nota).
   - Alguma errada → fim de jogo.
   - `extraDeck` vazio e tudo correto → fim de jogo (vitória total).

Nota sobre inserção da nova carta: como a sequência já está na ordem correta
(cronológica) após um acerto, a nova carta é inserida em uma posição aleatória
do array (não necessariamente cronologicamente correta) para que o jogador
precise re-arrastar; as demais mantêm sua ordem relativa entre si.

## Pontuação / persistência
- `GameKey` ganha `'timeline_infinite'` em `src/lib/supabase.ts`.
- Ao terminar (acerto total esgotando deck ou erro):
  - `correct_count = momentos` (tamanho da última rodada 100% correta;
    0 se errou já na rodada de 2)
  - `total_count = sequence.length` (tamanho da rodada que falhou, ou momentos
    se venceu tudo)
  - `points = min(momentos, INFINITE_TIMELINE_POINTS_CAP) * INFINITE_TIMELINE_POINTS_PER_HIT`
  - `eligible = !hasScoredToday('timeline_infinite')`
- Constantes em `gameLogic.ts`: `INFINITE_TIMELINE_POINTS_PER_HIT = 1`,
  `INFINITE_TIMELINE_POINTS_CAP = 10`.

## Recorde
- Novo hook `useGameRecord(gameKey)` em `hooks/gameSessions.ts`: busca o maior
  `correct_count` já salvo em `game_sessions` para o `game_key` (sem filtro de
  data — recorde histórico).

## Telas / Componentes
- Nova rota `src/app/joguinhos/linha-do-tempo-infinita.tsx`, seguindo o padrão
  de `linha-do-tempo.tsx` (loading / sem dados / jogo / resultado).
- Fase jogo: `GameHeader` + texto "Arraste pra ordenar do mais antigo ao mais
  recente" + contador "X momentos" + `DraggableTimelineList` + botão "Confirmar
  ordem".
- Fase resultado (game over), baseada no mockup fornecido:
  - "Você chegou a N momentos!" (N = `momentos`)
  - Badge "Recorde: X 🏆" (via `useGameRecord`)
  - Lista da rodada que falhou com `TimelineResultRow` (reaproveitado)
  - Indicador de pontos salvos (mesmo padrão dos outros joguinhos)
  - Botão "Jogar de novo" (reinicia com novo embaralhamento)
- Hub (`src/app/joguinhos/index.tsx`): novo `GameHubCard` "Linha do tempo
  infinita", ícone `infinite-outline`, `scoredToday={hasScoredToday('timeline_infinite')}`.

## Reaproveitamento (sem novos componentes de UI)
- `DraggableTimelineList`, `TimelineResultRow`, `scoreTimeline`, `toPlayable`,
  `GameHeader`, `GameHubCard`, `useRecordGameSession`, `useTodayGameSessions`,
  `usePoints`.

## Casos de borda
- Menos de 2 memórias com foto distintas → mensagem "Ainda não tem fotos
  suficientes..." (igual aos outros jogos).
- Memórias com a mesma `event_date` que a inicial: `buildTimelineRound` já
  evita isso para o conjunto de 4; aqui adaptamos para escolher cartas com
  datas distintas das já presentes na sequência.
