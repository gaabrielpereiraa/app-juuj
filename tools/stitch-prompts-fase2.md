# Prompts para o Stitch — Joguinhos, fase 2

Contexto pra colar no Stitch: ele já tem o padrão visual do app (paleta creme/laranja/marrom,
"squircles", `shadow-soft`, header simples = seta de voltar + título centralizado, sem
navbar). **Mantenha esse padrão visual já estabelecido** em todas as telas abaixo — mesmas
cores, tipografia, raios de borda e espaçamento das telas de "De qual date é a foto?" e
"Linha do tempo" já existentes.

Os jogos estão agrupados por **clima/vibe**, não por ordem de implementação.

---

## Cluster 1 — "Detetive de memórias" (quizzes rápidos de raciocínio)

### Prompt 1.1 — "Quem veio primeiro?"

```
Crie uma tela de jogo "Quem veio primeiro?" para o app de casal, mantendo o padrão visual
já estabelecido (header simples com seta de voltar + título centralizado, fundo creme
#fff8dc, cards #fffcf4, laranja #f47b25, marrom #5d4037, squircles, shadow-soft).

Layout:
- Header: "Quem veio primeiro?"
- Abaixo do header, um contador de sequência destacado: "Sequência: 5 🔥" (chip pill,
  fundo #ffdbc9, texto laranja, ícone de fogo)
- Duas fotos lado a lado, ocupando quase a largura toda, formato quadrado, cantos
  arredondados (rounded-2xl), com leve sombra. Entre elas, um "VS" pequeno e divertido
  em círculo laranja.
- Abaixo de cada foto, um botão "Essa é mais antiga" (pill, borda fina, mesma altura das
  duas fotos) - ao tocar, a foto escolhida ganha destaque com borda verde ou vermelha
  conforme o acerto.
- Estado de feedback: overlay com blur, ícone de check verde ou X vermelho, texto grande
  "Acertou!" / "Essa não!" e abaixo "Sequência: 6 🔥" ou "Sua sequência foi 5. Recorde: 12 🏆"
- Estado de fim de jogo (quando erra): tela com "Sequência: 5" grande, "Recorde: 12 🏆"
  abaixo, e botão pill laranja "Jogar de novo" + botão secundário "Voltar"

Gere variações: (a) tela de jogo com as duas fotos, (b) overlay de acerto, (c) overlay de
erro / fim de jogo com recorde.
```

---

## Cluster 2 — "Linha do tempo infinita" (extensão do jogo de ordenar)

### Prompt 2.1 — "Linha do tempo infinita"

```
Crie uma tela de jogo "Linha do tempo infinita" para o app de casal — modo sobrevivência:
o jogador vai recebendo fotos uma de cada vez e precisa encaixar cada uma no lugar
cronologicamente certo dentro de uma lista vertical que vai crescendo. Mantenha o padrão
visual já estabelecido (header simples, fundo creme #fff8dc, cards #fffcf4, laranja
#f47b25, marrom #5d4037, squircles, shadow-soft, ícone de drag "reorder").

Layout principal (tela de jogo):
- Header: "Linha do tempo infinita"
- Abaixo do header, contador grande: "Sequência: 8" + chip "Recorde: 14 🏆"
- Lista vertical de cards já posicionados (mesmo estilo de card da "Linha do tempo": foto
  pequena 48px + título), com uma linha conectora fina entre eles
- Entre cada par de cards (e antes do primeiro / depois do último), um "espaço de encaixe"
  visualmente sutil: uma faixa horizontal tracejada com "+" no meio, em laranja claro,
  altura menor que os cards
- No topo ou fixo embaixo, a "carta da vez": uma foto nova em destaque (maior, com sombra
  mais forte, leve rotação como se fosse uma carta sendo segurada), pronta pra ser
  posicionada

Estados extras:
- Feedback de acerto: o espaço de encaixe escolhido pisca em verde e a carta desliza pra
  o lugar
- Feedback de erro / fim de jogo: tela cheia com "Você chegou a 8 momentos!" grande,
  "Recorde: 14 🏆" abaixo, lista final mostrando onde errou (card com borda vermelha),
  botão pill laranja "Jogar de novo"

Gere variações: (a) tela de jogo em andamento (com 4-5 cards já na lista + carta da vez +
espaços de encaixe visíveis), (b) tela de fim de jogo com recorde.
```

---

## Cluster 3 — "Revelação & Quebra-cabeça" (mais lúdicos/táteis)

### Prompt 3.1 — "Foto misteriosa"

