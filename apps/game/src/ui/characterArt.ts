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

const drawGroundAura = (graphics: Phaser.GameObjects.Graphics, color: number): void => {
  graphics.fillStyle(color, 0.11).fillCircle(96, 92, 82);
  graphics.lineStyle(3, color, 0.28).strokeCircle(96, 92, 72);
  graphics.fillStyle(0x000000, 0.42).fillEllipse(96, 184, 112, 17);
};

const drawBrask = (graphics: Phaser.GameObjects.Graphics, color: number): void => {
  drawGroundAura(graphics, color);
  graphics.fillStyle(0x25344d, 1).fillRoundedRect(44, 92, 94, 78, 23);
  graphics.lineStyle(5, 0xd5a44e, 1).strokeRoundedRect(44, 92, 94, 78, 23);
  graphics.fillStyle(0xe0a066, 1).fillCircle(86, 62, 30);
  graphics.lineStyle(4, 0xffe8b5, 0.88).strokeCircle(86, 62, 30);
  graphics.fillStyle(0x374862, 1).fillRoundedRect(53, 25, 72, 31, 11);
  graphics.lineStyle(4, 0x72e8ff, 0.95).strokeRoundedRect(53, 25, 72, 31, 11);
  graphics.fillStyle(0x8ff3ff, 1).fillCircle(73, 58, 7);
  graphics.fillStyle(0x8ff3ff, 1).fillCircle(99, 58, 7);
  graphics.fillStyle(0xf08a35, 1).fillTriangle(58, 78, 87, 151, 113, 78);
  graphics.fillStyle(0xc75d26, 1).fillTriangle(69, 84, 87, 156, 96, 84);
  graphics.fillStyle(0x1c2a40, 1).fillRoundedRect(108, 91, 75, 32, 12);
  graphics.lineStyle(5, 0x75eaff, 1).strokeRoundedRect(108, 91, 75, 32, 12);
  graphics.fillStyle(0x9cf5ff, 0.92).fillCircle(179, 107, 12);
  graphics.fillStyle(0x151f31, 1).fillRoundedRect(43, 164, 39, 22, 8);
  graphics.fillStyle(0x151f31, 1).fillRoundedRect(105, 164, 39, 22, 8);
  graphics.lineStyle(3, color, 0.7).lineBetween(35, 115, 20, 101);
  graphics.lineStyle(3, color, 0.7).lineBetween(145, 78, 166, 63);
};

const drawKael = (graphics: Phaser.GameObjects.Graphics, color: number): void => {
  drawGroundAura(graphics, color);
  graphics.fillStyle(0x251d42, 1).fillRoundedRect(48, 87, 91, 82, 25);
  graphics.lineStyle(5, 0xd7b35c, 1).strokeRoundedRect(48, 87, 91, 82, 25);
  graphics.fillStyle(0xe7b27b, 1).fillCircle(90, 61, 28);
  graphics.lineStyle(4, 0xf7e7ca, 0.88).strokeCircle(90, 61, 28);
  graphics.fillStyle(0x1d1731, 1).fillTriangle(39, 45, 94, 12, 146, 49);
  graphics.fillStyle(color, 1).fillRoundedRect(48, 38, 92, 18, 8);
  graphics.lineStyle(3, 0xf0c56d, 0.9).strokeRoundedRect(48, 38, 92, 18, 8);
  graphics.fillStyle(0x57345d, 1).fillTriangle(51, 93, 89, 168, 122, 92);
  graphics.lineStyle(4, color, 0.9).lineBetween(68, 94, 62, 159);
  graphics.lineStyle(4, color, 0.9).lineBetween(112, 94, 124, 159);
  graphics.fillStyle(0x282642, 1).fillRoundedRect(113, 92, 70, 31, 12);
  graphics.lineStyle(5, 0xb48cff, 1).strokeRoundedRect(113, 92, 70, 31, 12);
  graphics.fillStyle(0xd8c2ff, 1).fillCircle(179, 107, 11);
  graphics.lineStyle(4, 0x85dbff, 0.9).lineBetween(154, 79, 182, 63);
  graphics.lineStyle(4, 0xb48cff, 0.9).lineBetween(151, 132, 181, 146);
  graphics.fillStyle(0x151326, 1).fillRoundedRect(48, 166, 38, 20, 7);
  graphics.fillStyle(0x151326, 1).fillRoundedRect(109, 166, 38, 20, 7);
};

