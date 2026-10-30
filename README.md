# GARIMO

Boas descobertas, bons preços.

Plataforma de descoberta de produtos e ofertas da Shopee: catálogo público alimentado pelo Supabase, painel administrativo privado com cadastro de produtos e (na Fase 3) gerador de legendas com IA.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, RLS) · Netlify

## Começo rápido

```bash
npm install
cp .env.example .env.local   # preencha com os dados do seu projeto Supabase
npm run dev                  # http://localhost:3000  ·  painel em /admin
```

Antes disso, o banco precisa estar configurado. Siga, nesta ordem:

1. [docs/SETUP.md](docs/SETUP.md): criar o projeto Supabase, aplicar as migrations, criar o administrador e rodar localmente.
2. [docs/DEPLOY.md](docs/DEPLOY.md): publicar no Netlify.
3. [docs/DATABASE.md](docs/DATABASE.md): estrutura do banco e regras de segurança.
4. [docs/FASE-1.md](docs/FASE-1.md) e [docs/FASE-2.md](docs/FASE-2.md): o que cada fase entrega e como testar.

## Estrutura

```
src/
  app/
    (public)/          site público: início, busca, categoria, produto
    ir/[slug]/         registra o clique e redireciona para a Shopee
    admin/login/       login do painel
    admin/(painel)/    páginas protegidas: visão geral, produtos, categorias, configurações
  components/          brand/ (logo), public/, admin/ (formulário de produto, imagens)
  lib/
    supabase/          clientes (público, servidor, proxy) e requireAdmin()
    catalog.ts         consultas do catálogo público
    product-schema.ts  validação do cadastro de produtos
  proxy.ts             protege /admin (Next.js 16: substitui o middleware)
  types/database.ts    tipos do banco (regenerar com `npm run db:types`)
supabase/
  migrations/          estrutura, segurança, storage e dados iniciais
  snippets/            SQL de apoio (adicionar administrador)
```

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (o mesmo que o Netlify executa) |
| `npm run start` | Roda o build localmente |
| `npm run typecheck` | Verifica os tipos TypeScript |
| `npm run db:types` | Regenera `src/types/database.ts` a partir do projeto Supabase linkado |
