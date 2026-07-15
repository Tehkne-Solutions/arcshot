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

const drawBrask = (graphics: Phaser.GameObjects.Graphics, color: number): void => {
  graphics.fillStyle(color, 0.16).fillCircle(96, 88, 78);
  graphics.fillStyle(0x273650, 1).fillRoundedRect(48, 91, 86, 67, 22);
  graphics.lineStyle(5, 0xf5d07a, 1).strokeRoundedRect(48, 91, 86, 67, 22);
  graphics.fillStyle(0xe1a365, 1).fillCircle(86, 65, 29);
  graphics.lineStyle(4, 0xf8f3df, 0.9).strokeCircle(86, 65, 29);
  graphics.fillStyle(0xf08a35, 1).fillTriangle(62, 77, 88, 145, 111, 77);
  graphics.fillStyle(0xc85c25, 1).fillTriangle(70, 83, 85, 151, 92, 84);
  graphics.fillStyle(0x36455f, 1).fillRoundedRect(57, 32, 63, 25, 10);
  graphics.lineStyle(4, 0x7ee7ff, 0.95).strokeRoundedRect(57, 32, 63, 25, 10);
  graphics.fillStyle(0x8ff3ff, 1).fillCircle(75, 58, 7);
  graphics.fillStyle(0x8ff3ff, 1).fillCircle(98, 58, 7);
  graphics.fillStyle(0x20304a, 1).fillRoundedRect(112, 91, 69, 31, 12);
  graphics.lineStyle(5, 0x75eaff, 1).strokeRoundedRect(112, 91, 69, 31, 12);
  graphics.fillStyle(0x9cf5ff, 0.9).fillCircle(177, 107, 12);
  graphics.fillStyle(0x19253a, 1).fillRoundedRect(50, 145, 34, 22, 8);
  graphics.fillStyle(0x19253a, 1).fillRoundedRect(105, 145, 34, 22, 8);
};

const drawKael = (graphics: Phaser.GameObjects.Graphics, color: number): void => {
  graphics.fillStyle(color, 0.15).fillCircle(96, 88, 78);
  graphics.fillStyle(0x251d42, 1).fillRoundedRect(50, 86, 86, 73, 24);
  graphics.lineStyle(5, 0xd7b35c, 1).strokeRoundedRect(50, 86, 86, 73, 24);
  graphics.fillStyle(0xe7b27b, 1).fillCircle(91, 62, 27);
  graphics.lineStyle(4, 0xf7e7ca, 0.9).strokeCircle(91, 62, 27);
  graphics.fillStyle(0x1d1731, 1).fillTriangle(43, 45, 94, 15, 142, 49);
  graphics.fillStyle(color, 1).fillRoundedRect(51, 39, 86, 17, 7);
  graphics.lineStyle(3, 0xf0c56d, 0.9).strokeRoundedRect(51, 39, 86, 17, 7);
  graphics.fillStyle(0x56345d, 1).fillTriangle(54, 91, 89, 160, 119, 91);
  graphics.lineStyle(4, color, 0.9).lineBetween(70, 94, 64, 151);
  graphics.lineStyle(4, color, 0.9).lineBetween(111, 94, 122, 151);
  graphics.fillStyle(0x282642, 1).fillRoundedRect(115, 92, 66, 30, 12);
  graphics.lineStyle(5, 0xb48cff, 1).strokeRoundedRect(115, 92, 66, 30, 12);
  graphics.fillStyle(0xd8c2ff, 1).fillCircle(178, 107, 11);
  graphics.lineStyle(4, 0x85dbff, 0.9).lineBetween(155, 79, 181, 64);
  graphics.lineStyle(4, 0xb48cff, 0.9).lineBetween(151, 130, 181, 144);
  graphics.fillStyle(0x151326, 1).fillRoundedRect(53, 148, 31, 20, 7);
  graphics.fillStyle(0x151326, 1).fillRoundedRect(111, 148, 31, 20, 7);
};

