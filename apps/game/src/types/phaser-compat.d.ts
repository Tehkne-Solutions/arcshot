import "phaser";

declare module "phaser" {
  namespace GameObjects {
    interface GameObjectCreator {
      graphics(config?: unknown, addToScene?: boolean): Phaser.GameObjects.Graphics;
    }
  }
}
