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
}

export class TerrainSystem {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly craters: Crater[] = [];
  private readonly barriers: Barrier[] = [];
  private readonly sampleStep = 5;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly worldWidth: number,
    private readonly worldHeight: number,
  ) {
    this.graphics = scene.add.graphics().setDepth(4);
  }

  configure(barrierCount: number): void {
    this.craters.length = 0;
    this.barriers.length = 0;
    const positions = [560, 675, 790];
    for (let index = 0; index < barrierCount; index += 1) {
      const x = positions[index] ?? 640 + index * 80;
      const surface = this.getTerrainSurfaceY(x);
      this.barriers.push({ x, y: surface - 88, width: 34, height: 88, health: 42 });
    }
    this.render();
  }

  private baseSurfaceY(x: number): number {
    return 524 + Math.sin(x * 0.008) * 25 + Math.sin(x * 0.021) * 12;
  }

  private pointInsideCrater(x: number, y: number): boolean {
    return this.craters.some((crater) => Math.hypot(x - crater.x, y - crater.y) < crater.radius);
  }

  private terrainSolid(x: number, y: number): boolean {
    if (x < 0 || x > this.worldWidth || y > this.worldHeight) return false;
    return y >= this.baseSurfaceY(x) && !this.pointInsideCrater(x, y);
  }

  getTerrainSurfaceY(x: number): number {
    const start = Math.max(0, Math.floor(this.baseSurfaceY(x)));
    for (let y = start; y < this.worldHeight; y += 2) {
      if (this.terrainSolid(x, y)) return y;
    }
    return this.worldHeight - 4;
  }

  getSurfaceY(x: number): number {
    let surface = this.getTerrainSurfaceY(x);
    for (const barrier of this.barriers) {
      if (barrier.health > 0 && x >= barrier.x - barrier.width / 2 && x <= barrier.x + barrier.width / 2) {
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
    this.render();
    return true;
  }

  addCrater(x: number, y: number, radius: number): void {
    this.craters.push({ x, y, radius: Math.max(14, radius) });
    for (const barrier of this.barriers) {
      if (barrier.health <= 0) continue;
      const nearestX = Phaser.Math.Clamp(x, barrier.x - barrier.width / 2, barrier.x + barrier.width / 2);
      const nearestY = Phaser.Math.Clamp(y, barrier.y, barrier.y + barrier.height);
      const distance = Phaser.Math.Distance.Between(x, y, nearestX, nearestY);
      if (distance < radius) barrier.health = Math.max(0, barrier.health - Math.round((1 - distance / radius) * 55));
    }
    this.render();
  }

  render(): void {
    this.graphics.clear();
    this.graphics.fillStyle(0x1a2a42, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(0, this.worldHeight);
    for (let x = 0; x <= this.worldWidth; x += this.sampleStep) {
      this.graphics.lineTo(x, this.getTerrainSurfaceY(x));
    }
    this.graphics.lineTo(this.worldWidth, this.worldHeight);
    this.graphics.closePath();
    this.graphics.fillPath();

    this.graphics.lineStyle(5, 0x2e5074, 1);
    this.graphics.beginPath();
    for (let x = 0; x <= this.worldWidth; x += this.sampleStep) {
      const y = this.getTerrainSurfaceY(x);
      if (x === 0) this.graphics.moveTo(x, y);
      else this.graphics.lineTo(x, y);
    }
    this.graphics.strokePath();

    for (const barrier of this.barriers) {
      if (barrier.health <= 0) continue;
      const healthRatio = barrier.health / 42;
      this.graphics.fillStyle(healthRatio > 0.5 ? 0x526a86 : 0x7d5149, 1);
      this.graphics.fillRoundedRect(barrier.x - barrier.width / 2, barrier.y, barrier.width, barrier.height, 7);
      this.graphics.lineStyle(3, 0xaac4df, 0.75);
      this.graphics.strokeRoundedRect(barrier.x - barrier.width / 2, barrier.y, barrier.width, barrier.height, 7);
    }
  }
}
