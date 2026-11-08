# Churrasco na Medida

Organizador de churrascos feito com HTML, CSS e JavaScript, sem cadastro, servidor ou dependências adicionais.

## Como usar

Abra `index.html` em um navegador, informe os participantes e escolha carnes, bebidas e acompanhamentos. A calculadora mantém as recomendações por pessoa da versão anterior e distribui os totais entre as opções selecionadas.

O organizador também permite editar e marcar itens da lista de compras, preparar convites para compartilhar pelo WhatsApp, salvar e reutilizar planejamentos neste navegador e imprimir a lista ou salvá-la como PDF pela opção de impressão do navegador.

## SEO e Google Search Console

A página pública usa URL canônica em `https://churaconamedida.netlify.app/`, metadados para buscadores e compartilhamento, e dados estruturados JSON-LD para a ferramenta e as perguntas frequentes. O sitemap e as regras de rastreamento estão em `sitemap.xml` e `robots.txt`.

Para configurar o Google Search Console:

1. Adicione a propriedade do domínio ou a propriedade de prefixo de URL `https://churaconamedida.netlify.app/`.
2. Conclua a verificação de propriedade pelo método escolhido pelo Google. Para verificação por meta tag, substitua o comentário de exemplo no `<head>` de `index.html` pelo elemento `<meta name="google-site-verification" ...>` com o código emitido para sua propriedade. Não use um código de exemplo como se fosse uma verificação válida.
3. Envie `https://churaconamedida.netlify.app/sitemap.xml` na seção **Sitemaps** e use a inspeção de URL para solicitar rastreamento, se desejar.

Os arquivos de SEO devem ser publicados na raiz do mesmo domínio para que as URLs do sitemap e do robots.txt sejam encontradas. Metadados e conteúdo ajudam os mecanismos de busca a entender a página, mas não garantem posições específicas nos resultados.
