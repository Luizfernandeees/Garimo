-- =====================================================================
-- GARIMO · 005 · Gerenciamento de produtos (Fase 2)
-- admin_save_product(): cria ou edita um produto e substitui a galeria
-- numa única transação. Roda com as permissões de quem chama
-- (security invoker), então as políticas RLS continuam valendo.
-- =====================================================================

create or replace function public.admin_save_product(
  p_id     uuid,
  p_data   jsonb,
  p_images jsonb default '[]'::jsonb
)
returns public.products
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row   public.products;
  v_base  text;
  v_slug  text;
  v_n     integer := 1;
  v_main  text := nullif(p_images -> 0 ->> 'url', '');
begin
  if not public.is_admin() then
    raise exception 'acesso negado' using errcode = '42501';
  end if;

  if jsonb_typeof(p_images) <> 'array' or jsonb_array_length(p_images) > 10 then
    raise exception 'galeria inválida (máximo de 10 imagens)' using errcode = '22023';
  end if;

  if p_id is null then
    -- Slug único a partir do sugerido: fone-x, fone-x-2, fone-x-3...
    v_base := coalesce(nullif(left(p_data ->> 'slug', 80), ''), 'produto');
    v_base := regexp_replace(v_base, '-+$', '');
    v_slug := v_base;
    while exists (select 1 from public.products where slug = v_slug) loop
      v_n := v_n + 1;
      v_slug := v_base || '-' || v_n;
    end loop;

    insert into public.products (
      name, slug, description, current_price, previous_price, previous_price_confirmed,
      image_url, affiliate_url, category_id, status, is_featured
    ) values (
      p_data ->> 'name',
      v_slug,
      nullif(p_data ->> 'description', ''),
      (p_data ->> 'current_price')::numeric,
      (p_data ->> 'previous_price')::numeric,
      coalesce((p_data ->> 'previous_price_confirmed')::boolean, false),
      v_main,
      p_data ->> 'affiliate_url',
      (p_data ->> 'category_id')::uuid,
      coalesce((p_data ->> 'status')::public.product_status, 'draft'),
      coalesce((p_data ->> 'is_featured')::boolean, false)
    )
    returning * into v_row;
  else
    update public.products set
      name                     = p_data ->> 'name',
      description              = nullif(p_data ->> 'description', ''),
      current_price            = (p_data ->> 'current_price')::numeric,
      previous_price           = (p_data ->> 'previous_price')::numeric,
      previous_price_confirmed = coalesce((p_data ->> 'previous_price_confirmed')::boolean, false),
      image_url                = v_main,
      affiliate_url            = p_data ->> 'affiliate_url',
      category_id              = (p_data ->> 'category_id')::uuid,
      status                   = coalesce((p_data ->> 'status')::public.product_status, status),
      is_featured              = coalesce((p_data ->> 'is_featured')::boolean, false)
    where id = p_id
    returning * into v_row;

    if v_row.id is null then
      raise exception 'produto não encontrado' using errcode = 'P0002';
    end if;
  end if;

  -- Galeria: a primeira imagem é a principal (products.image_url).
  delete from public.product_images where product_id = v_row.id;
  insert into public.product_images (product_id, url, alt, sort_order)
  select v_row.id, e ->> 'url', nullif(left(e ->> 'alt', 200), ''), (t.ord - 1)::integer
    from jsonb_array_elements(p_images) with ordinality as t(e, ord)
   where nullif(e ->> 'url', '') is not null;

  return v_row;
end;
$$;

revoke all on function public.admin_save_product(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.admin_save_product(uuid, jsonb, jsonb) to authenticated;

-- Contagem de produtos por categoria (para a tela de categorias)
create or replace function public.admin_category_counts()
returns table (category_id uuid, total bigint, published bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'acesso negado' using errcode = '42501';
  end if;
  return query
    select p.category_id, count(*), count(*) filter (where p.status = 'published')
      from public.products p
     where p.category_id is not null
     group by p.category_id;
end;
$$;

revoke all on function public.admin_category_counts() from public, anon;
grant execute on function public.admin_category_counts() to authenticated;

-- Busca do painel por nome
create index if not exists products_updated_idx on public.products (updated_at desc);
