import { BattleScene } from "./BattleScene";
import { MenuScene } from "./MenuScene";

export class ResponsiveMenuScene extends MenuScene {
  override create(): void {
    document.body.dataset.arcshotScene = "menu";
    super.create();
  }
}

export class ResponsiveBattleScene extends BattleScene {
  override create(): void {
    document.body.dataset.arcshotScene = "battle";
    super.create();
  }
}
