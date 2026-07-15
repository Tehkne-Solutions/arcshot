import Phaser from "phaser";
import { clamp, type CharacterDefinition } from "@arcshot/game-core";
import type { TerrainSystem } from "../systems/TerrainSystem";
import { resolveCharacterArt } from "../ui/characterArt";

export class UnitEntity {
  readonly container: Phaser.GameObjects.Container;
  readonly sprite: Phaser.GameObjects.Image;
  readonly character: CharacterDefinition;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly aura: Phaser.GameObjects.Arc;
  private readonly namePlate: Phaser.GameObjects.Rectangle;
  private readonly healthBackground: Phaser.GameObjects.Rectangle;
  private readonly healthFrame: Phaser.GameObjects.Rectangle;
  private readonly healthBar: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private readonly premium: boolean;
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
    readonly maxHealth: number,
    facing: 1 | -1,
  ) {
    this.character = character;
    this.health = maxHealth;
    this.facing = facing;
    this.phase = id === "player" ? 0 : Math.PI;

    const resolvedArt = resolveCharacterArt(scene, character);
    const texture = resolvedArt.textureKey;
    this.premium = resolvedArt.premium;

    const color = Phaser.Display.Color.HexStringToColor(
      character.color ?? (id === "player" ? "#67dcff" : "#ff735e"),
    ).color;
    const healthColor = id === "player" ? 0x27d9ff : 0xff594d;

    this.shadow = scene.add.ellipse(0, 39, this.premium ? 132 : 82, this.premium ? 24 : 18, 0x000000, 0.52);

    this.aura = scene.add.circle(0, -12, this.premium ? 70 : 43, color, 0.08)
      .setStrokeStyle(this.premium ? 3 : 2, color, 0.34)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.sprite = scene.add.image(0, this.premium ? 42 : 0, texture);
    if (this.premium) {
      this.sprite.setOrigin(0.5, 1);
      if (character.id === "rune-bombardier") this.sprite.setDisplaySize(184, 130);
      else this.sprite.setDisplaySize(176, 148);
    } else {
      this.sprite.setDisplaySize(108, 108);
    }
    this.sprite.setFlipX(facing === -1);

    const labelY = this.premium ? -102 : -79;
    const healthY = this.premium ? -80 : -61;

    this.namePlate = scene.add.rectangle(
      0,
      labelY,
      this.premium ? 210 : 128,
      25,
      0x07101e,
      0.84,
    ).setStrokeStyle(2, id === "player" ? 0x1fdcff : 0xff5d52, 0.86);

    this.label = scene.add.text(0, labelY, `${id === "player" ? "VOCÊ" : "NPC"} · ${character.name}`, {
      fontFamily: "Lexend",
      fontSize: this.premium ? "12px" : "11px",
      fontStyle: "bold",
      color: id === "player" ? "#75edff" : "#ff8a7f",
      stroke: "#07101e",
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.healthFrame = scene.add.rectangle(
      0,
      healthY,
      this.premium ? 130 : 100,
      14,
      0x090d17,
      1,
    ).setStrokeStyle(2, 0xd9aa55, 0.88);

    this.healthBackground = scene.add.rectangle(
      0,
      healthY,
      this.premium ? 124 : 94,
      8,
      0x190d14,
      0.96,
    );

    this.healthBar = scene.add.rectangle(
      this.premium ? -62 : -47,
      healthY,
      this.premium ? 124 : 94,
      8,
      healthColor,
      1,
    ).setOrigin(0, 0.5);

    this.container = scene.add.container(x, y, [
      this.shadow,
      this.aura,
      this.sprite,
      this.namePlate,
      this.healthFrame,
      this.healthBackground,
      this.healthBar,
      this.label,
    ]).setDepth(12);
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
    const maxWidth = this.premium ? 124 : 94;
    this.healthBar.width = maxWidth * ratio;
    this.label.setText(
      `${this.id === "player" ? "VOCÊ" : "NPC"} · ${this.character.name}  ${Math.ceil(this.health)}`,
    );

    if (ratio < 0.28) this.healthBar.setFillStyle(0xffb13d);
    else this.healthBar.setFillStyle(this.id === "player" ? 0x27d9ff : 0xff594d);

    if (this.health < previous) this.playHitReaction();
  }

  setCharging(charging: boolean): void {
    if (charging) this.action = "charge";
    else if (this.action === "charge") this.action = "idle";
  }

  playFireReaction(): void {
    this.action = "fire";
    this.actionUntil = this.scene.time.now + 290;
    const direction = this.facing;

    this.scene.tweens.add({
      targets: this.sprite,
      x: -direction * (this.premium ? 18 : 12),
      angle: -direction * (this.premium ? 7 : 5),
      duration: 75,
      yoyo: true,
      ease: "Back.Out",
    });

    const muzzleX = this.x + direction * (this.premium ? 76 : 48);
    const muzzleY = this.y - (this.premium ? 24 : 18);
    const flash = this.scene.add.circle(muzzleX, muzzleY, this.premium ? 20 : 13, 0x8feaff, 0.9)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(22);

    this.scene.tweens.add({
      targets: flash,
      scale: 2.4,
      alpha: 0,
      duration: 180,
      ease: "Quad.Out",
      onComplete: () => flash.destroy(),
    });
  }

  playHitReaction(): void {
    this.action = "hit";
    this.actionUntil = this.scene.time.now + 360;

    this.scene.tweens.add({
      targets: this.sprite,
      x: { from: -8, to: 8 },
      alpha: { from: 0.55, to: 1 },
      duration: 55,
      yoyo: true,
      repeat: 2,
    });

    const hitGlow = this.scene.add.circle(this.x, this.y - 24, this.premium ? 58 : 38, 0xff6b5f, 0.22)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(21);

    this.scene.tweens.add({
      targets: hitGlow,
      scale: 1.8,
      alpha: 0,
      duration: 320,
      onComplete: () => hitGlow.destroy(),
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
    const baseSpriteY = this.premium ? 42 : 0;

    this.sprite.y = baseSpriteY + Math.sin(time * bobSpeed + this.phase) * bobAmount - (this.action === "charge" ? 3 : 0);
    this.sprite.scaleY = 1 + Math.sin(time * (this.action === "charge" ? 6 : 2.1) + this.phase) * (this.action === "charge" ? 0.035 : 0.012);
    this.aura.alpha = this.action === "charge" ? 0.3 + Math.sin(time * 8) * 0.1 : active ? 0.14 : 0.055;
    this.aura.scale = this.action === "charge" ? 1.08 + Math.sin(time * 6) * 0.08 : 1;
    this.shadow.scaleX = 1 - (this.sprite.y - baseSpriteY) * 0.006;
    this.namePlate.alpha = active ? 0.96 : 0.78;
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
      if (Math.abs(this.y - surface) > 2) {
        this.y = Phaser.Math.Linear(this.y, surface, Math.min(1, deltaSeconds * 8));
      }
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
