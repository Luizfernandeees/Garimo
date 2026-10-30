# Fase 1: Fundação

## O que foi desenvolvido

**Banco de dados.** Estrutura completa para as quatro fases, com políticas de segurança, bucket de imagens e dados iniciais: 2 categorias e 15 estilos de legenda. Detalhes em [DATABASE.md](DATABASE.md).

**Site público**

- Página inicial: banner (título e texto editáveis no painel), busca, categorias, "Em destaque", "Ofertas selecionadas", "Chegaram agora" e bloco do Canal do WhatsApp.
- Página de produto: galeria, preço, preço anterior e desconto só quando confirmados, descrição, categoria, data de atualização, botão para a Shopee, aviso de variação de preço e aviso de link de afiliado.
- Página de categoria, com paginação.
- Busca por nome, palavra-chave (descrição) e nome de categoria, com filtro de categoria e mensagens para "nenhum resultado".
- Rota `/ir/[slug]`: registra o clique e redireciona para o link de afiliado sem alterar nenhum caractere. Robôs, pré-visualizações de link (WhatsApp, Instagram etc.) e pré-carregamentos seguem o link, mas não contam como clique.
- Rodapé com a marca, as categorias, as redes e os avisos de afiliado.
- Página 404, tela de erro com "Tentar de novo" e esqueletos de carregamento.
- SEO: título e descrição por página, URLs amigáveis, `sitemap.xml`, `robots.txt`, imagem de compartilhamento (Open Graph) e dados estruturados de produto.
- Logo redesenhada em SVG (#F07842), favicon e ícone para iPhone.

**Painel `/admin`**

- Login com e-mail e senha (Supabase Auth). O cadastro público fica desativado no Supabase.
- Proteção em três camadas: o proxy bloqueia quem não está logado, o servidor confere se o usuário é admin em toda página e ação, e o banco (RLS) recusa qualquer escrita de quem não é admin.
- **Visão geral:** total de produtos, publicados, rascunhos, arquivados, total de cliques, gráfico de cliques dos últimos 14 dias, mais acessados em 30 dias e últimas publicações. Todos os números vêm do banco; não há dados de vendas ou comissões.
- **Configurações:** título e texto do banner, link do Canal do WhatsApp e link do Instagram, com validação. Ao salvar, o site é atualizado na hora.
- Sair (logout).

## O que foi testado

**Segurança do banco** (Postgres 16 com a mesma estrutura do Supabase):

- Visitante vê 1 de 2 produtos (o rascunho fica oculto).
- Visitante não consegue ler cliques, inserir produtos, alterar configurações, ler estilos de legenda nem chamar funções do painel.
- Usuário logado que não é admin: a tentativa de alterar um produto não tem efeito, ele não consegue se tornar admin, não lê cliques, não chama as funções do painel e não envia arquivos para o Storage.
- Publicar sem preço é recusado.
- Desconto calculado corretamente (R$ 129,90 → R$ 79,90 = 38%).
- O histórico registra a alteração de preço com valor antigo e novo.

**Aplicação** (build de produção rodando contra um backend local compatível):

- `/ir/...` devolve `https://s.shopee.com.br/AbC123?utm_source=an_1&sub_id=a|b`, idêntico ao cadastrado, e registra a origem `instagram`.
- `/ir/` de um rascunho não redireciona para a Shopee nem conta clique.
- O robô do WhatsApp é redirecionado, mas não conta clique.
- Rascunho retorna 404. Categoria inexistente mostra "Página não encontrada" com `noindex`.
- Busca: "potes" encontra 1 produto; "eletr" encontra 2 (pelo nome da categoria); termo sem resultado mostra a mensagem certa; uma tentativa de injetar filtros na busca não expõe rascunhos.
- Login: senha errada mostra mensagem genérica; conta não-admin é recusada e desconectada; admin entra; sair encerra a sessão e o painel volta a pedir login.
- Configurações: link inválido é recusado; link válido salva e o botão do canal aparece no site.
- Layout conferido em 390 px (celular) e 1366 px (desktop), sem rolagem horizontal.

**Ainda não testado:** o login contra o Supabase real e o deploy no Netlify. Isso depende do seu projeto e da sua conta, e o checklist está em [DEPLOY.md](DEPLOY.md). Também não houve teste em aparelhos físicos (iPhone e Android); a validação foi feita em um navegador simulando celular.

## O que ainda falta (próximas fases)

- **Fase 2, produtos:** cadastro e edição pelo painel, upload de imagens, galeria, rascunho/publicar/arquivar, gestão de categorias e tela de histórico. Também a tentativa de preenchimento automático pela API oficial de afiliados da Shopee, que exige que sua conta seja aprovada e que você gere o App ID e o Secret.
- **Fase 3, legendas com IA:** gerador, estilos editáveis, histórico e botões de cópia e compartilhamento. Exige uma chave da API da Anthropic, que é **paga por uso**. Vou detalhar o custo antes de implementar.
- **Fase 4:** métricas por origem, revisão de SEO, testes em aparelhos reais, otimizações e publicação definitiva.

## Como testar a Fase 1

1. Siga [SETUP.md](SETUP.md) e rode `npm run dev`.
2. Abra `/admin` sem estar logado: deve ir para o login.
3. Entre com sua conta admin e confira a Visão geral (tudo zerado no início é o esperado).
4. Em Configurações, cole o link do seu Canal do WhatsApp e salve. Abra o site: o botão "Canal do WhatsApp" deve aparecer no topo e no fim da página.
5. No Supabase, em **Table Editor → products**, crie um produto de teste com `status = published`, `current_price` e um `affiliate_url`. Ele deve aparecer no site em até um minuto (a página inicial é renovada a cada 60 s).
6. Clique em "Ver oferta na Shopee": deve abrir o link exato. Volte ao painel: o clique aparece no gráfico.
7. Mude o produto para `draft` no Supabase: a página dele passa a dar 404.
8. Apague o produto de teste.
