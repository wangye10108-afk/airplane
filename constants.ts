export const CANVAS_WIDTH = window.innerWidth;
export const CANVAS_HEIGHT = window.innerHeight;

export const PLAYER_SPEED = 5;
export const BULLET_SPEED = 12;
export const ENEMY_SPEED_BASE = 2;

// Campaign Settings
export const CAMPAIGN_WAVES = 5;
export const ENEMIES_TO_CLEAR_WAVE = 20; // Basic clear condition

export const COLORS = {
  P1: '#00ffff', // Cyan
  P2: '#ff00ff', // Magenta
  ENEMY_BASIC: '#ff4444',
  ENEMY_CHASER: '#ffaa00',
  
  // Bullets
  BULLET_P1: '#ccffff',
  BULLET_P2: '#ffccff',
  BULLET_ENEMY: '#ffaaaa',
  
  // Weapons
  WEAPON_SPREAD: '#facc15', // Yellow
  WEAPON_LASER: '#38bdf8',  // Light Blue beam
  
  // Powerups
  POWERUP_SPREAD: '#fbbf24', // Amber
  POWERUP_LASER: '#0ea5e9',  // Sky
  POWERUP_HEALTH: '#22c55e', // Green
  
  PARTICLE_EXPLOSION: '#ffdd00',
};

export const KEYS = {
  WASD: { up: 'w', down: 's', left: 'a', right: 'd' },
  ARROWS: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
};

// Gemini prompts
export const BRIEFING_PROMPT = (wave: number, mode: string) => `
You are a sci-fi military commander. 
Generate a very short, intense mission briefing for "Wave ${wave}" of a space battle in "${mode}" mode.
Format as JSON:
{
  "title": "Operation Name",
  "description": "One sentence about the situation.",
  "enemyIntel": "One sentence about the enemy types."
}
Keep it under 50 words total. JSON only.
`;