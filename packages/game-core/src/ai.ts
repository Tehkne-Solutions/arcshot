import { distance } from "./math.js";
import { simulateTrajectory } from "./ballistics.js";
import type {
  AimSolution,
  BallisticEnvironment,
  Vec2,
  WeaponDefinition,
} from "./types.js";

export interface AimSearchOptions {
  origin: Vec2;
  target: Vec2;
  facing: 1 | -1;
  weapon: WeaponDefinition;
  environment: BallisticEnvironment;
  collides?: (point: Vec2) => boolean;
  angleMin?: number;
  angleMax?: number;
  powerMin?: number;
  powerMax?: number;
  precision?: "fast" | "balanced" | "precise";
}

interface SearchRange {
  angleMin: number;
  angleMax: number;
  powerMin: number;
  powerMax: number;
  angleStep: number;
  powerStep: number;
  maxSteps: number;
}

const scoreShot = (
  options: AimSearchOptions,
  angle: number,
  power: number,
  maxSteps: number,
): number => {
  const trajectory = simulateTrajectory({
    angle,
    power,
    facing: options.facing,
    origin: options.origin,
    weapon: options.weapon,
    environment: options.environment,
    maxSteps,
    stopWhen: (point) =>
      point.y > 760 ||
      point.x < -60 ||
      point.x > 1340 ||
      Boolean(options.collides?.(point)),
  });

  let score = Number.POSITIVE_INFINITY;
  for (let index = 0; index < trajectory.length; index += 1) {
    const point = trajectory[index]!;
    const targetDistance = distance(point, options.target);
    score = Math.min(score, targetDistance);

    // Atingir a área útil do alvo encerra cedo e evita milhares de verificações.
    if (targetDistance <= Math.max(16, options.weapon.blastRadius * 0.42)) break;
  }
  return score;
};

const searchRange = (
  options: AimSearchOptions,
  range: SearchRange,
  initial?: AimSolution,
): AimSolution => {
  let best = initial ?? { angle: 45, power: 70, score: Number.POSITIVE_INFINITY };

  for (let angle = range.angleMin; angle <= range.angleMax; angle += range.angleStep) {
    for (let power = range.powerMin; power <= range.powerMax; power += range.powerStep) {
      const score = scoreShot(options, angle, power, range.maxSteps);
      if (score < best.score) best = { angle, power, score };
      if (score <= 10) return best;
    }
  }

  return best;
};

export const findAimSolution = (options: AimSearchOptions): AimSolution => {
  const precision = options.precision ?? "balanced";
  const angleMin = options.angleMin ?? 12;
  const angleMax = options.angleMax ?? 82;
  const powerMin = options.powerMin ?? 30;
  const powerMax = options.powerMax ?? 100;

  const coarseStep = precision === "fast" ? 7 : precision === "balanced" ? 5 : 4;
  let best = searchRange(options, {
    angleMin,
    angleMax,
    powerMin,
    powerMax,
    angleStep: coarseStep,
    powerStep: coarseStep,
    maxSteps: precision === "fast" ? 120 : 150,
  });

  if (precision !== "fast") {
    const radius = precision === "precise" ? 5 : 4;
    best = searchRange(
      options,
      {
        angleMin: Math.max(angleMin, best.angle - radius),
        angleMax: Math.min(angleMax, best.angle + radius),
        powerMin: Math.max(powerMin, best.power - radius),
        powerMax: Math.min(powerMax, best.power + radius),
        angleStep: precision === "precise" ? 1 : 2,
        powerStep: precision === "precise" ? 1 : 2,
        maxSteps: precision === "precise" ? 190 : 165,
      },
      best,
    );
  }

  if (!Number.isFinite(best.score)) {
    return { angle: 45, power: 68, score: Number.MAX_SAFE_INTEGER };
  }

  return best;
};