const drawLyra = (graphics: Phaser.GameObjects.Graphics, color: number): void => {
  drawGroundAura(graphics, color);
  graphics.fillStyle(0x3a3157, 1).fillRoundedRect(50, 86, 84, 83, 25);
  graphics.lineStyle(5, 0xc7b8ff, 1).strokeRoundedRect(50, 86, 84, 83, 25);
  graphics.fillStyle(0xc98667, 1).fillCircle(87, 60, 28);
  graphics.lineStyle(4, 0xf5ecff, 0.9).strokeCircle(87, 60, 28);
  graphics.fillStyle(0xe9e2ff, 1).fillTriangle(49, 61, 82, 17, 128, 48);
  graphics.fillStyle(0xe9e2ff, 1).fillTriangle(56, 42, 38, 84, 81, 70);
  graphics.fillStyle(color, 0.94).fillRoundedRect(58, 51, 62, 15, 7);
  graphics.fillStyle(0x9ff5ff, 1).fillRoundedRect(70, 55, 39, 7, 3);
  graphics.fillStyle(0x66558e, 1).fillTriangle(54, 95, 83, 170, 130, 93);
  graphics.fillStyle(0x26304a, 1).fillRoundedRect(104, 79, 79, 22, 9);
  graphics.lineStyle(4, 0xb9f6ff, 1).strokeRoundedRect(104, 79, 79, 22, 9);
  graphics.fillStyle(0xeafcff, 1).fillTriangle(181, 79, 192, 90, 181, 101);
  graphics.lineStyle(4, color, 0.9).lineBetween(43, 100, 22, 82);
  graphics.lineStyle(4, color, 0.9).lineBetween(42, 116, 17, 131);
  graphics.fillStyle(0x241e38, 1).fillRoundedRect(48, 167, 38, 19, 7);
  graphics.fillStyle(0x241e38, 1).fillRoundedRect(108, 167, 38, 19, 7);
};

const drawBombardier = (graphics: Phaser.GameObjects.Graphics, color: number): void => {
  drawGroundAura(graphics, color);
  graphics.fillStyle(0x50633b, 1).fillCircle(83, 63, 31);
  graphics.lineStyle(4, 0xdff2bd, 0.85).strokeCircle(83, 63, 31);
  graphics.fillStyle(0x182431, 1).fillRoundedRect(50, 30, 67, 25, 8);
  graphics.lineStyle(4, 0xffb35f, 0.95).strokeRoundedRect(50, 30, 67, 25, 8);
  graphics.fillStyle(0xffc06c, 1).fillCircle(70, 62, 6);
  graphics.fillStyle(0xffc06c, 1).fillCircle(94, 62, 6);
  graphics.fillStyle(0x2e382d, 1).fillRoundedRect(39, 91, 99, 79, 23);
  graphics.lineStyle(5, color, 1).strokeRoundedRect(39, 91, 99, 79, 23);
  graphics.fillStyle(0x6f3a25, 1).fillRoundedRect(57, 101, 62, 45, 12);
  graphics.lineStyle(3, 0xffd087, 0.9).strokeRoundedRect(57, 101, 62, 45, 12);
  graphics.fillStyle(0x202b39, 1).fillRoundedRect(112, 83, 77, 37, 13);
  graphics.lineStyle(5, 0xff8a4a, 1).strokeRoundedRect(112, 83, 77, 37, 13);
  graphics.fillStyle(0xffcb71, 0.96).fillCircle(183, 101, 13);
  graphics.fillStyle(0x202c35, 1).fillCircle(36, 119, 18);
  graphics.lineStyle(4, 0x92d2d8, 0.8).strokeCircle(36, 119, 18);
  graphics.fillStyle(0x151d25, 1).fillRoundedRect(38, 165, 42, 21, 8);
  graphics.fillStyle(0x151d25, 1).fillRoundedRect(105, 165, 42, 21, 8);
  graphics.lineStyle(4, 0xffb85f, 0.65).lineBetween(145, 69, 170, 48);
  graphics.lineStyle(4, 0xff7b3d, 0.65).lineBetween(152, 136, 180, 151);
};

