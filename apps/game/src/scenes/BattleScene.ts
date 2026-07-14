import Phaser from "phaser";
import {
  calculateRadialDamage,
  clamp,
  findAimSolution,
  simulateTrajectory,
  stepProjectile,
  velocityFromAim,
  type ProjectileState,
  type WeaponDefinition,
} from "@arcshot/game-core";
import type { AssetCatalog } from "../types/content";
import { MISSIONS, type MissionDefinition } from "../content/missions";
import { TerrainSystem } from "../systems/TerrainSystem";
import { UnitEntity } from "../entities/UnitEntity";

interface BattleData {
  mode?: "campaign" | "challenge";
  missionIndex?: number;
}

interface ActiveProjectile {
  state: ProjectileState;
  weapon: WeaponDefinition;
  owner: UnitEntity;
  view: Phaser.GameObjects.Image;
  pierceRemaining: number;
  alive: boolean;
}

export class BattleScene extends Phaser.Scene {
  private readonly worldWidth = 1280;
  private readonly worldHeight = 720;
  private catalog!: AssetCatalog;
  private mission!: MissionDefinition;
  private mode: "campaign" | "challenge" = "campaign";
  private terrain!: TerrainSystem;
  private player!: UnitEntity;
  private enemy!: UnitEntity;
  private projectiles: ActiveProjectile[] = [];
  private trajectoryGraphics!: Phaser.GameObjects.Graphics;
  private effectGraphics!: Phaser.GameObjects.Graphics;
  private hudText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private bannerText!: Phaser.GameObjects.Text;
  private turn: "player" | "enemy" = "player";
  private angle = 45;
  private power = 68;
  private wind = 0;
  private weaponIndex = 0;
  private ammo = new Map<string, number>();
  private quickAim = false;
  private dragging = false;
  private dragPoint = new Phaser.Math.Vector2();
  private shotInProgress = false;
  private finishScheduled = false;
  private movementLeft = 145;
  private turnCount = 1;
  private outcome = false;
  private accumulator = 0;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor() { super("BattleScene"); }

  init(data: BattleData): void {
    this.mode = data.mode ?? "campaign";
    this.mission = { ...MISSIONS[data.missionIndex ?? 0]! };
    if (this.mode === "challenge") {
      this.mission = {
        ...this.mission,
        title: "Desafio dos Ventos",
        enemyHealth: 145,
        windMin: -82,
        windMax: 82,
        enemyProfile: "tactical",
        barriers: 3,
      };
    }
  }

  create(): void {
    this.catalog = this.cache.json.get("arcshot-catalog") as AssetCatalog;
    this.createBackground();
    this.terrain = new TerrainSystem(this, this.worldWidth, this.worldHeight);
    this.terrain.configure(this.mission.barriers);

    const playerCharacter = this.catalog.characters.find((item) => item.id === "bombardier") ?? this.catalog.characters[0]!;
    const enemyCharacter = this.catalog.characters.find((item) => item.id === "ranger") ?? this.catalog.characters[1] ?? this.catalog.characters[0]!;
    this.player = new UnitEntity(this, "player", 185, 400, playerCharacter.assetKey, playerCharacter.maxHealth, 1);
    this.enemy = new UnitEntity(this, "enemy", 1080, 400, enemyCharacter.assetKey, this.mission.enemyHealth, -1);
    this.player.settle(this.terrain);
    this.enemy.settle(this.terrain);

    for (const weapon of this.catalog.weapons) {
      if (weapon.ammo !== null) this.ammo.set(weapon.id, weapon.ammo);
    }

    this.trajectoryGraphics = this.add.graphics().setDepth(10);
    this.effectGraphics = this.add.graphics().setDepth(20);
    this.createHud();
    this.bindInputs();
    this.rollWind();
    this.updateHud();
    this.showBanner(this.mission.title, 1350);
  }

  private createBackground(): void {
    this.cameras.main.setBackgroundColor(0x07101e);
    const graphics = this.add.graphics().setDepth(0);
    graphics.fillStyle(0x0d1d35, 1).fillRect(0, 0, this.worldWidth, this.worldHeight);
    graphics.fillStyle(0x17345b, 0.8).fillCircle(980, 105, 250);
    graphics.fillStyle(0x204a79, 0.45).fillCircle(1010, 130, 165);
    graphics.fillStyle(0x0b1728, 1);
    graphics.fillTriangle(0, 500, 260, 235, 520, 500);
    graphics.fillTriangle(300, 500, 610, 285, 900, 500);
    graphics.fillTriangle(730, 500, 1030, 210, 1280, 500);
    graphics.fillStyle(0xffffff, 0.18);
    for (let i = 0; i < 55; i += 1) graphics.fillCircle((i * 193) % 1280, (i * 83) % 330 + 25, i % 4 === 0 ? 2 : 1);
  }

