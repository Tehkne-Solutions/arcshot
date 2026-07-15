import Phaser from "phaser";
import {
  calculateRadialDamage,
  clamp,
  findAimSolution,
  rateChargeExecution,
  simulateTrajectory,
  stepCharge,
  stepProjectile,
  velocityFromAim,
  type ArenaTheme,
  type CharacterDefinition,
  type EffectStyle,
  type ProjectileState,
  type WeaponDefinition,
} from "@arcshot/game-core";
import type { AssetCatalog } from "../types/content";
import { MISSIONS, type MissionDefinition } from "../content/missions";
import { TerrainSystem } from "../systems/TerrainSystem";
import { AnimatedBattlefield } from "../systems/AnimatedBattlefield";
import { UnitEntity } from "../entities/UnitEntity";

interface BattleData {
  mode?: "campaign" | "challenge";
  missionIndex?: number;
  characterId?: string;
}

interface ActiveProjectile {
  state: ProjectileState;
  weapon: WeaponDefinition;
  owner: UnitEntity;
  character: CharacterDefinition;
  view: Phaser.GameObjects.Image;
  pierceRemaining: number;
  trailClock: number;
  alive: boolean;
}

interface PendingNpcShot {
  angle: number;
  power: number;
  weapon: WeaponDefinition;
}

