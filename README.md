# Maria & Vítor — Nosso Mundinho ♡

Um cantinho feito com carinho, de Vítor para Maria, para transformar nossas fotinhas em moldes de Hama Beads.

## Versão 2.0 — um molde mais fofinho

- **Remoção de fundo de cor uniforme** (sem IA e sem API), com ajuste de sensibilidade
- **PNG transparente** da imagem recortada, antes da pixelização
- **Recorte manual** das quatro bordas e posicionamento horizontal/vertical
- **Centralização automática** do personagem com preservação de proporções
- **Três estilos**: Fofinho, Sticker e Fiel ao original
- **Paletas**: Original, Pastel e Vibrante
- **Preservação de contornos escuros** e limpeza de pixels soltos
- Grades de 15×15 a 60×60; opção de usar Mini 2,6 mm, Midi 5 mm ou diâmetro personalizado
- Prévia das miçangas, contador por cor, acompanhamento da montagem e exportação PNG/PDF
- **Modo Solo** e **Modo Duo** independentes para montar duas peças ao mesmo tempo
- Responsivo para celulares, incluindo iPhone

## Para melhores resultados

1. Prefira a imagem original ao print de um aplicativo.
2. Se a imagem tiver fundo branco ou cor chapada, marque **Remover fundo** e ajuste a sensibilidade.
3. Use **Recortar e posicionar a foto** para tirar cabeçalhos, marcas d'água ou espaço vazio.
4. Para personagens de corpo inteiro, experimente 40×40 ou 50×50 antes de 29×29.
5. Compare **Fofinho** com **Sticker**. O modo Sticker reforça bastante o contorno; se ficar grosso demais, desligue **Contornos**.
6. Salve o PNG recortado para conferir a limpeza do fundo.

**Limitação importante:** a remoção do fundo usa cores conectadas às bordas. Para fotos com cenários complexos, podem sobrar áreas ou desaparecer partes de cor parecida com o fundo. Este processo não usa reconhecimento de pessoas ou de objetos. O resultado também depende da quantidade de miçangas escolhida; detalhes muito finos não cabem numa grade pequena.

## Privacidade

Tudo ocorre no navegador. **Nenhuma imagem é enviada a um servidor**. Sem login, API, pagamento ou banco de dados. Fotos e marcações não persistem após atualizar a página.

## Hospedagem

Este site é estático: `index.html` e `pixel-engine.js`. Importe o repositório na Vercel como **Other**, na raiz, sem Build Command.

## Código

- `index.html`: interface, editor e exportação
- `pixel-engine.js`: tratamento de imagens local (remoção, recorte, amostragem, simplificação, contorno)
- `.github/workflows/syntax-check.yml`: verificação de sintaxe JavaScript em cada push

---

*Maria & Vítor, uma miçanguinha de cada vez. ♡*
