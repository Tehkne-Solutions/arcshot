import Phaser from "phaser";
import type { CharacterDefinition } from "@arcshot/game-core";
import { MISSIONS } from "../content/missions";
import type { AssetCatalog } from "../types/content";
import { resolveCharacterArt } from "../ui/characterArt";
import { ARCSHOT_THEMES, getArcshotTheme } from "../ui/theme";

interface MissionBriefingData {
  mode?: "campaign" | "challenge";
  missionIndex?: number;
  characterId?: string;
}

export class MissionBriefingScene extends Phaser.Scene {
  private mode: "campaign" | "challenge" = "campaign";
  private missionIndex = 0;
  private characterId = "rune-bombardier";

  constructor() { super("MissionBriefingScene"); }

  init(data: MissionBriefingData): void {
    this.mode = data.mode ?? "campaign";
    this.missionIndex = Phaser.Math.Clamp(data.missionIndex ?? 0, 0, MISSIONS.length - 1);
    this.characterId = data.characterId ?? localStorage.getItem("arcshot:selected-character") ?? "rune-bombardier";
  }

  create(): void {
    const palette = ARCSHOT_THEMES[getArcshotTheme()];
    const mission = MISSIONS[this.missionIndex]!;
    const catalog = this.cache.json.get("arcshot-catalog") as AssetCatalog;
    const character = catalog.characters.find((item) => item.id === this.characterId)
      ?? catalog.characters[0]!;

    const background = this.add.graphics();
    background.fillGradientStyle(
      palette.backgroundTop,
      palette.backgroundTop,
      palette.backgroundBottom,
      palette.backgroundBottom,
      1,
    ).fillRect(0, 0, 1280, 720);
    background.fillStyle(palette.secondary, palette.isLight ? 0.1 : 0.18).fillCircle(1120, 90, 330);
    background.fillStyle(palette.primary, palette.isLight ? 0.07 : 0.12).fillCircle(140, 630, 300);

    this.add.rectangle(95, 55, 1090, 610, palette.panel, palette.isLight ? 0.98 : 0.95)
      .setOrigin(0)
      .setStrokeStyle(3, palette.borderStrong, 0.9);

    this.add.text(130, 88, this.mode === "challenge" ? "MODO DESAFIO" : "BRIEFING DA MISSÃO", {
      fontFamily: "Lexend", fontSize: "13px", fontStyle: "bold",
      color: palette.isLight ? "#2f6cff" : "#67dcff", letterSpacing: 2,
    });
    this.add.text(130, 116, this.mode === "challenge" ? "Cidadela Tempestuosa" : mission.title, {
      fontFamily: "Lexend", fontSize: "38px", fontStyle: "bold", color: palette.text,
    });
    this.add.text(130, 164, this.mode === "challenge"
      ? "Sobreviva ao NPC tático sob vento extremo e vença o duelo."
      : mission.subtitle, {
      fontFamily: "Lexend", fontSize: "15px", color: palette.muted, wordWrap: { width: 680 },
    });

    const art = resolveCharacterArt(this, character as CharacterDefinition);
    this.add.circle(1000, 205, 108, Phaser.Display.Color.HexStringToColor(character.color ?? "#4aa8ff").color, 0.14)
      .setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(character.color ?? "#4aa8ff").color, 0.52);
    this.add.image(1000, 220, art.textureKey).setDisplaySize(190, 190);
    this.add.text(1000, 330, character.name, {
      fontFamily: "Lexend", fontSize: "18px", fontStyle: "bold", color: palette.text,
    }).setOrigin(0.5);
    this.add.text(1000, 358, `${character.maxHealth} PV  •  Movimento ${character.moveRange}`, {
      fontFamily: "Lexend", fontSize: "11px", color: palette.muted,
    }).setOrigin(0.5);

    this.section(130, 220, 700, 96, "CONDIÇÃO DE VITÓRIA", "Reduza a vida do inimigo a zero antes que sua vida chegue a zero.", palette.primary, palette);