```
Crie uma tela de jogo "Foto misteriosa" para o app de casal: a foto começa extremamente
desfocada/com zoom em um detalhe, e vai revelando gradualmente enquanto o jogador pensa.
Quanto antes acertar, mais pontos. Mantenha o padrão visual já estabelecido (header
simples, fundo creme #fff8dc, cards #fffcf4, laranja #f47b25, marrom #5d4037, squircles,
shadow-soft).

Layout:
- Header: "Foto misteriosa"
- Foto grande (proporção 4:5, cantos arredondados, borda creme grossa) com efeito de
  blur pesado / zoom em um canto, dando a sensação de "ainda não dá pra ver direito"
- Abaixo da foto, uma barra de "revelação" horizontal (estilo barra de progresso, mas em
  tom dourado/amarelo "butter") indicando quanto da imagem já foi revelada
- Texto centralizado: "Já sabe quando foi essa?"
- Grid 2x2 de botões de resposta com data + título (mesmo estilo do jogo "De qual date é
  a foto")
- Indicador de pontos possíveis no canto, indo de "+10" pra "+2" conforme a imagem revela
  (chip pequeno laranja no canto superior da foto)

Estados extras:
- Overlay de acerto: blur + check verde + foto totalmente nítida ao fundo + "Isso mesmo!
  +8 pontos 💛"
- Overlay de erro: blur + X + "Quase! Era 12/02 · Maraca"

Gere variações: (a) tela com a foto ainda bem desfocada (início), (b) tela com a foto
quase revelada (fim do tempo), (c) overlay de acerto com a foto nítida.
```

### Prompt 3.2 — "Quebra-cabeça do momento"

```
Crie uma tela de jogo "Quebra-cabeça do momento" para o app de casal: uma foto de um
encontro é cortada em uma grade 3x3 e embaralhada; o jogador arrasta as peças pra montar
a foto de novo. Mantenha o padrão visual já estabelecido (header simples, fundo creme
#fff8dc, cards #fffcf4, laranja #f47b25, marrom #5d4037, squircles, shadow-soft).

Layout:
- Header: "Quebra-cabeça do momento"
- Grade 3x3 quadrada centralizada, ocupando boa parte da tela, com cantos arredondados no
  conjunto todo (rounded-2xl) e cada peça com uma borda fina creme entre si
  (efeito "vitral")
- Uma ou duas peças fora do lugar destacadas com leve sombra/elevação, como se estivessem
  "flutuando" sendo arrastadas
- Abaixo da grade, texto discreto: "Arraste as peças pra remontar a foto"
- Contador de movimentos no topo: "12 movimentos"

Estado de conclusão:
- A foto se monta por completo, uma leve animação de "brilho" percorre a imagem
- Overlay com blur: foto completa ao fundo + texto grande "Quebra-cabeça completo!" +
  "12 movimentos" + "+6 pontos 💛" + revela a data e o título do encontro embaixo
  ("12/02 · Maraca") + botão pill laranja "Próximo Jogo"

Gere variações: (a) tela com o quebra-cabeça embaralhado em andamento, (b) tela de
conclusão com a foto completa e a data/título revelados.
```

---

## Cluster 4 — "Modo Dueto" (social / passa o celular)

### Prompt 4.1 — "Resultado do Dueto"

```
Crie uma tela de "Resultado do Dueto" para o app de casal — uma tela de placar comparando
o desempenho dos dois jogadores na mesma rodada de um joguinho (ex: "Qual é o rolê?" ou
"Quem veio primeiro?"). Mantenha o padrão visual já estabelecido (header simples, fundo
creme #fff8dc, cards #fffcf4, laranja #f47b25, marrom #5d4037, squircles, shadow-soft).

Layout:
- Header: "Resultado do Dueto"
- Texto centralizado pequeno: "Qual é o rolê? · Rodada de hoje"
- Dois cards lado a lado (ou empilhados, com "VS" entre eles), um para cada jogador:
  - Avatar/inicial circular
  - Nome
  - Placar grande: "8 de 10"
  - Uma faixa de cor sutil no card de quem ganhou (fundo levemente verde / dourado) com
    uma coroa pequena (👑) no canto
- Abaixo dos cards, uma frase fofa central: "Gabriel ganhou por 1 ponto! 💛" (ou
  "Empate! Vocês são sincronizados 💛" em caso de empate)
- Botão pill laranja "Jogar de novo" e botão secundário "Voltar pros Joguinhos"

Gere variações: (a) tela com um vencedor claro (com coroa), (b) tela de empate.
```

---

## Resumo de telas a gerar

| Cluster | Tela | Variações |
|---|---|---|
| 1. Detetive de memórias | Quem veio primeiro? | jogo, acerto, erro/recorde |
| 1. Detetive de memórias | Qual é o rolê? | pergunta, acerto, erro |
| 2. Linha do tempo infinita | Linha do tempo infinita | jogo em andamento, fim de jogo |
| 3. Revelação & Quebra-cabeça | Foto misteriosa | início (borrada), quase revelada, acerto |
| 3. Revelação & Quebra-cabeça | Quebra-cabeça do momento | embaralhado, completo |
| 4. Modo Dueto | Resultado do Dueto | vencedor, empate |
