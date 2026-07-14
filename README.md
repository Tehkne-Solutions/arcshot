# ArcShot

Jogo de artilharia tática em turnos que combina lançamento físico acessível, precisão competitiva, vento, terreno destrutível, armas especiais e batalhas contra NPCs.

**Produto Tehkné Solutions.**

## Stack

- Phaser 3 + TypeScript + Vite
- Núcleo balístico determinístico compartilhado
- Asset Factory dirigida por manifestos JSON
- Colyseus para a futura camada multiplayer autoritativa
- Vitest para testes do núcleo
- GitHub Actions para validação contínua

## O que já está jogável

- Menu com campanha, desafio NPC e multiplayer sinalizado como próxima etapa
- Cinco missões single-player
- Batalha por turnos contra NPC
- Mira tática por ângulo e potência
- Mira rápida por arrastar e soltar
- Vento variável
- Prévia de trajetória
- Quatro armas geradas por manifesto
- Munição, espalhamento, perfuração e explosões diferentes
- Terreno deformável por crateras
- Barreiras destrutíveis
- Dano radial, empurrão e queda
- IA que busca soluções balísticas
- Salvamento local de estrelas

## Executar

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite.

## Validar tudo

```bash
npm run check
```

## Asset Factory

Os conteúdos ficam em `asset-definitions/`. Rode:

```bash
npm run assets:validate
npm run assets:build
npm run assets:watch
```

A fábrica valida os manifestos, gera SVGs provisórios, o catálogo do jogo, o Asset Pack do Phaser e um catálogo visual HTML.

## Controles

- `A / D`: movimentação limitada
- `W / S`: ângulo
- `Q / E`: potência
- `1–4`: selecionar arma
- `Espaço`: disparar
- `Tab`: alternar mira tática e rápida
- Mouse: arrastar e soltar no modo rápido
- `R`: reiniciar missão
- `Esc`: voltar ao menu

## Estrutura

```text
apps/game             Cliente Phaser
apps/server           Base Colyseus para multiplayer
packages/game-core    Regras e balística compartilhadas
packages/asset-factory Automação de conteúdo
asset-definitions     Manifestos de armas e personagens
assets-source         Entrada futura para artes definitivas
```

© Tehkné Solutions
