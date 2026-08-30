import type { MissionDefinition, MissionObjectiveKind } from "../content/missions";

export interface MissionObjectiveProgress {
  kind: MissionObjectiveKind;
  current: number;
  target: number;
  threshold?: number;
  title: string;
  instruction: string;
  complete: boolean;
}

export interface MissionOutcomeCheck {
  victory: boolean;
  objectiveComplete: boolean;
  failureReason?: string;
}

/**
 * Deterministic mission-progress state for the campaign vertical slice.
 *
 * The tracker deliberately knows nothing about Phaser, rendering or input.
 * BattleScene can feed it gameplay events and use the result to decide
 * whether the mission is actually complete.
 */
export class MissionObjectiveTracker {
  private readonly mission: MissionDefinition;
  private current = 0;
  private enemyDefeated = false;
  private playerHealth = 0;
  private playerCraterCount = 0;
  private strongWindHits = 0;
  private barriersDestroyed = 0;

  constructor(mission: MissionDefinition) {
    this.mission = mission;
  }

  reset(playerHealth: number): void {
    this.current = 0;
    this.enemyDefeated = false;
    this.playerHealth = playerHealth;
    this.playerCraterCount = 0;
    this.strongWindHits = 0;
    this.barriersDestroyed = 0;
  }

  onEnemyDefeated(): void {
    this.enemyDefeated = true;
    this.refreshCurrent();
  }

  onPlayerHealthChanged(health: number): void {
    this.playerHealth = Math.max(0, health);
  }

  onBarrierDestroyed(count = 1): void {
    this.barriersDestroyed += Math.max(0, count);
    this.refreshCurrent();
  }

  onPlayerCraterCreated(count = 1): void {
    this.playerCraterCount += Math.max(0, count);
    this.refreshCurrent();
  }

  onPlayerHitUnderStrongWind(wind: number): void {
    const threshold = this.mission.objective.threshold ?? 35;
    if (Math.abs(wind) >= threshold) {
      this.strongWindHits += 1;
      this.refreshCurrent();
    }
  }

  get progress(): MissionObjectiveProgress {
    const { objective } = this.mission;
    return {
      kind: objective.kind,
      current: this.current,
      target: objective.target,
      threshold: objective.threshold,
      title: objective.title,
      instruction: objective.instruction,
      complete: this.isPrimaryObjectiveComplete(),
    };
  }

  checkOutcome(): MissionOutcomeCheck {
    const objectiveComplete = this.isPrimaryObjectiveComplete();

    if (this.enemyDefeated && !objectiveComplete) {
      return {
        victory: false,
        objectiveComplete: false,
        failureReason: this.mission.objective.failureText,
      };
    }

    if (!this.enemyDefeated || !objectiveComplete) {
      return { victory: false, objectiveComplete };
    }

    if (this.mission.objective.kind === "survive-elite") {
      const minimumHealth = this.mission.objective.threshold ?? 30;
      if (this.playerHealth < minimumHealth) {
        return {
          victory: false,
          objectiveComplete: false,
          failureReason: this.mission.objective.failureText,
        };
      }
    }

    return { victory: true, objectiveComplete: true };
  }

  private isPrimaryObjectiveComplete(): boolean {
    const { objective } = this.mission;
    if (objective.kind === "defeat-enemy") return this.enemyDefeated;
    return this.current >= objective.target;
  }

  private refreshCurrent(): void {
    const { objective } = this.mission;
    switch (objective.kind) {
      case "defeat-enemy":
        this.current = this.enemyDefeated ? objective.target : 0;
        break;
      case "destroy-barriers":
        this.current = Math.min(this.barriersDestroyed, objective.target);
        break;
      case "strong-wind-hits":
        this.current = Math.min(this.strongWindHits, objective.target);
        break;
      case "create-craters":
        this.current = Math.min(this.playerCraterCount, objective.target);
        break;
      case "survive-elite":
        this.current = this.enemyDefeated ? objective.target : 0;
        break;
    }
  }
}
