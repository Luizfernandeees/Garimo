# Banco de dados

Toda a estrutura está versionada em `supabase/migrations/`. Nunca altere tabelas direto pelo painel do Supabase: crie uma nova migration (`npx supabase migration new nome`) para manter o histórico.

## Tabelas

| Tabela | Para que serve | Quem lê | Quem escreve |
|---|---|---|---|
| `products` | Catálogo | Público: só `published`. Admin: tudo | Admin |
| `categories` | Categorias | Público | Admin |
| `product_images` | Galeria de fotos | Público: só de produtos publicados | Admin |
| `product_history` | Histórico de alterações | Admin | Trigger automático |
| `clicks` | Cliques em "Ver oferta" | Admin | Função `register_click` |
| `caption_styles` | Estilos de legenda (Fase 3) | Admin | Admin |
| `captions` | Legendas geradas (Fase 3) | Admin | Admin |
| `ai_usage` | Consumo da IA, para controle de custo (Fase 3) | Admin | Servidor (Fase 3) |
| `site_settings` | Banner e links das redes (linha única) | Público | Admin |
| `admin_users` | Quem pode entrar no painel | O próprio usuário | Só via SQL no painel do Supabase |

## Regras importantes em `products`

- **Status:** `draft` (rascunho), `published` (publicado) e `archived` (arquivado). Só `published` aparece no site.
- **Preços** em `numeric(10,2)`. Um produto não pode ser publicado sem `current_price`; o próprio banco recusa.
- **Desconto** (`discount_percent`) é uma coluna calculada pelo banco e não pode ser digitada. Ela só existe quando `previous_price_confirmed = true` e o preço anterior é maior que o atual. O site mostra o preço riscado e o selo de desconto apenas nesse caso.
- **Link de afiliado** (`affiliate_url`) é guardado exatamente como foi colado e devolvido sem alterações pela rota `/ir/[slug]`. Precisa começar com `https://`.
- **`published_at`** é preenchido automaticamente quando o produto passa para "publicado".
- **`updated_at`** é atualizado em toda edição. É a data mostrada como "Atualizado em".
- **Histórico:** toda inclusão e alteração gera uma linha em `product_history`, com os campos alterados (valor antigo e novo) e quem alterou.

## Segurança (RLS)

Todas as tabelas têm Row Level Security ativado, e as permissões são concedidas explicitamente.

- A função `is_admin()` verifica se o usuário logado está em `admin_users`. Todas as políticas de escrita dependem dela.
- Visitantes usam a chave publicável e só conseguem **ler** produtos publicados, suas imagens, categorias e configurações do site.
- Um usuário logado que **não** é admin tem exatamente o mesmo acesso de um visitante.
- Cliques só podem ser gravados pela função `register_click(slug, origem)`. Ela só aceita produtos publicados, limpa o texto da origem e não grava IP, navegador nem qualquer dado pessoal.
- As funções do painel (`top_clicked_products`, `clicks_by_day`) recusam quem não é admin.

Estas regras foram testadas num Postgres com a mesma estrutura. Os casos verificados estão em [FASE-1.md](FASE-1.md).

## Funções usadas pelo painel

- `admin_save_product(id, dados, imagens)`: cria ou edita um produto e substitui a galeria numa única transação. Gera um endereço (slug) único a partir do nome na criação (`fone-x`, `fone-x-2`...) e não muda o endereço depois, para não quebrar links já compartilhados. Roda com as permissões de quem chama, então o RLS continua valendo e só admin consegue usar.
- `admin_category_counts()`: quantos produtos (e quantos publicados) cada categoria tem.

## Imagens

A primeira imagem da galeria é a principal e fica também em `products.image_url`. Todas ficam em `product_images`, na ordem escolhida no painel. As fotos enviadas pelo painel são reduzidas no navegador (até 1600 px, WebP) e ficam em `product-images/produtos/AAAA/MM/`. Ao remover uma foto da galeria e salvar, o arquivo também é apagado do Storage.

## Storage

O bucket `product-images` é público para leitura, para que as imagens apareçam no site, com limite de 5 MB por arquivo e apenas JPEG, PNG, WebP e AVIF. Upload, troca e remoção são permitidos só para admins. Não há política de listagem, então ninguém consegue listar o conteúdo do bucket pela API.

## Adicionar outro administrador no futuro

Crie o usuário em **Authentication → Users** e rode `supabase/snippets/add_admin.sql` com o novo e-mail. Para remover o acesso, apague a linha correspondente em `admin_users`.

## Regenerar os tipos TypeScript

Sempre que a estrutura mudar:

```bash
npm run db:types
```