  private createHud(): void {
    this.add.rectangle(22, 18, 430, 116, 0x091424, 0.92).setOrigin(0).setStrokeStyle(2, 0x31547c, 0.9).setDepth(30);
    this.hudText = this.add.text(42, 34, "", {
      fontFamily: "Lexend", fontSize: "16px", color: "#dfeeff", lineSpacing: 7,
    }).setDepth(31);
    this.add.rectangle(470, 18, 788, 75, 0x091424, 0.92).setOrigin(0).setStrokeStyle(2, 0x31547c, 0.9).setDepth(30);
    this.weaponText = this.add.text(492, 34, "", {
      fontFamily: "Lexend", fontSize: "15px", color: "#dfeeff", wordWrap: { width: 740 },
    }).setDepth(31);
    this.add.rectangle(22, 638, 1236, 60, 0x07101d, 0.94).setOrigin(0).setStrokeStyle(2, 0x263f61, 0.9).setDepth(30);
    this.add.text(42, 658, "A/D mover   W/S ângulo   Q/E potência   1–4 armas   Espaço disparar   Tab mira rápida   R reiniciar   Esc menu", {
      fontFamily: "Lexend", fontSize: "14px", color: "#8da5c1",
    }).setDepth(31);
    this.bannerText = this.add.text(640, 180, "", {
      fontFamily: "Lexend", fontSize: "34px", fontStyle: "bold", color: "#ffffff",
      backgroundColor: "#07101ddd", padding: { x: 25, y: 14 }, align: "center",
    }).setOrigin(0.5).setDepth(50).setVisible(false);
  }

