-- Schema do Armário Virtual (rodar no Supabase SQL Editor).
-- Depois, criar o bucket 'wardrobe' como PÚBLICO em Storage (pastas raw/ e clean/).

create table if not exists wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'processing' check (status in ('processing', 'ready', 'error')),
  raw_path text not null,         -- foto original no bucket 'wardrobe'
  image_path text,                -- imagem de catálogo gerada (fundo branco, de frente)
  category text check (category in (
    'blusas', 'tube_tops', 'regatas', 'camisetas', 'camisas', 'calcas', 'shorts', 'saias',
    'vestidos', 'macacoes', 'casacos', 'calcados', 'bolsas', 'acessorios'
  )),
  name text,
  colors text[],
  pattern text,
  material text,
  formality int check (formality between 1 and 5),  -- 1 = casa, 5 = gala
  seasons text[],
  occasions text[],
  description text,               -- descrição rica usada pelo chat estilista
  error text,
  created_at timestamptz default now()
);
create index if not exists wardrobe_items_category_idx on wardrobe_items(category);

-- RLS: app usa anon key (sem auth), igual rewards/tasks. Edge Functions usam service_role.
alter table wardrobe_items enable row level security;

drop policy if exists "public all wardrobe_items" on wardrobe_items;
create policy "public all wardrobe_items" on wardrobe_items for all using (true) with check (true);

-- Storage: anon pode subir/apagar fotos no bucket 'wardrobe'
drop policy if exists "public read wardrobe" on storage.objects;
drop policy if exists "public write wardrobe" on storage.objects;
drop policy if exists "public delete wardrobe" on storage.objects;
create policy "public read wardrobe" on storage.objects for select using (bucket_id = 'wardrobe'); -- remove() precisa de select
create policy "public write wardrobe" on storage.objects for insert with check (bucket_id = 'wardrobe');
create policy "public delete wardrobe" on storage.objects for delete using (bucket_id = 'wardrobe');
