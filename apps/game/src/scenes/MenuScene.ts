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

const FEATURED_CHARACTERS = ["rune-bombardier", "storm-corsair", "celestial-marksman"];

const ROLE_LABELS: Record<string, string> = {
  artillery: "ARTILHARIA",
  trickster: "ESTRATEGISTA",
  precision: "PRECISÃO",
  ranger: "CAÇADOR",
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
    const selectedId = localStorage.getItem("arcshot:selected-character")
      ?? featured[0]?.id
      ?? catalog.characters[0]?.id
      ?? "rune-bombardier";
    const missionStars = MISSIONS.map((mission) => Number(localStorage.getItem(`arcshot:${mission.id}:stars`) ?? 0));
    const totalStars = missionStars.reduce((sum, stars) => sum + stars, 0);

    this.drawHeader(palette, themeName, totalStars);
    this.drawCampaignPanel(palette, missionStars, selectedId);
    this.drawCombatantPanel(palette, featured, selectedId);
    this.add.text(1208, 692, "Tehkné Solutions", {
      fontFamily: "Lexend", fontSize: "12px", fontStyle: "bold", color: palette.softText,
    }).setOrigin(1, 0.5);
  }

  private getFeaturedCharacters(catalog: AssetCatalog): CharacterDefinition[] {
    const preferred = FEATURED_CHARACTERS
      .map((id) => catalog.characters.find((character) => character.id === id))
      .filter((character): character is CharacterDefinition => Boolean(character));

    for (const character of catalog.characters) {
      if (preferred.length >= 3) break;
      if (!preferred.some((item) => item.id === character.id)) preferred.push(character);
    }
    return preferred.slice(0, 3);
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
      const x = 34 + ((index * 173) % 1210);
      const y = 30 + ((index * 97) % 650);
      const radius = index % 4 === 0 ? 3 : 1.5;
      background.fillStyle(index % 3 === 0 ? palette.accent : palette.primary, palette.isLight ? 0.12 : 0.22)
        .fillCircle(x, y, radius);
    }

    const ornament = this.add.graphics();
    ornament.lineStyle(2, palette.borderStrong, palette.isLight ? 0.18 : 0.2);
    ornament.strokeCircle(1160, 610, 78);
    ornament.strokeCircle(1160, 610, 50);
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      ornament.lineBetween(
        1160 + Math.cos(angle) * 53,
        610 + Math.sin(angle) * 53,
        1160 + Math.cos(angle) * 73,
        610 + Math.sin(angle) * 73,
      );
    }
  }

  private drawHeader(palette: ArcshotUiPalette, themeName: ArcshotTheme, totalStars: number): void {
    this.add.rectangle(42, 28, 1196, 126, palette.panel, palette.isLight ? 0.96 : 0.93)
      .setOrigin(0)
      .setStrokeStyle(2, palette.border, 0.9);

    this.add.circle(94, 91, 36, palette.primary, 1)
      .setStrokeStyle(5, palette.isLight ? 0xffffff : palette.accent, palette.isLight ? 0.95 : 0.8);
    this.add.text(94, 91, "A", {
      fontFamily: "Lexend", fontSize: "30px", fontStyle: "bold", color: "#ffffff",
    }).setOrigin(0.5);

    this.add.text(146, 50, "TEHKNÉ SOLUTIONS", {
      fontFamily: "Lexend", fontSize: "12px", fontStyle: "bold", color: palette.primary === 0x2f6cff ? "#2f6cff" : "#67dcff", letterSpacing: 2.6,
    });
    this.add.text(142, 70, "ARCSHOT", {
      fontFamily: "Lexend", fontSize: "50px", fontStyle: "bold", color: palette.text,
    });
    this.add.text(146, 124, "Fantasia tecnológica em artilharia tática", {
      fontFamily: "Lexend", fontSize: "15px", color: palette.muted,
    });

    this.add.rectangle(788, 51, 208, 78, palette.panelAlt, 1)
      .setOrigin(0)
      .setStrokeStyle(2, palette.border, 0.8);
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
    this.add.rectangle(x, y, 190, 76, palette.panelAlt, 1)
      .setOrigin(0)
      .setStrokeStyle(2, palette.border, 0.8);

    const createOption = (theme: ArcshotTheme, label: string, optionX: number): void => {
      const selected = themeName === theme;
      const button = this.add.rectangle(optionX, y + 28, 78, 34, selected ? palette.primary : palette.panelStrong, 1)
        .setOrigin(0)
        .setStrokeStyle(2, selected ? palette.primary : palette.border, selected ? 1 : 0.65)
        .setInteractive({ useHandCursor: true });
      const text = this.add.text(optionX + 39, y + 45, label, {
        fontFamily: "Lexend", fontSize: "11px", fontStyle: "bold", color: selected ? "#ffffff" : palette.muted,
      }).setOrigin(0.5);

      button.on("pointerover", () => {
        if (!selected) button.setFillStyle(palette.primary, 0.14);
      });
      button.on("pointerout", () => {
        if (!selected) button.setFillStyle(palette.panelStrong, 1);
      });
      button.on("pointerdown", () => {
        applyArcshotTheme(theme);
        this.scene.restart();
      });
      text.setDepth(button.depth + 1);
    };

    createOption("light", "CLARO", x + 13);
    createOption("dark", "ESCURO", x + 99);
  }

  private drawCampaignPanel(palette: ArcshotUiPalette, missionStars: number[], selectedId: string): void {
    this.add.rectangle(42, 174, 724, 512, palette.panel, palette.isLight ? 0.97 : 0.94)
      .setOrigin(0)
      .setStrokeStyle(2, palette.border, 0.9);

    this.add.text(70, 197, "CAMPANHA", {
      fontFamily: "Lexend", fontSize: "19px", fontStyle: "bold", color: palette.text,
    });
    this.add.text(70, 226, "Domine vento, terreno e execução em cinco confrontos.", {
      fontFamily: "Lexend", fontSize: "12px", color: palette.muted,
    });

    MISSIONS.forEach((mission, index) => {
      const y = 258 + index * 78;
      const storedStars = missionStars[index] ?? 0;
      const unlocked = index === 0 || (missionStars[index - 1] ?? 0) > 0;
      const completed = storedStars > 0;
      const fill = unlocked ? palette.panelStrong : palette.panelAlt;
      const border = completed ? palette.success : unlocked ? palette.border : palette.border;
      const card = this.add.rectangle(68, y, 672, 64, fill, unlocked ? 1 : 0.72)
        .setOrigin(0)
        .setStrokeStyle(2, border, completed ? 0.75 : 0.58);

      this.add.circle(100, y + 32, 19, completed ? palette.success : unlocked ? palette.primary : palette.disabled, unlocked ? 1 : 0.55);
      this.add.text(100, y + 32, String(index + 1), {
        fontFamily: "Lexend", fontSize: "14px", fontStyle: "bold", color: "#ffffff",
      }).setOrigin(0.5);

      this.add.text(132, y + 12, mission.title, {
        fontFamily: "Lexend", fontSize: "16px", fontStyle: "bold", color: unlocked ? palette.text : palette.disabled,
      });
      this.add.text(132, y + 37, unlocked ? mission.subtitle : "Conclua a missão anterior para desbloquear.", {
        fontFamily: "Lexend", fontSize: "11px", color: unlocked ? palette.muted : palette.disabled,
      });

      const stateLabel = !unlocked ? "BLOQUEADA" : completed ? "CONCLUÍDA" : "JOGAR";
      const stateColor = !unlocked ? palette.disabled : completed ? palette.success : palette.primary;
      this.add.text(716, y + 17, stateLabel, {
        fontFamily: "Lexend", fontSize: "10px", fontStyle: "bold", color: Phaser.Display.Color.IntegerToColor(stateColor).rgba,
      }).setOrigin(1, 0.5);
      this.add.text(716, y + 44, completed ? "★".repeat(storedStars) : unlocked ? "→" : "—", {
        fontFamily: "Lexend", fontSize: completed ? "16px" : "18px", fontStyle: "bold", color: completed ? "#e49b16" : palette.softText,
      }).setOrigin(1, 0.5);

      if (unlocked) {
        card.setInteractive({ useHandCursor: true });
        card.on("pointerover", () => {
          card.setFillStyle(palette.primary, palette.isLight ? 0.08 : 0.2);
          card.setStrokeStyle(2, palette.primary, 0.95);
        });
        card.on("pointerout", () => {
          card.setFillStyle(fill, 1);
          card.setStrokeStyle(2, border, completed ? 0.75 : 0.58);
        });
        card.on("pointerdown", () => this.scene.start("BattleScene", {
          mode: "campaign",
          missionIndex: index,
          characterId: selectedId,
        }));
      }
    });
  }

  private drawCombatantPanel(
    palette: ArcshotUiPalette,
    featured: CharacterDefinition[],
    selectedId: string,
  ): void {
    this.add.rectangle(784, 174, 454, 512, palette.panel, palette.isLight ? 0.97 : 0.94)
      .setOrigin(0)
      .setStrokeStyle(2, palette.border, 0.9);

    this.add.text(808, 197, "ESCOLHA SEU COMBATENTE", {
      fontFamily: "Lexend", fontSize: "18px", fontStyle: "bold", color: palette.text,
    });
    this.add.text(808, 226, "Cada herói muda projétil, efeitos e estilo de combate.", {
      fontFamily: "Lexend", fontSize: "11px", color: palette.muted,
    });

    featured.forEach((character, index) => {
      const x = 806 + index * 137;
      const y = 256;
      const selected = character.id === selectedId;
      const color = Phaser.Display.Color.HexStringToColor(character.color ?? "#2f6cff").color;
      const cardFill = selected ? palette.panelStrong : palette.panelAlt;
      const card = this.add.rectangle(x, y, 124, 210, cardFill, 1)
        .setOrigin(0)
        .setStrokeStyle(selected ? 4 : 2, selected ? color : palette.border, selected ? 1 : 0.7)
        .setInteractive({ useHandCursor: true });

      this.add.rectangle(x + 9, y + 10, 106, 116, palette.isLight ? 0xe5efff : 0x0a1427, 1)
        .setOrigin(0)
        .setStrokeStyle(1, selected ? color : palette.border, 0.48);
      this.add.circle(x + 62, y + 66, 47, color, selected ? 0.22 : 0.1);

      const resolved = resolveCharacterArt(this, character);
      const portrait = this.add.image(x + 62, y + 71, resolved.textureKey);
      if (resolved.premium) portrait.setDisplaySize(108, 108);
      else portrait.setDisplaySize(104, 104);

      this.add.text(x + 62, y + 141, character.name.split(" ")[0] ?? character.name, {
        fontFamily: "Lexend", fontSize: "13px", fontStyle: "bold", color: palette.text,
      }).setOrigin(0.5);
      this.add.text(x + 62, y + 164, ROLE_LABELS[character.role] ?? character.role.toUpperCase(), {
        fontFamily: "Lexend", fontSize: "8px", fontStyle: "bold", color: character.color ?? palette.text, letterSpacing: 0.5,
      }).setOrigin(0.5);

      const actionLabel = selected ? "SELECIONADO" : "ESCOLHER";
      const action = this.add.rectangle(x + 10, y + 181, 104, 20, selected ? color : palette.panelStrong, 1)
        .setOrigin(0)
        .setStrokeStyle(1, selected ? color : palette.border, 0.75);
      this.add.text(x + 62, y + 191, actionLabel, {
        fontFamily: "Lexend", fontSize: "8px", fontStyle: "bold", color: selected ? "#ffffff" : palette.muted,
      }).setOrigin(0.5);

      card.on("pointerover", () => {
        card.setStrokeStyle(4, color, 1);
        card.setScale(1.025);
        action.setFillStyle(color, selected ? 1 : 0.18);
      });
      card.on("pointerout", () => {
        card.setStrokeStyle(selected ? 4 : 2, selected ? color : palette.border, selected ? 1 : 0.7);
        card.setScale(1);
        action.setFillStyle(selected ? color : palette.panelStrong, 1);
      });
      card.on("pointerdown", () => {
        localStorage.setItem("arcshot:selected-character", character.id);
        this.scene.restart();
      });
    });

    const challenge = this.add.rectangle(808, 490, 406, 86, palette.secondary, 1)
      .setOrigin(0)
      .setStrokeStyle(3, palette.isLight ? 0xffffff : palette.accent, palette.isLight ? 0.72 : 0.8)
      .setInteractive({ useHandCursor: true });
    this.add.text(832, 506, "MODO DESAFIO", {
      fontFamily: "Lexend", fontSize: "20px", fontStyle: "bold", color: "#ffffff",
    });
    this.add.text(832, 538, "NPC tático, tempestade viva e pressão máxima.", {
      fontFamily: "Lexend", fontSize: "11px", color: "#eeeaff",
    });
    this.add.text(1184, 533, "JOGAR  →", {
      fontFamily: "Lexend", fontSize: "12px", fontStyle: "bold", color: "#ffffff",
    }).setOrigin(1, 0.5);
    challenge.on("pointerover", () => challenge.setFillStyle(palette.primaryHover, 1));
    challenge.on("pointerout", () => challenge.setFillStyle(palette.secondary, 1));
    challenge.on("pointerdown", () => this.scene.start("BattleScene", {
      mode: "challenge",
      missionIndex: 4,
      characterId: selectedId,
    }));

    this.add.rectangle(808, 594, 406, 62, palette.panelAlt, 1)
      .setOrigin(0)
      .setStrokeStyle(2, palette.border, 0.75);
    this.add.text(830, 610, "MULTIPLAYER", {
      fontFamily: "Lexend", fontSize: "14px", fontStyle: "bold", color: palette.text,
    });
    this.add.text(830, 634, "Salas e duelos online em evolução.", {
      fontFamily: "Lexend", fontSize: "10px", color: palette.muted,
    });
    this.add.text(1188, 625, "EM BREVE", {
      fontFamily: "Lexend", fontSize: "9px", fontStyle: "bold", color: palette.softText,
    }).setOrigin(1, 0.5);
  }
}
