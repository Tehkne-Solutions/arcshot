import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2022",
    sourcemap: true,
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/phaser")) return "vendor-phaser";
          if (id.includes("packages/game-core") || id.includes("@arcshot/game-core")) return "game-core";
          return undefined;
        },
      },
    },
  },
});
