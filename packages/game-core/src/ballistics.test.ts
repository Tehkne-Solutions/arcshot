import { describe, expect, it } from "vitest";
import {
  findAimSolution,
  simulateTrajectory,
  velocityFromAim,
  type WeaponDefinition,
} from "./index.js";

const weapon: WeaponDefinition = {
  id: "test",
  name: "Test",
  description: "",
  damage: 30,
  blastRadius: 70,
  speed: 620,
  gravityScale: 1,
  projectileCount: 1,
  spreadDegrees: 0,
  pierce: 0,
  craterScale: 1,
  ammo: null,
  color: "#fff",
  assetKey: "weapon-test",
};

describe("ballistics", () => {
  it("creates an upward velocity for a positive angle", () => {
    const velocity = velocityFromAim(45, 100, 600, 1);
    expect(velocity.x).toBeGreaterThan(0);
    expect(velocity.y).toBeLessThan(0);
  });

  it("wind changes horizontal travel", () => {
    const still = simulateTrajectory({
      angle: 45,
      power: 70,
      facing: 1,
      origin: { x: 100, y: 500 },
      weapon,
      environment: { gravity: 380, wind: 0 },
      maxSteps: 120,
    });
    const windy = simulateTrajectory({
      angle: 45,
      power: 70,
      facing: 1,
      origin: { x: 100, y: 500 },
      weapon,
      environment: { gravity: 380, wind: 55 },
      maxSteps: 120,
    });
    expect(windy.at(-1)?.x ?? 0).toBeGreaterThan(still.at(-1)?.x ?? 0);
  });

  it("finds a useful aim solution", () => {
    const solution = findAimSolution({
      origin: { x: 160, y: 450 },
      target: { x: 850, y: 450 },
      facing: 1,
      weapon,
      environment: { gravity: 380, wind: 0 },
      precision: "fast",
    });
    expect(solution.score).toBeLessThan(80);
  });
});
