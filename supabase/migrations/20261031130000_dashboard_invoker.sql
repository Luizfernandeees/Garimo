-- =====================================================================
-- GARIMO · 006 · As funções do painel passam a rodar com as permissões
-- de quem chama. O admin já lê cliques e produtos pelo RLS, então não
-- precisam de privilégio extra (recomendação do Security Advisor).
-- =====================================================================
alter function public.top_clicked_products(integer, integer) security invoker;
alter function public.clicks_by_day(integer) security invoker;
