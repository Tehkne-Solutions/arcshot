import { defineRoom, defineServer } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { ArcShotRoom } from "./rooms/ArcShotRoom.js";

const server = defineServer({
  greet: false,
  transport: new WebSocketTransport({ pingInterval: 10_000 }),
  rooms: {
    arcshot_duel: defineRoom(ArcShotRoom),
  },
  express: (app) => {
    app.get("/api/health", (_request, response) => {
      response.json({
        ok: true,
        product: "ArcShot",
        signature: "Tehkné Solutions",
      });
    });
  },
});

export default server;
