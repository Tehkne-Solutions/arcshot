import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }

  preload(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    const backdrop = this.add.graphics();
    backdrop.fillGradientStyle(0x120a22, 0x120a22, 0x27143f, 0x09101f, 1);
    backdrop.fillRect(0, 0, width, height);

    const title = this.add.text(width / 2, height / 2 - 58, "ARCSHOT", {
      fontFamily: "Lexend",
      fontSize: "62px",
      fontStyle: "bold",
      color: "#f7d78f",
      stroke: "#4a260d",
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 12, "Forjando o campo de batalha...", {
      fontFamily: "Lexend",
      fontSize: "18px",
      color: "#d7c7ff",
    }).setOrigin(0.5);

    const frame = this.add.rectangle(width / 2, height / 2 + 72, 390, 16, 0x07101e, 0.95)
      .setStrokeStyle(3, 0xb77a2c, 1);
    const bar = this.add.rectangle(width / 2 - 190, height / 2 + 72, 0, 10, 0x67dcff)
      .setOrigin(0, 0.5);

    this.load.on("progress", (progress: number) => {
      bar.width = 380 * progress;
    });

    this.load.on("loaderror", () => {
      title.setText("ERRO AO CARREGAR ASSETS");
      frame.setStrokeStyle(3, 0xff765f, 1);
    });

    this.load.pack("arcshot-pack", "assets/generated/asset-pack.json");

    const premium = "assets/premium";
    this.load.image("premium-arena-storm", `${premium}/arena-storm-citadel.webp`);
    this.load.image("premium-hud-overlay", `${premium}/hud-ornate-overlay.webp`);
    this.load.image("premium-brask", `${premium}/brask-forja-runa.png`);
    this.load.image("premium-kael", `${premium}/kael-corsario.png`);
    this.load.image("premium-terrain", `${premium}/terrain-rune-rock.webp`);
    this.load.image("premium-water", `${premium}/water-arcane.webp`);
    this.load.image("premium-pillar", `${premium}/rune-pillar.png`);
    this.load.image("premium-weapon-1", `${premium}/weapon-1.webp`);
    this.load.image("premium-weapon-2", `${premium}/weapon-2.webp`);
    this.load.image("premium-weapon-3", `${premium}/weapon-3.webp`);
    this.load.image("premium-weapon-4", `${premium}/weapon-4.webp`);
  }

  create(): void {
    this.scene.start("MenuScene");
  }
}
