import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
  @type("string") name = "Combatente";
  @type("number") health = 100;
  @type("boolean") ready = false;
}

export class ShotCommandState extends Schema {
  @type("string") playerId = "";
  @type("number") angle = 45;
  @type("number") power = 70;
  @type("string") weaponId = "impact-shot";
}

export class ArcShotState extends Schema {
  @type("string") phase = "waiting";
  @type("string") currentTurn = "";
  @type("number") wind = 0;
  @type("number") tick = 0;
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type([ShotCommandState]) shots = new ArraySchema<ShotCommandState>();
}
