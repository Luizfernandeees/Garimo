# Fase 2: Produtos

## O que foi desenvolvido

O catálogo agora é alimentado exclusivamente pelo banco do Supabase, pelo painel. Não há nenhum produto escrito no código, e o banco começa vazio.

**Produtos** (`/admin/produtos`)

- Lista com filtros por status (Todos, Publicado, Rascunho, Arquivado), contagem de cada um, busca pelo nome e paginação.
- **Cadastrar produto** (`/admin/produtos/novo`), com os campos:
  - Link de afiliado. Só aceita links da Shopee (`shopee.com.br`, `s.shopee.com.br`, `shp.ee`) e é salvo exatamente como foi colado, com todos os parâmetros.
  - Nome e descrição.
  - Categoria.
  - "Mostrar em Em destaque".
  - Preço atual e preço anterior. Aceitam `79,90`, `79.90` ou `R$ 1.299,90`.
  - "Confirmei o preço anterior na Shopee". Só com esta confirmação o site mostra o preço riscado e o desconto, que é calculado automaticamente.
  - Imagens: envio de fotos do celular ou computador (até 10, reduzidas para 1600 px antes do envio) ou link de imagem da CDN da Shopee. A primeira é a principal, e dá para reordenar, trocar a principal e remover.
- **Prévia ao vivo:** ao lado do formulário, o cartão aparece exatamente como ficará no site, com preço, desconto, categoria e foto.
- **Salvar como rascunho** (só no painel) ou **Salvar e publicar** (vai direto para o site).
- **Editar** (`/admin/produtos/[id]`): todos os campos e as imagens. Os botões mudam conforme o status:
  - Rascunho: **Publicar** ou **Arquivar**.
  - Publicado: **Ver no site**, **Mover para rascunho** ou **Arquivar**.
  - Arquivado: **Republicar** ou **Mover para rascunho**.
- **Histórico** de cada produto: quando foi cadastrado, publicado, arquivado e editado, com os campos alterados (os preços aparecem com valor antigo e novo).
- Total de cliques do produto no topo da página de edição.

**Regras para publicar.** Um produto só vai para o site com preço atual, categoria e pelo menos uma imagem. Se faltar algo, o painel aponta o campo e não salva. Rascunhos podem ficar incompletos.

**Categorias** (`/admin/categorias`)

- Criar, editar nome, descrição e ordem no menu.
- Excluir só quando a categoria não tem produtos.
- O endereço (`/categoria/...`) é gerado na criação e não muda depois.

**Site público**

Publicar, editar, arquivar ou mudar categorias atualiza a página inicial, as páginas de categoria, a página do produto e o sitemap **na hora**, sem esperar cache. Produto arquivado ou em rascunho some do site e passa a dar "Página não encontrada".

## Testes realizados

Build de produção rodando contra um banco Postgres com a mesma estrutura do Supabase e um Storage compatível, controlado por um navegador real (Chromium):

| # | Teste | Resultado |
|---|---|---|
| 1 | Publicar com o formulário vazio | Erros em link e nome; nada salvo |
| 2 | Link da Amazon no campo de afiliado | Recusado com mensagem clara |
| 3 | Corrigir um campo com erro | A mensagem de erro some na hora |
| 4 | Envio de 2 fotos de 2000 px | Enviadas, reduzidas e exibidas na galeria |
| 5 | Prévia ao vivo | Mostra −38% com preço anterior confirmado |
| 6 | Salvar como rascunho | Criado; a página pública dá 404 |
| 7 | Publicar | Aparece na página inicial, na categoria e na página própria, com foto, R$ 79,90 e "38% mais barato" |
| 8 | Botão "Ver oferta" (`/ir/...`) | Redireciona para `https://s.shopee.com.br/7AbCdEf?utm_source=an_18000&utm_medium=affiliates&sub_id=garimo\|zap`, idêntico ao cadastrado |
| 9 | Editar o preço para 69,90 e remover uma foto | Site atualizado na hora (R$ 69,90, 46%); a foto removida foi apagada do Storage |
| 10 | Histórico | "Editado: preço atual: R$ 79,90 → R$ 69,90" |
| 11 | Arquivar | Some do site imediatamente (404) e da página inicial |
| 12 | Republicar | Volta ao site |
| 13 | Publicar sem imagem | Bloqueado com "Adicione pelo menos uma imagem para publicar" |
| 14 | Criar a categoria "Beleza e cuidados" | Aparece no menu do site |
| 15 | Telas do painel em 390 px (celular) | Sem rolagem horizontal |
| 16 | Função de salvar chamada por visitante ou por usuário não-admin | Recusada pelo banco |

**Não testado:** o seu projeto real no Supabase e no Netlify, e aparelhos físicos. Fotos em formato HEIC, que alguns iPhones usam, dependem do navegador. O Safari do iPhone normalmente converte para JPEG ao escolher a foto, mas vale testar com uma foto sua.

## Como atualizar um projeto que já tem a Fase 1

```bash
npx supabase db push
```

Isso aplica só a nova migration, `20261031120000_product_management.sql`. Pelo SQL Editor, rode apenas esse arquivo. Depois, publique o código novo no Netlify com um `git push`.

## Como testar

1. Entre no painel e abra **Produtos → Cadastrar produto**.
2. Cole um link de afiliado seu, preencha nome e preço, escolha a categoria e envie uma foto.
3. Clique em **Salvar como rascunho**. Abra o site: o produto ainda não aparece.
4. No painel, clique em **Publicar**. Recarregue o site: ele aparece em "Chegaram agora" e na categoria.
5. Clique em **Ver oferta na Shopee** no site e confira que abre o seu link.
6. Altere o preço no painel e salve. A página do produto mostra o novo valor.
7. Clique em **Arquivar**. O produto sai do site e continua na aba "Arquivado" do painel.

## Limitações conhecidas

- **Preenchimento automático pelo link:** não incluído. O caminho autorizado é a API de afiliados da Shopee, que exige a aprovação da sua conta e as credenciais (App ID e Secret). Quando você tiver, dá para adicionar um botão "Buscar dados do produto" sem mudar o resto do cadastro.
- **Fotos de um cadastro abandonado:** se você enviar fotos e sair sem salvar, os arquivos ficam no Storage sem uso. O impacto é pequeno, porque as fotos são reduzidas antes do envio.
- **Excluir produto definitivamente:** não existe. O fluxo é arquivar, como pedido, para manter o histórico.
- **Estatísticas por origem do clique:** os dados já são registrados e entram no painel na Fase 4.

## Próxima fase

**Fase 3, legendas com IA:** gerador com os 15 estilos (editáveis), versões curta e completa, Instagram e WhatsApp, histórico e botões de copiar e compartilhar. Requer uma chave da API da Anthropic, que é paga por uso. Antes de implementar, apresento a estimativa de custo e o limite diário configurável.
