import Phaser from "phaser";
import { ARCSHOT_THEMES, getArcshotTheme } from "../ui/theme";

export class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }

  preload(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const palette = ARCSHOT_THEMES[getArcshotTheme()];

    const backdrop = this.add.graphics();
    backdrop.fillGradientStyle(
      palette.backgroundTop,
      palette.backgroundTop,
      palette.backgroundBottom,
      palette.backgroundBottom,
      1,
    );
    backdrop.fillRect(0, 0, width, height);
    backdrop.fillStyle(palette.backgroundGlow, palette.isLight ? 0.16 : 0.24).fillCircle(width * 0.5, height * 0.42, 270);

    const crest = this.add.circle(width / 2, height / 2 - 122, 34, palette.primary, 1)
      .setStrokeStyle(5, palette.isLight ? 0xffffff : palette.accent, 0.9);
    this.add.text(crest.x, crest.y, "A", {
      fontFamily: "Lexend",
      fontSize: "28px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);

    const title = this.add.text(width / 2, height / 2 - 58, "ARCSHOT", {
      fontFamily: "Lexend",
      fontSize: "62px",
      fontStyle: "bold",
      color: palette.text,
      stroke: palette.isLight ? "#ffffff" : "#10182b",
      strokeThickness: palette.isLight ? 2 : 5,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 12, "Preparando o campo de batalha...", {
      fontFamily: "Lexend",
      fontSize: "18px",
      color: palette.muted,
    }).setOrigin(0.5);

    const frame = this.add.rectangle(width / 2, height / 2 + 72, 390, 16, palette.panelAlt, 1)
      .setStrokeStyle(3, palette.borderStrong, 0.9);
    const bar = this.add.rectangle(width / 2 - 190, height / 2 + 72, 0, 10, palette.primary)
      .setOrigin(0, 0.5);

    this.load.on("progress", (progress: number) => {
      bar.width = 380 * progress;
    });

    this.load.on("loaderror", () => {
      title.setText("ERRO AO CARREGAR ASSETS");
      frame.setStrokeStyle(3, palette.danger, 1);
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
