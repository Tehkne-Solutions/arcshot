import Phaser from "phaser";
import type { CharacterDefinition } from "@arcshot/game-core";

export interface ResolvedCharacterArt {
  readonly textureKey: string;
  readonly premium: boolean;
}

const premiumTextureFor = (scene: Phaser.Scene, characterId: string): string | null => {
  if (characterId === "rune-bombardier" && scene.textures.exists("premium-brask")) return "premium-brask";
  if (characterId === "storm-corsair" && scene.textures.exists("premium-kael")) return "premium-kael";
  return null;
};

const base = (graphics: Phaser.GameObjects.Graphics, color: number): void => {
  graphics.fillStyle(color, 0.12).fillCircle(96, 92, 82);
  graphics.lineStyle(3, color, 0.34).strokeCircle(96, 92, 72);
  graphics.fillStyle(0x000000, 0.45).fillEllipse(96, 184, 116, 18);
};

const drawLyra = (graphics: Phaser.GameObjects.Graphics, color: number): void => {
  base(graphics, color);
  graphics.fillStyle(0x372f57, 1).fillRoundedRect(48, 86, 88, 84, 26);
  graphics.lineStyle(5, 0xc7b8ff, 1).strokeRoundedRect(48, 86, 88, 84, 26);
  graphics.fillStyle(0xc98667, 1).fillCircle(86, 59, 28);
  graphics.lineStyle(4, 0xf5ecff, 0.9).strokeCircle(86, 59, 28);
  graphics.fillStyle(0xe9e2ff, 1).fillTriangle(47, 59, 81, 14, 130, 48);
  graphics.fillStyle(color, 0.96).fillRoundedRect(57, 50, 66, 16, 8);
  graphics.fillStyle(0xa5f7ff, 1).fillRoundedRect(70, 55, 40, 7, 3);
  graphics.fillStyle(0x6c5b97, 1).fillTriangle(51, 96, 83, 171, 132, 93);
  graphics.fillStyle(0x24304b, 1).fillRoundedRect(103, 78, 81, 23, 10);
  graphics.lineStyle(4, 0xb9f6ff, 1).strokeRoundedRect(103, 78, 81, 23, 10);
  graphics.fillStyle(0xeafcff, 1).fillTriangle(181, 78, 194, 90, 181, 102);
  graphics.lineStyle(4, color, 0.9).lineBetween(40, 101, 17, 80);
  graphics.lineStyle(4, color, 0.9).lineBetween(40, 117, 14, 134);
  graphics.fillStyle(0x241e38, 1).fillRoundedRect(45, 166, 41, 20, 7);
  graphics.fillStyle(0x241e38, 1).fillRoundedRect(108, 166, 41, 20, 7);
};

const drawTorga = (graphics: Phaser.GameObjects.Graphics, color: number): void => {
  base(graphics, color);
  graphics.fillStyle(0x1d3342, 1).fillEllipse(86, 111, 118, 105);
  graphics.lineStyle(6, 0xd0b56a, 1).strokeEllipse(86, 111, 118, 105);
  graphics.fillStyle(0x294d5d, 1).fillCircle(74, 55, 31);
  graphics.lineStyle(5, 0xe7faff, 0.9).strokeCircle(74, 55, 31);
  graphics.fillStyle(0x75e6ff, 1).fillCircle(64, 54, 5);
  graphics.fillStyle(0x75e6ff, 1).fillCircle(83, 54, 5);
  graphics.fillStyle(0x203442, 1).fillRoundedRect(42, 88, 97, 78, 28);
  graphics.lineStyle(5, color, 1).strokeRoundedRect(42, 88, 97, 78, 28);
  graphics.fillStyle(0x0c1925, 1).fillCircle(84, 119, 40);
  graphics.lineStyle(7, 0xb88b45, 1).strokeCircle(84, 119, 40);
  graphics.lineStyle(4, color, 0.9).strokeCircle(84, 119, 27);
  graphics.fillStyle(0xa8f3ff, 1).fillDiamond(84, 119, 16, 24);
  graphics.fillStyle(0x202c3d, 1).fillRoundedRect(121, 83, 67, 36, 14);
  graphics.lineStyle(5, color, 1).strokeRoundedRect(121, 83, 67, 36, 14);
  graphics.fillStyle(0xc6f7ff, 0.95).fillCircle(184, 101, 13);
  graphics.fillStyle(0x17232d, 1).fillRoundedRect(38, 166, 43, 20, 8);
  graphics.fillStyle(0x17232d, 1).fillRoundedRect(104, 166, 43, 20, 8);
};

