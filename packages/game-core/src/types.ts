export interface Vec2 {
  x: number;
  y: number;
}

export interface ProjectileState {
  position: Vec2;
  velocity: Vec2;
  age: number;
}

export interface BallisticEnvironment {
  gravity: number;
  wind: number;
}

export interface WeaponDefinition {
  id: string;
  name: string;
  description: string;
  damage: number;
  blastRadius: number;
  speed: number;
  gravityScale: number;
  projectileCount: number;
  spreadDegrees: number;
  pierce: number;
  craterScale: number;
  ammo: number | null;
  color: string;
  assetKey: string;
}

export type ArenaTheme = "arcane-forge" | "sky-harbor" | "storm-ruins" | "mystic-wilds";
export type ProjectileStyle = "rune-bomb" | "storm-shell" | "star-bolt" | "arc-orb" | "hunter-shot";
export type EffectStyle = "ember-runes" | "storm" | "celestial" | "arcane" | "nature";

export interface CharacterDefinition {
  id: string;
  name: string;
  role: string;
  description: string;
  maxHealth: number;
  moveRange: number;
  assetKey: string;
  color?: string;
  arenaTheme?: ArenaTheme;
  projectileStyle?: ProjectileStyle;
  effectStyle?: EffectStyle;
}

export interface AimSolution {
  angle: number;
  power: number;
  score: number;
}
