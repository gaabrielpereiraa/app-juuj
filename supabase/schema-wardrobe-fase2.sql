-- Lookinhos fase 2: looks salvos + provador virtual (rodar no Supabase SQL Editor).
-- Depois, criar o bucket 'wardrobe-private' como PRIVADO em Storage (foto dela + imagens do provador).

create table if not exists wardrobe_looks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  item_ids uuid[] not null,
  why text,
  occasion text,                  -- a pergunta que ela fez à estilista
  tryon_path text,                -- imagem "em mim" no bucket wardrobe-private, se gerada
  created_at timestamptz default now()
);

-- cache do provador (mesmo look + mesma foto = não paga de novo) e base do limite diário
create table if not exists wardrobe_tryons (
  key text primary key,           -- sha256(ids ordenados + versão da foto dela)
  path text not null,
  created_at timestamptz default now()
);

alter table wardrobe_looks enable row level security;
alter table wardrobe_tryons enable row level security;

drop policy if exists "public all wardrobe_looks" on wardrobe_looks;
create policy "public all wardrobe_looks" on wardrobe_looks for all using (true) with check (true);
-- wardrobe_tryons: só a Edge Function (service_role) escreve/lê; sem policy para anon

-- Storage privado: app sobe a foto e gera URL assinada; sem URL pública.
-- ponytail: sem login, a anon key do APK ainda consegue assinar URLs; protege contra link vazado, não contra quem tem o APK.
drop policy if exists "anon read wardrobe-private" on storage.objects;
drop policy if exists "anon write wardrobe-private" on storage.objects;
drop policy if exists "anon update wardrobe-private" on storage.objects;
create policy "anon read wardrobe-private" on storage.objects for select using (bucket_id = 'wardrobe-private');
create policy "anon write wardrobe-private" on storage.objects for insert with check (bucket_id = 'wardrobe-private');
create policy "anon update wardrobe-private" on storage.objects for update using (bucket_id = 'wardrobe-private');
