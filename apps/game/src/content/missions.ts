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
}

export const MISSIONS: MissionDefinition[] = [
  {
    id: "m01-first-arc",
    title: "1. Primeiro Arco",
    subtitle: "Aprenda ângulo, força e vento em um duelo curto.",
    enemyHealth: 64,
    windMin: -15,
    windMax: 15,
    barriers: 0,
    enemyProfile: "rookie",
    starTurns: [4, 6, 9],
  },
  {
    id: "m02-break-the-wall",
    title: "2. Quebre a Muralha",
    subtitle: "Use explosões ou perfuração contra as barreiras.",
    enemyHealth: 78,
    windMin: -28,
    windMax: 28,
    barriers: 2,
    enemyProfile: "rookie",
    starTurns: [5, 8, 11],
  },
  {
    id: "m03-crosswind",
    title: "3. Vento Cruzado",
    subtitle: "Corrija a trajetória sob rajadas fortes.",
    enemyHealth: 88,
    windMin: -62,
    windMax: 62,
    barriers: 1,
    enemyProfile: "aggressive",
    starTurns: [6, 9, 13],
  },
  {
    id: "m04-crater-line",
    title: "4. Linha de Crateras",
    subtitle: "Desloque o inimigo e transforme o terreno.",
    enemyHealth: 100,
    windMin: -42,
    windMax: 42,
    barriers: 3,
    enemyProfile: "aggressive",
    starTurns: [7, 10, 14],
  },
  {
    id: "m05-ace-duel",
    title: "5. Duelo dos Ases",
    subtitle: "Uma batalha completa contra o NPC tático.",
    enemyHealth: 120,
    windMin: -55,
    windMax: 55,
    barriers: 2,
    enemyProfile: "tactical",
    starTurns: [8, 12, 16],
  },
];
