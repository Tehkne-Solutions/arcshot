import type { CharacterDefinition, WeaponDefinition } from "@arcshot/game-core";

export interface AssetCatalog {
  generatedAt: string;
  signature: string;
  weapons: WeaponDefinition[];
  characters: CharacterDefinition[];
}
