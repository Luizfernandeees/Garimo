-- =====================================================================
-- GARIMO · 007 · Evitar produtos repetidos
-- 1. O mesmo link de afiliado não pode ser cadastrado duas vezes.
-- 2. O mesmo item da Shopee (loja + item) também não, mesmo que o link
--    de afiliado seja diferente (cada link gerado é único).
-- 3. Função para o painel avisar sobre nomes parecidos.
-- =====================================================================

alter table public.products
  add column if not exists shopee_item_key text
  check (shopee_item_key is null or shopee_item_key ~ '^[0-9]+\.[0-9]+$');

comment on column public.products.shopee_item_key is
  'Identificação do item na Shopee no formato loja.item, tirada do link. Usada para impedir cadastro repetido.';

-- Preenche a partir de links longos já cadastrados (…-i.LOJA.ITEM ou /product/LOJA/ITEM).
update public.products
   set shopee_item_key = coalesce(
         substring(affiliate_url from '-i\.([0-9]+\.[0-9]+)'),
         replace(substring(affiliate_url from '/product/([0-9]+/[0-9]+)'), '/', '.'))
 where shopee_item_key is null;

create unique index if not exists products_affiliate_url_key
  on public.products (affiliate_url);
create unique index if not exists products_shopee_item_key
  on public.products (shopee_item_key) where shopee_item_key is not null;

-- admin_save_product passa a gravar shopee_item_key (quando enviado).
create or replace function public.admin_save_product(
  p_id     uuid,
  p_data   jsonb,
  p_images jsonb default '[]'::jsonb
)
returns public.products
language plpgsql security invoker set search_path = '' as $$
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
    v_base := coalesce(nullif(left(p_data ->> 'slug', 80), ''), 'produto');
    v_base := regexp_replace(v_base, '-+$', '');
    v_slug := v_base;
    while exists (select 1 from public.products where slug = v_slug) loop
      v_n := v_n + 1;
      v_slug := v_base || '-' || v_n;
    end loop;

    insert into public.products (
      name, slug, description, current_price, previous_price, previous_price_confirmed,
      image_url, affiliate_url, category_id, status, is_featured, shopee_item_key
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
      coalesce((p_data ->> 'is_featured')::boolean, false),
      nullif(p_data ->> 'shopee_item_key', '')
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
      is_featured              = coalesce((p_data ->> 'is_featured')::boolean, false),
      shopee_item_key          = case when p_data ? 'shopee_item_key'
                                      then nullif(p_data ->> 'shopee_item_key', '')
                                      else shopee_item_key end
    where id = p_id
    returning * into v_row;

    if v_row.id is null then
      raise exception 'produto não encontrado' using errcode = 'P0002';
    end if;
  end if;

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

-- Produtos com nome parecido (similaridade de trigramas >= 0,5).
create or replace function public.admin_similar_products(p_name text, p_exclude uuid default null)
returns table (id uuid, name text, slug text, status public.product_status, similarity real)
language plpgsql stable security invoker set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'acesso negado' using errcode = '42501';
  end if;
  return query
    select p.id, p.name, p.slug, p.status, extensions.similarity(lower(p.name), lower(p_name))
      from public.products p
     where (p_exclude is null or p.id <> p_exclude)
       and extensions.similarity(lower(p.name), lower(p_name)) >= 0.5
     order by 5 desc
     limit 3;
end;
$$;

revoke all on function public.admin_similar_products(text, uuid) from public, anon;
grant execute on function public.admin_similar_products(text, uuid) to authenticated;
