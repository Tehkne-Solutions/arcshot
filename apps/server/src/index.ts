import app from "./app.config.js";

const port = Number(process.env.PORT ?? 2567);
await app.listen(port);
console.log(`ArcShot multiplayer server listening on :${port}`);