export class BattleScene extends Phaser.Scene {
  private readonly worldWidth = 1280;
  private readonly worldHeight = 720;
  private catalog!: AssetCatalog;
  private mission!: MissionDefinition;
  private mode: "campaign" | "challenge" = "campaign";
  private missionIndex = 0;
  private selectedCharacterId = "rune-bombardier";
  private battlefield!: AnimatedBattlefield;
  private terrain!: TerrainSystem;
  private player!: UnitEntity;
  private enemy!: UnitEntity;
  private playerCharacter!: CharacterDefinition;
  private enemyCharacter!: CharacterDefinition;
  private projectiles: ActiveProjectile[] = [];
  private trajectoryGraphics!: Phaser.GameObjects.Graphics;
  private effectGraphics!: Phaser.GameObjects.Graphics;
  private powerMeterGraphics!: Phaser.GameObjects.Graphics;
  private hudText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private bannerText!: Phaser.GameObjects.Text;
  private powerMeterText!: Phaser.GameObjects.Text;
  private turnTimerText!: Phaser.GameObjects.Text;
  private turn: "player" | "enemy" = "player";
  private angle = 45;
  private power = 68;
  private chargePower = 22;
  private chargeDirection: 1 | -1 = 1;
  private chargeOwner: "player" | "enemy" | null = null;
  private charging = false;
  private pendingNpcShot?: PendingNpcShot;
  private npcPlanning = false;
  private npcWatchdog = 0;
  private lastExecutionLabel = "PRONTO";
  private turnTimeRemaining = 15;
  private wind = 0;
  private weaponIndex = 0;
  private playerAmmo = new Map<string, number>();
  private enemyAmmo = new Map<string, number>();
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
    this.missionIndex = clamp(data.missionIndex ?? 0, 0, MISSIONS.length - 1);
    this.selectedCharacterId = data.characterId ?? localStorage.getItem("arcshot:selected-character") ?? "rune-bombardier";
    this.mission = { ...MISSIONS[this.missionIndex]! };
    if (this.mode === "challenge") {
      this.mission = {
        ...this.mission,
        id: "challenge-storm-citadel",
        title: "Desafio da Cidadela Tempestuosa",
        subtitle: "Vento extremo, rival de elite e arena viva.",
        enemyHealth: 145,
        windMin: -82,
        windMax: 82,
        enemyProfile: "tactical",
        barriers: 3,
      };
    }
    this.resetRuntimeState();
  }

  private resetRuntimeState(): void {
    this.projectiles = [];
    this.playerAmmo = new Map();
    this.enemyAmmo = new Map();
    this.turn = "player";
    this.angle = 45;
    this.power = 68;
    this.chargePower = 22;
    this.chargeDirection = 1;
    this.chargeOwner = null;
    this.charging = false;
    this.pendingNpcShot = undefined;
    this.npcPlanning = false;
    this.npcWatchdog = 0;
    this.lastExecutionLabel = "PLANEJE E EXECUTE";
    this.turnTimeRemaining = this.getTurnDuration();
    this.wind = 0;
    this.weaponIndex = 0;
    this.quickAim = false;
    this.dragging = false;
    this.shotInProgress = false;
    this.finishScheduled = false;
    this.movementLeft = 145;
    this.turnCount = 1;
    this.outcome = false;
    this.accumulator = 0;
  }

  create(): void {
    this.catalog = this.cache.json.get("arcshot-catalog") as AssetCatalog;
    if (!this.catalog?.characters?.length || !this.catalog?.weapons?.length) {
      this.add.text(640, 360, "Falha ao carregar o catálogo de combate.", { fontFamily: "Lexend", fontSize: "24px", color: "#ff8c78" }).setOrigin(0.5);
      return;
    }

    this.playerCharacter = this.catalog.characters.find((item) => item.id === this.selectedCharacterId)
      ?? this.catalog.characters.find((item) => item.id === "rune-bombardier")
      ?? this.catalog.characters[0]!;
    this.enemyCharacter = this.chooseEnemyCharacter();
    this.movementLeft = this.playerCharacter.moveRange;

    const theme: ArenaTheme = this.mode === "challenge"
      ? "storm-ruins"
      : this.playerCharacter.arenaTheme ?? "sky-harbor";
    this.cameras.main.setBackgroundColor(0x07101e);
    this.battlefield = new AnimatedBattlefield(this, this.worldWidth, this.worldHeight, theme);
    this.terrain = new TerrainSystem(this, this.worldWidth, this.worldHeight);
    this.terrain.configure(this.mission.barriers);

    this.player = new UnitEntity(this, "player", 185, 400, this.playerCharacter, this.playerCharacter.maxHealth, 1);
    this.enemy = new UnitEntity(this, "enemy", 1080, 400, this.enemyCharacter, this.mission.enemyHealth, -1);
    this.player.settle(this.terrain);
    this.enemy.settle(this.terrain);

    for (const weapon of this.catalog.weapons) {
      if (weapon.ammo !== null) {
        this.playerAmmo.set(weapon.id, weapon.ammo);
        this.enemyAmmo.set(weapon.id, weapon.ammo);
      }
      this.ensureProjectileTexture(this.playerCharacter, weapon);
      this.ensureProjectileTexture(this.enemyCharacter, weapon);
    }

    this.trajectoryGraphics = this.add.graphics().setDepth(10);
    this.effectGraphics = this.add.graphics().setDepth(19);
    this.powerMeterGraphics = this.add.graphics().setDepth(32);
    this.createHud();
    this.bindInputs();
    this.rollWind();
    this.updateHud();
    this.showBanner(this.mission.title, 1350);
    window.dispatchEvent(new CustomEvent("arcshot:scene", { detail: { scene: "battle" } }));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.battlefield?.destroy());
  }

  private chooseEnemyCharacter(): CharacterDefinition {
    const preferred = this.mode === "challenge"
      ? ["storm-corsair", "celestial-marksman", "ranger"]
      : this.missionIndex % 3 === 0
        ? ["celestial-marksman", "ranger", "storm-corsair"]
        : this.missionIndex % 3 === 1
          ? ["storm-corsair", "ranger", "celestial-marksman"]
          : ["rune-bombardier", "ranger", "storm-corsair"];
    return preferred
      .map((id) => this.catalog.characters.find((character) => character.id === id && character.id !== this.selectedCharacterId))
      .find(Boolean)
      ?? this.catalog.characters.find((character) => character.id !== this.selectedCharacterId)
      ?? this.catalog.characters[0]!;
  }

  private getTurnDuration(): number {
    if (this.mode === "challenge") return 12;
    if (this.mission.enemyProfile === "tactical") return 14;
    if (this.mission.enemyProfile === "aggressive") return 16;
    return 18;
  }

  private getPlayerChargeSpeed(): number {
    if (this.mode === "challenge") return 112;
    if (this.mission.enemyProfile === "tactical") return 102;
    if (this.mission.enemyProfile === "aggressive") return 92;
    return 82;
  }

  private createHud(): void {
    this.add.rectangle(22, 18, 430, 116, 0x091424, 0.92).setOrigin(0).setStrokeStyle(2, 0x31547c, 0.9).setDepth(30);
    this.hudText = this.add.text(42, 31, "", {
      fontFamily: "Lexend", fontSize: "15px", color: "#dfeeff", lineSpacing: 6,
    }).setDepth(31);

    this.add.rectangle(470, 18, 788, 75, 0x091424, 0.92).setOrigin(0).setStrokeStyle(2, 0x31547c, 0.9).setDepth(30);
    this.weaponText = this.add.text(492, 31, "", {
      fontFamily: "Lexend", fontSize: "14px", color: "#dfeeff", wordWrap: { width: 740 },
    }).setDepth(31);

    this.add.rectangle(470, 101, 788, 50, 0x07101d, 0.95).setOrigin(0).setStrokeStyle(2, 0x31547c, 0.9).setDepth(30);
    this.powerMeterText = this.add.text(490, 104, "", {
      fontFamily: "Lexend", fontSize: "12px", fontStyle: "bold", color: "#dfeeff",
    }).setDepth(33);
    this.turnTimerText = this.add.text(1238, 104, "", {
      fontFamily: "Lexend", fontSize: "13px", fontStyle: "bold", color: "#ffcf59",
    }).setOrigin(1, 0).setDepth(33);

    this.add.rectangle(22, 638, 1236, 60, 0x07101d, 0.94).setOrigin(0).setStrokeStyle(2, 0x263f61, 0.9).setDepth(30);
    this.add.text(42, 651, "A/D mover   W/S ângulo   Q/E potência alvo   SEGURE/SOLTE Espaço   1–4 armas   Tab mira rápida   Esc menu", {
      fontFamily: "Lexend", fontSize: "13px", color: "#8da5c1",
    }).setDepth(31);
    this.add.text(42, 674, "O combatente altera arena, projétil, rastro e impacto. Solte o marcador na faixa para executar o arco planejado.", {
      fontFamily: "Lexend", fontSize: "11px", color: "#617c9c",
    }).setDepth(31);

    this.bannerText = this.add.text(640, 190, "", {
      fontFamily: "Lexend", fontSize: "32px", fontStyle: "bold", color: "#ffffff",
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
      if (!this.canPlayerAct() || !this.quickAim || this.charging) return;
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
      this.lastExecutionLabel = "ARRASTO DIRETO";
      this.fire(this.player, undefined, this.power);
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
    const ammo = weapon.ammo === null ? "∞" : String(this.playerAmmo.get(weapon.id) ?? 0);
    this.hudText.setText([
      `${this.turn === "player" ? "SEU TURNO" : "TURNO DO NPC"}  •  Rodada ${this.turnCount}`,
      `${this.playerCharacter.name}  ×  ${this.enemyCharacter.name}`,
      `Ângulo ${Math.round(this.angle)}°   Alvo ${Math.round(this.power)}%   Vento ${this.wind >= 0 ? "→" : "←"} ${Math.abs(Math.round(this.wind))}`,
    ]);
    this.weaponText.setText(`ARMA ${this.weaponIndex + 1}: ${weapon.name.toUpperCase()}  •  Munição ${ammo}  •  ${this.lastExecutionLabel}\n${weapon.description}`);
  }

  private showBanner(message: string, duration = 950): void {
    this.bannerText.setText(message).setAlpha(0).setVisible(true);
    this.tweens.add({ targets: this.bannerText, alpha: 1, duration: 160, yoyo: true, hold: Math.max(120, duration - 320), onComplete: () => this.bannerText.setVisible(false) });
  }

  private rollWind(): void {
    this.wind = Phaser.Math.Between(Math.round(this.mission.windMin), Math.round(this.mission.windMax));
  }

  override update(time: number, deltaMilliseconds: number): void {
    if (!this.player || !this.enemy || !this.terrain) return;
    const delta = Math.min(deltaMilliseconds / 1000, 1 / 20);
    this.handleInput(delta);
    this.updateTurnClock(delta);
    this.updateCharge(delta);
    this.updateNpcWatchdog(delta);
    this.player.updatePhysics(delta, this.terrain);
    this.enemy.updatePhysics(delta, this.terrain);
    this.player.setCharging(this.charging && this.chargeOwner === "player");
    this.enemy.setCharging(this.charging && this.chargeOwner === "enemy");
    this.player.updateVisual(time, this.turn === "player");
    this.enemy.updateVisual(time, this.turn === "enemy");
    this.battlefield.update(time, delta, this.wind);

    this.accumulator += delta;
    const fixed = 1 / 60;
    while (this.accumulator >= fixed) {
      this.updateProjectiles(fixed);
      this.accumulator -= fixed;
    }
    this.drawTrajectory();
    this.drawPowerMeter();
    this.drawAimArc();
  }

  private updateTurnClock(delta: number): void {
    if (!this.canPlayerAct()) return;
    this.turnTimeRemaining = Math.max(0, this.turnTimeRemaining - delta);
    if (this.turnTimeRemaining > 0) return;
    this.showBanner("TEMPO ESGOTADO", 700);
    if (this.charging && this.chargeOwner === "player") {
      this.releasePlayerCharge(true);
      return;
    }
    const fallbackPower = clamp(this.power * 0.82, 22, 100);
    this.lastExecutionLabel = "DISPARO FORÇADO";
    this.fire(this.player, undefined, fallbackPower);
  }

  private updateCharge(delta: number): void {
    if (!this.charging) return;
    if (this.chargeOwner === "player") {
      const next = stepCharge({ value: this.chargePower, direction: this.chargeDirection }, this.getPlayerChargeSpeed(), delta);
      this.chargePower = next.value;
      this.chargeDirection = next.direction;
      return;
    }
    if (this.chargeOwner === "enemy" && this.pendingNpcShot) {
      const npcSpeed = this.mode === "challenge" ? 142 : this.mission.enemyProfile === "tactical" ? 128 : this.mission.enemyProfile === "aggressive" ? 112 : 94;
      this.chargePower = Math.min(this.pendingNpcShot.power, this.chargePower + npcSpeed * delta);
      if (this.chargePower >= this.pendingNpcShot.power - 0.01) this.releaseNpcCharge();
    }
  }

  private updateNpcWatchdog(delta: number): void {
    const npcIdle = this.turn === "enemy" && !this.shotInProgress && !this.charging && !this.outcome;
    if (!npcIdle) {
      this.npcWatchdog = 0;
      return;
    }
    this.npcWatchdog += delta;
    if (this.npcWatchdog >= 1.8 && !this.npcPlanning) {
      this.npcWatchdog = 0;
      this.performNpcTurn();
    }
  }

  private handleInput(delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.menu!)) this.scene.start("MenuScene");
    if (Phaser.Input.Keyboard.JustDown(this.keys.restart!)) this.scene.restart({ mode: this.mode, missionIndex: this.missionIndex, characterId: this.playerCharacter.id });
    if (!this.canPlayerAct()) return;

    if (!this.quickAim && this.charging && Phaser.Input.Keyboard.JustUp(this.keys.fire!)) {
      this.releasePlayerCharge();
      return;
    }
    if (!this.quickAim && !this.charging && Phaser.Input.Keyboard.JustDown(this.keys.fire!)) {
      this.startPlayerCharge();
      return;
    }
    if (this.charging) {
      this.updateHud();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.mode!)) {
      this.quickAim = !this.quickAim;
      this.dragging = false;
      this.lastExecutionLabel = this.quickAim ? "MIRA RÁPIDA" : "MIRA TÁTICA";
    }

    const weaponKeys = [this.keys.one, this.keys.two, this.keys.three, this.keys.four];
    weaponKeys.forEach((key, index) => {
      if (key && Phaser.Input.Keyboard.JustDown(key) && this.catalog.weapons[index]) this.weaponIndex = index;
    });

    if (!this.quickAim) {
      if (this.keys.angleUp?.isDown) this.angle = clamp(this.angle + 45 * delta, 8, 84);
      if (this.keys.angleDown?.isDown) this.angle = clamp(this.angle - 45 * delta, 8, 84);
      if (this.keys.powerUp?.isDown) this.power = clamp(this.power + 52 * delta, 22, 100);
      if (this.keys.powerDown?.isDown) this.power = clamp(this.power - 52 * delta, 22, 100);
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
    this.updateHud();
  }

  private startPlayerCharge(): void {
    const weapon = this.currentWeapon();
    if (!this.hasAmmo(weapon, this.player)) {
      this.showBanner("SEM MUNIÇÃO");
      return;
    }
    this.charging = true;
    this.chargeOwner = "player";
    this.chargePower = 22;
    this.chargeDirection = 1;
    this.lastExecutionLabel = "CARREGANDO";
    this.updateHud();
  }

  private releasePlayerCharge(forced = false): void {
    if (!this.charging || this.chargeOwner !== "player") return;
    const execution = rateChargeExecution(this.chargePower, this.power);
    this.charging = false;
    this.chargeOwner = null;
    if (forced) {
      this.lastExecutionLabel = `FORÇADO ${Math.round(execution.actual)}%`;
    } else if (execution.rating === "perfect") {
      this.lastExecutionLabel = `PERFEITO ±${execution.error.toFixed(1)}%`;
      this.showBanner("EXECUÇÃO PERFEITA", 720);
      this.pulseExecution(0x7fe7ff);
    } else if (execution.rating === "good") {
      this.lastExecutionLabel = `BOA ±${execution.error.toFixed(1)}%`;
      this.showBanner("BOA EXECUÇÃO", 580);
      this.pulseExecution(0xffcf59);
    } else {
      this.lastExecutionLabel = `DESVIO ${execution.error.toFixed(1)}%`;
      this.showBanner("POTÊNCIA DESVIADA", 580);
      this.pulseExecution(0xff765f);
    }
    this.fire(this.player, undefined, execution.actual);
  }

  private pulseExecution(color: number): void {
    const pulse = this.add.circle(this.player.x, this.player.y - 18, 22, color, 0.18).setStrokeStyle(3, color, 0.9).setDepth(23);
    this.tweens.add({ targets: pulse, scale: 2.7, alpha: 0, duration: 420, ease: "Cubic.Out", onComplete: () => pulse.destroy() });
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
    const previewPower = this.charging && this.chargeOwner === "player" ? this.chargePower : this.power;
    const origin = { x: this.player.x + this.player.facing * 34, y: this.player.y - 22 };
    const trajectory = simulateTrajectory({
      angle: this.angle,
      power: previewPower,
      facing: this.player.facing,
      origin,
      weapon,
      environment: { gravity: 410, wind: this.wind },
      maxSteps: 180,
      stopWhen: (point) => point.x < 0 || point.x > this.worldWidth || point.y > this.worldHeight || this.terrain.isSolid(point.x, point.y),
    });
    const color = Phaser.Display.Color.HexStringToColor(this.playerCharacter.color ?? "#7fe5ff").color;
    trajectory.filter((_, index) => index % 6 === 0).forEach((point, index) => {
      this.trajectoryGraphics.fillStyle(index % 2 === 0 ? color : 0xffffff, this.charging ? 0.94 : 0.68)
        .fillCircle(point.x, point.y, Math.max(2, 5 - index * 0.075));
    });
    if (this.quickAim && this.dragging) {
      this.trajectoryGraphics.lineStyle(4, 0xffcf59, 0.9).lineBetween(this.player.x, this.player.y - 12, this.dragPoint.x, this.dragPoint.y);
    }
  }

  private drawAimArc(): void {
    this.effectGraphics.clear();
    if (!this.canPlayerAct()) return;
    const radians = Phaser.Math.DegToRad(this.angle);
    const start = this.player.facing > 0 ? 0 : Math.PI;
    const end = this.player.facing > 0 ? -radians : Math.PI + radians;
    const color = Phaser.Display.Color.HexStringToColor(this.playerCharacter.color ?? "#67dcff").color;
    this.effectGraphics.lineStyle(this.charging ? 5 : 3, this.charging ? 0xffcf59 : color, this.charging ? 0.95 : 0.68);
    this.effectGraphics.beginPath();
    this.effectGraphics.arc(this.player.x, this.player.y - 14, 58, start, end, this.player.facing > 0);
    this.effectGraphics.strokePath();
  }

  private drawPowerMeter(): void {
    this.powerMeterGraphics.clear();
    const x = 490;
    const y = 128;
    const width = 640;
    const height = 13;
    const minPower = 22;
    const maxPower = 100;
    const toX = (value: number): number => x + ((clamp(value, minPower, maxPower) - minPower) / (maxPower - minPower)) * width;
    const markerPower = this.charging ? this.chargePower : this.power;
    const targetPower = this.chargeOwner === "enemy" && this.pendingNpcShot ? this.pendingNpcShot.power : this.power;

    this.powerMeterGraphics.fillStyle(0x12233a, 1).fillRoundedRect(x, y, width, height, 6);
    this.powerMeterGraphics.fillStyle(0xb64646, 0.82).fillRoundedRect(x, y, width * 0.34, height, 6);
    this.powerMeterGraphics.fillStyle(0xd3a53f, 0.82).fillRect(x + width * 0.34, y, width * 0.35, height);
    this.powerMeterGraphics.fillStyle(0x4bbf88, 0.82).fillRoundedRect(x + width * 0.69, y, width * 0.31, height, 6);

    if (this.turn === "player") {
      const zoneStart = toX(targetPower - 6);
      const zoneEnd = toX(targetPower + 6);
      const perfectStart = toX(targetPower - 2.5);
      const perfectEnd = toX(targetPower + 2.5);
      this.powerMeterGraphics.fillStyle(0x67dcff, 0.28).fillRect(zoneStart, y - 4, Math.max(3, zoneEnd - zoneStart), height + 8);
      this.powerMeterGraphics.fillStyle(0xffffff, 0.42).fillRect(perfectStart, y - 6, Math.max(2, perfectEnd - perfectStart), height + 12);
    }

    const markerX = toX(markerPower);
    this.powerMeterGraphics.lineStyle(3, 0xffffff, 1).lineBetween(markerX, y - 7, markerX, y + height + 7);
    this.powerMeterGraphics.fillStyle(this.chargeOwner === "enemy" ? 0xff765f : 0xffffff, 1)
      .fillTriangle(markerX - 7, y - 9, markerX + 7, y - 9, markerX, y - 1);

    if (this.chargeOwner === "enemy") {
      this.powerMeterText.setText(`NPC CARREGANDO  ${Math.round(markerPower)}%`);
      this.turnTimerText.setText("PRESSÃO ADVERSÁRIA").setColor("#ff8c78");
    } else if (this.charging) {
      this.powerMeterText.setText(`EXECUÇÃO ${Math.round(markerPower)}%   •   ALVO ${Math.round(targetPower)}%`);
      this.turnTimerText.setText(`${Math.ceil(this.turnTimeRemaining)}s`).setColor(this.turnTimeRemaining <= 4 ? "#ff765f" : "#ffcf59");
    } else {
      this.powerMeterText.setText(`POTÊNCIA ALVO ${Math.round(targetPower)}%   •   SEGURE FOGO E SOLTE NA FAIXA`);
      this.turnTimerText.setText(this.turn === "player" ? `${Math.ceil(this.turnTimeRemaining)}s` : "NPC").setColor(this.turnTimeRemaining <= 4 ? "#ff765f" : "#ffcf59");
    }
  }

  private ammoMap(owner: UnitEntity): Map<string, number> {
    return owner === this.player ? this.playerAmmo : this.enemyAmmo;
  }

  private hasAmmo(weapon: WeaponDefinition, owner: UnitEntity): boolean {
    return weapon.ammo === null || (this.ammoMap(owner).get(weapon.id) ?? 0) > 0;
  }

  private consumeAmmo(weapon: WeaponDefinition, owner: UnitEntity): void {
    if (weapon.ammo === null) return;
    const map = this.ammoMap(owner);
    map.set(weapon.id, Math.max(0, (map.get(weapon.id) ?? 0) - 1));
  }

  private fire(owner: UnitEntity, aiAngle?: number, aiPower?: number, aiWeapon?: WeaponDefinition): boolean {
    const weapon = aiWeapon ?? this.currentWeapon();
    if (!this.hasAmmo(weapon, owner)) {
      if (owner === this.player) this.showBanner("SEM MUNIÇÃO");
      return false;
    }

    this.charging = false;
    this.chargeOwner = null;
    this.pendingNpcShot = undefined;
    this.npcPlanning = false;
    this.consumeAmmo(weapon, owner);
    this.shotInProgress = true;
    this.finishScheduled = false;
    this.trajectoryGraphics.clear();
    const baseAngle = aiAngle ?? this.angle;
    const shotPower = aiPower ?? this.power;
    const origin = { x: owner.x + owner.facing * 36, y: owner.y - 24 };
    const count = Math.max(1, weapon.projectileCount);
    const character = owner.character;
    const textureKey = this.ensureProjectileTexture(character, weapon);

    owner.playFireReaction();
    this.spawnMuzzleVfx(owner, character);
    for (let index = 0; index < count; index += 1) {
      const offset = (index - (count - 1) / 2) * weapon.spreadDegrees;
      const view = this.add.image(origin.x, origin.y, textureKey).setDisplaySize(34, 34).setDepth(16);
      this.projectiles.push({
        state: {
          position: { ...origin },
          velocity: velocityFromAim(baseAngle + offset, shotPower, weapon.speed, owner.facing),
          age: 0,
        },
        weapon,
        owner,
        character,
        view,
        pierceRemaining: weapon.pierce,
        trailClock: 0,
        alive: true,
      });
    }
    this.cameras.main.shake(105, 0.0035);
    this.updateHud();
    return true;
  }

  private updateProjectiles(delta: number): void {
    for (const projectile of this.projectiles) {
      if (!projectile.alive) continue;
      const previous = projectile.state.position;
      projectile.state = stepProjectile(projectile.state, { gravity: 410, wind: this.wind }, projectile.weapon.gravityScale, delta);
      const point = projectile.state.position;
      projectile.view.setPosition(point.x, point.y).setRotation(Math.atan2(projectile.state.velocity.y, projectile.state.velocity.x));
      projectile.trailClock += delta;
      if (projectile.trailClock >= 0.045) {
        projectile.trailClock = 0;
        this.spawnProjectileTrail(projectile);
      }

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
          projectile.state.position = { x: point.x + Math.sign(projectile.state.velocity.x) * 40, y: previous.y };
          continue;
        }
        this.explode(projectile, point.x, point.y);
      }
    }

    this.projectiles = this.projectiles.filter((projectile) => projectile.alive);
    if (this.shotInProgress && this.projectiles.length === 0 && !this.finishScheduled) {
      this.finishScheduled = true;
      this.time.delayedCall(620, () => this.finishTurn());
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
    this.spawnImpactVfx(x, y, radius, projectile.character.effectStyle ?? "arcane", projectile.character.color ?? projectile.weapon.color);
    if (projectile.character.effectStyle === "storm") this.battlefield.flashStorm();
    this.cameras.main.shake(190, 0.008);
  }

  private finishTurn(): void {
    this.finishScheduled = false;
    this.shotInProgress = false;
    this.charging = false;
    this.chargeOwner = null;
    this.pendingNpcShot = undefined;
    this.npcPlanning = false;
    this.player.settle(this.terrain);
    this.enemy.settle(this.terrain);
    if (this.checkOutcome()) return;

    if (this.turn === "player") {
      this.turn = "enemy";
      this.lastExecutionLabel = "NPC ANALISANDO";
      this.showBanner("TURNO DO NPC", 520);
      this.time.delayedCall(280, () => this.performNpcTurn());
    } else {
      this.turn = "player";
      this.turnCount += 1;
      this.movementLeft = this.playerCharacter.moveRange;
      this.turnTimeRemaining = this.getTurnDuration();
      this.lastExecutionLabel = "PLANEJE E EXECUTE";
      this.rollWind();
      this.showBanner("SEU TURNO", 560);
    }
    this.updateHud();
  }

  private performNpcTurn(): void {
    if (this.outcome || this.turn !== "enemy" || this.shotInProgress || this.charging || this.npcPlanning) return;
    this.npcPlanning = true;
    this.lastExecutionLabel = "NPC CALCULANDO";
    this.updateHud();

    this.time.delayedCall(20, () => {
      if (this.outcome || this.turn !== "enemy") {
        this.npcPlanning = false;
        return;
      }

      try {
        let weaponPool = this.catalog.weapons.filter((weapon) => this.hasAmmo(weapon, this.enemy));
        if (weaponPool.length === 0) {
          const fallback = this.catalog.weapons[0]!;
          if (fallback.ammo !== null) this.enemyAmmo.set(fallback.id, 99);
          weaponPool = [fallback];
        }
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
        const inaccuracy = this.mission.enemyProfile === "rookie"
          ? Phaser.Math.FloatBetween(-6, 6)
          : this.mission.enemyProfile === "aggressive"
            ? Phaser.Math.FloatBetween(-2.8, 2.8)
            : Phaser.Math.FloatBetween(-1.1, 1.1);

        this.pendingNpcShot = {
          angle: clamp(solution.angle + inaccuracy, 8, 84),
          power: clamp(solution.power + inaccuracy, 25, 100),
          weapon,
        };
      } catch {
        this.pendingNpcShot = {
          angle: 44,
          power: 68,
          weapon: this.catalog.weapons[0]!,
        };
      }

      this.npcPlanning = false;
      this.charging = true;
      this.chargeOwner = "enemy";
      this.chargePower = 22;
      this.chargeDirection = 1;
      this.lastExecutionLabel = "NPC CARREGANDO";
      this.updateHud();
    });
  }

  private releaseNpcCharge(): void {
    const pending = this.pendingNpcShot;
    if (!pending || this.chargeOwner !== "enemy") {
      this.charging = false;
      this.chargeOwner = null;
      this.pendingNpcShot = undefined;
      this.npcPlanning = false;
      this.performNpcTurn();
      return;
    }
    this.charging = false;
    this.chargeOwner = null;
    this.pendingNpcShot = undefined;
    this.fire(this.enemy, pending.angle, pending.power, pending.weapon);
  }

  private ensureProjectileTexture(character: CharacterDefinition, weapon: WeaponDefinition): string {
    const key = `projectile-${character.id}-${weapon.id}`;
    if (this.textures.exists(key)) return key;
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    const color = Phaser.Display.Color.HexStringToColor(character.color ?? weapon.color).color;
    const style = character.projectileStyle ?? "arc-orb";
    graphics.fillStyle(0xffffff, 0.95).fillCircle(32, 32, 6);
    if (style === "rune-bomb") {
      graphics.fillStyle(0x2b1b23, 1).fillCircle(32, 33, 19);
      graphics.lineStyle(5, color, 1).strokeCircle(32, 33, 18);
      graphics.lineStyle(3, 0xffd36d, 0.9).lineBetween(20, 33, 44, 33).lineBetween(32, 21, 32, 45);
    } else if (style === "storm-shell") {
      graphics.fillStyle(color, 0.9).fillEllipse(32, 32, 43, 23);
      graphics.lineStyle(4, 0xffffff, 0.9).lineBetween(10, 32, 53, 32);
      graphics.lineStyle(3, color, 0.8).lineBetween(18, 18, 10, 9).lineBetween(48, 46, 57, 54);
    } else if (style === "star-bolt") {
      graphics.fillStyle(color, 0.95).fillTriangle(5, 32, 52, 17, 52, 47);
      graphics.fillStyle(0xffffff, 0.95).fillTriangle(20, 32, 48, 24, 48, 40);
    } else if (style === "hunter-shot") {
      graphics.fillStyle(color, 0.95).fillRoundedRect(8, 25, 47, 14, 7);
      graphics.fillStyle(0xffffff, 0.8).fillTriangle(48, 20, 62, 32, 48, 44);
    } else {
      graphics.fillStyle(color, 0.9).fillCircle(32, 32, 20);
      graphics.lineStyle(4, 0xffffff, 0.75).strokeCircle(32, 32, 17);
    }
    graphics.generateTexture(key, 64, 64);
    graphics.destroy();
    return key;
  }

  private spawnMuzzleVfx(owner: UnitEntity, character: CharacterDefinition): void {
    const color = Phaser.Display.Color.HexStringToColor(character.color ?? "#ffffff").color;
    const x = owner.x + owner.facing * 46;
    const y = owner.y - 25;
    const flash = this.add.circle(x, y, 11, 0xffffff, 0.95).setDepth(22);
    const ring = this.add.circle(x, y, 16, color, 0.35).setStrokeStyle(3, color, 0.95).setDepth(21);
    this.tweens.add({ targets: [flash, ring], scale: 2.4, alpha: 0, duration: 260, ease: "Cubic.Out", onComplete: () => { flash.destroy(); ring.destroy(); } });
    for (let index = 0; index < 7; index += 1) {
      const particle = this.add.circle(x, y, 2 + (index % 2), index % 2 === 0 ? color : 0xffffff, 0.9).setDepth(21);
      this.tweens.add({
        targets: particle,
        x: x + owner.facing * Phaser.Math.Between(28, 70),
        y: y + Phaser.Math.Between(-28, 28),
        alpha: 0,
        duration: Phaser.Math.Between(220, 420),
        onComplete: () => particle.destroy(),
      });
    }
  }

  private spawnProjectileTrail(projectile: ActiveProjectile): void {
    const color = Phaser.Display.Color.HexStringToColor(projectile.character.color ?? projectile.weapon.color).color;
    const style = projectile.character.effectStyle ?? "arcane";
    const point = projectile.state.position;
    const particle = this.add.circle(point.x, point.y, style === "storm" ? 4 : 3, style === "ember-runes" ? 0xffb24f : color, style === "celestial" ? 0.8 : 0.62).setDepth(15);
    if (style === "storm") particle.setStrokeStyle(2, 0xffffff, 0.7);
    this.tweens.add({
      targets: particle,
      scale: style === "celestial" ? 0.1 : 1.8,
      alpha: 0,
      x: point.x - projectile.state.velocity.x * 0.035,
      y: point.y - projectile.state.velocity.y * 0.025 + Phaser.Math.Between(-4, 4),
      duration: style === "ember-runes" ? 420 : 280,
      onComplete: () => particle.destroy(),
    });
  }

  private spawnImpactVfx(x: number, y: number, radius: number, style: EffectStyle, colorHex: string): void {
    const color = Phaser.Display.Color.HexStringToColor(colorHex).color;
    const core = this.add.circle(x, y, 12, 0xffffff, 0.98).setDepth(24);
    const blast = this.add.circle(x, y, 18, color, 0.76).setDepth(23);
    const ring = this.add.circle(x, y, 24, color, 0.12).setStrokeStyle(style === "storm" ? 6 : 4, style === "celestial" ? 0xffffff : color, 0.95).setDepth(22);
    this.tweens.add({ targets: [core, blast, ring], scale: radius / 15, alpha: 0, duration: style === "celestial" ? 520 : 390, ease: "Cubic.Out", onComplete: () => { core.destroy(); blast.destroy(); ring.destroy(); } });

    const count = style === "storm" ? 18 : style === "celestial" ? 16 : 13;
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Phaser.Math.FloatBetween(-0.18, 0.18);
      const distance = Phaser.Math.Between(Math.round(radius * 0.45), Math.round(radius * 1.25));
      const particleColor = style === "ember-runes" && index % 3 === 0 ? 0xffcf59 : index % 4 === 0 ? 0xffffff : color;
      const particle = style === "celestial"
        ? this.add.star(x, y, 4, 2, 5, particleColor, 0.95).setDepth(23)
        : this.add.circle(x, y, index % 4 === 0 ? 4 : 2.5, particleColor, 0.9).setDepth(23);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        rotation: angle * 2,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(320, 610),
        ease: "Quad.Out",
        onComplete: () => particle.destroy(),
      });
    }
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
    this.add.rectangle(640, 360, 650, 350, 0x07101e, 0.97).setStrokeStyle(3, victory ? 0x67dfff : 0xff735e).setDepth(60);
    this.add.text(640, 252, victory ? "VITÓRIA" : "DERROTA", {
      fontFamily: "Lexend", fontSize: "54px", fontStyle: "bold", color: victory ? "#7fe7ff" : "#ff8c78",
    }).setOrigin(0.5).setDepth(61);
    this.add.text(640, 318, victory ? "★".repeat(stars) : `${this.enemyCharacter.name} venceu esta batalha.`, {
      fontFamily: "Lexend", fontSize: victory ? "40px" : "18px", color: victory ? "#ffcf59" : "#aab9cc",
    }).setOrigin(0.5).setDepth(61);
    const replay = this.add.rectangle(480, 425, 210, 58, 0x19395d, 1).setStrokeStyle(2, 0x67dfff).setDepth(61).setInteractive({ useHandCursor: true });
    const menu = this.add.rectangle(800, 425, 210, 58, 0x30254a, 1).setStrokeStyle(2, 0xb77cff).setDepth(61).setInteractive({ useHandCursor: true });
    this.add.text(480, 425, "JOGAR NOVAMENTE", { fontFamily: "Lexend", fontSize: "14px", fontStyle: "bold", color: "#eaf6ff" }).setOrigin(0.5).setDepth(62);
    this.add.text(800, 425, "VOLTAR AO MENU", { fontFamily: "Lexend", fontSize: "14px", fontStyle: "bold", color: "#f2e6ff" }).setOrigin(0.5).setDepth(62);
    replay.on("pointerdown", () => this.scene.restart({ mode: this.mode, missionIndex: this.missionIndex, characterId: this.playerCharacter.id }));
    menu.on("pointerdown", () => this.scene.start("MenuScene"));
  }
}
