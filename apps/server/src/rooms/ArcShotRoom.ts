import { Client, CloseCode, Room } from "@colyseus/core";
import { ArcShotState, PlayerState, ShotCommandState } from "./schema/ArcShotState.js";

interface FireMessage {
  angle: number;
  power: number;
  weaponId: string;
}

export class ArcShotRoom extends Room {
  override maxClients = 2;
  override state = new ArcShotState();

  override messages = {
    ready: (client: Client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      player.ready = true;
      this.tryStart();
    },
    fire: (client: Client, message: FireMessage) => {
      if (this.state.phase !== "battle" || this.state.currentTurn !== client.sessionId) return;
      if (!Number.isFinite(message.angle) || !Number.isFinite(message.power)) return;
      const command = new ShotCommandState();
      command.playerId = client.sessionId;
      command.angle = Math.max(8, Math.min(84, message.angle));
      command.power = Math.max(22, Math.min(100, message.power));
      command.weaponId = String(message.weaponId || "impact-shot").slice(0, 48);
      this.state.shots.push(command);
      while (this.state.shots.length > 20) this.state.shots.shift();
      const ids = [...this.state.players.keys()];
      this.state.currentTurn = ids.find((id) => id !== client.sessionId) ?? client.sessionId;
      this.state.wind = Math.round((Math.random() * 2 - 1) * 60);
    },
  };

  override onCreate(): void {
    this.setSimulationInterval(() => { this.state.tick += 1; }, 1000 / 20);
  }

  override onJoin(client: Client, options: { name?: string }): void {
    const player = new PlayerState();
    player.name = String(options.name || "Combatente").slice(0, 24);
    this.state.players.set(client.sessionId, player);
  }

  override onLeave(client: Client, _code: CloseCode): void {
    this.state.players.delete(client.sessionId);
    this.state.phase = "waiting";
    this.state.currentTurn = "";
  }

  private tryStart(): void {
    const players = [...this.state.players.entries()];
    if (players.length !== 2 || players.some(([, player]) => !player.ready)) return;
    this.state.phase = "battle";
    this.state.currentTurn = players[0]![0];
    this.state.wind = Math.round((Math.random() * 2 - 1) * 45);
  }
}
