import Phaser from "phaser";
import type { ArenaTheme } from "@arcshot/game-core";

interface Drifter {
  object: Phaser.GameObjects.Container;
  speed: number;
  baseY: number;
  phase: number;
}

interface AmbientParticle {
  object: Phaser.GameObjects.Arc;
  speedX: number;
  speedY: number;
  phase: number;
}

const PALETTES: Record<ArenaTheme, {
  sky: number;
  horizon: number;
  glow: number;
  silhouette: number;
  accent: number;
  secondary: number;
}> = {
  "arcane-forge": {
    sky: 0x170e1c,
    horizon: 0x4a1d25,
    glow: 0xff6d37,
    silhouette: 0x140d18,
    accent: 0xff9d4c,
    secondary: 0xb83d62,
  },
  "sky-harbor": {
    sky: 0x071a32,
    horizon: 0x164d76,
    glow: 0x74e4ff,
    silhouette: 0x071525,
    accent: 0x49d8ff,
    secondary: 0xffc45c,
  },
  "storm-ruins": {
    sky: 0x111329,
    horizon: 0x34305b,
    glow: 0xb39cff,
    silhouette: 0x0b0d1a,
    accent: 0xd7c2ff,
    secondary: 0x58d5ff,
  },
  "mystic-wilds": {
    sky: 0x08201d,
    horizon: 0x1f5b48,
    glow: 0x7fffc6,
    silhouette: 0x061713,
    accent: 0x6ee7a5,
    secondary: 0xffd96a,
  },
};

