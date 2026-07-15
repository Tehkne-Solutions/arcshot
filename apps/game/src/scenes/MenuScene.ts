import Phaser from "phaser";
import type { CharacterDefinition } from "@arcshot/game-core";
import { MISSIONS } from "../content/missions";
import type { AssetCatalog } from "../types/content";
import { resolveCharacterArt } from "../ui/characterArt";
import {
  applyArcshotTheme,
  ARCSHOT_THEMES,
  getArcshotTheme,
  type ArcshotTheme,
  type ArcshotUiPalette,
} from "../ui/theme";

const FEATURED_CHARACTERS = [
  "rune-bombardier",
  "storm-corsair",
  "celestial-marksman",
  "iron-shell-guardian",
  "steam-orc-raider",
];

const ROLE_LABELS: Record<string, string> = {
  artillery: "ARTILHARIA",
  trickster: "ESTRATÉGIA",
  precision: "PRECISÃO",
  guardian: "GUARDIÃO",
  brawler: "BRUTAMONTE",
};

export class MenuScene extends Phaser.Scene {
  constructor() { super("MenuScene"); }

  create(): void {
    const themeName = getArcshotTheme();
    const palette = ARCSHOT_THEMES[themeName];
    applyArcshotTheme(themeName);
    this.cameras.main.setBackgroundColor(palette.backgroundTop);
    this.drawBackdrop(palette);

    const catalog = this.cache.json.get("arcshot-catalog") as AssetCatalog;
    if (!catalog?.characters?.length) {
      this.add.text(640, 360, "Não foi possível carregar os combatentes.", {
        fontFamily: "Lexend", fontSize: "24px", color: palette.text,
      }).setOrigin(0.5);
      return;
    }

    const featured = this.getFeaturedCharacters(catalog);
    const storedSelection = localStorage.getItem("arcshot:selected-character");
    const selectedId = featured.some((character) => character.id === storedSelection)
      ? storedSelection!
      : featured[0]?.id ?? "rune-bombardier";
    localStorage.setItem("arcshot:selected-character", selectedId);

    const missionStars = MISSIONS.map((mission) => Number(localStorage.getItem(`arcshot:${mission.id}:stars`) ?? 0));
    const totalStars = missionStars.reduce((sum, stars) => sum + stars, 0);

    this.drawHeader(palette, themeName, totalStars);
    this.drawCampaign(palette, missionStars, selectedId);
    this.drawCombatants(palette, featured, selectedId);
    this.add.text(1208, 694, "Tehkné Solutions", {
      fontFamily: "Lexend", fontSize: "12px", fontStyle: "bold", color: palette.softText,
    }).setOrigin(1, 0.5);
  }

  private getFeaturedCharacters(catalog: AssetCatalog): CharacterDefinition[] {
    return FEATURED_CHARACTERS
      .map((id) => catalog.characters.find((character) => character.id === id))
      .filter((character): character is CharacterDefinition => Boolean(character));
  }

  private panel(
    x: number,
    y: number,
    width: number,
    height: number,
    palette: ArcshotUiPalette,
    fill = palette.panel,
  ): Phaser.GameObjects.Rectangle {
    return this.add.rectangle(x, y, width, height, fill, palette.isLight ? 0.97 : 0.94)
      .setOrigin(0)
      .setStrokeStyle(2, palette.border, 0.88);
  }

  private drawBackdrop(palette: ArcshotUiPalette): void {
    const background = this.add.graphics();
    background.fillGradientStyle(
      palette.backgroundTop,
      palette.backgroundTop,
      palette.backgroundBottom,
      palette.backgroundBottom,
      1,
    ).fillRect(0, 0, 1280, 720);
    background.fillStyle(palette.backgroundGlow, palette.isLight ? 0.16 : 0.22).fillCircle(1120, 90, 330);
    background.fillStyle(palette.secondary, palette.isLight ? 0.08 : 0.13).fillCircle(1220, 340, 270);
    background.fillStyle(palette.primary, palette.isLight ? 0.06 : 0.09).fillCircle(140, 620, 250);

    for (let index = 0; index < 18; index += 1) {
      background.fillStyle(index % 3 === 0 ? palette.accent : palette.primary, palette.isLight ? 0.12 : 0.22)
        .fillCircle(34 + ((index * 173) % 1210), 30 + ((index * 97) % 650), index % 4 === 0 ? 3 : 1.5);
    }
  }

