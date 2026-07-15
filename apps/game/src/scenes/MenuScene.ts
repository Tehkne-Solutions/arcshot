import Phaser from "phaser";
import { MISSIONS } from "../content/missions";
import type { AssetCatalog } from "../types/content";

const FEATURED_CHARACTERS = ["rune-bombardier", "storm-corsair", "celestial-marksman"];

export class MenuScene extends Phaser.Scene {
  constructor() { super("MenuScene"); }

  create(): void {
    this.cameras.main.setBackgroundColor(0x071020);
    const background = this.add.graphics();
    background.fillGradientStyle(0x091426, 0x091426, 0x13142c, 0x13142c, 1).fillRect(0, 0, 1280, 720);
    background.fillStyle(0x1f3961, 0.3).fillCircle(1070, 110, 300);
    background.fillStyle(0x522d63, 0.2).fillCircle(1180, 260, 220);
    background.fillStyle(0x17213a, 0.96).fillRoundedRect(58, 46, 1164, 628, 30);
    background.lineStyle(2, 0x36547c, 0.8).strokeRoundedRect(58, 46, 1164, 628, 30);

    const catalog = this.cache.json.get("arcshot-catalog") as AssetCatalog;
    const featured = FEATURED_CHARACTERS
      .map((id) => catalog.characters.find((character) => character.id === id))
      .filter((character): character is NonNullable<typeof character> => Boolean(character));
    const selectedId = localStorage.getItem("arcshot:selected-character") ?? featured[0]?.id ?? catalog.characters[0]?.id ?? "bombardier";

    const missionStars = MISSIONS.map((mission) => Number(localStorage.getItem(`arcshot:${mission.id}:stars`) ?? 0));
    const totalStars = missionStars.reduce((sum, stars) => sum + stars, 0);

    this.add.text(100, 82, "TEHKNÉ SOLUTIONS", {
      fontFamily: "Lexend", fontSize: "15px", fontStyle: "bold", color: "#6fdfff", letterSpacing: 3,
    });
    this.add.text(94, 118, "ARCSHOT", {
      fontFamily: "Lexend", fontSize: "76px", fontStyle: "bold", color: "#f1f7ff",
    });
    this.add.text(100, 204, "Fantasia tecno-medieval em artilharia tática", {
      fontFamily: "Lexend", fontSize: "21px", color: "#9eb2cc",
    });
    this.add.text(1158, 92, `${totalStars} / ${MISSIONS.length * 3} ESTRELAS`, {
      fontFamily: "Lexend", fontSize: "14px", fontStyle: "bold", color: "#ffcf59", letterSpacing: 1,
    }).setOrigin(1, 0.5);
    this.add.text(1158, 120, "Progresso salvo neste dispositivo", {
      fontFamily: "Lexend", fontSize: "12px", color: "#748aa6",
    }).setOrigin(1, 0.5);

    this.add.text(100, 264, "CAMPANHA", {
      fontFamily: "Lexend", fontSize: "16px", fontStyle: "bold", color: "#ffcf59", letterSpacing: 2,
    });

    MISSIONS.forEach((mission, index) => {
      const y = 302 + index * 62;
      const storedStars = missionStars[index] ?? 0;
      const unlocked = index === 0 || (missionStars[index - 1] ?? 0) > 0;
      const button = this.add.rectangle(100, y, 620, 50, unlocked ? 0x132641 : 0x0c1727, 1).setOrigin(0, 0.5)
        .setStrokeStyle(2, unlocked ? 0x31577d : 0x23344a, unlocked ? 0.9 : 0.55);

      this.add.text(120, y - 13, mission.title, {
        fontFamily: "Lexend", fontSize: "18px", fontStyle: "bold", color: unlocked ? "#edf5ff" : "#65758a",
      });
      this.add.text(120, y + 11, unlocked ? mission.subtitle : "Conclua a missão anterior para desbloquear.", {
        fontFamily: "Lexend", fontSize: "12px", color: unlocked ? "#8ea5c0" : "#536276",
      });
      this.add.text(688, y, unlocked ? (storedStars > 0 ? "★".repeat(storedStars) : "—") : "BLOQ.", {
        fontFamily: "Lexend", fontSize: unlocked ? "18px" : "12px", fontStyle: "bold", color: unlocked ? "#ffcf59" : "#526176",
      }).setOrigin(1, 0.5);

      if (unlocked) {
        button.setInteractive({ useHandCursor: true });
        button.on("pointerover", () => button.setFillStyle(0x1c395c));
        button.on("pointerout", () => button.setFillStyle(0x132641));
        button.on("pointerdown", () => this.scene.start("BattleScene", { mode: "campaign", missionIndex: index, characterId: selectedId }));
      }
    });

    this.add.text(780, 250, "ESCOLHA SEU COMBATENTE", {
      fontFamily: "Lexend", fontSize: "15px", fontStyle: "bold", color: "#8de8ff", letterSpacing: 1.4,
    });

    featured.forEach((character, index) => {
      const x = 780 + index * 126;
      const selected = character.id === selectedId;
      const color = Phaser.Display.Color.HexStringToColor(character.color ?? "#67dcff").color;
      const card = this.add.rectangle(x, 292, 116, 166, selected ? 0x203b57 : 0x101d31, 0.98).setOrigin(0)
        .setStrokeStyle(selected ? 3 : 2, selected ? color : 0x2c4666, selected ? 1 : 0.7)
        .setInteractive({ useHandCursor: true });
      this.add.circle(x + 58, 346, 45, color, selected ? 0.2 : 0.1);
      this.add.image(x + 58, 346, character.assetKey).setDisplaySize(88, 88);
      this.add.text(x + 58, 399, character.name.split(" ")[0] ?? character.name, {
        fontFamily: "Lexend", fontSize: "13px", fontStyle: "bold", color: selected ? "#ffffff" : "#b5c6dc",
      }).setOrigin(0.5);
      this.add.text(x + 58, 424, character.role.toUpperCase(), {
        fontFamily: "Lexend", fontSize: "9px", fontStyle: "bold", color: character.color ?? "#7de7ff", letterSpacing: 0.8,
      }).setOrigin(0.5);
      card.on("pointerover", () => card.setFillStyle(0x24425f));
      card.on("pointerout", () => card.setFillStyle(selected ? 0x203b57 : 0x101d31));
      card.on("pointerdown", () => {
        localStorage.setItem("arcshot:selected-character", character.id);
        this.scene.restart();
      });
    });

    const challenge = this.add.rectangle(780, 485, 368, 82, 0x472a4f, 1).setOrigin(0, 0)
      .setStrokeStyle(2, 0xb66dcc, 0.8).setInteractive({ useHandCursor: true });
    this.add.text(806, 503, "MODO DESAFIO", { fontFamily: "Lexend", fontSize: "21px", fontStyle: "bold", color: "#f3d7ff" });
    this.add.text(806, 536, "NPC tático, tempestade viva e pressão máxima.", { fontFamily: "Lexend", fontSize: "13px", color: "#d1aedb" });
    challenge.on("pointerover", () => challenge.setFillStyle(0x5b3565));
    challenge.on("pointerout", () => challenge.setFillStyle(0x472a4f));
    challenge.on("pointerdown", () => this.scene.start("BattleScene", { mode: "challenge", missionIndex: 4, characterId: selectedId }));

    this.add.rectangle(780, 586, 368, 50, 0x132238, 0.8).setOrigin(0, 0).setStrokeStyle(2, 0x3a5577, 0.55);
    this.add.text(806, 601, "MULTIPLAYER · EM EVOLUÇÃO", { fontFamily: "Lexend", fontSize: "14px", fontStyle: "bold", color: "#8fa6c0" });
    this.add.text(1180, 648, "© Tehkné Solutions", { fontFamily: "Lexend", fontSize: "13px", color: "#627894" }).setOrigin(1, 0.5);
  }
}