const drawLyra = (graphics: Phaser.GameObjects.Graphics, color: number): void => {
  graphics.fillStyle(color, 0.16).fillCircle(96, 88, 78);
  graphics.fillStyle(0x3a3157, 1).fillRoundedRect(53, 86, 78, 75, 25);
  graphics.lineStyle(5, 0xc7b8ff, 1).strokeRoundedRect(53, 86, 78, 75, 25);
  graphics.fillStyle(0xc98667, 1).fillCircle(88, 61, 27);
  graphics.lineStyle(4, 0xf5ecff, 0.9).strokeCircle(88, 61, 27);
  graphics.fillStyle(0xe9e2ff, 1).fillTriangle(53, 60, 82, 19, 125, 48);
  graphics.fillStyle(0xe9e2ff, 1).fillTriangle(59, 43, 42, 83, 80, 70);
  graphics.fillStyle(color, 0.94).fillRoundedRect(62, 53, 55, 14, 7);
  graphics.fillStyle(0x9ff5ff, 1).fillRoundedRect(73, 56, 34, 7, 3);
  graphics.fillStyle(0x66558e, 1).fillTriangle(57, 95, 84, 160, 126, 93);
  graphics.fillStyle(0x26304a, 1).fillRoundedRect(105, 80, 77, 21, 9);
  graphics.lineStyle(4, 0xb9f6ff, 1).strokeRoundedRect(105, 80, 77, 21, 9);
  graphics.fillStyle(0xeafcff, 1).fillTriangle(179, 80, 191, 90, 179, 101);
  graphics.lineStyle(4, color, 0.9).lineBetween(45, 99, 26, 83);
  graphics.lineStyle(4, color, 0.9).lineBetween(44, 113, 21, 127);
  graphics.fillStyle(0x241e38, 1).fillRoundedRect(53, 150, 31, 19, 7);
  graphics.fillStyle(0x241e38, 1).fillRoundedRect(108, 150, 31, 19, 7);
};

const drawGeneric = (graphics: Phaser.GameObjects.Graphics, color: number): void => {
  graphics.fillStyle(color, 0.15).fillCircle(96, 88, 78);
  graphics.fillStyle(color, 1).fillRoundedRect(55, 84, 78, 77, 24);
  graphics.lineStyle(5, 0xf4f8ff, 0.9).strokeRoundedRect(55, 84, 78, 77, 24);
  graphics.fillStyle(0xd4a274, 1).fillCircle(92, 58, 27);
  graphics.fillStyle(0x26364e, 1).fillRoundedRect(111, 91, 68, 27, 11);
  graphics.lineStyle(4, 0xf4f8ff, 0.9).strokeRoundedRect(111, 91, 68, 27, 11);
  graphics.fillStyle(0xffffff, 0.92).fillCircle(176, 105, 10);
  graphics.fillStyle(0x182238, 1).fillRoundedRect(57, 150, 30, 18, 6);
  graphics.fillStyle(0x182238, 1).fillRoundedRect(105, 150, 30, 18, 6);
};

const ensureVectorTexture = (scene: Phaser.Scene, character: CharacterDefinition): string => {
  const key = `safe-character-${character.id}`;
  if (scene.textures.exists(key)) return key;

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
  const color = Phaser.Display.Color.HexStringToColor(character.color ?? "#4aa8ff").color;

  if (character.id === "rune-bombardier") drawBrask(graphics, color);
  else if (character.id === "storm-corsair") drawKael(graphics, color);
  else if (character.id === "celestial-marksman") drawLyra(graphics, color);
  else drawGeneric(graphics, color);

  graphics.generateTexture(key, 192, 192);
  graphics.destroy();
  return key;
};

export const resolveCharacterArt = (scene: Phaser.Scene, character: CharacterDefinition): ResolvedCharacterArt => {
  const premiumTexture = premiumTextureFor(scene, character.id);
  if (premiumTexture) return { textureKey: premiumTexture, premium: true };
  return { textureKey: ensureVectorTexture(scene, character), premium: false };
};
