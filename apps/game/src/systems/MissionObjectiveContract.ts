import type { MissionDefinition } from "../content/missions";
import { MissionObjectiveRuntime } from "./MissionObjectiveRuntime";

export interface MissionObjectiveContractResult {
  objective: MissionDefinition["objective"]["type"];
  current: number;
  target: number;
  completed: boolean;
  victory: boolean;
  failure: boolean;
}

/** Deterministic smoke contract for the five official objective families. */
export function evaluateMissionObjectiveContract(
  mission: MissionDefinition,
  playerHealth: number,
): MissionObjectiveContractResult {
  const runtime = new MissionObjectiveRuntime(mission, playerHealth);
  const target = mission.objective.target;

  switch (mission.objective.type) {
    case "defeat-enemy":
      runtime.apply({ type: "enemy-defeated" });
      break;
    case "destroy-barriers":
      runtime.apply({ type: "barrier-destroyed", count: target });
      break;
    case "strong-wind-hits":
      for (let i = 0; i < target; i += 1) {
        runtime.apply({ type: "player-hit-under-strong-wind", wind: mission.objective.threshold ?? 35 });
      }
      break;
    case "create-craters":
      runtime.apply({ type: "player-crater-created", count: target });
      break;
    case "survive-elite":
      runtime.apply({ type: "enemy-defeated" });
      break;
  }

  const outcome = runtime.checkOutcome();
  return {
    objective: mission.objective.type,
    current: runtime.progress.current,
    target,
    completed: runtime.progress.current >= target,
    victory: outcome.victory,
    failure: outcome.failure,
  };
}
