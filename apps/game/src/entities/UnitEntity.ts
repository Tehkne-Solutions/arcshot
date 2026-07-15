import Phaser from "phaser";
import { clamp, type CharacterDefinition } from "@arcshot/game-core";
import type { TerrainSystem } from "../systems/TerrainSystem";

export class UnitEntity {
  readonly container: Phaser.GameObjects.Container;
  readonly sprite: Phaser.GameObjects.Image;
  readonly character: CharacterDefinition;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly aura: Phaser.GameObjects.Arc;
  private readonly healthBackground: Phaser.GameObjects.Rectangle;
  private readonly healthBar: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private action: "idle" | "charge" | "fire" | "hit" = "idle";
  private actionUntil = 0;
  private readonly phase: number;
  velocityX = 0;
  velocityY = 0;
  health: number;
  facing: 1 | -1;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly id: "player" | "enemy",
    x: number,
    y: number,
    character: CharacterDefinition,
    maxHealth: number,
    facing: 1 | -1,
  ) {
    this.character = character;
    this.health = maxHealth;
    this.facing = facing;
    this.phase = id === "player" ? 0 : Math.PI;

    const color = Phaser.Display.Color.HexStringToColor(character.color ?? (id === "player" ? "#67dcff" : "#ff735e")).color;
    this.shadow = scene.add.ellipse(0, 37, 82, 18, 0x000000, 0.42);
    this.aura = scene.add.circle(0, -2, 43, color, 0.08).setStrokeStyle(2, color, 0.28);
    this.sprite = scene.add.image(0, 0, character.assetKey).setDisplaySize(108, 108);
    this.sprite.setFlipX(facing === -1);
    this.label = scene.add.text(0, -79, `${id === "player" ? "VOCÊ" : "NPC"} · ${character.name}`, {
      fontFamily: "Lexend",
      fontSize: "12px",
      fontStyle: "bold",
      color: id === "player" ? "#7de7ff" : "#ff9b86",
    }).setOrigin(0.5);
    this.healthBackground = scene.add.rectangle(0, -61, 96, 10, 0x09111f, 0.92).setStrokeStyle(2, 0xffffff, 0.22);
    this.healthBar = scene.add.rectangle(-46, -61, 92, 6, id === "player" ? 0x65dcff : 0xff735e).setOrigin(0, 0.5);
    this.container = scene.add.container(x, y, [this.shadow, this.aura, this.sprite, this.label, this.healthBackground, this.healthBar]).setDepth(12);
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
    const previous = this.health;
    this.health = clamp(value, 0, this.maxHealth);
    const ratio = this.health / this.maxHealth;
    this.healthBar.width = 92 * ratio;
    this.label.setText(`${this.id === "player" ? "VOCÊ" : "NPC"} · ${this.character.name}  ${Math.ceil(this.health)}`);
    if (this.health < previous) this.playHitReaction();
  }

  setCharging(charging: boolean): void {
    if (charging) this.action = "charge";
    else if (this.action === "charge") this.action = "idle";
  }

  playFireReaction(): void {
    this.action = "fire";
    this.actionUntil = this.scene.time.now + 260;
    const direction = this.facing;
    this.scene.tweens.add({
      targets: this.sprite,
      x: -direction * 12,
      angle: -direction * 5,
      duration: 70,
      yoyo: true,
      ease: "Quad.Out",
    });
  }

  playHitReaction(): void {
    this.action = "hit";
    this.actionUntil = this.scene.time.now + 330;
    this.scene.tweens.add({
      targets: this.sprite,
      x: { from: -7, to: 7 },
      alpha: { from: 0.55, to: 1 },
      duration: 55,
      yoyo: true,
      repeat: 2,
    });
  }

  updateVisual(timeMilliseconds: number, active: boolean): void {
    const time = timeMilliseconds / 1000;
    if (this.actionUntil > 0 && timeMilliseconds >= this.actionUntil) {
      this.action = "idle";
      this.actionUntil = 0;
    }

    const bobSpeed = this.action === "charge" ? 5.2 : active ? 2.4 : 1.5;
    const bobAmount = this.action === "charge" ? 4.2 : active ? 2.8 : 1.6;
    this.sprite.y = Math.sin(time * bobSpeed + this.phase) * bobAmount - (this.action === "charge" ? 3 : 0);
    this.sprite.scaleY = 1 + Math.sin(time * (this.action === "charge" ? 6 : 2.1) + this.phase) * (this.action === "charge" ? 0.035 : 0.012);
    this.aura.alpha = this.action === "charge" ? 0.25 + Math.sin(time * 8) * 0.09 : active ? 0.13 : 0.06;
    this.aura.scale = this.action === "charge" ? 1.08 + Math.sin(time * 6) * 0.08 : 1;
    this.shadow.scaleX = 1 - this.sprite.y * 0.006;
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