  private bindInputs(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error("Teclado indisponível.");
    this.keys = keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      angleUp: Phaser.Input.Keyboard.KeyCodes.W,
      angleDown: Phaser.Input.Keyboard.KeyCodes.S,
      powerDown: Phaser.Input.Keyboard.KeyCodes.Q,
      powerUp: Phaser.Input.Keyboard.KeyCodes.E,
      fire: Phaser.Input.Keyboard.KeyCodes.SPACE,
      mode: Phaser.Input.Keyboard.KeyCodes.TAB,
      restart: Phaser.Input.Keyboard.KeyCodes.R,
      menu: Phaser.Input.Keyboard.KeyCodes.ESC,
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE,
      four: Phaser.Input.Keyboard.KeyCodes.FOUR,
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.canPlayerAct() || !this.quickAim) return;
      this.dragging = true;
      this.dragPoint.set(pointer.worldX, pointer.worldY);
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.dragging) this.dragPoint.set(pointer.worldX, pointer.worldY);
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging || !this.canPlayerAct() || !this.quickAim) return;
      this.dragging = false;
      this.dragPoint.set(pointer.worldX, pointer.worldY);
      this.applyQuickAim();
      this.fire(this.player);
    });
  }

  private canPlayerAct(): boolean {
    return this.turn === "player" && !this.shotInProgress && !this.outcome;
  }

  private currentWeapon(): WeaponDefinition {
    return this.catalog.weapons[this.weaponIndex] ?? this.catalog.weapons[0]!;
  }

  private updateHud(): void {
    const weapon = this.currentWeapon();
    const ammo = weapon.ammo === null ? "∞" : String(this.ammo.get(weapon.id) ?? 0);
    this.hudText.setText([
      `${this.turn === "player" ? "SEU TURNO" : "TURNO DO NPC"}  •  Rodada ${this.turnCount}`,
      `Ângulo ${Math.round(this.angle)}°   Potência ${Math.round(this.power)}%`,
      `Vento ${this.wind >= 0 ? "→" : "←"} ${Math.abs(Math.round(this.wind))}   Mira ${this.quickAim ? "RÁPIDA" : "TÁTICA"}`,
    ]);
    this.weaponText.setText(`ARMA ${this.weaponIndex + 1}: ${weapon.name.toUpperCase()}  •  Munição ${ammo}\n${weapon.description}`);
  }

  private showBanner(message: string, duration = 950): void {
    this.bannerText.setText(message).setAlpha(0).setVisible(true);
    this.tweens.add({ targets: this.bannerText, alpha: 1, duration: 180, yoyo: true, hold: Math.max(120, duration - 360), onComplete: () => this.bannerText.setVisible(false) });
  }

  private rollWind(): void {
    this.wind = Phaser.Math.Between(Math.round(this.mission.windMin), Math.round(this.mission.windMax));
  }

  override update(_time: number, deltaMilliseconds: number): void {
    const delta = Math.min(deltaMilliseconds / 1000, 1 / 20);
    this.handleInput(delta);
    this.player.updatePhysics(delta, this.terrain);
    this.enemy.updatePhysics(delta, this.terrain);

    this.accumulator += delta;
    const fixed = 1 / 60;
    while (this.accumulator >= fixed) {
      this.updateProjectiles(fixed);
      this.accumulator -= fixed;
    }
    this.drawTrajectory();
  }

  private handleInput(delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.menu!)) this.scene.start("MenuScene");
    if (Phaser.Input.Keyboard.JustDown(this.keys.restart!)) this.scene.restart({ mode: this.mode, missionIndex: MISSIONS.findIndex((mission) => mission.id === this.mission.id) });
    if (!this.canPlayerAct()) return;

    if (Phaser.Input.Keyboard.JustDown(this.keys.mode!)) {
      this.quickAim = !this.quickAim;
      this.dragging = false;
    }
    const weaponKeys = [this.keys.one, this.keys.two, this.keys.three, this.keys.four];
    weaponKeys.forEach((key, index) => {
      if (key && Phaser.Input.Keyboard.JustDown(key) && this.catalog.weapons[index]) this.weaponIndex = index;
    });

    if (!this.quickAim) {
      if (this.keys.angleUp?.isDown) this.angle = clamp(this.angle + 45 * delta, 8, 84);
      if (this.keys.angleDown?.isDown) this.angle = clamp(this.angle - 45 * delta, 8, 84);
      if (this.keys.powerUp?.isDown) this.power = clamp(this.power + 55 * delta, 22, 100);
      if (this.keys.powerDown?.isDown) this.power = clamp(this.power - 55 * delta, 22, 100);
    }

    const direction = Number(Boolean(this.keys.right?.isDown)) - Number(Boolean(this.keys.left?.isDown));
    if (direction !== 0 && this.movementLeft > 0) {
      const amount = Math.min(this.movementLeft, 90 * delta);
      const nextX = clamp(this.player.x + direction * amount, 70, 590);
      this.movementLeft -= Math.abs(nextX - this.player.x);
      this.player.x = nextX;
      this.player.settle(this.terrain);
      this.player.setFacing(direction > 0 ? 1 : -1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.fire!) && !this.quickAim) this.fire(this.player);
    this.updateHud();
  }

  private applyQuickAim(): void {
    const pullX = this.player.x - this.dragPoint.x;
    const pullY = this.player.y - this.dragPoint.y;
    const length = Math.hypot(pullX, pullY);
    if (length < 20) return;
    const facing: 1 | -1 = pullX >= 0 ? 1 : -1;
    this.player.setFacing(facing);
    this.angle = clamp(Phaser.Math.RadToDeg(Math.atan2(-pullY, Math.abs(pullX))), 8, 84);
    this.power = clamp(length / 2.45, 22, 100);
  }

  private drawTrajectory(): void {
    this.trajectoryGraphics.clear();
    if (!this.canPlayerAct()) return;
    if (this.quickAim && this.dragging) this.applyQuickAim();
    const weapon = this.currentWeapon();
    const origin = { x: this.player.x + this.player.facing * 34, y: this.player.y - 22 };
    const trajectory = simulateTrajectory({
      angle: this.angle,
      power: this.power,
      facing: this.player.facing,
      origin,
      weapon,
      environment: { gravity: 410, wind: this.wind },
      maxSteps: 180,
      stopWhen: (point) => point.x < 0 || point.x > this.worldWidth || point.y > this.worldHeight || this.terrain.isSolid(point.x, point.y),
    });
    trajectory.filter((_, index) => index % 7 === 0).forEach((point, index) => {
      this.trajectoryGraphics.fillStyle(index % 2 === 0 ? 0x7fe5ff : 0xffffff, 0.72).fillCircle(point.x, point.y, Math.max(2, 5 - index * 0.08));
    });
    if (this.quickAim && this.dragging) {
      this.trajectoryGraphics.lineStyle(4, 0xffcf59, 0.9).lineBetween(this.player.x, this.player.y - 12, this.dragPoint.x, this.dragPoint.y);
    }
  }

  private hasAmmo(weapon: WeaponDefinition): boolean {
    return weapon.ammo === null || (this.ammo.get(weapon.id) ?? 0) > 0;
  }

  private fire(owner: UnitEntity, aiAngle?: number, aiPower?: number, aiWeapon?: WeaponDefinition): void {
    const weapon = aiWeapon ?? this.currentWeapon();
    if (!this.hasAmmo(weapon)) {
      if (owner === this.player) this.showBanner("SEM MUNIÇÃO");
      return;
    }
    if (weapon.ammo !== null) this.ammo.set(weapon.id, Math.max(0, (this.ammo.get(weapon.id) ?? 0) - 1));
    this.shotInProgress = true;
    this.finishScheduled = false;
    this.trajectoryGraphics.clear();
    const baseAngle = aiAngle ?? this.angle;
    const shotPower = aiPower ?? this.power;
    const origin = { x: owner.x + owner.facing * 36, y: owner.y - 24 };
    const count = Math.max(1, weapon.projectileCount);
    for (let index = 0; index < count; index += 1) {
      const offset = (index - (count - 1) / 2) * weapon.spreadDegrees;
      const view = this.add.image(origin.x, origin.y, weapon.assetKey).setDisplaySize(30, 30).setDepth(16);
      this.projectiles.push({
        state: {
          position: { ...origin },
          velocity: velocityFromAim(baseAngle + offset, shotPower, weapon.speed, owner.facing),
          age: 0,
        },
        weapon,
        owner,
        view,
        pierceRemaining: weapon.pierce,
        alive: true,
      });
    }
    this.cameras.main.shake(90, 0.0025);
    this.updateHud();
  }

  private updateProjectiles(delta: number): void {
    for (const projectile of this.projectiles) {
      if (!projectile.alive) continue;
      const previous = projectile.state.position;
      projectile.state = stepProjectile(projectile.state, { gravity: 410, wind: this.wind }, projectile.weapon.gravityScale, delta);
      const point = projectile.state.position;
      projectile.view.setPosition(point.x, point.y).setRotation(Math.atan2(projectile.state.velocity.y, projectile.state.velocity.x));

      if (point.x < -40 || point.x > this.worldWidth + 40 || point.y > this.worldHeight + 30 || projectile.state.age > 8) {
        this.removeProjectile(projectile);
        continue;
      }

      const target = projectile.owner === this.player ? this.enemy : this.player;
      if (Phaser.Math.Distance.Between(point.x, point.y, target.x, target.y - 12) < 32) {
        this.explode(projectile, point.x, point.y);
        continue;
      }

      if (this.terrain.isSolid(point.x, point.y)) {
        const hitBarrier = this.terrain.hitBarrier(point.x, point.y, Math.round(projectile.weapon.damage * 0.75));
        if (hitBarrier && projectile.pierceRemaining > 0) {
          projectile.pierceRemaining -= 1;
          projectile.state.position = {
            x: point.x + Math.sign(projectile.state.velocity.x) * 40,
            y: previous.y,
          };
          continue;
        }
        this.explode(projectile, point.x, point.y);
      }
    }

    this.projectiles = this.projectiles.filter((projectile) => projectile.alive);
    if (this.shotInProgress && this.projectiles.length === 0 && !this.finishScheduled) {
      this.finishScheduled = true;
      this.time.delayedCall(700, () => this.finishTurn());
    }
  }

  private removeProjectile(projectile: ActiveProjectile): void {
    projectile.alive = false;
    projectile.view.destroy();
  }

  private explode(projectile: ActiveProjectile, x: number, y: number): void {
    this.removeProjectile(projectile);
    const radius = projectile.weapon.blastRadius;
    this.terrain.addCrater(x, y, radius * projectile.weapon.craterScale);
    for (const unit of [this.player, this.enemy]) {
      const result = calculateRadialDamage({ x, y }, { x: unit.x, y: unit.y - 10 }, radius, projectile.weapon.damage);
      const friendlyFactor = unit === projectile.owner ? 0.5 : 1;
      unit.setHealth(unit.health - result.damage * friendlyFactor);
      unit.applyImpulse(result.impulse.x * 310 * radius / 80, result.impulse.y * 275 * radius / 80 - Math.max(0, result.damage) * 1.2);
    }

    const color = Phaser.Display.Color.HexStringToColor(projectile.weapon.color).color;
    const flash = this.add.circle(x, y, 12, 0xffffff, 0.95).setDepth(22);
    const blast = this.add.circle(x, y, 18, color, 0.8).setDepth(21);
    this.tweens.add({ targets: [flash, blast], scale: radius / 16, alpha: 0, duration: 360, ease: "Cubic.Out", onComplete: () => { flash.destroy(); blast.destroy(); } });
    this.cameras.main.shake(170, 0.007);
  }

  private finishTurn(): void {
    this.finishScheduled = false;
    this.shotInProgress = false;
    this.player.settle(this.terrain);
    this.enemy.settle(this.terrain);
    if (this.checkOutcome()) return;

    if (this.turn === "player") {
      this.turn = "enemy";
      this.showBanner("TURNO DO NPC", 750);
      this.time.delayedCall(750, () => this.performNpcTurn());
    } else {
      this.turn = "player";
      this.turnCount += 1;
      this.movementLeft = 145;
      this.rollWind();
      this.showBanner("SEU TURNO", 700);
    }
    this.updateHud();
  }

  private performNpcTurn(): void {
    if (this.outcome) return;
    const weaponPool = this.catalog.weapons.filter((weapon) => this.hasAmmo(weapon));
    const weapon = this.mission.enemyProfile === "aggressive"
      ? weaponPool.find((item) => item.id === "mega-bomb") ?? weaponPool[0]!
      : this.mission.enemyProfile === "tactical"
        ? weaponPool.find((item) => item.id === "piercer") ?? weaponPool[0]!
        : weaponPool[0]!;
    this.enemy.setFacing(this.player.x < this.enemy.x ? -1 : 1);
    const precision = this.mission.enemyProfile === "tactical" ? "precise" : this.mission.enemyProfile === "aggressive" ? "balanced" : "fast";
    const solution = findAimSolution({
      origin: { x: this.enemy.x + this.enemy.facing * 36, y: this.enemy.y - 24 },
      target: { x: this.player.x, y: this.player.y - 10 },
      facing: this.enemy.facing,
      weapon,
      environment: { gravity: 410, wind: this.wind },
      precision,
      collides: (point) => this.terrain.isSolid(point.x, point.y),
    });
    const inaccuracy = this.mission.enemyProfile === "rookie" ? Phaser.Math.FloatBetween(-6, 6) : this.mission.enemyProfile === "aggressive" ? Phaser.Math.FloatBetween(-2.8, 2.8) : Phaser.Math.FloatBetween(-1.1, 1.1);
    this.fire(this.enemy, clamp(solution.angle + inaccuracy, 8, 84), clamp(solution.power + inaccuracy, 25, 100), weapon);
  }

  private checkOutcome(): boolean {
    if (this.player.health > 0 && this.enemy.health > 0) return false;
    this.outcome = true;
    const victory = this.enemy.health <= 0 && this.player.health > 0;
    let stars = 0;
    if (victory) {
      const [three, two, one] = this.mission.starTurns;
      stars = this.turnCount <= three ? 3 : this.turnCount <= two ? 2 : this.turnCount <= one ? 1 : 1;
      if (this.mode === "campaign") {
        const key = `arcshot:${this.mission.id}:stars`;
        localStorage.setItem(key, String(Math.max(stars, Number(localStorage.getItem(key) ?? 0))));
      }
    }
    this.showEndPanel(victory, stars);
    return true;
  }

  private showEndPanel(victory: boolean, stars: number): void {
    this.add.rectangle(640, 360, 620, 330, 0x07101e, 0.97).setStrokeStyle(3, victory ? 0x67dfff : 0xff735e).setDepth(60);
    this.add.text(640, 260, victory ? "VITÓRIA" : "DERROTA", {
      fontFamily: "Lexend", fontSize: "54px", fontStyle: "bold", color: victory ? "#7fe7ff" : "#ff8c78",
    }).setOrigin(0.5).setDepth(61);
    this.add.text(640, 326, victory ? "★".repeat(stars) : "O NPC venceu esta batalha.", {
      fontFamily: "Lexend", fontSize: victory ? "40px" : "19px", color: victory ? "#ffcf59" : "#aab9cc",
    }).setOrigin(0.5).setDepth(61);
    const replay = this.add.rectangle(500, 420, 220, 58, 0x19395d, 1).setStrokeStyle(2, 0x67dfff).setDepth(61).setInteractive({ useHandCursor: true });
    const menu = this.add.rectangle(780, 420, 220, 58, 0x30254a, 1).setStrokeStyle(2, 0xb77cff).setDepth(61).setInteractive({ useHandCursor: true });
    this.add.text(500, 420, "JOGAR NOVAMENTE", { fontFamily: "Lexend", fontSize: "15px", fontStyle: "bold", color: "#eaf6ff" }).setOrigin(0.5).setDepth(62);
    this.add.text(780, 420, "VOLTAR AO MENU", { fontFamily: "Lexend", fontSize: "15px", fontStyle: "bold", color: "#f2e6ff" }).setOrigin(0.5).setDepth(62);
    replay.on("pointerdown", () => this.scene.restart({ mode: this.mode, missionIndex: MISSIONS.findIndex((mission) => mission.id === this.mission.id) }));
    menu.on("pointerdown", () => this.scene.start("MenuScene"));
  }
}
