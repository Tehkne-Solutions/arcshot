import Phaser from "phaser";
import type { ArenaTheme } from "@arcshot/game-core";

interface AmbientParticle {
  object: Phaser.GameObjects.Arc;
  speedX: number;
  speedY: number;
  phase: number;
}

export class AnimatedBattlefield {
  private readonly background: Phaser.GameObjects.Image;
  private readonly backgroundGlow: Phaser.GameObjects.Image;
  private readonly water: Phaser.GameObjects.TileSprite;
  private readonly vignette: Phaser.GameObjects.Graphics;
  private readonly particles: AmbientParticle[] = [];
  private readonly lightningFlash: Phaser.GameObjects.Rectangle;
  private lightningClock = 0;
  private nextLightning = 4.5;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly width: number,
    private readonly height: number,
    readonly theme: ArenaTheme,
  ) {
    this.background = scene.add.image(width / 2, height / 2, "premium-arena-storm")
      .setDisplaySize(width, height)
      .setDepth(-12);

    this.backgroundGlow = scene.add.image(width / 2, height / 2, "premium-arena-storm")
      .setDisplaySize(width + 18, height + 14)
      .setAlpha(0.08)
      .setTint(0xbda1ff)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(-11);

    this.water = scene.add.tileSprite(width / 2, height - 66, width, 210, "premium-water")
      .setDisplaySize(width, 210)
      .setAlpha(0.88)
      .setTint(0x9fdcff)
      .setDepth(1);

    const horizonMist = scene.add.rectangle(width / 2, 470, width, 250, 0x5a3a77, 0.1)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(-4);
    scene.tweens.add({
      targets: horizonMist,
      alpha: { from: 0.045, to: 0.14 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });

    this.vignette = scene.add.graphics().setDepth(28);
    this.drawVignette();

    this.lightningFlash = scene.add.rectangle(width / 2, height / 2, width, height, 0xc5b7ff, 0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(-2);

    this.createAmbientParticles();
    this.createFloatingEmbers();
  }

  private drawVignette(): void {
    this.vignette.clear();
    this.vignette.fillStyle(0x050712, 0.34);
    this.vignette.fillRect(0, 0, this.width, 12);
    this.vignette.fillRect(0, this.height - 12, this.width, 12);
    this.vignette.fillRect(0, 0, 12, this.height);
    this.vignette.fillRect(this.width - 12, 0, 12, this.height);
    this.vignette.lineStyle(2, 0xb9782d, 0.62);
    this.vignette.strokeRoundedRect(8, 8, this.width - 16, this.height - 16, 12);
  }

  private createAmbientParticles(): void {
    for (let index = 0; index < 42; index += 1) {
      const warm = index % 5 === 0;
      const particle = this.scene.add.circle(
        (index * 163 + 47) % this.width,
        160 + ((index * 97) % 390),
        warm ? 2.4 : 1.4,
        warm ? 0xffa24d : 0x72ddff,
        warm ? 0.55 : 0.34,
      ).setDepth(-1);

      if (warm) particle.setBlendMode(Phaser.BlendModes.ADD);

      this.particles.push({
        object: particle,
        speedX: 4 + (index % 7) * 1.4,
        speedY: -1.8 + (index % 4) * 0.9,
        phase: index * 0.63,
      });
    }
  }

  private createFloatingEmbers(): void {
    for (let index = 0; index < 12; index += 1) {
      const ember = this.scene.add.circle(
        60 + ((index * 103) % (this.width - 120)),
        440 + ((index * 47) % 150),
        2 + (index % 3),
        index % 2 === 0 ? 0xff8b45 : 0x8eeeff,
        0.35,
      ).setDepth(2).setBlendMode(Phaser.BlendModes.ADD);

      this.scene.tweens.add({
        targets: ember,
        y: ember.y - 34 - (index % 4) * 12,
        x: ember.x + (index % 2 === 0 ? 18 : -18),
        alpha: { from: 0.1, to: 0.65 },
        duration: 1400 + index * 90,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });
    }
  }

  update(timeMilliseconds: number, deltaSeconds: number, wind: number): void {
    const time = timeMilliseconds / 1000;
    const windFactor = Phaser.Math.Clamp(wind / 82, -1, 1);

    this.background.x = this.width / 2 + Math.sin(time * 0.08) * 5;
    this.background.y = this.height / 2 + Math.cos(time * 0.06) * 3;
    this.backgroundGlow.x = this.width / 2 - Math.sin(time * 0.065) * 7;
    this.backgroundGlow.alpha = 0.065 + Math.sin(time * 0.45) * 0.018;

    this.water.tilePositionX += (8 + windFactor * 9) * deltaSeconds;
    this.water.tilePositionY = Math.sin(time * 0.7) * 3;
    this.water.alpha = 0.79 + Math.sin(time * 1.15) * 0.05;

    for (const particle of this.particles) {
      particle.object.x += (particle.speedX + windFactor * 18) * deltaSeconds;
      particle.object.y += particle.speedY * deltaSeconds + Math.sin(time * 1.4 + particle.phase) * 0.1;
      if (particle.object.x > this.width + 20) particle.object.x = -20;
      if (particle.object.x < -20) particle.object.x = this.width + 20;
      if (particle.object.y < 120) particle.object.y = 570;
      if (particle.object.y > 590) particle.object.y = 140;
    }

    this.lightningClock += deltaSeconds;
    if (this.lightningClock >= this.nextLightning) {
      this.lightningClock = 0;
      this.nextLightning = Phaser.Math.FloatBetween(4.2, 9.5);
      this.triggerLightning();
    }
  }

  private triggerLightning(): void {
    this.lightningFlash.setAlpha(0.22);
    this.scene.tweens.add({
      targets: this.lightningFlash,
      alpha: 0,
      duration: 150,
      yoyo: true,
      repeat: 1,
      ease: "Quad.Out",
    });

    this.scene.cameras.main.shake(110, 0.0012);
  }

  flashStorm(): void {
    this.triggerLightning();
  }

  reactToImpact(style: "rune" | "storm" | "celestial" | "nature", intensity: number): void {
    if (style === "storm" || style === "celestial") this.triggerLightning();
    this.scene.tweens.add({
      targets: this.backgroundGlow,
      alpha: Math.min(0.26, 0.09 + intensity * 0.07),
      duration: 90,
      yoyo: true,
      ease: "Quad.Out",
    });
  }

  destroy(): void {
    this.background.destroy();
    this.backgroundGlow.destroy();
    this.water.destroy();
    this.vignette.destroy();
    this.lightningFlash.destroy();
    for (const particle of this.particles) particle.object.destroy();
    this.particles.length = 0;
  }
}
