import { clamp } from "./math.js";

export interface ChargeState {
  value: number;
  direction: 1 | -1;
}

export type ChargeRating = "perfect" | "good" | "off";

export interface ChargeExecution {
  actual: number;
  target: number;
  error: number;
  rating: ChargeRating;
}

export function stepCharge(
  state: ChargeState,
  speed: number,
  deltaSeconds: number,
  min = 22,
  max = 100,
): ChargeState {
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  let value = clamp(state.value, safeMin, safeMax);
  let direction: 1 | -1 = state.direction;
  let remaining = Math.max(0, speed) * Math.max(0, deltaSeconds);

  while (remaining > 0) {
    const boundary = direction > 0 ? safeMax : safeMin;
    const distance = Math.abs(boundary - value);

    if (remaining <= distance) {
      value += remaining * direction;
      remaining = 0;
    } else {
      value = boundary;
      remaining -= distance;
      direction = direction > 0 ? -1 : 1;
    }
  }

  return { value, direction };
}

export function rateChargeExecution(actual: number, target: number): ChargeExecution {
  const safeActual = clamp(actual, 0, 100);
  const safeTarget = clamp(target, 0, 100);
  const error = Math.abs(safeActual - safeTarget);
  const rating: ChargeRating = error <= 2.5 ? "perfect" : error <= 7 ? "good" : "off";

  return {
    actual: safeActual,
    target: safeTarget,
    error,
    rating,
  };
}
