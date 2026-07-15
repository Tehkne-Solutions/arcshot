import "phaser";

declare module "phaser" {
  namespace Types.GameObjects.Graphics {
    interface Options {
      add?: boolean;
    }
  }
}
