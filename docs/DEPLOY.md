# Publicação no Netlify

## Compatibilidade verificada

- O Netlify publica Next.js com o adaptador oficial (OpenNext), instalado e atualizado **automaticamente** em cada build. Não é preciso adicionar `@netlify/plugin-nextjs` ao `package.json`; a recomendação do Netlify é não fixar a versão.
- O adaptador suporta Next.js 13.5 em diante, incluindo App Router, Server Actions, ISR/revalidação e otimização de imagens pelo Netlify Image CDN.
- O `proxy.ts` (o "middleware" do Next.js 16) roda em Node.js. A limitação do Netlify nesse ponto é não ter acesso a sistema de arquivos nem a addons C++; o nosso proxy só lê e grava cookies de sessão, então não é afetado.
- Projeto testado com Next.js 16.4 e Node.js 22.

## 1. Subir o código para o GitHub

```bash
git init
git add .
git commit -m "GARIMO: fase 1"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/garimo.git
git push -u origin main
```

Confira que `.env.local` **não** foi enviado (ele está no `.gitignore`).

## 2. Criar o site no Netlify

1. https://app.netlify.com → **Add new project → Import an existing project → GitHub**.
2. Escolha o repositório `garimo`.
3. As configurações de build vêm do `netlify.toml` (`npm run build`, Node 22). Não altere.
4. Antes de publicar, abra **Environment variables** e adicione:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | chave publicável |
| `NEXT_PUBLIC_SITE_URL` | por enquanto, `https://NOME.netlify.app` (veja o passo 3) |

5. **Deploy**.

## 3. Ajustar o endereço do site

O Netlify gera um endereço como `https://nome-aleatorio.netlify.app`. Você pode trocar o nome em **Site configuration → Change site name** (por exemplo `garimo.netlify.app`).

Depois:

1. Atualize `NEXT_PUBLIC_SITE_URL` com o endereço final, sem barra no fim.
2. **Deploys → Trigger deploy → Deploy site**. Variáveis `NEXT_PUBLIC_*` são gravadas no build, então só passam a valer num novo deploy.
3. No Supabase, em **Authentication → URL Configuration**, coloque o mesmo endereço em **Site URL**.

## 4. Conferir depois do deploy

- [ ] A página inicial abre no celular e no computador.
- [ ] `/admin` sem login leva para `/admin/login`.
- [ ] O login com a conta de admin abre a Visão geral.
- [ ] Em Configurações, salvar o link do Canal do WhatsApp faz o botão aparecer no site.
- [ ] `/robots.txt` e `/sitemap.xml` mostram o endereço correto.

## Domínio próprio (futuro)

Em **Domain management → Add a domain**. O Netlify emite o certificado HTTPS gratuitamente. Depois, atualize `NEXT_PUBLIC_SITE_URL`, a Site URL do Supabase e faça um novo deploy.

## Custos e limites

Netlify e Supabase têm planos gratuitos com **cotas** (banda, execuções de funções, otimização de imagens, armazenamento, tamanho do banco). Gratuito não significa ilimitado.

Para o volume inicial da GARIMO, os planos gratuitos devem bastar. Os limites mudam com o tempo, então confira os valores atuais nas páginas de preços (netlify.com/pricing e supabase.com/pricing) e acompanhe o uso em:

- Netlify: **Team → Usage & billing**
- Supabase: **Organization → Usage**

Nada neste projeto contrata serviço pago. Se algum limite estiver perto de estourar, o próprio painel de cada serviço avisa antes de cobrar.
