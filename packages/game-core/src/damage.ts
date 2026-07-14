import { clamp, distance } from "./math.js";
import type { Vec2 } from "./types.js";

export interface RadialDamageResult {
  damage: number;
  impulse: Vec2;
}

export const calculateRadialDamage = (
  center: Vec2,
  target: Vec2,
  radius: number,
  maxDamage: number,
): RadialDamageResult => {
  const range = distance(center, target);
  if (range >= radius) {
    return { damage: 0, impulse: { x: 0, y: 0 } };
  }

  const factor = clamp(1 - range / radius, 0, 1);
  const normalLength = Math.max(range, 1);
  return {
    damage: Math.round(maxDamage * factor),
    impulse: {
      x: ((target.x - center.x) / normalLength) * factor,
      y: ((target.y - center.y) / normalLength) * factor,
    },
  };
};
