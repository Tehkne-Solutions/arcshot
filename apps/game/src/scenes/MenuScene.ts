import Phaser from "phaser";
import { MISSIONS } from "../content/missions";

export class MenuScene extends Phaser.Scene {
  constructor() { super("MenuScene"); }

  create(): void {
    this.cameras.main.setBackgroundColor(0x071020);
    const background = this.add.graphics();
    background.fillStyle(0x0c1a30, 1).fillCircle(1040, 120, 310);
    background.fillStyle(0x102849, 0.65).fillCircle(1110, 170, 210);
    background.fillStyle(0x17213a, 1).fillRoundedRect(58, 46, 1164, 628, 30);
    background.lineStyle(2, 0x36547c, 0.8).strokeRoundedRect(58, 46, 1164, 628, 30);

    this.add.text(100, 82, "TEHKNÉ SOLUTIONS", {
      fontFamily: "Lexend", fontSize: "15px", fontStyle: "bold", color: "#6fdfff", letterSpacing: 3,
    });
    this.add.text(94, 118, "ARCSHOT", {
      fontFamily: "Lexend", fontSize: "76px", fontStyle: "bold", color: "#f1f7ff",
    });
    this.add.text(100, 204, "Artilharia tática em turnos", {
      fontFamily: "Lexend", fontSize: "24px", color: "#9eb2cc",
    });

    this.add.text(100, 264, "CAMPANHA", {
      fontFamily: "Lexend", fontSize: "16px", fontStyle: "bold", color: "#ffcf59", letterSpacing: 2,
    });

    MISSIONS.forEach((mission, index) => {
      const y = 302 + index * 62;
      const storedStars = Number(localStorage.getItem(`arcshot:${mission.id}:stars`) ?? 0);
      const button = this.add.rectangle(100, y, 620, 50, 0x132641, 1).setOrigin(0, 0.5)
        .setStrokeStyle(2, 0x31577d, 0.9).setInteractive({ useHandCursor: true });
      this.add.text(120, y - 13, mission.title, {
        fontFamily: "Lexend", fontSize: "18px", fontStyle: "bold", color: "#edf5ff",
      });
      this.add.text(120, y + 11, mission.subtitle, {
        fontFamily: "Lexend", fontSize: "12px", color: "#8ea5c0",
      });
      this.add.text(688, y, storedStars > 0 ? "★".repeat(storedStars) : "—", {
        fontFamily: "Lexend", fontSize: "18px", color: "#ffcf59",
      }).setOrigin(1, 0.5);
      button.on("pointerover", () => button.setFillStyle(0x1c395c));
      button.on("pointerout", () => button.setFillStyle(0x132641));
      button.on("pointerdown", () => this.scene.start("BattleScene", { mode: "campaign", missionIndex: index }));
    });

    const challenge = this.add.rectangle(780, 310, 376, 116, 0x472a4f, 1).setOrigin(0, 0)
      .setStrokeStyle(2, 0xb66dcc, 0.8).setInteractive({ useHandCursor: true });
    this.add.text(806, 334, "MODO DESAFIO", { fontFamily: "Lexend", fontSize: "22px", fontStyle: "bold", color: "#f3d7ff" });
    this.add.text(806, 372, "NPC tático, vento extremo e vida ampliada.", { fontFamily: "Lexend", fontSize: "14px", color: "#d1aedb", wordWrap: { width: 320 } });
    challenge.on("pointerover", () => challenge.setFillStyle(0x5b3565));
    challenge.on("pointerout", () => challenge.setFillStyle(0x472a4f));
    challenge.on("pointerdown", () => this.scene.start("BattleScene", { mode: "challenge", missionIndex: 4 }));

    this.add.rectangle(780, 450, 376, 116, 0x132238, 0.8).setOrigin(0, 0).setStrokeStyle(2, 0x3a5577, 0.55);
    this.add.text(806, 474, "MULTIPLAYER", { fontFamily: "Lexend", fontSize: "22px", fontStyle: "bold", color: "#8fa6c0" });
    this.add.text(806, 512, "Servidor base pronto. Duelo online entra na próxima fase.", { fontFamily: "Lexend", fontSize: "14px", color: "#7188a3", wordWrap: { width: 320 } });

    this.add.text(1180, 636, "© Tehkné Solutions", { fontFamily: "Lexend", fontSize: "13px", color: "#627894" }).setOrigin(1, 0.5);
  }
}