  private drawHeader(palette: ArcshotUiPalette, themeName: ArcshotTheme, totalStars: number): void {
    this.panel(42, 28, 1196, 126, palette);
    this.add.circle(94, 91, 36, palette.primary, 1)
      .setStrokeStyle(5, palette.isLight ? 0xffffff : palette.accent, 0.9);
    this.add.text(94, 91, "A", {
      fontFamily: "Lexend", fontSize: "30px", fontStyle: "bold", color: "#ffffff",
    }).setOrigin(0.5);
    this.add.text(146, 50, "TEHKNÉ SOLUTIONS", {
      fontFamily: "Lexend", fontSize: "12px", fontStyle: "bold",
      color: palette.isLight ? "#2f6cff" : "#67dcff", letterSpacing: 2.6,
    });
    this.add.text(142, 70, "ARCSHOT", {
      fontFamily: "Lexend", fontSize: "50px", fontStyle: "bold", color: palette.text,
    });
    this.add.text(146, 124, "Fantasia tecnológica em artilharia tática", {
      fontFamily: "Lexend", fontSize: "15px", color: palette.muted,
    });

    this.panel(788, 51, 208, 78, palette, palette.panelAlt);
    this.add.text(812, 68, "PROGRESSO DA CAMPANHA", {
      fontFamily: "Lexend", fontSize: "10px", fontStyle: "bold", color: palette.softText, letterSpacing: 1,
    });
    this.add.text(812, 91, `${totalStars} / ${MISSIONS.length * 3}`, {
      fontFamily: "Lexend", fontSize: "27px", fontStyle: "bold", color: palette.text,
    });
    this.add.text(914, 99, "ESTRELAS", {
      fontFamily: "Lexend", fontSize: "10px", fontStyle: "bold", color: "#d48b00",
    });
    this.drawThemeToggle(palette, themeName, 1017, 52);
  }

  private drawThemeToggle(palette: ArcshotUiPalette, themeName: ArcshotTheme, x: number, y: number): void {
    this.add.text(x, y - 16, "APARÊNCIA", {
      fontFamily: "Lexend", fontSize: "10px", fontStyle: "bold", color: palette.softText, letterSpacing: 1,
    });
    this.panel(x, y, 190, 76, palette, palette.panelAlt);

    const option = (theme: ArcshotTheme, label: string, optionX: number): void => {
      const selected = themeName === theme;
      const button = this.add.rectangle(optionX, y + 28, 78, 34, selected ? palette.primary : palette.panelStrong, 1)
        .setOrigin(0)
        .setStrokeStyle(2, selected ? palette.primary : palette.border, selected ? 1 : 0.65)
        .setInteractive({ useHandCursor: true });
      this.add.text(optionX + 39, y + 45, label, {
        fontFamily: "Lexend", fontSize: "11px", fontStyle: "bold", color: selected ? "#ffffff" : palette.muted,
      }).setOrigin(0.5);
      button.on("pointerdown", () => {
        applyArcshotTheme(theme);
        this.scene.restart();
      });
    };

    option("light", "CLARO", x + 13);
    option("dark", "ESCURO", x + 99);
  }

