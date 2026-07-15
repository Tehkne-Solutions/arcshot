import { describe, expect, it } from "vitest";
import { rateChargeExecution, stepCharge } from "./charge.js";

describe("charge meter", () => {
  it("moves toward maximum and reflects after the boundary", () => {
    const first = stepCharge({ value: 22, direction: 1 }, 78, 0.5);
    expect(first.value).toBeCloseTo(61);
    expect(first.direction).toBe(1);

    const reflected = stepCharge({ value: 96, direction: 1 }, 20, 0.5);
    expect(reflected.value).toBeCloseTo(94);
    expect(reflected.direction).toBe(-1);
  });

  it("classifies execution windows", () => {
    expect(rateChargeExecution(70, 72).rating).toBe("perfect");
    expect(rateChargeExecution(66, 72).rating).toBe("good");
    expect(rateChargeExecution(58, 72).rating).toBe("off");
  });
});
