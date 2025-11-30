export type Vector2D = { x: number; y: number };

export enum EntityType {
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY',
  BULLET = 'BULLET',
  PARTICLE = 'PARTICLE',
  POWERUP = 'POWERUP',
  TEXT_FLOAT = 'TEXT_FLOAT'
}

export enum WeaponType {
  BLASTER = 'BLASTER',
  SPREAD = 'SPREAD',
  LASER = 'LASER'
}

export enum PowerupType {
  WEAPON_SPREAD = 'WEAPON_SPREAD',
  WEAPON_LASER = 'WEAPON_LASER',
  HEALTH = 'HEALTH'
}

export enum GameMode {
  CAMPAIGN = 'CAMPAIGN', // Levels with finish condition
  ENDLESS = 'ENDLESS'    // Infinite scaling
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Vector2D;
  vel: Vector2D;
  radius: number;
  color: string;
  health: number;
  maxHealth: number;
  damage: number;
  scoreValue?: number;
  ownerId?: string; // For bullets to know who shot them
  lifeTime?: number; // For particles
  maxLifeTime?: number;
  
  // Weapon/Powerup specific
  weaponType?: WeaponType;
  powerupType?: PowerupType;
  piercing?: boolean; // For lasers
}

export interface GameState {
  score: number;
  wave: number;
  enemiesDefeatedInWave: number; // For Campaign progress
  isGameOver: boolean;
  isLevelComplete: boolean;
  isPaused: boolean;
  players: Entity[];
  enemies: Entity[];
  bullets: Entity[];
  particles: Entity[];
  powerups: Entity[];
  stars: { pos: Vector2D; speed: number; size: number; alpha: number }[];
  gameTime: number;
}

export interface BriefingData {
  title: string;
  description: string;
  enemyIntel: string;
}