const drawRanger = (graphics: Phaser.GameObjects.Graphics, color: number): void => {
  drawGroundAura(graphics, color);
  graphics.fillStyle(0xc88769, 1).fillCircle(83, 61, 28);
  graphics.lineStyle(4, 0xf8e7ce, 0.9).strokeCircle(83, 61, 28);
  graphics.fillStyle(0x274235, 1).fillTriangle(48, 57, 80, 17, 122, 50);
  graphics.fillStyle(color, 0.92).fillRoundedRect(54, 47, 63, 14, 7);
  graphics.fillStyle(0xbfffe0, 1).fillCircle(72, 61, 5);
  graphics.fillStyle(0xbfffe0, 1).fillCircle(93, 61, 5);
  graphics.fillStyle(0x244033, 1).fillRoundedRect(47, 88, 79, 81, 24);
  graphics.lineStyle(5, color, 1).strokeRoundedRect(47, 88, 79, 81, 24);
  graphics.fillStyle(0x4b6b55, 1).fillTriangle(51, 98, 84, 171, 125, 96);
  graphics.fillStyle(0x1e3027, 1).fillRoundedRect(63, 103, 43, 42, 10);
  graphics.lineStyle(3, 0xd9f6c9, 0.75).strokeRoundedRect(63, 103, 43, 42, 10);
  graphics.lineStyle(6, 0xe5c177, 1).beginPath();
  graphics.arc(145, 105, 39, -1.2, 1.2, false);
  graphics.strokePath();
  graphics.lineStyle(3, 0xe5f8db, 0.9).lineBetween(159, 69, 159, 141);
  graphics.fillStyle(0x8fffd1, 1).fillTriangle(164, 103, 187, 94, 187, 112);
  graphics.lineStyle(4, color, 0.8).lineBetween(42, 112, 23, 94);
  graphics.fillStyle(0x17251e, 1).fillRoundedRect(45, 166, 38, 20, 7);
  graphics.fillStyle(0x17251e, 1).fillRoundedRect(103, 166, 38, 20, 7);
};

const drawGeneric = (graphics: Phaser.GameObjects.Graphics, color: number): void => {
  drawGroundAura(graphics, color);
  graphics.fillStyle(0x26364e, 1).fillRoundedRect(47, 87, 89, 82, 24);
  graphics.lineStyle(5, color, 1).strokeRoundedRect(47, 87, 89, 82, 24);
  graphics.fillStyle(0xd4a274, 1).fillCircle(86, 59, 29);
  graphics.lineStyle(4, 0xf4f8ff, 0.88).strokeCircle(86, 59, 29);
  graphics.fillStyle(0x1d2b41, 1).fillRoundedRect(111, 91, 73, 29, 11);
  graphics.lineStyle(4, 0xf4f8ff, 0.88).strokeRoundedRect(111, 91, 73, 29, 11);
  graphics.fillStyle(0xffffff, 0.92).fillCircle(180, 106, 10);
  graphics.fillStyle(0x182238, 1).fillRoundedRect(46, 166, 38, 20, 7);
  graphics.fillStyle(0x182238, 1).fillRoundedRect(105, 166, 38, 20, 7);
};

const ensureVectorTexture = (scene: Phaser.Scene, character: CharacterDefinition): string => {
  const key = `safe-character-${character.id}`;
  if (scene.textures.exists(key)) return key;

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
  const color = Phaser.Display.Color.HexStringToColor(character.color ?? "#4aa8ff").color;

  if (character.id === "rune-bombardier") drawBrask(graphics, color);
  else if (character.id === "storm-corsair") drawKael(graphics, color);
  else if (character.id === "celestial-marksman") drawLyra(graphics, color);
  else if (character.id === "bombardier") drawBombardier(graphics, color);
  else if (character.id === "ranger") drawRanger(graphics, color);
  else drawGeneric(graphics, color);

  graphics.generateTexture(key, 192, 192);
  graphics.destroy();
  return key;
};

export const resolveCharacterArt = (scene: Phaser.Scene, character: CharacterDefinition): ResolvedCharacterArt => {
  const premiumTexture = premiumTextureFor(scene, character.id);
  if (premiumTexture) return { textureKey: premiumTexture, premium: true };
  return { textureKey: ensureVectorTexture(scene, character), premium: true };
};
