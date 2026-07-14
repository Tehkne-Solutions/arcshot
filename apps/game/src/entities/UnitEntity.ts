import Phaser from "phaser";
import { clamp } from "@arcshot/game-core";
import type { TerrainSystem } from "../systems/TerrainSystem";

export class UnitEntity {
  readonly container: Phaser.GameObjects.Container;
  readonly sprite: Phaser.GameObjects.Image;
  private readonly healthBackground: Phaser.GameObjects.Rectangle;
  private readonly healthBar: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  velocityX = 0;
  velocityY = 0;
  health: number;
  facing: 1 | -1;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly id: "player" | "enemy",
    x: number,
    y: number,
    texture: string,
    readonly maxHealth: number,
    facing: 1 | -1,
  ) {
    this.health = maxHealth;
    this.facing = facing;
    this.sprite = scene.add.image(0, 0, texture).setDisplaySize(92, 92);
    this.sprite.setFlipX(facing === -1);
    this.label = scene.add.text(0, -72, id === "player" ? "VOCÊ" : "NPC", {
      fontFamily: "Lexend",
      fontSize: "14px",
      fontStyle: "bold",
      color: id === "player" ? "#7de7ff" : "#ff9b86",
    }).setOrigin(0.5);
    this.healthBackground = scene.add.rectangle(0, -55, 88, 9, 0x09111f, 0.9).setStrokeStyle(2, 0xffffff, 0.25);
    this.healthBar = scene.add.rectangle(-42, -55, 84, 5, id === "player" ? 0x65dcff : 0xff735e).setOrigin(0, 0.5);
    this.container = scene.add.container(x, y, [this.sprite, this.label, this.healthBackground, this.healthBar]).setDepth(12);
  }

  get x(): number { return this.container.x; }
  get y(): number { return this.container.y; }
  set x(value: number) { this.container.x = value; }
  set y(value: number) { this.container.y = value; }

  setFacing(facing: 1 | -1): void {
    this.facing = facing;
    this.sprite.setFlipX(facing === -1);
  }

  setHealth(value: number): void {
    this.health = clamp(value, 0, this.maxHealth);
    const ratio = this.health / this.maxHealth;
    this.healthBar.width = 84 * ratio;
    this.label.setText(`${this.id === "player" ? "VOCÊ" : "NPC"}  ${Math.ceil(this.health)}`);
  }

  applyImpulse(x: number, y: number): void {
    this.velocityX += x;
    this.velocityY += y;
  }

  settle(terrain: TerrainSystem): void {
    this.y = terrain.getSurfaceY(this.x) - 42;
  }

  updatePhysics(deltaSeconds: number, terrain: TerrainSystem): void {
    if (Math.abs(this.velocityX) < 0.1 && Math.abs(this.velocityY) < 0.1) {
      const surface = terrain.getSurfaceY(this.x) - 42;
      if (Math.abs(this.y - surface) > 2) this.y = Phaser.Math.Linear(this.y, surface, Math.min(1, deltaSeconds * 8));
      return;
    }

    this.velocityY += 720 * deltaSeconds;
    const nextX = clamp(this.x + this.velocityX * deltaSeconds, 38, 1242);
    const nextY = this.y + this.velocityY * deltaSeconds;
    const ground = terrain.getSurfaceY(nextX) - 42;
    this.x = nextX;
    if (nextY >= ground) {
      this.y = ground;
      this.velocityY *= -0.18;
      this.velocityX *= 0.62;
      if (Math.abs(this.velocityY) < 18) this.velocityY = 0;
      if (Math.abs(this.velocityX) < 8) this.velocityX = 0;
    } else {
      this.y = nextY;
    }
  }
}
