# Bodas de Prata — site completo

Este ZIP contém o projeto completo do convite digital de Bodas de Prata.

## Conteúdo incluído

- Abertura animada com envelope, música e alianças de prata em 3D.
- Quatro fotos do casal, textos, contagem regressiva e localização oficial.
- Música `Ordinary` em `public/invite/assets/`.
- Código da animação, estilos, páginas e arquivos de configuração para publicar.

## Como rodar no computador

É necessário ter Node.js 22 ou superior e pnpm instalado.

```bash
pnpm install
pnpm run build
pnpm start
```

Depois, abra o endereço que aparecer no terminal.

## Como publicar

O projeto usa Vinext e gera uma aplicação compatível com Cloudflare Workers.

1. Instale as dependências com `pnpm install`.
2. Gere a versão de produção com `pnpm run build`.
3. Publique a pasta `dist/` em uma hospedagem compatível com Cloudflare Workers/Vinext.

Os arquivos visuais e a música ficam em `public/invite/assets/`. Não altere esses caminhos sem também atualizar `public/invite/index.html`.

## Arquivos principais

- `public/invite/index.html` — conteúdo e estrutura do convite.
- `public/invite/cinema.css` — visual, responsividade e animações.
- `public/invite/cinema.js` — música, sequência de cenas, controles e contagem regressiva.
- `lib/ceremony-3d.js` — cena em 3D das alianças de prata.
- `public/invite/assets/` — fotos, música, envelope, alianças e cenário.
