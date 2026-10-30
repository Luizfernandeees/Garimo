-- Rode no SQL Editor do Supabase DEPOIS de criar o usuário em
-- Authentication → Users → Add user. Troque o e-mail abaixo.
insert into public.admin_users (user_id)
select id from auth.users where email = 'seu-email@exemplo.com'
on conflict (user_id) do nothing;

-- Conferir:
select u.email, a.created_at
  from public.admin_users a
  join auth.users u on u.id = a.user_id;