export class AnimatedBattlefield {
  private readonly palette;
  private readonly farLayer: Phaser.GameObjects.Container;
  private readonly midLayer: Phaser.GameObjects.Container;
  private readonly drifters: Drifter[] = [];
  private readonly particles: AmbientParticle[] = [];
  private readonly animatedObjects: Phaser.GameObjects.GameObject[] = [];
  private airship?: Phaser.GameObjects.Container;
  private propeller?: Phaser.GameObjects.Arc;
  private banner?: Phaser.GameObjects.Triangle;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly width: number,
    private readonly height: number,
    readonly theme: ArenaTheme,
  ) {
    this.palette = PALETTES[theme];
    this.farLayer = scene.add.container(0, 0).setDepth(-8);
    this.midLayer = scene.add.container(0, 0).setDepth(-5);
    this.createSky();
    this.createDistantWorld();
    this.createClouds();
    this.createThemeLandmarks();
    this.createAmbientParticles();
  }

  private createSky(): void {
    const sky = this.scene.add.graphics().setDepth(-12);
    sky.fillGradientStyle(this.palette.sky, this.palette.sky, this.palette.horizon, this.palette.horizon, 1);
    sky.fillRect(0, 0, this.width, this.height);

    const glow = this.scene.add.circle(this.width * 0.78, 112, this.theme === "arcane-forge" ? 92 : 128, this.palette.glow, 0.18).setDepth(-11);
    const core = this.scene.add.circle(this.width * 0.78, 112, this.theme === "arcane-forge" ? 45 : 62, this.palette.glow, 0.25).setDepth(-11);
    this.animatedObjects.push(sky, glow, core);

    for (let index = 0; index < 46; index += 1) {
      const star = this.scene.add.circle(
        (index * 181 + 43) % this.width,
        24 + ((index * 71) % 280),
        index % 6 === 0 ? 2 : 1,
        index % 4 === 0 ? this.palette.accent : 0xffffff,
        index % 5 === 0 ? 0.7 : 0.34,
      ).setDepth(-10);
      this.animatedObjects.push(star);
      this.scene.tweens.add({
        targets: star,
        alpha: { from: star.alpha * 0.45, to: star.alpha },
        duration: 900 + (index % 7) * 170,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private createDistantWorld(): void {
    const silhouettes = this.scene.add.graphics();
    silhouettes.fillStyle(this.palette.silhouette, 0.94);
    silhouettes.fillTriangle(-80, 505, 210, 250, 480, 505);
    silhouettes.fillTriangle(270, 505, 590, 310, 880, 505);
    silhouettes.fillTriangle(690, 505, 1030, 228, 1360, 505);
    silhouettes.fillStyle(this.palette.secondary, 0.12);
    silhouettes.fillTriangle(45, 455, 270, 282, 500, 455);
    silhouettes.fillTriangle(720, 470, 1000, 252, 1240, 470);
    this.farLayer.add(silhouettes);

    for (let index = 0; index < 5; index += 1) {
      const x = 80 + index * 280;
      const island = this.scene.add.container(x, 300 + (index % 2) * 44);
      const rock = this.scene.add.triangle(0, 0, -78, 0, 72, 0, 0, 94, this.palette.silhouette, 0.9);
      const rim = this.scene.add.ellipse(0, -2, 158, 36, this.palette.accent, 0.13).setStrokeStyle(2, this.palette.accent, 0.25);
      island.add([rock, rim]);
      this.farLayer.add(island);
      this.drifters.push({ object: island, speed: 0, baseY: island.y, phase: index * 1.7 });
    }
  }

  private createClouds(): void {
    for (let index = 0; index < 7; index += 1) {
      const cloud = this.scene.add.container((index * 235) % (this.width + 160) - 80, 72 + (index % 3) * 78);
      const alpha = this.theme === "arcane-forge" ? 0.1 : 0.16;
      cloud.add([
        this.scene.add.ellipse(-35, 0, 94, 30, 0xffffff, alpha),
        this.scene.add.ellipse(15, -8, 118, 38, 0xffffff, alpha),
        this.scene.add.ellipse(58, 2, 88, 28, 0xffffff, alpha),
      ]);
      cloud.setDepth(-7);
      this.drifters.push({ object: cloud, speed: 4 + index * 0.65, baseY: cloud.y, phase: index * 0.9 });
    }
  }

  private createThemeLandmarks(): void {
    if (this.theme === "arcane-forge") this.createForge();
    else if (this.theme === "sky-harbor") this.createSkyHarbor();
    else if (this.theme === "storm-ruins") this.createStormRuins();
    else this.createMysticWilds();
  }

  private createForge(): void {
    const tower = this.scene.add.container(1045, 350);
    tower.add([
      this.scene.add.rectangle(0, 0, 96, 248, 0x1d1720, 0.95).setStrokeStyle(3, this.palette.accent, 0.25),
      this.scene.add.rectangle(-23, -58, 18, 95, 0x3c2423, 1),
      this.scene.add.rectangle(24, -78, 20, 136, 0x3c2423, 1),
      this.scene.add.circle(0, 22, 35, this.palette.glow, 0.2).setStrokeStyle(4, this.palette.accent, 0.55),
      this.scene.add.circle(0, 22, 14, this.palette.glow, 0.7),
    ]);
    this.midLayer.add(tower);

    for (let index = 0; index < 4; index += 1) {
      const smoke = this.scene.add.ellipse(1000 + index * 18, 200 - index * 22, 66 + index * 14, 38 + index * 12, 0x291f2b, 0.3).setDepth(-4);
      this.animatedObjects.push(smoke);
      this.scene.tweens.add({ targets: smoke, y: smoke.y - 30, x: smoke.x + 18, alpha: 0.08, duration: 1800 + index * 300, yoyo: true, repeat: -1 });
    }
  }

  private createSkyHarbor(): void {
    this.airship = this.scene.add.container(-180, 175).setDepth(-4);
    const hull = this.scene.add.ellipse(0, 20, 178, 52, 0x26394f, 1).setStrokeStyle(4, this.palette.accent, 0.55);
    const balloon = this.scene.add.ellipse(-10, -35, 232, 88, 0x305978, 0.9).setStrokeStyle(3, 0xf3fbff, 0.35);
    const cabin = this.scene.add.rectangle(15, 36, 76, 34, 0x5b3828, 1).setStrokeStyle(3, this.palette.secondary, 0.7);
    this.propeller = this.scene.add.circle(100, 18, 21, this.palette.secondary, 0.35).setStrokeStyle(4, this.palette.secondary, 0.9);
    this.banner = this.scene.add.triangle(-86, 26, 0, 0, 0, 36, -72, 18, this.palette.secondary, 0.9);
    this.airship.add([balloon, hull, cabin, this.propeller, this.banner]);
    this.midLayer.add(this.airship);
  }

  private createStormRuins(): void {
    const ruins = this.scene.add.graphics();
    ruins.fillStyle(0x17172d, 0.96);
    ruins.fillRect(925, 245, 44, 230);
    ruins.fillRect(1070, 195, 52, 280);
    ruins.fillRect(1180, 290, 38, 185);
    ruins.lineStyle(5, this.palette.accent, 0.34);
    ruins.lineBetween(947, 245, 1095, 195);
    ruins.lineBetween(1095, 195, 1198, 290);
    this.midLayer.add(ruins);

    for (let index = 0; index < 3; index += 1) {
      const crystal = this.scene.add.polygon(840 + index * 135, 380 - index * 35, [0, 34, 18, 0, 36, 34, 18, 72], this.palette.accent, 0.32).setStrokeStyle(2, 0xffffff, 0.4);
      this.midLayer.add(crystal);
      this.scene.tweens.add({ targets: crystal, alpha: { from: 0.2, to: 0.62 }, duration: 620 + index * 180, yoyo: true, repeat: -1 });
    }
  }

  private createMysticWilds(): void {
    const forest = this.scene.add.graphics();
    for (let index = 0; index < 9; index += 1) {
      const x = 780 + index * 67;
      forest.fillStyle(0x082c25, 0.94).fillTriangle(x - 45, 475, x, 260 - (index % 3) * 35, x + 45, 475);
      forest.fillStyle(this.palette.accent, 0.16).fillCircle(x, 300 - (index % 3) * 35, 34);
    }
    this.midLayer.add(forest);
  }

  private createAmbientParticles(): void {
    for (let index = 0; index < 34; index += 1) {
      const particle = this.scene.add.circle(
        (index * 137) % this.width,
        150 + ((index * 83) % 410),
        index % 5 === 0 ? 3 : 1.5,
        index % 4 === 0 ? this.palette.secondary : this.palette.accent,
        0.25 + (index % 4) * 0.08,
      ).setDepth(-3);
      this.particles.push({
        object: particle,
        speedX: 5 + (index % 7) * 1.8,
        speedY: this.theme === "arcane-forge" ? -(5 + (index % 5)) : (index % 2 === 0 ? -2 : 2),
        phase: index * 0.73,
      });
    }
  }

  update(timeMilliseconds: number, deltaSeconds: number, wind: number): void {
    const time = timeMilliseconds / 1000;
    const windFactor = Phaser.Math.Clamp(wind / 82, -1, 1);

    for (const drifter of this.drifters) {
      drifter.object.y = drifter.baseY + Math.sin(time * 0.55 + drifter.phase) * 5;
      if (drifter.speed > 0) {
        drifter.object.x += (drifter.speed + windFactor * 8) * deltaSeconds;
        if (drifter.object.x > this.width + 150) drifter.object.x = -180;
      }
    }

    for (const particle of this.particles) {
      particle.object.x += (particle.speedX + windFactor * 20) * deltaSeconds;
      particle.object.y += particle.speedY * deltaSeconds + Math.sin(time * 1.7 + particle.phase) * 0.12;
      if (particle.object.x > this.width + 20) particle.object.x = -20;
      if (particle.object.x < -20) particle.object.x = this.width + 20;
      if (particle.object.y < 120) particle.object.y = 570;
      if (particle.object.y > 590) particle.object.y = 140;
    }

    if (this.airship) {
      this.airship.x += (15 + windFactor * 5) * deltaSeconds;
      this.airship.y = 174 + Math.sin(time * 0.9) * 9;
      if (this.airship.x > this.width + 220) this.airship.x = -220;
    }
    if (this.propeller) this.propeller.rotation += deltaSeconds * 7;
    if (this.banner) this.banner.scaleX = 0.86 + Math.sin(time * 5 + windFactor) * 0.15;
  }

  flashStorm(): void {
    if (this.theme !== "storm-ruins" && this.theme !== "sky-harbor") return;
    const flash = this.scene.add.rectangle(this.width / 2, this.height / 2, this.width, this.height, 0xd8edff, 0.22).setDepth(18);
    this.scene.tweens.add({ targets: flash, alpha: 0, duration: 190, onComplete: () => flash.destroy() });
  }

  destroy(): void {
    this.farLayer.destroy(true);
    this.midLayer.destroy(true);
    for (const particle of this.particles) particle.object.destroy();
    for (const object of this.animatedObjects) object.destroy();
  }
}
