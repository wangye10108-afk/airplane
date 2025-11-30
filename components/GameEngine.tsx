import React, { useRef, useEffect } from 'react';
import { Entity, EntityType, GameState, Vector2D, WeaponType, PowerupType, GameMode } from '../types';
import { COLORS, KEYS, PLAYER_SPEED, BULLET_SPEED, ENEMY_SPEED_BASE, ENEMIES_TO_CLEAR_WAVE } from '../constants';
import { audioService } from '../services/audioService';

interface GameEngineProps {
  mode: GameMode;
  playerCount: 1 | 2;
  onGameOver: (score: number) => void;
  onLevelComplete: (score: number) => void;
  wave: number;
}

const GameEngine: React.FC<GameEngineProps> = ({ mode, playerCount, onGameOver, onLevelComplete, wave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const scoreRef = useRef<number>(0);
  
  // Game State Ref (Mutable for performance)
  const state = useRef<GameState>({
    score: 0,
    wave: wave,
    enemiesDefeatedInWave: 0,
    isGameOver: false,
    isLevelComplete: false,
    isPaused: false,
    players: [],
    enemies: [],
    bullets: [],
    particles: [],
    powerups: [],
    stars: [],
    gameTime: 0,
  });

  // Input State
  const input = useRef<{ [key: string]: boolean }>({});
  const touches = useRef<Map<number, { x: number, y: number, startX: number, startY: number }>>(new Map());

  // Initialize Game
  useEffect(() => {
    initGame();
    audioService.resume(); 
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);
    
    // Touch events for mobile
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerCount, wave, mode]);

  const initGame = () => {
    const { width, height } = getCanvasSize();
    state.current.isGameOver = false;
    state.current.isLevelComplete = false;
    state.current.score = scoreRef.current;
    state.current.enemiesDefeatedInWave = 0;
    
    state.current.bullets = [];
    state.current.enemies = [];
    state.current.particles = [];
    state.current.powerups = [];
    
    // Init Stars
    state.current.stars = Array.from({ length: 100 }, () => ({
      pos: { x: Math.random() * width, y: Math.random() * height },
      speed: 0.5 + Math.random() * 2,
      size: 1 + Math.random() * 2,
      alpha: Math.random()
    }));

    // Init Players
    const newPlayers: Entity[] = [];

    // Player 1
    newPlayers.push({
      id: 'p1',
      type: EntityType.PLAYER,
      pos: { x: width * (playerCount === 2 ? 0.3 : 0.5), y: height - 100 },
      vel: { x: 0, y: 0 },
      radius: 20,
      color: COLORS.P1,
      health: 100,
      maxHealth: 100,
      damage: 10,
      weaponType: WeaponType.BLASTER
    });

    // Player 2
    if (playerCount === 2) {
      newPlayers.push({
        id: 'p2',
        type: EntityType.PLAYER,
        pos: { x: width * 0.7, y: height - 100 },
        vel: { x: 0, y: 0 },
        radius: 20,
        color: COLORS.P2,
        health: 100,
        maxHealth: 100,
        damage: 10,
        weaponType: WeaponType.BLASTER
      });
    }

    state.current.players = newPlayers;
  };

  const getCanvasSize = () => {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  };

  const handleResize = () => {
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    }
  };

  // --- Input Handling ---

  const handleKeyDown = (e: KeyboardEvent) => { input.current[e.key] = true; };
  const handleKeyUp = (e: KeyboardEvent) => { input.current[e.key] = false; };

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      touches.current.set(t.identifier, { x: t.clientX, y: t.clientY, startX: t.clientX, startY: t.clientY });
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      touches.current.set(t.identifier, { x: t.clientX, y: t.clientY, startX: t.clientX, startY: t.clientY }); 
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      touches.current.delete(e.changedTouches[i].identifier);
    }
  };

  // --- Game Loop ---

  const gameLoop = (time: number) => {
    if (state.current.isGameOver || state.current.isLevelComplete) return;

    update(time);
    draw();
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const update = (time: number) => {
    const { width, height } = getCanvasSize();
    const s = state.current;
    s.gameTime++;

    // Check Level Progress (Campaign only)
    if (mode === GameMode.CAMPAIGN && s.enemiesDefeatedInWave >= ENEMIES_TO_CLEAR_WAVE) {
      s.isLevelComplete = true;
      scoreRef.current = s.score;
      onLevelComplete(s.score);
      return;
    }

    // 1. Player Movement
    s.players.forEach((p, index) => {
      let dx = 0;
      let dy = 0;

      // Keyboard Controls
      if (index === 0) { // P1
        if (input.current[KEYS.WASD.left] || input.current['ArrowLeft']) dx = -1;
        if (input.current[KEYS.WASD.right] || input.current['ArrowRight']) dx = 1;
        if (input.current[KEYS.WASD.up] || input.current['ArrowUp']) dy = -1;
        if (input.current[KEYS.WASD.down] || input.current['ArrowDown']) dy = 1;
      }
      
      // P2 Keyboard override
      if (index === 1 && playerCount === 2) { 
        dx = 0; dy = 0;
        if (input.current[KEYS.ARROWS.left]) dx = -1;
        if (input.current[KEYS.ARROWS.right]) dx = 1;
        if (input.current[KEYS.ARROWS.up]) dy = -1;
        if (input.current[KEYS.ARROWS.down]) dy = 1;
      }

      // Re-apply P1 WASD specific for 2P mode
      if (index === 0 && playerCount === 2) {
        dx = 0; dy = 0;
        if (input.current[KEYS.WASD.left]) dx = -1;
        if (input.current[KEYS.WASD.right]) dx = 1;
        if (input.current[KEYS.WASD.up]) dy = -1;
        if (input.current[KEYS.WASD.down]) dy = 1;
      }

      // Touch Controls
      if (touches.current.size > 0) {
        touches.current.forEach((touch) => {
          const isLeft = touch.x < width / 2;
          
          if (playerCount === 1) {
            const diffX = touch.x - p.pos.x;
            const diffY = touch.y - (p.pos.y - 50); 
            const dist = Math.sqrt(diffX*diffX + diffY*diffY);
            if (dist > 10) {
              dx = diffX / dist;
              dy = diffY / dist;
            }
          } else {
             if (index === 0 && isLeft) {
                const diffX = touch.x - p.pos.x;
                const diffY = touch.y - (p.pos.y - 50);
                const dist = Math.sqrt(diffX*diffX + diffY*diffY);
                if (dist > 10) { dx = diffX/dist; dy = diffY/dist; }
             }
             if (index === 1 && !isLeft) {
                const diffX = touch.x - p.pos.x;
                const diffY = touch.y - (p.pos.y - 50);
                const dist = Math.sqrt(diffX*diffX + diffY*diffY);
                if (dist > 10) { dx = diffX/dist; dy = diffY/dist; }
             }
          }
        });
      }

      // Apply Velocity
      p.pos.x += dx * PLAYER_SPEED;
      p.pos.y += dy * PLAYER_SPEED;

      // Bounds
      p.pos.x = Math.max(p.radius, Math.min(width - p.radius, p.pos.x));
      p.pos.y = Math.max(p.radius, Math.min(height - p.radius, p.pos.y));

      // Auto Fire
      if (s.gameTime % 10 === 0) {
        fireWeapon(p);
      }
    });

    // 2. Bullets
    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const b = s.bullets[i];
      b.pos.x += b.vel.x * BULLET_SPEED;
      b.pos.y += b.vel.y * BULLET_SPEED;
      
      if (b.pos.y < -50 || b.pos.y > height + 50 || b.pos.x < 0 || b.pos.x > width) {
        s.bullets.splice(i, 1);
      }
    }

    // 3. Powerups
    for (let i = s.powerups.length - 1; i >= 0; i--) {
        const pu = s.powerups[i];
        pu.pos.y += 2; // Fall down
        
        // Remove if off screen
        if (pu.pos.y > height + 20) {
            s.powerups.splice(i, 1);
            continue;
        }

        // Check collision with players
        for (const p of s.players) {
            const dx = p.pos.x - pu.pos.x;
            const dy = p.pos.y - pu.pos.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < p.radius + pu.radius) {
                // Apply Powerup
                applyPowerup(p, pu.powerupType!);
                spawnParticles(pu.pos, 10, pu.color);
                s.powerups.splice(i, 1);
                break;
            }
        }
    }

    // 4. Enemies
    // Spawn
    const spawnRate = Math.max(20, 60 - (wave * 5));
    if (s.gameTime % spawnRate === 0) {
      spawnEnemy(width);
    }

    for (let i = s.enemies.length - 1; i >= 0; i--) {
      const e = s.enemies[i];
      e.pos.x += e.vel.x;
      e.pos.y += e.vel.y;

      // Simple AI
      if (e.id.includes('chaser') && s.players.length > 0) {
        // Simple easing towards player
        const target = s.players[0]; // Chase P1 for simplicity
        const dx = target.pos.x - e.pos.x;
        const dy = target.pos.y - e.pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 0) {
          e.vel.x = (dx / dist) * (ENEMY_SPEED_BASE + wave * 0.2);
          e.vel.y = (dy / dist) * (ENEMY_SPEED_BASE + wave * 0.2);
        }
      }

      if (e.pos.y > height + 50) {
        s.enemies.splice(i, 1);
      }
    }

    // 5. Collisions
    // Bullet vs Enemy
    for (let bIdx = s.bullets.length - 1; bIdx >= 0; bIdx--) {
      const b = s.bullets[bIdx];
      let bulletHit = false;

      // Check vs Enemies
      if (b.ownerId?.startsWith('p')) {
        for (let eIdx = s.enemies.length - 1; eIdx >= 0; eIdx--) {
          const e = s.enemies[eIdx];
          if (checkCollision(b, e)) {
            e.health -= b.damage;
            spawnParticles(e.pos, 3, b.color);
            bulletHit = true;
            
            if (e.health <= 0) {
              handleEnemyDeath(e);
              s.enemies.splice(eIdx, 1);
              s.score += 100;
              scoreRef.current = s.score;
            }
            break; // Bullet hit one enemy
          }
        }
      }

      // If bullet hit and isn't piercing (Laser pierces), remove it
      if (bulletHit && !b.piercing) {
        s.bullets.splice(bIdx, 1);
      }
    }

    // Player vs Enemy
    for (let pIdx = s.players.length - 1; pIdx >= 0; pIdx--) {
      const p = s.players[pIdx];
      for (let eIdx = s.enemies.length - 1; eIdx >= 0; eIdx--) {
        const e = s.enemies[eIdx];
        if (checkCollision(p, e)) {
          p.health -= 20;
          e.health = 0; // Enemy suicide
          handleEnemyDeath(e);
          s.enemies.splice(eIdx, 1);
          spawnParticles(p.pos, 10, '#ffffff');

          if (p.health <= 0) {
             s.players.splice(pIdx, 1);
             if (s.players.length === 0) {
                endGame();
             }
          }
        }
      }
    }

    // 6. Particles
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.pos.x += p.vel.x;
      p.pos.y += p.vel.y;
      p.lifeTime = (p.lifeTime || 0) - 1;
      if (p.lifeTime <= 0) s.particles.splice(i, 1);
    }

    // 7. Background Stars
    s.stars.forEach(star => {
      star.pos.y += star.speed + (mode === GameMode.ENDLESS ? wave * 0.1 : 0); // Faster stars in later waves
      if (star.pos.y > height) {
        star.pos.y = 0;
        star.pos.x = Math.random() * width;
      }
    });
  };

  const handleEnemyDeath = (e: Entity) => {
    state.current.enemiesDefeatedInWave++;
    spawnParticles(e.pos, 15, COLORS.PARTICLE_EXPLOSION);
    audioService.playExplosion();
    
    // Chance to spawn powerup (15%)
    if (Math.random() < 0.15) {
        spawnPowerup(e.pos);
    }
  };

  const spawnPowerup = (pos: Vector2D) => {
      const r = Math.random();
      let type = PowerupType.HEALTH;
      let color = COLORS.POWERUP_HEALTH;
      
      if (r < 0.4) {
          type = PowerupType.WEAPON_SPREAD;
          color = COLORS.POWERUP_SPREAD;
      } else if (r < 0.8) {
          type = PowerupType.WEAPON_LASER;
          color = COLORS.POWERUP_LASER;
      }

      state.current.powerups.push({
          id: `pu_${Math.random()}`,
          type: EntityType.POWERUP,
          pos: { ...pos },
          vel: { x: 0, y: 0 },
          radius: 15,
          color: color,
          health: 1, maxHealth: 1, damage: 0,
          powerupType: type
      });
  };

  const applyPowerup = (player: Entity, type: PowerupType) => {
      audioService.playPowerup();
      if (type === PowerupType.HEALTH) {
          player.health = Math.min(player.maxHealth, player.health + 30);
      } else if (type === PowerupType.WEAPON_SPREAD) {
          player.weaponType = WeaponType.SPREAD;
      } else if (type === PowerupType.WEAPON_LASER) {
          player.weaponType = WeaponType.LASER;
      }
  };

  const fireWeapon = (p: Entity) => {
      const color = p.id === 'p1' ? COLORS.BULLET_P1 : COLORS.BULLET_P2;
      audioService.playShoot(p.weaponType || WeaponType.BLASTER);
      
      switch (p.weaponType) {
          case WeaponType.LASER:
              // Laser: Fast, high damage, piercing
               state.current.bullets.push({
                  id: Math.random().toString(),
                  type: EntityType.BULLET,
                  pos: { x: p.pos.x, y: p.pos.y - 20 },
                  vel: { x: 0, y: -2 }, // Faster than normal because BULLET_SPEED is multiplier
                  radius: 4, // width
                  color: COLORS.WEAPON_LASER,
                  health: 1, maxHealth: 1,
                  damage: 30, // High damage
                  ownerId: p.id,
                  piercing: true
              });
              break;

          case WeaponType.SPREAD:
              // Spread: 3 bullets
              [-0.3, 0, 0.3].forEach(xVel => {
                  state.current.bullets.push({
                      id: Math.random().toString(),
                      type: EntityType.BULLET,
                      pos: { x: p.pos.x, y: p.pos.y - 10 },
                      vel: { x: xVel, y: -1 },
                      radius: 4,
                      color: COLORS.WEAPON_SPREAD,
                      health: 1, maxHealth: 1,
                      damage: 15, // Slightly less than base per bullet
                      ownerId: p.id
                  });
              });
              break;

          case WeaponType.BLASTER:
          default:
              // Default
              state.current.bullets.push({
                  id: Math.random().toString(),
                  type: EntityType.BULLET,
                  pos: { x: p.pos.x, y: p.pos.y - 10 },
                  vel: { x: 0, y: -1 },
                  radius: 4,
                  color: color,
                  health: 1, maxHealth: 1,
                  damage: 20,
                  ownerId: p.id
              });
              break;
      }
  };

  const spawnEnemy = (width: number) => {
    const isChaser = Math.random() > 0.8;
    const x = Math.random() * (width - 40) + 20;
    
    state.current.enemies.push({
      id: isChaser ? 'chaser_' + Math.random() : 'basic_' + Math.random(),
      type: EntityType.ENEMY,
      pos: { x, y: -30 },
      vel: { x: 0, y: ENEMY_SPEED_BASE + wave * 0.5 },
      radius: 15 + Math.random() * 10,
      color: isChaser ? COLORS.ENEMY_CHASER : COLORS.ENEMY_BASIC,
      health: 20 + wave * 10,
      maxHealth: 20 + wave * 10,
      damage: 10
    });
  };

  const spawnParticles = (pos: Vector2D, count: number, color: string) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4;
      state.current.particles.push({
        id: Math.random().toString(),
        type: EntityType.PARTICLE,
        pos: { ...pos },
        vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        radius: Math.random() * 3,
        color: color,
        health: 1,
        maxHealth: 1,
        damage: 0,
        lifeTime: 30 + Math.random() * 20
      });
    }
  };

  const checkCollision = (a: Entity, b: Entity) => {
    // Better collision box for laser
    if (a.weaponType === WeaponType.LASER || a.piercing) {
        // Simple AABB for long lasers vs circle
        // Laser is thin vertical line effectively
        return Math.abs(a.pos.x - b.pos.x) < (b.radius + 5) && 
               Math.abs(a.pos.y - b.pos.y) < (b.radius + 40); // 40 is laser length approximation
    }

    const dx = a.pos.x - b.pos.x;
    const dy = a.pos.y - b.pos.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    return dist < (a.radius + b.radius);
  };

  const endGame = () => {
    state.current.isGameOver = true;
    onGameOver(state.current.score);
  };

  // --- Render ---

  const drawPlayer1 = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) => {
      // P1: Sleek, forward swept wing interceptor
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      
      // Fuselage
      ctx.moveTo(x, y - r); // Nose
      ctx.lineTo(x + r * 0.2, y - r * 0.2); 
      
      // Right Wing (forward swept)
      ctx.lineTo(x + r, y - r * 0.1); // Wing tip
      ctx.lineTo(x + r * 0.4, y + r * 0.5); // Wing root rear
      
      // Engine/Rear
      ctx.lineTo(x + r * 0.2, y + r * 0.8);
      ctx.lineTo(x, y + r * 0.6); // Center rear
      
      // Left side mirror
      ctx.lineTo(x - r * 0.2, y + r * 0.8);
      ctx.lineTo(x - r * 0.4, y + r * 0.5);
      ctx.lineTo(x - r, y - r * 0.1);
      ctx.lineTo(x - r * 0.2, y - r * 0.2);
      
      ctx.closePath();
      ctx.fill();

      // Cockpit detail
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(x, y - r * 0.5);
      ctx.lineTo(x + r * 0.1, y - r * 0.2);
      ctx.lineTo(x - r * 0.1, y - r * 0.2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
  };

  const drawPlayer2 = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) => {
      // P2: Heavy, twin-boom fighter
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      
      // Central Pod
      ctx.beginPath();
      ctx.moveTo(x, y - r * 0.8);
      ctx.lineTo(x + r * 0.3, y);
      ctx.lineTo(x + r * 0.3, y + r * 0.5);
      ctx.lineTo(x - r * 0.3, y + r * 0.5);
      ctx.lineTo(x - r * 0.3, y);
      ctx.closePath();
      ctx.fill();

      // Left Boom
      ctx.beginPath();
      ctx.rect(x - r, y - r * 0.2, r * 0.4, r * 1.2);
      ctx.fill();

      // Right Boom
      ctx.beginPath();
      ctx.rect(x + r * 0.6, y - r * 0.2, r * 0.4, r * 1.2);
      ctx.fill();

      // Wing Connectors
      ctx.beginPath();
      ctx.rect(x - r, y, r * 2, r * 0.2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    
    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Stars
    state.current.stars.forEach(star => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      ctx.beginPath();
      ctx.arc(star.pos.x, star.pos.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Particles
    state.current.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = (p.lifeTime || 0) / 40;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // Powerups
    state.current.powerups.forEach(p => {
        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        
        ctx.fillStyle = p.color;
        ctx.beginPath();
        // Draw diamond shape
        ctx.moveTo(p.pos.x, p.pos.y - p.radius);
        ctx.lineTo(p.pos.x + p.radius, p.pos.y);
        ctx.lineTo(p.pos.x, p.pos.y + p.radius);
        ctx.lineTo(p.pos.x - p.radius, p.pos.y);
        ctx.closePath();
        ctx.fill();
        
        // Inner text symbol
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let symbol = '?';
        if (p.powerupType === PowerupType.HEALTH) symbol = '+';
        if (p.powerupType === PowerupType.WEAPON_LASER) symbol = 'L';
        if (p.powerupType === PowerupType.WEAPON_SPREAD) symbol = 'S';
        ctx.fillText(symbol, p.pos.x, p.pos.y);

        ctx.shadowBlur = 0;
    });

    // Bullets
    state.current.bullets.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      if (b.piercing) {
          // Draw Laser Beam
          ctx.shadowBlur = 15;
          ctx.shadowColor = b.color;
          ctx.fillRect(b.pos.x - 2, b.pos.y - 40, 4, 60);
          ctx.shadowBlur = 0;
      } else {
          ctx.arc(b.pos.x, b.pos.y, b.radius, 0, Math.PI * 2);
          ctx.fill();
      }
    });

    // Enemies
    state.current.enemies.forEach(e => {
      ctx.fillStyle = e.color;
      
      // Draw Triangle for enemy
      ctx.beginPath();
      ctx.moveTo(e.pos.x, e.pos.y + e.radius);
      ctx.lineTo(e.pos.x - e.radius, e.pos.y - e.radius);
      ctx.lineTo(e.pos.x + e.radius, e.pos.y - e.radius);
      ctx.closePath();
      ctx.fill();

      // Health Bar
      const hpPct = e.health / e.maxHealth;
      ctx.fillStyle = 'red';
      ctx.fillRect(e.pos.x - 10, e.pos.y - e.radius - 10, 20, 3);
      ctx.fillStyle = 'green';
      ctx.fillRect(e.pos.x - 10, e.pos.y - e.radius - 10, 20 * hpPct, 3);
    });

    // Players
    state.current.players.forEach(p => {
      if (p.id === 'p1') {
          drawPlayer1(ctx, p.pos.x, p.pos.y, p.radius, p.color);
      } else {
          drawPlayer2(ctx, p.pos.x, p.pos.y, p.radius, p.color);
      }

      // Shield Ring based on health
      if (p.health > 20) {
        ctx.strokeStyle = `rgba(255,255,255,${p.health/200})`;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.radius * 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="absolute top-0 left-0 w-full h-full cursor-none"
    />
  );
};

export default GameEngine;