  private drawCampaign(palette: ArcshotUiPalette, missionStars: number[], selectedId: string): void {
    this.panel(42, 174, 724, 512, palette);
    this.add.text(70, 197, "CAMPANHA", {
      fontFamily: "Lexend", fontSize: "19px", fontStyle: "bold", color: palette.text,
    });
    this.add.text(70, 226, "Cada confronto mostra a condição de vitória, o desafio e a pontuação antes de começar.", {
      fontFamily: "Lexend", fontSize: "11px", color: palette.muted,
    });

    MISSIONS.forEach((mission, index) => {
      const y = 258 + index * 78;
      const storedStars = missionStars[index] ?? 0;
      const unlocked = index === 0 || (missionStars[index - 1] ?? 0) > 0;
      const completed = storedStars > 0;
      const fill = unlocked ? palette.panelStrong : palette.panelAlt;
      const border = completed ? palette.success : palette.border;
      const card = this.add.rectangle(68, y, 672, 64, fill, unlocked ? 1 : 0.72)
        .setOrigin(0)
        .setStrokeStyle(2, border, completed ? 0.75 : 0.58);

      this.add.circle(100, y + 32, 19, completed ? palette.success : unlocked ? palette.primary : palette.disabledFill, unlocked ? 1 : 0.55);
      this.add.text(100, y + 32, String(index + 1), {
        fontFamily: "Lexend", fontSize: "14px", fontStyle: "bold", color: "#ffffff",
      }).setOrigin(0.5);
      this.add.text(132, y + 9, mission.title, {
        fontFamily: "Lexend", fontSize: "15px", fontStyle: "bold", color: unlocked ? palette.text : palette.disabled,
      });
      this.add.text(132, y + 34, unlocked ? mission.subtitle : "Conclua a missão anterior para desbloquear.", {
        fontFamily: "Lexend", fontSize: "10px", color: unlocked ? palette.muted : palette.disabled,
        wordWrap: { width: 475 },
      });

      const stateLabel = !unlocked ? "BLOQUEADA" : completed ? "CONCLUÍDA" : "VER MISSÃO";
      const stateColor = !unlocked ? palette.disabledFill : completed ? palette.success : palette.primary;
      this.add.text(716, y + 17, stateLabel, {
        fontFamily: "Lexend", fontSize: "9px", fontStyle: "bold",
        color: Phaser.Display.Color.IntegerToColor(stateColor).rgba,
      }).setOrigin(1, 0.5);
      this.add.text(716, y + 44, completed ? "★".repeat(storedStars) : unlocked ? "DETALHES →" : "—", {
        fontFamily: "Lexend", fontSize: completed ? "16px" : "9px", fontStyle: "bold",
        color: completed ? "#e49b16" : palette.softText,
      }).setOrigin(1, 0.5);

      if (unlocked) {
        card.setInteractive({ useHandCursor: true });
        card.on("pointerover", () => card.setStrokeStyle(3, palette.primary, 0.95));
        card.on("pointerout", () => card.setStrokeStyle(2, border, completed ? 0.75 : 0.58));
        card.on("pointerdown", () => this.scene.start("MissionBriefingScene", {
          mode: "campaign", missionIndex: index, characterId: selectedId,
        }));
      }
    });
  }

