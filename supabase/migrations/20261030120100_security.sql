-- =====================================================================
-- GARIMO · 002 · Segurança: is_admin(), RLS, permissões e RPCs
-- Regra geral: visitante só lê o que está publicado; todo o resto
-- exige um usuário autenticado presente em admin_users.
-- =====================================================================

-- ---------------------------------------------------------------------
-- is_admin(): base de todas as políticas
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Ativar RLS em todas as tabelas
-- ---------------------------------------------------------------------
alter table public.admin_users     enable row level security;
alter table public.categories      enable row level security;
alter table public.products        enable row level security;
alter table public.product_images  enable row level security;
alter table public.product_history enable row level security;
alter table public.clicks          enable row level security;
alter table public.caption_styles  enable row level security;
alter table public.captions        enable row level security;
alter table public.ai_usage        enable row level security;
alter table public.site_settings   enable row level security;

-- ---------------------------------------------------------------------
-- Permissões explícitas (RLS filtra linha a linha por cima disto)
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;

grant select on public.categories, public.products, public.product_images, public.site_settings to anon;

grant select on all tables in schema public to authenticated;
grant insert, update, delete on
  public.categories, public.products, public.product_images,
  public.caption_styles, public.captions
  to authenticated;
grant update on public.site_settings to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ---------------------------------------------------------------------
-- admin_users: cada usuário só enxerga a própria linha. Sem escrita
-- pela API: novos admins são adicionados via SQL no painel do Supabase.
-- ---------------------------------------------------------------------
create policy "admin_users: ver a própria linha"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create policy "categories: leitura pública"
  on public.categories for select to anon, authenticated
  using (true);

create policy "categories: admin insere"
  on public.categories for insert to authenticated
  with check ((select public.is_admin()));
create policy "categories: admin altera"
  on public.categories for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "categories: admin exclui"
  on public.categories for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- products: público só vê publicados; admin vê tudo
-- ---------------------------------------------------------------------
create policy "products: leitura de publicados ou admin"
  on public.products for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));

create policy "products: admin insere"
  on public.products for insert to authenticated
  with check ((select public.is_admin()));
create policy "products: admin altera"
  on public.products for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "products: admin exclui"
  on public.products for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- product_images: segue a visibilidade do produto
-- ---------------------------------------------------------------------
create policy "product_images: leitura de publicados ou admin"
  on public.product_images for select to anon, authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'published'
    )
  );

create policy "product_images: admin insere"
  on public.product_images for insert to authenticated
  with check ((select public.is_admin()));
create policy "product_images: admin altera"
  on public.product_images for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "product_images: admin exclui"
  on public.product_images for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Tabelas só do admin (leitura). Escrita via trigger/RPC.
-- ---------------------------------------------------------------------
create policy "product_history: admin lê"
  on public.product_history for select to authenticated
  using ((select public.is_admin()));

create policy "clicks: admin lê"
  on public.clicks for select to authenticated
  using ((select public.is_admin()));

create policy "ai_usage: admin lê"
  on public.ai_usage for select to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- caption_styles e captions: só admin
-- ---------------------------------------------------------------------
create policy "caption_styles: admin lê"
  on public.caption_styles for select to authenticated
  using ((select public.is_admin()));
create policy "caption_styles: admin insere"
  on public.caption_styles for insert to authenticated
  with check ((select public.is_admin()));
create policy "caption_styles: admin altera"
  on public.caption_styles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "caption_styles: admin exclui"
  on public.caption_styles for delete to authenticated
  using ((select public.is_admin()));

create policy "captions: admin lê"
  on public.captions for select to authenticated
  using ((select public.is_admin()));
create policy "captions: admin insere"
  on public.captions for insert to authenticated
  with check ((select public.is_admin()));
create policy "captions: admin altera"
  on public.captions for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "captions: admin exclui"
  on public.captions for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- site_settings: leitura pública, alteração só admin
-- ---------------------------------------------------------------------
create policy "site_settings: leitura pública"
  on public.site_settings for select to anon, authenticated
  using (true);
create policy "site_settings: admin altera"
  on public.site_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- =====================================================================
-- RPCs
-- =====================================================================

-- register_click: única forma de gravar um clique.
-- Só registra para produto publicado e devolve o link de afiliado
-- original, sem alterações. Retorna null se o produto não estiver
-- publicado.
create or replace function public.register_click(p_slug text, p_source text default 'direto')
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id  uuid;
  v_url text;
  v_src text;
begin
  select id, affiliate_url
    into v_id, v_url
    from public.products
   where slug = p_slug and status = 'published';

  if v_id is null then
    return null;
  end if;

  v_src := left(regexp_replace(lower(coalesce(p_source, '')), '[^a-z0-9_-]', '', 'g'), 32);
  if v_src = '' then
    v_src := 'direto';
  end if;

  insert into public.clicks (product_id, source) values (v_id, v_src);
  return v_url;
end;
$$;

revoke all on function public.register_click(text, text) from public;
grant execute on function public.register_click(text, text) to anon, authenticated;

-- Painel: produtos mais clicados no período
create or replace function public.top_clicked_products(p_days integer default 30, p_limit integer default 5)
returns table (product_id uuid, name text, slug text, status public.product_status, clicks bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'acesso negado' using errcode = '42501';
  end if;

  return query
    select p.id, p.name, p.slug, p.status, count(c.id)
      from public.clicks c
      join public.products p on p.id = c.product_id
     where c.created_at >= now() - make_interval(days => greatest(p_days, 1))
     group by p.id
     order by count(c.id) desc, p.name
     limit least(greatest(p_limit, 1), 50);
end;
$$;

-- Painel: cliques por dia (fuso de São Paulo), incluindo dias zerados
create or replace function public.clicks_by_day(p_days integer default 14)
returns table (day date, clicks bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'acesso negado' using errcode = '42501';
  end if;

  return query
    with days as (
      select generate_series(
               (now() at time zone 'America/Sao_Paulo')::date - (least(greatest(p_days, 1), 90) - 1),
               (now() at time zone 'America/Sao_Paulo')::date,
               interval '1 day')::date as day
    )
    select d.day, count(c.id)
      from days d
      left join public.clicks c
        on (c.created_at at time zone 'America/Sao_Paulo')::date = d.day
     group by d.day
     order by d.day;
end;
$$;

revoke all on function public.top_clicked_products(integer, integer) from public, anon;
revoke all on function public.clicks_by_day(integer) from public, anon;
grant execute on function public.top_clicked_products(integer, integer) to authenticated;
grant execute on function public.clicks_by_day(integer) to authenticated;

-- Funções de trigger não devem ser chamadas diretamente pela API
revoke all on function public.log_product_change() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.set_published_at() from public, anon, authenticated;
