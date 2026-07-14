import type { Vec2 } from "./types.js";

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const degreesToRadians = (degrees: number): number =>
  (degrees * Math.PI) / 180;

export const distance = (a: Vec2, b: Vec2): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

export const seededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};