  private drawCombatants(
    palette: ArcshotUiPalette,
    featured: CharacterDefinition[],
    selectedId: string,
  ): void {
    this.panel(784, 174, 454, 512, palette);
    this.add.text(808, 197, "ESCOLHA SEU COMBATENTE", {
      fontFamily: "Lexend", fontSize: "18px", fontStyle: "bold", color: palette.text,
    });
    this.add.text(808, 226, "Cinco heróis, silhuetas, vida e estilos de disparo diferentes.", {
      fontFamily: "Lexend", fontSize: "10px", color: palette.muted,
    });

    featured.forEach((character, index) => {
      const x = 805 + index * 82;
      const y = 254;
      const selected = character.id === selectedId;
      const color = Phaser.Display.Color.HexStringToColor(character.color ?? "#2f6cff").color;
      const card = this.add.rectangle(x, y, 76, 202, selected ? palette.panelStrong : palette.panelAlt, 1)
        .setOrigin(0)
        .setStrokeStyle(selected ? 3 : 1.5, selected ? color : palette.border, selected ? 1 : 0.7)
        .setInteractive({ useHandCursor: true });

      this.add.rectangle(x + 5, y + 7, 66, 104, palette.isLight ? 0xe5efff : 0x0a1427, 1)
        .setOrigin(0)
        .setStrokeStyle(1, selected ? color : palette.border, 0.48);
      this.add.circle(x + 38, y + 58, 29, color, selected ? 0.22 : 0.1);
      const art = resolveCharacterArt(this, character);
      this.add.image(x + 38, y + 62, art.textureKey).setDisplaySize(70, 70);

      const shortName = character.name.split(" ")[0] ?? character.name;
      this.add.text(x + 38, y + 122, shortName, {
        fontFamily: "Lexend", fontSize: "10px", fontStyle: "bold", color: palette.text,
      }).setOrigin(0.5);
      this.add.text(x + 38, y + 143, ROLE_LABELS[character.role] ?? character.role.toUpperCase(), {
        fontFamily: "Lexend", fontSize: "6px", fontStyle: "bold", color: character.color ?? palette.text,
        align: "center", wordWrap: { width: 68 },
      }).setOrigin(0.5);
      this.add.text(x + 38, y + 162, `${character.maxHealth} PV`, {
        fontFamily: "Lexend", fontSize: "8px", color: palette.muted,
      }).setOrigin(0.5);

      const action = this.add.rectangle(x + 6, y + 178, 64, 17, selected ? color : palette.panelStrong, 1)
        .setOrigin(0)
        .setStrokeStyle(1, selected ? color : palette.border, 0.75);
      this.add.text(x + 38, y + 186.5, selected ? "ATIVO" : "ESCOLHER", {
        fontFamily: "Lexend", fontSize: "6px", fontStyle: "bold", color: selected ? "#ffffff" : palette.muted,
      }).setOrigin(0.5);

      card.on("pointerover", () => {
        card.setStrokeStyle(3, color, 1);
        action.setFillStyle(color, selected ? 1 : 0.18);
      });
      card.on("pointerout", () => {
        card.setStrokeStyle(selected ? 3 : 1.5, selected ? color : palette.border, selected ? 1 : 0.7);
        action.setFillStyle(selected ? color : palette.panelStrong, 1);
      });
      card.on("pointerdown", () => {
        localStorage.setItem("arcshot:selected-character", character.id);
        this.scene.restart();
      });
    });

    const challenge = this.add.rectangle(808, 480, 406, 86, palette.secondary, 1)
      .setOrigin(0)
      .setStrokeStyle(3, palette.isLight ? 0xffffff : palette.accent, 0.78)
      .setInteractive({ useHandCursor: true });
    this.add.text(832, 496, "MODO DESAFIO", {
      fontFamily: "Lexend", fontSize: "20px", fontStyle: "bold", color: "#ffffff",
    });
    this.add.text(832, 528, "NPC tático, tempestade viva e pressão máxima.", {
      fontFamily: "Lexend", fontSize: "11px", color: "#eeeaff",
    });
    this.add.text(1184, 523, "VER REGRAS  →", {
      fontFamily: "Lexend", fontSize: "11px", fontStyle: "bold", color: "#ffffff",
    }).setOrigin(1, 0.5);
    challenge.on("pointerdown", () => this.scene.start("MissionBriefingScene", {
      mode: "challenge", missionIndex: 4, characterId: selectedId,
    }));

    this.panel(808, 584, 406, 72, palette, palette.panelAlt);
    this.add.text(830, 600, "MULTIPLAYER", {
      fontFamily: "Lexend", fontSize: "14px", fontStyle: "bold", color: palette.text,
    });
    this.add.text(830, 626, "Salas e duelos online em evolução.", {
      fontFamily: "Lexend", fontSize: "10px", color: palette.muted,
    });
    this.add.text(1188, 618, "EM BREVE", {
      fontFamily: "Lexend", fontSize: "9px", fontStyle: "bold", color: palette.softText,
    }).setOrigin(1, 0.5);
  }
}
