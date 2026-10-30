# Configuração: Supabase e ambiente local

> **Projeto atual da GARIMO:** `ibylzipnfjkymmnhqxwt` (antigo "Leleo corte project", região Canadá). As 6 migrations já foram aplicadas pelo conector em 30/10/2026. Pule os passos 1 e 3 e comece pelo passo 2. Neste projeto, **não use `npx supabase db push`**: as migrations foram registradas com outras versões, e o CLI tentaria aplicá-las de novo. Novas mudanças de banco serão aplicadas pelo conector ou, se preferir o CLI, depois de um `npx supabase migration repair`.

Tempo estimado: 20 minutos. Tudo aqui usa o plano gratuito.

## 1. Criar o projeto no Supabase

1. Acesse https://supabase.com e crie uma conta (pode entrar com o GitHub).
2. **New project**. Sugestões:
   - Nome: `garimo`
   - Região: **South America (São Paulo)**, mais perto do seu público.
   - Senha do banco: gere uma forte e guarde num gerenciador de senhas. O site não usa essa senha; ela só serve para acesso direto ao banco.
3. Aguarde o projeto ficar pronto (1 a 2 minutos).

## 2. Desativar o cadastro público

Em **Authentication → Sign In / Providers**, desligue **Allow new users to sign up** e salve.

Assim ninguém consegue criar conta pelo site ou pela API. Só você cria usuários, pelo painel do Supabase.

## 3. Aplicar as migrations

As migrations criam tabelas, políticas de segurança, o bucket de imagens e os dados iniciais. Escolha **uma** das opções.

### Opção A: Supabase CLI (recomendada)

O `npx` baixa o CLI na primeira vez que for usado; não é preciso instalar nada.

```bash
npx supabase login                      # abre o navegador para autorizar
npx supabase init                       # cria supabase/config.toml (não mexe nas migrations)
npx supabase link --project-ref SEU_REF # o "ref" é o código na URL do projeto
npx supabase db push                    # aplica as 6 migrations
```

### Opção B: SQL Editor (sem instalar nada)

No painel do Supabase, abra **SQL Editor** e execute o conteúdo de cada arquivo de `supabase/migrations/`, **na ordem do nome**:

1. `20261030120000_schema.sql`
2. `20261030120100_security.sql`
3. `20261030120200_storage.sql`
4. `20261030120300_initial_data.sql`
5. `20261031120000_product_management.sql`
6. `20261031130000_dashboard_invoker.sql`

> Se escolher a opção B agora, poderá usar o CLI depois, mas ele não saberá que essas migrations já foram aplicadas. Nesse caso, rode `npx supabase migration repair --status applied <versão>` para cada arquivo antes do próximo `db push`.

## 4. Criar o administrador

1. Em **Authentication → Users → Add user → Create new user**, informe seu e-mail e uma senha forte. Marque **Auto Confirm User**.
2. No **SQL Editor**, abra `supabase/snippets/add_admin.sql`, troque o e-mail pelo seu e execute.

O login no painel só funciona para usuários que estão na tabela `admin_users`. Uma conta criada no Auth mas fora dessa tabela recebe a mensagem "Esta conta não tem acesso ao painel".

## 5. Pegar as chaves

Em **Project Settings → API Keys** (ou no botão **Connect** do topo):

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **Publishable key** (`sb_publishable_...`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Projetos antigos mostram a chave `anon` (um JWT longo); ela também funciona no lugar da publicável.

**Não use a secret key / service_role em lugar nenhum deste projeto.** A Fase 1 não precisa dela, e ela ignora todas as regras de segurança.

## 6. Rodar localmente

Requisitos: Node.js 20.9 ou mais novo (recomendado: 22).

```bash
npm install
cp .env.example .env.local
# edite .env.local com a URL e a chave publicável
npm run dev
```

- Site: http://localhost:3000
- Painel: http://localhost:3000/admin

Para cadastrar produtos, entre no painel e use **Produtos → Cadastrar produto**. O passo a passo está em [FASE-2.md](FASE-2.md).

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Painel diz "O Supabase ainda não foi configurado" | `.env.local` ausente ou com nome de variável errado. Reinicie o `npm run dev` depois de editar. |
| "E-mail ou senha incorretos" com a senha certa | Usuário não confirmado. Marque **Auto Confirm User** ao criar, ou confirme em Authentication → Users. |
| "Esta conta não tem acesso ao painel" | O e-mail não foi inserido em `admin_users` (passo 4). |
| Dashboard com aviso "Parte dos dados não carregou" | Alguma migration não foi aplicada. Confira em **Database → Migrations** ou rode `npx supabase db push`. |
| Site fora do ar depois de dias sem uso | Projetos gratuitos do Supabase são pausados após um período sem atividade. Reative em **Project → Restore**; não há custo. |
