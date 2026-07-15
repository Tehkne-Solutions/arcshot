import Phaser from "phaser";

interface Crater {
  x: number;
  y: number;
  radius: number;
}

interface Barrier {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  view: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Arc;
}

export class TerrainSystem {
  private readonly textureKey: string;
  private readonly texture: Phaser.Textures.CanvasTexture;
  private readonly context: CanvasRenderingContext2D;
  private readonly image: Phaser.GameObjects.Image;
  private readonly edgeGraphics: Phaser.GameObjects.Graphics;
  private readonly craters: Crater[] = [];
  private readonly barriers: Barrier[] = [];
  private readonly sampleStep = 4;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly worldWidth: number,
    private readonly worldHeight: number,
  ) {
    this.textureKey = `premium-terrain-${scene.sys.settings.key}-${Date.now()}`;
    const texture = scene.textures.createCanvas(this.textureKey, worldWidth, worldHeight);
    if (!texture) {
      throw new Error(`Não foi possível criar a textura dinâmica do terreno: ${this.textureKey}`);
    }
    this.texture = texture;
    this.context = this.texture.getContext();
    this.image = scene.add.image(0, 0, this.textureKey).setOrigin(0).setDepth(4);
    this.edgeGraphics = scene.add.graphics().setDepth(5);
  }

  configure(barrierCount: number): void {
    this.craters.length = 0;
    for (const barrier of this.barriers) {
      barrier.view.destroy();
      barrier.glow.destroy();
    }
    this.barriers.length = 0;

    const positions = [570, 700, 830];
    const heights = [122, 92, 110];

    for (let index = 0; index < barrierCount; index += 1) {
      const x = positions[index] ?? 610 + index * 95;
      const height = heights[index] ?? 96;
      const surface = this.getTerrainSurfaceY(x);
      const width = index === 0 ? 54 : 48;
      const y = surface - height;

      const glow = this.scene.add.circle(x, y + height * 0.46, 28, 0x63e4ff, 0.14)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(5.5);

      const view = this.scene.add.image(x, surface + 4, "premium-pillar")
        .setOrigin(0.5, 1)
        .setDisplaySize(width + 26, height + 34)
        .setDepth(6);

      this.scene.tweens.add({
        targets: glow,
        alpha: { from: 0.08, to: 0.3 },
        scale: { from: 0.88, to: 1.13 },
        duration: 900 + index * 170,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });

      this.barriers.push({
        x,
        y,
        width,
        height,
        health: 48,
        maxHealth: 48,
        view,
        glow,
      });
    }

    this.render();
  }

  private baseSurfaceY(x: number): number {
    const rolling = Math.sin(x * 0.008) * 11 + Math.sin(x * 0.021) * 5;
    const leftChannel = 48 * Math.exp(-Math.pow((x - 470) / 76, 2));
    const rightChannel = 62 * Math.exp(-Math.pow((x - 1000) / 72, 2));
    const centerLift = -18 * Math.exp(-Math.pow((x - 700) / 160, 2));
    return 528 + rolling + leftChannel + rightChannel + centerLift;
  }

  private pointInsideCrater(x: number, y: number): boolean {
    return this.craters.some((crater) => Math.hypot(x - crater.x, y - crater.y) < crater.radius);
  }

  private terrainSolid(x: number, y: number): boolean {
    if (x < 0 || x > this.worldWidth || y > this.worldHeight) return false;
    return y >= this.baseSurfaceY(x) && !this.pointInsideCrater(x, y);
  }

  getTerrainSurfaceY(x: number): number {
    const start = Math.max(0, Math.floor(this.baseSurfaceY(x) - 4));
    for (let y = start; y < this.worldHeight; y += 2) {
      if (this.terrainSolid(x, y)) return y;
    }
    return this.worldHeight - 4;
  }

  getSurfaceY(x: number): number {
    let surface = this.getTerrainSurfaceY(x);
    for (const barrier of this.barriers) {
      if (
        barrier.health > 0 &&
        x >= barrier.x - barrier.width / 2 &&
        x <= barrier.x + barrier.width / 2
      ) {
        surface = Math.min(surface, barrier.y);
      }
    }
    return surface;
  }

  isSolid(x: number, y: number): boolean {
    if (this.terrainSolid(x, y)) return true;
    return this.barriers.some((barrier) =>
      barrier.health > 0 &&
      x >= barrier.x - barrier.width / 2 &&
      x <= barrier.x + barrier.width / 2 &&
      y >= barrier.y &&
      y <= barrier.y + barrier.height,
    );
  }

  hitBarrier(x: number, y: number, damage: number): boolean {
    const barrier = this.barriers.find((candidate) =>
      candidate.health > 0 &&
      x >= candidate.x - candidate.width / 2 &&
      x <= candidate.x + candidate.width / 2 &&
      y >= candidate.y &&
      y <= candidate.y + candidate.height,
    );

    if (!barrier) return false;

    barrier.health = Math.max(0, barrier.health - damage);
    this.updateBarrierVisual(barrier);
    return true;
  }

  addCrater(x: number, y: number, radius: number): void {
    this.craters.push({ x, y, radius: Math.max(14, radius) });

    for (const barrier of this.barriers) {
      if (barrier.health <= 0) continue;
      const nearestX = Phaser.Math.Clamp(x, barrier.x - barrier.width / 2, barrier.x + barrier.width / 2);
      const nearestY = Phaser.Math.Clamp(y, barrier.y, barrier.y + barrier.height);
      const distance = Phaser.Math.Distance.Between(x, y, nearestX, nearestY);
      if (distance < radius) {
        barrier.health = Math.max(0, barrier.health - Math.round((1 - distance / radius) * 58));
        this.updateBarrierVisual(barrier);
      }
    }

    this.render();
  }

  private updateBarrierVisual(barrier: Barrier): void {
    const ratio = barrier.health / barrier.maxHealth;
    barrier.view.setVisible(barrier.health > 0);
    barrier.glow.setVisible(barrier.health > 0);

    if (barrier.health <= 0) {
      const fragments = 8;
      for (let index = 0; index < fragments; index += 1) {
        const shard = this.scene.add.rectangle(
          barrier.x + Phaser.Math.Between(-18, 18),
          barrier.y + Phaser.Math.Between(8, barrier.height - 8),
          Phaser.Math.Between(5, 12),
          Phaser.Math.Between(9, 18),
          index % 2 === 0 ? 0x8eeaff : 0x7b5a3b,
          0.92,
        ).setDepth(15).setAngle(Phaser.Math.Between(-45, 45));

        this.scene.tweens.add({
          targets: shard,
          x: shard.x + Phaser.Math.Between(-70, 70),
          y: shard.y + Phaser.Math.Between(35, 105),
          angle: shard.angle + Phaser.Math.Between(-180, 180),
          alpha: 0,
          duration: Phaser.Math.Between(420, 720),
          ease: "Quad.In",
          onComplete: () => shard.destroy(),
        });
      }
      return;
    }

    barrier.view.clearTint();
    if (ratio < 0.35) barrier.view.setTint(0xc36a5c);
    else if (ratio < 0.7) barrier.view.setTint(0xd6a469);

    barrier.view.setAlpha(0.72 + ratio * 0.28);
    barrier.glow.setAlpha(0.08 + ratio * 0.18);
  }

  render(): void {
    const ctx = this.context;
    ctx.clearRect(0, 0, this.worldWidth, this.worldHeight);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, this.worldHeight);
    for (let x = 0; x <= this.worldWidth; x += this.sampleStep) {
      ctx.lineTo(x, this.getTerrainSurfaceY(x));
    }
    ctx.lineTo(this.worldWidth, this.worldHeight);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 470, 0, this.worldHeight);
    gradient.addColorStop(0, "#35496a");
    gradient.addColorStop(0.12, "#202c45");
    gradient.addColorStop(0.58, "#11182a");
    gradient.addColorStop(1, "#070b14");
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.clip();
    const source = this.scene.textures.get("premium-terrain").getSourceImage() as CanvasImageSource;
    const pattern = ctx.createPattern(source, "repeat");
    if (pattern) {
      ctx.globalAlpha = 0.88;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 450, this.worldWidth, this.worldHeight - 450);
    }

    ctx.globalAlpha = 0.32;
    ctx.fillStyle = "#4bdcff";
    for (let index = 0; index < 26; index += 1) {
      const x = (index * 157 + 43) % this.worldWidth;
      const y = this.getTerrainSurfaceY(x) + 28 + (index % 5) * 25;
      ctx.beginPath();
      ctx.arc(x, y, index % 4 === 0 ? 5 : 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    for (const crater of this.craters) {
      const craterGradient = ctx.createRadialGradient(
        crater.x,
        crater.y,
        crater.radius * 0.35,
        crater.x,
        crater.y,
        crater.radius,
      );
      craterGradient.addColorStop(0, "rgba(0,0,0,1)");
      craterGradient.addColorStop(0.82, "rgba(0,0,0,1)");
      craterGradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = craterGradient;
      ctx.beginPath();
      ctx.arc(crater.x, crater.y, crater.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    this.texture.refresh();

    this.edgeGraphics.clear();
    this.edgeGraphics.lineStyle(6, 0x1dd7ff, 0.22);
    this.edgeGraphics.beginPath();
    for (let x = 0; x <= this.worldWidth; x += this.sampleStep) {
      const y = this.getTerrainSurfaceY(x);
      if (x === 0) this.edgeGraphics.moveTo(x, y);
      else this.edgeGraphics.lineTo(x, y);
    }
    this.edgeGraphics.strokePath();

    this.edgeGraphics.lineStyle(2, 0xcba45b, 0.46);
    this.edgeGraphics.beginPath();
    for (let x = 0; x <= this.worldWidth; x += this.sampleStep) {
      const y = this.getTerrainSurfaceY(x) - 2;
      if (x === 0) this.edgeGraphics.moveTo(x, y);
      else this.edgeGraphics.lineTo(x, y);
    }
    this.edgeGraphics.strokePath();
  }

  destroy(): void {
    for (const barrier of this.barriers) {
      barrier.view.destroy();
      barrier.glow.destroy();
    }
    this.barriers.length = 0;
    this.image.destroy();
    this.edgeGraphics.destroy();
    this.scene.textures.remove(this.textureKey);
  }
}
