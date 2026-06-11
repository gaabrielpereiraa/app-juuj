-- Joguinhos: sessões de jogo com teto diário de pontuação.
-- Rodar no Supabase SQL Editor (painel), igual ao schema.sql.

create table if not exists game_sessions (
  id uuid primary key default gen_random_uuid(),
  game_key text not null check (game_key in ('photo_quiz','timeline')),
  played_on date not null,          -- YYYY-MM-DD no fuso local do cliente
  correct_count int not null,
  total_count int not null,
  points_awarded int not null default 0,
  created_at timestamptz default now()
);

alter table game_sessions enable row level security;
create policy "public read game_sessions"  on game_sessions for select using (true);
create policy "public insert game_sessions" on game_sessions for insert with check (true);

-- Teto diário garantido no banco: só UMA sessão PONTUADA por jogo por dia.
-- Sessões cosméticas (points_awarded = 0) podem se repetir à vontade.
create unique index game_sessions_daily_award_idx
  on game_sessions (game_key, played_on) where (points_awarded > 0);
