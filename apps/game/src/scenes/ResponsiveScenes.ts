import { BattleScene } from "./BattleScene";
import { MenuScene } from "./MenuScene";
import { MissionBriefingScene } from "./MissionBriefingScene";

export class ResponsiveMenuScene extends MenuScene {
  override create(): void {
    document.body.dataset.arcshotScene = "menu";
    super.create();
  }
}

export class ResponsiveMissionBriefingScene extends MissionBriefingScene {
  override create(): void {
    document.body.dataset.arcshotScene = "briefing";
    super.create();
  }
}

export class ResponsiveBattleScene extends BattleScene {
  override create(): void {
    document.body.dataset.arcshotScene = "battle";
    super.create();
  }
}
