export type MissionObjectiveKind =
  | "defeat-enemy"
  | "destroy-barriers"
  | "strong-wind-hits"
  | "create-craters"
  | "survive-elite";

export interface MissionObjectiveDefinition {
  kind: MissionObjectiveKind;
  title: string;
  instruction: string;
  target: number;
  threshold?: number;
  hints: string[];
  failureText: string;
}

export interface MissionDefinition {
  id: string;
  title: string;
  subtitle: string;
  enemyHealth: number;
  windMin: number;
  windMax: number;
  barriers: number;
  enemyProfile: "rookie" | "aggressive" | "tactical";
  starTurns: [number, number, number];
  objective: MissionObjectiveDefinition;
}

export const MISSIONS: MissionDefinition[] = [
  {
    id: "m01-first-arc",
    title: "1. Primeiro Arco",
    subtitle: "Derrote o inimigo e conclua o tutorial balístico.",
    enemyHealth: 64,
    windMin: -15,
    windMax: 15,
    barriers: 0,
    enemyProfile: "rookie",
    starTurns: [4, 6, 9],
    objective: {
      kind: "defeat-enemy",
      title: "VENÇA O PRIMEIRO DUELO",
      instruction: "Reduza a vida do inimigo a zero antes que ele derrote você.",
      target: 1,
      hints: [
        "W/S ajusta o ângulo e Q/E define a potência planejada.",
        "Segure Espaço e solte o marcador dentro da faixa branca.",
      ],
      failureText: "O inimigo permaneceu de pé.",
    },
  },
  {
    id: "m02-break-the-wall",
    title: "2. Quebre a Muralha",
    subtitle: "Destrua 2 pilares rúnicos e depois derrote o inimigo.",
    enemyHealth: 78,
    windMin: -28,
    windMax: 28,
    barriers: 2,
    enemyProfile: "rookie",
    starTurns: [5, 8, 11],
    objective: {
      kind: "destroy-barriers",
      title: "ABRA CAMINHO PELA MURALHA",
      instruction: "Destrua os 2 pilares rúnicos e finalize o inimigo no mesmo duelo.",
      target: 2,
      hints: [
        "A Megabomba remove muita vida dos pilares.",
        "O Perfurador atravessa uma barreira antes de explodir.",
      ],
      failureText: "O inimigo caiu, mas a muralha obrigatória não foi destruída.",
    },
  },
  {
    id: "m03-crosswind",
    title: "3. Vento Cruzado",
    subtitle: "Acerte 2 tiros sob vento forte e vença o confronto.",
    enemyHealth: 88,
    windMin: -62,
    windMax: 62,
    barriers: 1,
    enemyProfile: "aggressive",
    starTurns: [6, 9, 13],
    objective: {
      kind: "strong-wind-hits",
      title: "DOMINE AS RAJADAS",
      instruction: "Acerte o inimigo 2 vezes quando o vento estiver em 35 ou mais e depois derrote-o.",
      target: 2,
      threshold: 35,
      hints: [
        "Vento para a direita aumenta o alcance; vento contrário reduz.",
        "A trajetória pontilhada já considera a rajada atual.",
      ],
      failureText: "Faltaram acertos válidos durante vento forte.",
    },
  },
  {
    id: "m04-crater-line",
    title: "4. Linha de Crateras",
    subtitle: "Crie 4 crateras com seus tiros e derrote o inimigo.",
    enemyHealth: 100,
    windMin: -42,
    windMax: 42,
    barriers: 3,
    enemyProfile: "aggressive",
    starTurns: [7, 10, 14],
    objective: {
      kind: "create-craters",
      title: "TRANSFORME O CAMPO",
      instruction: "Crie pelo menos 4 crateras com disparos do jogador e finalize o inimigo.",
      target: 4,
      hints: [
        "Cada impacto no terreno cria uma cratera e altera a linha de tiro.",
        "Use explosões para derrubar o rival em regiões mais baixas.",
      ],
      failureText: "O duelo terminou antes de criar as 4 crateras exigidas.",
    },
  },
  {
    id: "m05-ace-duel",
    title: "5. Duelo dos Ases",
    subtitle: "Derrote o NPC tático e termine com pelo menos 30 PV.",
    enemyHealth: 120,
    windMin: -55,
    windMax: 55,
    barriers: 2,
    enemyProfile: "tactical",
    starTurns: [8, 12, 16],
    objective: {
      kind: "survive-elite",
      title: "SOBREVIVA AO ÁS INIMIGO",
      instruction: "Derrote o NPC tático e termine a batalha com no mínimo 30 pontos de vida.",
      target: 1,
      threshold: 30,
      hints: [
        "Mude de posição para não repetir a mesma linha de impacto.",
        "Um disparo perfeito reduz o risco de desperdiçar turnos.",
      ],
      failureText: "O rival caiu, mas sua vida terminou abaixo do mínimo exigido.",
    },
  },
];
