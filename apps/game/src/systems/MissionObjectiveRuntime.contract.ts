import type { MissionDefinition } from "../content/missions";
import { MissionObjectiveRuntime } from "./MissionObjectiveRuntime";

/**
 * Executable contract for the five campaign objective families.
 * These checks intentionally avoid Phaser so mission rules can be validated
 * independently from rendering and projectile simulation.
 */
export function runMissionObjectiveContract(mission: MissionDefinition, playerHealth: number) {
  const runtime = new MissionObjectiveRuntime(mission, playerHealth);

  switch (mission.objective.type) {
    case "defeat-enemy":
      runtime.apply({ type: "enemy-defeated" });
      break;
    case "destroy-barriers":
      runtime.apply({ type: "barrier-destroyed", count: mission.objective.target });
      break;
    case "strong-wind-hits":
      for (let index = 0; index < mission.objective.target; index += 1) {
        runtime.apply({ type: "player-hit-under-strong-wind", wind: mission.objective.threshold ?? 35 });
      }
      break;
    case "create-craters":
      runtime.apply({ type: "player-crater-created", count: mission.objective.target });
      break;
    case "survive-elite":
      runtime.apply({ type: "enemy-defeated" });
      break;
  }

  return runtime.checkOutcome();
}
