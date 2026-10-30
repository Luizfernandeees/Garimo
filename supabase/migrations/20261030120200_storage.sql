-- =====================================================================
-- GARIMO · 003 · Storage de imagens
-- Bucket público para leitura das imagens pelo site; upload, troca e
-- remoção apenas por admins. Sem política de SELECT em storage.objects,
-- então ninguém consegue listar o conteúdo do bucket pela API.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "product-images: admin envia"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "product-images: admin altera"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "product-images: admin remove"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
