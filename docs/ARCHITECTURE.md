# Arquitetura do ArcShot

## Princípios

1. O núcleo de regras não depende do Phaser.
2. Cliente e servidor reutilizam a mesma balística.
3. Conteúdo é definido por dados, não por listas fixas no código.
4. Assets provisórios e definitivos seguem o mesmo manifesto.
5. Multiplayer será autoritativo; o cliente envia intenção, não resultado.

## Fluxo de conteúdo

```text
asset-definitions + assets-source
              ↓
        Asset Factory
              ↓
catalog.json + asset-pack.json + SVG/atlas + relatório
              ↓
            Phaser
```

## Simulação

A trajetória usa passo fixo e fórmula própria. Phaser renderiza e recebe input; `@arcshot/game-core` calcula velocidade inicial, gravidade, vento, trajetória e busca balística da IA.

## Multiplayer

`apps/server` já contém uma sala Colyseus inicial. A próxima etapa é mover o estado integral da partida para a sala, processar comandos de movimento e disparo no servidor e transmitir snapshots/replays aos clientes.

## Terreno destrutível

O protótipo usa uma superfície procedural com crateras circulares. A colisão consulta a mesma representação lógica usada para desenhar o terreno. Uma evolução futura poderá trocar a malha por máscara de pixels sem alterar a API de colisão.
