import { degreesToRadians } from "./math.js";
import type {
  BallisticEnvironment,
  ProjectileState,
  Vec2,
  WeaponDefinition,
} from "./types.js";

export const velocityFromAim = (
  angleDegrees: number,
  power: number,
  weaponSpeed: number,
  facing: 1 | -1,
): Vec2 => {
  const radians = degreesToRadians(angleDegrees);
  const magnitude = weaponSpeed * (power / 100);
  return {
    x: Math.cos(radians) * magnitude * facing,
    y: -Math.sin(radians) * magnitude,
  };
};

export const stepProjectile = (
  state: ProjectileState,
  environment: BallisticEnvironment,
  gravityScale: number,
  deltaSeconds: number,
): ProjectileState => {
  const velocity = {
    x: state.velocity.x + environment.wind * deltaSeconds,
    y: state.velocity.y + environment.gravity * gravityScale * deltaSeconds,
  };

  return {
    position: {
      x: state.position.x + velocity.x * deltaSeconds,
      y: state.position.y + velocity.y * deltaSeconds,
    },
    velocity,
    age: state.age + deltaSeconds,
  };
};

export interface SimulationOptions {
  angle: number;
  power: number;
  facing: 1 | -1;
  origin: Vec2;
  weapon: WeaponDefinition;
  environment: BallisticEnvironment;
  fixedDelta?: number;
  maxSteps?: number;
  stopWhen?: (point: Vec2, previous: Vec2) => boolean;
}

export const simulateTrajectory = (options: SimulationOptions): Vec2[] => {
  const fixedDelta = options.fixedDelta ?? 1 / 60;
  const maxSteps = options.maxSteps ?? 300;
  const points: Vec2[] = [{ ...options.origin }];
  let state: ProjectileState = {
    position: { ...options.origin },
    velocity: velocityFromAim(
      options.angle,
      options.power,
      options.weapon.speed,
      options.facing,
    ),
    age: 0,
  };

  for (let index = 0; index < maxSteps; index += 1) {
    const previous = state.position;
    state = stepProjectile(
      state,
      options.environment,
      options.weapon.gravityScale,
      fixedDelta,
    );
    points.push({ ...state.position });
    if (options.stopWhen?.(state.position, previous)) {
      break;
    }
  }

  return points;
};
