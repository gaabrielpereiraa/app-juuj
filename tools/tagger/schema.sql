-- Schema do sistema de fotos dos joguinhos (rodar no Supabase SQL Editor).
-- Depois, criar o bucket 'memories' como PÚBLICO em Storage.

-- Memórias (1 linha por encontro da lista DATAS)
create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  title text not null,
  location text,
  category text,                  -- ex: praia, chamego, festa, japa (heurística do título)
  created_at timestamptz default now(),
  unique (event_date, title)      -- permite seed idempotente (on conflict)
);

-- Fotos ligadas a uma memória
create table if not exists memory_photos (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references memories(id) on delete cascade,
  storage_path text not null,     -- caminho no bucket 'memories'
  sort_order int default 0,
  created_at timestamptz default now()
);
create index if not exists memory_photos_memory_id_idx on memory_photos(memory_id);

-- RLS: leitura pública (app usa anon key); escrita só via service_role (tagger), que ignora RLS.
alter table memories enable row level security;
alter table memory_photos enable row level security;

drop policy if exists "public read memories" on memories;
drop policy if exists "public read memory_photos" on memory_photos;
create policy "public read memories" on memories for select using (true);
create policy "public read memory_photos" on memory_photos for select using (true);
