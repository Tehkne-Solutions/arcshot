import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }

  preload(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const title = this.add.text(width / 2, height / 2 - 42, "ARCSHOT", {
      fontFamily: "Lexend",
      fontSize: "58px",
      fontStyle: "bold",
      color: "#eef7ff",
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 22, "Preparando arsenal...", {
      fontFamily: "Lexend",
      fontSize: "18px",
      color: "#8fa9c8",
    }).setOrigin(0.5);
    const bar = this.add.rectangle(width / 2 - 180, height / 2 + 68, 0, 8, 0x67dcff).setOrigin(0, 0.5);
    this.add.rectangle(width / 2, height / 2 + 68, 360, 8, 0x23344f).setOrigin(0.5).setDepth(-1);
    this.load.on("progress", (progress: number) => { bar.width = 360 * progress; });
    this.load.on("loaderror", () => title.setText("ERRO AO CARREGAR ASSETS"));
    this.load.pack("arcshot-pack", "assets/generated/asset-pack.json");
  }

  create(): void {
    this.scene.start("MenuScene");
  }
}
