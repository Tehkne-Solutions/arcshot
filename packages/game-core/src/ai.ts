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

export const findAimSolution = (options: AimSearchOptions): AimSolution => {
  const precision = options.precision ?? "balanced";
  const angleStep = precision === "precise" ? 1 : precision === "fast" ? 5 : 2;
  const powerStep = precision === "precise" ? 1 : precision === "fast" ? 5 : 2;
  let best: AimSolution = { angle: 45, power: 70, score: Number.POSITIVE_INFINITY };

  for (
    let angle = options.angleMin ?? 12;
    angle <= (options.angleMax ?? 82);
    angle += angleStep
  ) {
    for (
      let power = options.powerMin ?? 30;
      power <= (options.powerMax ?? 100);
      power += powerStep
    ) {
      const trajectory = simulateTrajectory({
        angle,
        power,
        facing: options.facing,
        origin: options.origin,
        weapon: options.weapon,
        environment: options.environment,
        maxSteps: 270,
        stopWhen: (point) =>
          point.y > 760 || point.x < -60 || point.x > 1340 || Boolean(options.collides?.(point)),
      });

      let score = Number.POSITIVE_INFINITY;
      for (const point of trajectory) {
        score = Math.min(score, distance(point, options.target));
      }

      if (score < best.score) {
        best = { angle, power, score };
      }
    }
  }

  return best;
};
