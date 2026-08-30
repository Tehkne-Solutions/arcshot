import type { MissionDefinition } from "../content/missions";
import { MissionObjectiveRuntime } from "./MissionObjectiveRuntime";

export interface MissionObjectiveContractResult {
  objective: MissionDefinition["objective"]["kind"];
  current: number;
  target: number;
  completed: boolean;
  victory: boolean;
  failureReason?: string;
}

/** Deterministic smoke contract for the five official objective families. */
export function evaluateMissionObjectiveContract(
  mission: MissionDefinition,
  playerHealth: number,
): MissionObjectiveContractResult {
  const runtime = new MissionObjectiveRuntime(mission, playerHealth);
  const target = mission.objective.target;

  switch (mission.objective.kind) {
    case "defeat-enemy":
      runtime.apply({ type: "enemy-defeated" });
      break;
    case "destroy-barriers":
      runtime.apply({ type: "barrier-destroyed", count: target });
      runtime.apply({ type: "enemy-defeated" });
      break;
    case "strong-wind-hits":
      for (let i = 0; i < target; i += 1) {
        runtime.apply({ type: "player-hit-under-strong-wind", wind: mission.objective.threshold ?? 35 });
      }
      runtime.apply({ type: "enemy-defeated" });
      break;
    case "create-craters":
      runtime.apply({ type: "player-crater-created", count: target });
      runtime.apply({ type: "enemy-defeated" });
      break;
    case "survive-elite":
      runtime.apply({ type: "enemy-defeated" });
      break;
  }

  const outcome = runtime.checkOutcome();
  return {
    objective: mission.objective.kind,
    current: runtime.progress.current,
    target,
    completed: runtime.progress.complete,
    victory: outcome.victory,
    failureReason: outcome.failureReason,
  };
}
