import type { MissionDefinition } from "../content/missions";
import { MissionObjectiveTracker, type MissionObjectiveProgress, type MissionOutcomeCheck } from "./MissionObjectiveTracker";

export interface MissionObjectiveEvent {
  type:
    | "enemy-defeated"
    | "player-health-changed"
    | "barrier-destroyed"
    | "player-crater-created"
    | "player-hit-under-strong-wind";
  count?: number;
  health?: number;
  wind?: number;
}

/**
 * Small integration boundary between BattleScene and the deterministic
 * mission-objective tracker. Keeping event translation here prevents Phaser
 * concerns from leaking into mission rules and gives the battle scene one
 * stable API to feed gameplay facts into.
 */
export class MissionObjectiveRuntime {
  readonly tracker: MissionObjectiveTracker;

  constructor(mission: MissionDefinition, playerHealth: number) {
    this.tracker = new MissionObjectiveTracker(mission);
    this.tracker.reset(playerHealth);
  }

  apply(event: MissionObjectiveEvent): void {
    switch (event.type) {
      case "enemy-defeated":
        this.tracker.onEnemyDefeated();
        break;
      case "player-health-changed":
        this.tracker.onPlayerHealthChanged(event.health ?? 0);
        break;
      case "barrier-destroyed":
        this.tracker.onBarrierDestroyed(event.count ?? 1);
        break;
      case "player-crater-created":
        this.tracker.onPlayerCraterCreated(event.count ?? 1);
        break;
      case "player-hit-under-strong-wind":
        this.tracker.onPlayerHitUnderStrongWind(event.wind ?? 0);
        break;
    }
  }

  get progress(): MissionObjectiveProgress {
    return this.tracker.progress;
  }

  checkOutcome(): MissionOutcomeCheck {
    return this.tracker.checkOutcome();
  }
}
