import Phaser from "phaser";
import { MISSIONS } from "../content/missions";
import type { AssetCatalog } from "../types/content";
import { premiumTextureForCharacter } from "../art/premiumAssets";

const FEATURED_CHARACTERS = ["rune-bombardier", "storm-corsair", "celestial-marksman"];

export class PremiumMenuScene extends Phaser.Scene {
  constructor() { super("MenuScene"); }

  create(): void {
    document.body.dataset.arcshotScene = "menu";
    this.add.image(640, 360, "premium-bg-storm").setDisplaySize(1280, 720).setDepth(-3);
    const veil = this.add.graphics().setDepth(-2);
    veil.fillGradientStyle(0x030713, 0x030713, 0x050712, 0x050712, 0.3, 0.3, 0.82, 0.82).fillRect(0, 0, 1280, 720);
    veil.fillStyle(0x03050c, 0.64).fillRect(0, 0, 1280, 720);

    const catalog = this.cache.json.get("arcshot-catalog") as AssetCatalog;
    const featured = FEATURED_CHARACTERS
      .map((id) => catalog.characters.find((character) => character.id === id))
      .filter((character): character is NonNullable<typeof character> => Boolean(character));
    const selectedId = localStorage.getItem("arcshot:selected-character") ?? featured[0]?.id ?? catalog.characters[0]?.id ?? "rune-bombardier";
    const missionStars = MISSIONS.map((mission) => Number(localStorage.getItem(`arcshot:${mission.id}:stars`) ?? 0));
    const totalStars = missionStars.reduce((sum, stars) => sum + stars, 0);

    const chrome = this.add.graphics();
    this.drawPanel(chrome, 42, 34, 1196, 652, 0x07111e, 0xc98232);
    this.drawPanel(chrome, 70, 222, 675, 420, 0x081322, 0x8a5b2c);
    this.drawPanel(chrome, 770, 222, 438, 255, 0x081322, 0x8a5b2c);
    this.drawPanel(chrome, 770, 495, 438, 130, 0x111126, 0xa66ad2);

    this.add.text(86, 66, "TEHKNÉ SOLUTIONS", {
      fontFamily: "Lexend", fontSize: "13px", fontStyle: "bold", color: "#6fe5ff", letterSpacing: 4,
      stroke: "#03050a", strokeThickness: 4,
    });
    this.add.text(82, 94, "ARCSHOT", {
      fontFamily: "Lexend", fontSize: "72px", fontStyle: "bold", color: "#f7f9ff",
      stroke: "#060711", strokeThickness: 9,
    });
    this.add.text(86, 174, "FANTASIA TECNO-MEDIEVAL · ARTILHARIA TÁTICA", {
      fontFamily: "Lexend", fontSize: "16px", fontStyle: "bold", color: "#e6b765", letterSpacing: 1.8,
      stroke: "#03050a", strokeThickness: 4,
    });
    this.add.text(1188, 78, `${totalStars} / ${MISSIONS.length * 3} ESTRELAS`, {
      fontFamily: "Lexend", fontSize: "15px", fontStyle: "bold", color: "#ffcf62",
      backgroundColor: "#07101ddd", padding: { x: 14, y: 9 },
      stroke: "#03050a", strokeThickness: 3,
    }).setOrigin(1, 0.5);
    this.add.text(1188, 122, "Progresso salvo neste dispositivo", {
      fontFamily: "Lexend", fontSize: "11px", color: "#8da2ba",
    }).setOrigin(1, 0.5);

    this.add.text(96, 242, "CAMPANHA", {
      fontFamily: "Lexend", fontSize: "15px", fontStyle: "bold", color: "#f1c36f", letterSpacing: 2.2,
    });

    MISSIONS.forEach((mission, index) => {
      const y = 284 + index * 66;
      const storedStars = missionStars[index] ?? 0;
      const unlocked = index === 0 || (missionStars[index - 1] ?? 0) > 0;
      const button = this.add.rectangle(94, y, 625, 53, unlocked ? 0x10233b : 0x080e19, 0.96).setOrigin(0, 0.5)
        .setStrokeStyle(2, unlocked ? 0x9a692f : 0x293346, unlocked ? 0.9 : 0.55);
      this.add.text(113, y - 13, `${String(index + 1).padStart(2, "0")}  ${mission.title}`, {
        fontFamily: "Lexend", fontSize: "16px", fontStyle: "bold", color: unlocked ? "#f2f6ff" : "#5d6a7b",
        stroke: "#03050a", strokeThickness: 3,
      });
      this.add.text(152, y + 10, unlocked ? mission.subtitle : "Conclua a missão anterior para desbloquear.", {
        fontFamily: "Lexend", fontSize: "11px", color: unlocked ? "#9cb0c7" : "#4f5b6b",
      });
      this.add.text(694, y, unlocked ? (storedStars > 0 ? "★".repeat(storedStars) : "—") : "BLOQ.", {
        fontFamily: "Lexend", fontSize: unlocked ? "18px" : "11px", fontStyle: "bold", color: unlocked ? "#ffcf59" : "#526176",
      }).setOrigin(1, 0.5);
      if (unlocked) {
        button.setInteractive({ useHandCursor: true });
        button.on("pointerover", () => button.setFillStyle(0x1c395c).setStrokeStyle(3, 0xe2a44e, 1));
        button.on("pointerout", () => button.setFillStyle(0x10233b).setStrokeStyle(2, 0x9a692f, 0.9));
        button.on("pointerdown", () => this.scene.start("BattleScene", { mode: "campaign", missionIndex: index, characterId: selectedId }));
      }
    });

    this.add.text(794, 241, "ESCOLHA SEU COMBATENTE", {
      fontFamily: "Lexend", fontSize: "14px", fontStyle: "bold", color: "#7de9ff", letterSpacing: 1.4,
    });

    featured.forEach((character, index) => {
      const x = 793 + index * 132;
      const selected = character.id === selectedId;
      const color = Phaser.Display.Color.HexStringToColor(character.color ?? "#67dcff").color;
      const card = this.add.rectangle(x, 275, 118, 174, selected ? 0x213451 : 0x0b1524, 0.98).setOrigin(0)
        .setStrokeStyle(selected ? 4 : 2, selected ? 0xe2a44e : 0x3b5474, selected ? 1 : 0.7)
        .setInteractive({ useHandCursor: true });
      this.add.circle(x + 59, 332, 48, color, selected ? 0.2 : 0.09).setStrokeStyle(2, color, selected ? 0.6 : 0.22);
      const portrait = this.add.image(x + 59, 342, premiumTextureForCharacter(character.id)).setDisplaySize(116, 116);
      this.add.text(x + 59, 401, character.name.split(" ")[0] ?? character.name, {
        fontFamily: "Lexend", fontSize: "13px", fontStyle: "bold", color: selected ? "#ffffff" : "#b5c6dc",
        stroke: "#03050a", strokeThickness: 3,
      }).setOrigin(0.5);
      this.add.text(x + 59, 426, character.role.toUpperCase(), {
        fontFamily: "Lexend", fontSize: "8px", fontStyle: "bold", color: character.color ?? "#7de7ff", letterSpacing: 0.7,
      }).setOrigin(0.5);
      card.on("pointerover", () => {
        card.setFillStyle(0x263d5a).setStrokeStyle(4, 0xf1bd62, 1);
        portrait.setScale(1.07);
      });
      card.on("pointerout", () => {
        card.setFillStyle(selected ? 0x213451 : 0x0b1524).setStrokeStyle(selected ? 4 : 2, selected ? 0xe2a44e : 0x3b5474, selected ? 1 : 0.7);
        portrait.setScale(1);
      });
      card.on("pointerdown", () => {
        localStorage.setItem("arcshot:selected-character", character.id);
        this.scene.restart();
      });
    });

    const challenge = this.add.rectangle(792, 518, 394, 86, 0x321d44, 0.98).setOrigin(0, 0)
      .setStrokeStyle(3, 0xc883e7, 0.92).setInteractive({ useHandCursor: true });
    this.add.text(818, 536, "MODO DESAFIO", {
      fontFamily: "Lexend", fontSize: "21px", fontStyle: "bold", color: "#f6dcff", stroke: "#03050a", strokeThickness: 4,
    });
    this.add.text(818, 570, "NPC tático · tempestade viva · pressão máxima", {
      fontFamily: "Lexend", fontSize: "12px", color: "#d6b8e4",
    });
    challenge.on("pointerover", () => challenge.setFillStyle(0x4d2a64).setStrokeStyle(4, 0xe5a8ff, 1));
    challenge.on("pointerout", () => challenge.setFillStyle(0x321d44).setStrokeStyle(3, 0xc883e7, 0.92));
    challenge.on("pointerdown", () => this.scene.start("BattleScene", { mode: "challenge", missionIndex: 4, characterId: selectedId }));

    this.add.text(1184, 650, "© Tehkné Solutions", { fontFamily: "Lexend", fontSize: "12px", color: "#71879f" }).setOrigin(1, 0.5);
  }

  private drawPanel(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, fill: number, border: number): void {
    graphics.fillStyle(0x02040a, 0.72).fillRoundedRect(x + 8, y + 10, width, height, 16);
    graphics.fillStyle(fill, 0.94).fillRoundedRect(x, y, width, height, 15);
    graphics.lineStyle(3, border, 0.95).strokeRoundedRect(x, y, width, height, 15);
    graphics.lineStyle(1, 0xffdf8f, 0.32).strokeRoundedRect(x + 6, y + 6, width - 12, height - 12, 11);
    graphics.fillStyle(0x5be6ff, 0.68).fillCircle(x + 8, y + 8, 2.5).fillCircle(x + width - 8, y + 8, 2.5);
  }
}