    const tacticalInstruction = this.mode === "challenge"
      ? "Vença o NPC tático com vento entre -82 e 82, três pilares e somente 12 segundos por turno."
      : mission.objective.instruction;
    this.section(130, 332, 700, 106, "DESAFIO TÁTICO DA FASE", tacticalInstruction, palette.secondary, palette);

    const [threeStars, twoStars, oneStar] = mission.starTurns;
    this.add.text(130, 462, "PONTUAÇÃO", {
      fontFamily: "Lexend", fontSize: "12px", fontStyle: "bold", color: palette.softText, letterSpacing: 1.2,
    });
    const starLines = [
      `★★★  Vitória em até ${threeStars} rodadas`,
      `★★    Vitória em até ${twoStars} rodadas`,
      `★      Vitória em até ${oneStar} rodadas ou mais`,
    ];
    starLines.forEach((line, index) => {
      this.add.text(130, 488 + index * 27, line, {
        fontFamily: "Lexend", fontSize: "13px", color: index === 0 ? "#d99000" : palette.muted,
      });
    });

    this.add.text(520, 462, "DICAS", {
      fontFamily: "Lexend", fontSize: "12px", fontStyle: "bold", color: palette.softText, letterSpacing: 1.2,
    });
    const hints = this.mode === "challenge"
      ? ["Observe a rajada antes de carregar.", "Mude de posição entre os disparos."]
      : mission.objective.hints;
    hints.slice(0, 2).forEach((hint, index) => {
      this.add.text(520, 488 + index * 34, `• ${hint}`, {
        fontFamily: "Lexend", fontSize: "12px", color: palette.muted, wordWrap: { width: 300 },
      });
    });

    const back = this.add.rectangle(130, 598, 190, 44, palette.panelAlt, 1)
      .setOrigin(0)
      .setStrokeStyle(2, palette.border, 0.9)
      .setInteractive({ useHandCursor: true });
    this.add.text(225, 620, "VOLTAR", {
      fontFamily: "Lexend", fontSize: "12px", fontStyle: "bold", color: palette.text,
    }).setOrigin(0.5);
    back.on("pointerdown", () => this.scene.start("MenuScene"));

    const start = this.add.rectangle(842, 584, 300, 58, palette.primary, 1)
      .setOrigin(0)
      .setStrokeStyle(3, palette.isLight ? 0xffffff : palette.accent, 0.8)
      .setInteractive({ useHandCursor: true });
    this.add.text(992, 613, this.mode === "challenge" ? "INICIAR DESAFIO  →" : "INICIAR MISSÃO  →", {
      fontFamily: "Lexend", fontSize: "14px", fontStyle: "bold", color: "#ffffff",
    }).setOrigin(0.5);
    start.on("pointerover", () => start.setFillStyle(palette.primaryHover, 1));
    start.on("pointerout", () => start.setFillStyle(palette.primary, 1));
    start.on("pointerdown", () => this.scene.start("BattleScene", {
      mode: this.mode,
      missionIndex: this.missionIndex,
      characterId: character.id,
    }));

    this.input.keyboard?.once("keydown-ESC", () => this.scene.start("MenuScene"));
    this.input.keyboard?.once("keydown-ENTER", () => this.scene.start("BattleScene", {
      mode: this.mode,
      missionIndex: this.missionIndex,
      characterId: character.id,
    }));
  }

  private section(
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    body: string,
    accent: number,
    palette: (typeof ARCSHOT_THEMES)[keyof typeof ARCSHOT_THEMES],
  ): void {
    this.add.rectangle(x, y, width, height, palette.panelAlt, 1)
      .setOrigin(0)
      .setStrokeStyle(2, accent, 0.72);
    this.add.rectangle(x, y, 8, height, accent, 1).setOrigin(0);
    this.add.text(x + 26, y + 18, title, {
      fontFamily: "Lexend", fontSize: "11px", fontStyle: "bold", color: palette.softText, letterSpacing: 1,
    });
    this.add.text(x + 26, y + 45, body, {
      fontFamily: "Lexend", fontSize: "14px", fontStyle: "bold", color: palette.text,
      wordWrap: { width: width - 48 },
    });
  }
}
