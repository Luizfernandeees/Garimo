-- =====================================================================
-- GARIMO · 004 · Dados iniciais (idempotente)
-- Fica em migration (e não em seed.sql) para também ir para produção.
-- =====================================================================

insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

insert into public.categories (name, slug, description, sort_order) values
  ('Eletrônicos',      'eletronicos',      'Fones, carregadores, acessórios e gadgets para o dia a dia.', 1),
  ('Casa e decoração', 'casa-e-decoracao', 'Organização, utilidades e objetos para deixar a casa do seu jeito.', 2)
on conflict (slug) do nothing;

insert into public.caption_styles (name, description, sort_order) values
  ('Chamativo',           'Abre com impacto e destaca o principal motivo para clicar.', 1),
  ('Elegante',            'Tom sofisticado, frases curtas e vocabulário cuidadoso.', 2),
  ('Engraçado',           'Bem-humorado e leve, sem exagerar nem perder a informação.', 3),
  ('Influenciador',       'Primeira pessoa, como uma indicação sincera para os seguidores.', 4),
  ('Minimalista',         'Pouquíssimas palavras: o produto, o preço e o link.', 5),
  ('Profissional',        'Objetivo e informativo, foco em características reais.', 6),
  ('Amigável',            'Conversa próxima, como uma dica entre amigos.', 7),
  ('Economia',            'Destaca o preço e a economia, somente com valores confirmados.', 8),
  ('Curiosidade',         'Abre com uma pergunta ou gancho que desperta interesse.', 9),
  ('Lista de benefícios', 'Benefícios em tópicos curtos, apenas os que constam no cadastro.', 10),
  ('Achado imperdível',   'Apresenta o produto como uma boa descoberta, sem inventar urgência.', 11),
  ('Premium',             'Valoriza qualidade e acabamento descritos no cadastro.', 12),
  ('Oferta relâmpago',    'Ritmo rápido e direto. Não afirma prazo ou estoque que não foram informados.', 13),
  ('Direto para WhatsApp','Formato curto, pronto para colar no Canal do WhatsApp.', 14),
  ('Criativo',            'Abordagem original, com metáforas ou situações do cotidiano.', 15)
on conflict (name) do nothing;