const drawGhorz = (graphics: Phaser.GameObjects.Graphics, color: number): void => {
  base(graphics, color);
  graphics.fillStyle(0x5d873e, 1).fillCircle(78, 57, 31);
  graphics.lineStyle(4, 0xe8ffc8, 0.88).strokeCircle(78, 57, 31);
  graphics.fillStyle(0xe8f4c8, 1).fillTriangle(58, 71, 65, 89, 72, 69);
  graphics.fillStyle(0xe8f4c8, 1).fillTriangle(88, 70, 96, 88, 101, 66);
  graphics.fillStyle(0x182330, 1).fillRoundedRect(48, 25, 67, 26, 9);
  graphics.lineStyle(4, color, 1).strokeRoundedRect(48, 25, 67, 26, 9);
  graphics.fillStyle(0xffc462, 1).fillCircle(66, 57, 6);
  graphics.fillStyle(0xffc462, 1).fillCircle(89, 57, 6);
  graphics.fillStyle(0x303a2d, 1).fillRoundedRect(35, 91, 108, 80, 24);
  graphics.lineStyle(5, color, 1).strokeRoundedRect(35, 91, 108, 80, 24);
  graphics.fillStyle(0x7b3f25, 1).fillRoundedRect(55, 101, 65, 45, 12);
  graphics.lineStyle(3, 0xffd087, 0.9).strokeRoundedRect(55, 101, 65, 45, 12);
  graphics.fillStyle(0x202b39, 1).fillRoundedRect(116, 82, 76, 38, 13);
  graphics.lineStyle(5, 0xff9c45, 1).strokeRoundedRect(116, 82, 76, 38, 13);
  graphics.fillStyle(0xffce70, 0.96).fillCircle(186, 101, 13);
  graphics.fillStyle(0x26333b, 1).fillCircle(32, 116, 20);
  graphics.lineStyle(4, 0x95d8df, 0.85).strokeCircle(32, 116, 20);
  graphics.lineStyle(5, 0xb7c2c7, 0.8).lineBetween(43, 84, 25, 55);
  graphics.fillStyle(0x151d25, 1).fillRoundedRect(34, 165, 46, 21, 8);
  graphics.fillStyle(0x151d25, 1).fillRoundedRect(106, 165, 46, 21, 8);
};

const drawFallback = (graphics: Phaser.GameObjects.Graphics, color: number): void => {
  base(graphics, color);
  graphics.fillStyle(0x26364e, 1).fillRoundedRect(46, 86, 92, 84, 25);
  graphics.lineStyle(5, color, 1).strokeRoundedRect(46, 86, 92, 84, 25);
  graphics.fillStyle(0xd4a274, 1).fillCircle(84, 58, 29);
  graphics.lineStyle(4, 0xf4f8ff, 0.88).strokeCircle(84, 58, 29);
  graphics.fillStyle(0x1d2b41, 1).fillRoundedRect(111, 91, 74, 30, 11);
  graphics.lineStyle(4, color, 0.9).strokeRoundedRect(111, 91, 74, 30, 11);
  graphics.fillStyle(0xffffff, 0.92).fillCircle(181, 106, 10);
  graphics.fillStyle(0x182238, 1).fillRoundedRect(45, 166, 40, 20, 7);
  graphics.fillStyle(0x182238, 1).fillRoundedRect(106, 166, 40, 20, 7);
};

const ensureVectorTexture = (scene: Phaser.Scene, character: CharacterDefinition): string => {
  const key = `combatant-art-${character.id}`;
  if (scene.textures.exists(key)) return key;

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
  const color = Phaser.Display.Color.HexStringToColor(character.color ?? "#4aa8ff").color;

  if (character.id === "celestial-marksman") drawLyra(graphics, color);
  else if (character.id === "iron-shell-guardian") drawTorga(graphics, color);
  else if (character.id === "steam-orc-raider") drawGhorz(graphics, color);
  else drawFallback(graphics, color);

  graphics.generateTexture(key, 196, 196);
  graphics.destroy();
  return key;
};

export const resolveCharacterArt = (scene: Phaser.Scene, character: CharacterDefinition): ResolvedCharacterArt => {
  const premiumTexture = premiumTextureFor(scene, character.id);
  if (premiumTexture) return { textureKey: premiumTexture, premium: true };
  return { textureKey: ensureVectorTexture(scene, character), premium: true };
};
