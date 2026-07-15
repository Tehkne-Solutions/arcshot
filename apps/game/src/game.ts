import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { ResponsiveBattleScene, ResponsiveMenuScene } from "./scenes/ResponsiveScenes";

document.body.dataset.arcshotScene = "boot";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  width: 1280,
  height: 720,
  backgroundColor: "#07101e",
  scene: [BootScene, ResponsiveMenuScene, ResponsiveBattleScene],
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  input: {
    keyboard: true,
    mouse: true,
    touch: true,
  },
};

new Phaser.Game(config);
window.dispatchEvent(new CustomEvent("arcshot:ready"));
