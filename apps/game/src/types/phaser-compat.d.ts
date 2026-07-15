declare namespace Phaser.GameObjects {
  interface GameObjectCreator {
    graphics(
      config?: Phaser.Types.GameObjects.Graphics.Options & { add?: boolean },
      addToScene?: boolean,
    ): Phaser.GameObjects.Graphics;
  }
}

export {};
