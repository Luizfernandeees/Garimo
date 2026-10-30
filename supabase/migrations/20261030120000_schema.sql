-- =====================================================================
-- GARIMO · 001 · Estrutura principal
-- Tabelas, tipos, índices e triggers. Segurança (RLS) fica em 002.
-- =====================================================================

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type public.product_status as enum ('draft', 'published', 'archived');

-- ---------------------------------------------------------------------
-- Administradores
-- Só quem estiver nesta tabela tem acesso ao painel. Linhas são
-- inseridas manualmente via SQL (ver supabase/snippets/add_admin.sql).
-- ---------------------------------------------------------------------
create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
comment on table public.admin_users is 'Usuários autorizados a acessar o painel /admin.';

-- ---------------------------------------------------------------------
-- Categorias
-- ---------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 60),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (description is null or char_length(description) <= 300),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Produtos
-- Preços em reais, numeric(10,2). O desconto NUNCA é digitado:
-- é calculado e só existe quando o preço anterior foi confirmado.
-- ---------------------------------------------------------------------
create table public.products (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null check (char_length(name) between 3 and 200),
  slug                     text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description              text check (description is null or char_length(description) <= 5000),
  current_price            numeric(10,2) check (current_price is null or current_price >= 0),
  previous_price           numeric(10,2) check (previous_price is null or previous_price >= 0),
  previous_price_confirmed boolean not null default false,
  discount_percent         smallint generated always as (
    case
      when previous_price_confirmed
       and current_price is not null
       and previous_price is not null
       and previous_price > current_price
       and previous_price > 0
      then round((1 - current_price / previous_price) * 100)::smallint
    end
  ) stored,
  image_url                text,
  -- Link de afiliado preservado exatamente como colado pelo admin.
  affiliate_url            text not null check (affiliate_url ~* '^https://[^[:space:]]+$'),
  category_id              uuid references public.categories (id) on delete set null,
  status                   public.product_status not null default 'draft',
  is_featured              boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  published_at             timestamptz,
  -- Um produto publicado precisa ter preço atual.
  constraint products_published_needs_price
    check (status <> 'published' or current_price is not null)
);

create index products_status_published_idx on public.products (status, published_at desc);
create index products_category_idx        on public.products (category_id);
create index products_featured_idx        on public.products (published_at desc) where is_featured and status = 'published';
create index products_discount_idx        on public.products (discount_percent desc) where discount_percent is not null and status = 'published';
create index products_name_trgm_idx       on public.products using gin (name extensions.gin_trgm_ops);

-- Galeria
create table public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url        text not null,
  alt        text check (alt is null or char_length(alt) <= 200),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort_order);

-- Histórico básico de alterações (preenchido por trigger)
create table public.product_history (
  id         bigint generated always as identity primary key,
  product_id uuid not null references public.products (id) on delete cascade,
  changed_by uuid references auth.users (id) on delete set null,
  action     text not null,
  changes    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index product_history_product_idx on public.product_history (product_id, created_at desc);

-- ---------------------------------------------------------------------
-- Cliques (sem IP, sem user-agent, sem dado pessoal)
-- ---------------------------------------------------------------------
create table public.clicks (
  id         bigint generated always as identity primary key,
  product_id uuid not null references public.products (id) on delete cascade,
  source     text not null default 'direto' check (char_length(source) <= 32),
  created_at timestamptz not null default now()
);
create index clicks_product_created_idx on public.clicks (product_id, created_at desc);
create index clicks_created_idx         on public.clicks (created_at desc);

-- ---------------------------------------------------------------------
-- Legendas (usadas na Fase 3)
-- ---------------------------------------------------------------------
create table public.caption_styles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(name) between 2 and 60),
  description text check (description is null or char_length(description) <= 500),
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table public.captions (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  style_id   uuid references public.caption_styles (id) on delete set null,
  style      text not null,                      -- nome do estilo no momento da geração
  format     text not null default 'generic' check (format in ('generic', 'instagram', 'whatsapp')),
  length     text not null default 'full'    check (length in ('short', 'full')),
  content    text not null check (char_length(content) <= 4000),
  created_at timestamptz not null default now()
);
create index captions_product_idx on public.captions (product_id, created_at desc);

-- Controle de custo da IA (Fase 3)
create table public.ai_usage (
  id            bigint generated always as identity primary key,
  model         text not null,
  input_tokens  integer not null default 0,
  output_tokens integer not null default 0,
  product_id    uuid references public.products (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index ai_usage_created_idx on public.ai_usage (created_at desc);

-- ---------------------------------------------------------------------
-- Configurações do site (linha única, id = 1)
-- ---------------------------------------------------------------------
create table public.site_settings (
  id                   smallint primary key default 1 check (id = 1),
  hero_title           text not null default 'Boas descobertas, bons preços.' check (char_length(hero_title) <= 90),
  hero_subtitle        text not null default 'A GARIMO seleciona produtos e ofertas da Shopee para você encontrar boas oportunidades de compra.' check (char_length(hero_subtitle) <= 220),
  whatsapp_channel_url text check (whatsapp_channel_url is null or whatsapp_channel_url ~* '^https://(www\.)?whatsapp\.com/channel/[A-Za-z0-9]+/?$'),
  instagram_url        text check (instagram_url is null or instagram_url ~* '^https://(www\.)?instagram\.com/[A-Za-z0-9_.]+/?$'),
  updated_at           timestamptz not null default now()
);

-- =====================================================================
-- Funções e triggers
-- =====================================================================

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- published_at: definido sempre que o produto entra em "publicado"
create or replace function public.set_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger products_set_published_at
  before insert or update of status on public.products
  for each row execute function public.set_published_at();

-- Histórico de alterações
create or replace function public.log_product_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  diff jsonb;
begin
  if tg_op = 'INSERT' then
    insert into public.product_history (product_id, changed_by, action, changes)
    values (new.id, auth.uid(), 'created', jsonb_build_object('status', new.status));
    return new;
  end if;

  select coalesce(
           jsonb_object_agg(n.key, jsonb_build_object('de', o.value, 'para', n.value)),
           '{}'::jsonb)
    into diff
    from jsonb_each(to_jsonb(new)) n
    join jsonb_each(to_jsonb(old)) o on o.key = n.key
   where n.value is distinct from o.value
     and n.key not in ('updated_at', 'published_at', 'discount_percent');

  if diff <> '{}'::jsonb then
    insert into public.product_history (product_id, changed_by, action, changes)
    values (
      new.id,
      auth.uid(),
      case when old.status is distinct from new.status
           then 'status:' || new.status::text
           else 'updated' end,
      diff
    );
  end if;
  return new;
end;
$$;

create trigger products_log_change
  after insert or update on public.products
  for each row execute function public.log_product_change();
