# ArcShot — Mission Objective Architecture

## Objetivo

Fechar o vertical slice de campanha sem permitir que uma missão seja considerada vencida apenas porque o NPC morreu quando o objetivo obrigatório ainda não foi cumprido.

## Fluxo oficial

```text
MissionDefinition
      ↓
MissionObjectiveTracker
      ↓
Battle gameplay events
      ↓
Objective progress
      ↓
Enemy defeated + objective complete
      ↓
Victory / stars / unlock
```

## Objetivos atuais

- `defeat-enemy`: derrotar o inimigo.
- `destroy-barriers`: destruir a quantidade de pilares exigida e derrotar o inimigo.
- `strong-wind-hits`: acertar a quantidade exigida durante vento forte e derrotar o inimigo.
- `create-craters`: criar a quantidade exigida de crateras e derrotar o inimigo.
- `survive-elite`: derrotar o inimigo e terminar com a vida mínima definida pelo threshold.

## Regra de ouro

A definição da missão já informa ao jogador o que precisa ser feito. A máquina de estado da batalha deve usar a mesma definição para decidir vitória ou derrota. Nenhuma condição deve existir somente no texto da UI.

## Estado desta etapa

`MissionObjectiveTracker` é a camada determinística e independente de Phaser. A integração com os eventos da `BattleScene` deve alimentar o tracker nos pontos reais de gameplay:

- derrota do inimigo;
- destruição efetiva de barreira;
- acerto do jogador sob vento forte;
- criação de cratera pelo jogador;
- mudança de vida do jogador.

A próxima alteração deve conectar esses eventos e substituir a validação de vitória baseada apenas em HP.
