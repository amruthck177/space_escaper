import audio from './audio';

export class GameEngine {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Configurations
    this.difficulty = config.difficulty || 'normal';
    this.colorblind = config.colorblind || false;
    this.username = config.username || 'Player';
    this.isMobile = typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
    
    // Callbacks
    this.onGameOver = config.onGameOver || (() => {});
    this.onScoreUpdate = config.onScoreUpdate || (() => {});
    this.onComboUpdate = config.onComboUpdate || (() => {});
    this.onLivesUpdate = config.onLivesUpdate || (() => {});
    this.onBoostCooldownUpdate = config.onBoostCooldownUpdate || (() => {});
    this.onActivePowerupsUpdate = config.onActivePowerupsUpdate || (() => {});
    this.onHapticTrigger = config.onHapticTrigger || (() => {});
    
    // Setup dimensions
    this.resize();

    // Input state
    this.keys = {};
    this.lastLeftTap = 0;
    this.lastRightTap = 0;
    this.touchX = null;
    this.touchActive = false;

    // Difficulty Settings
    this.diffConfig = {
      easy: { startSpeed: 2.0, spawnInterval: 1800, rampRate: 0.05, maxSpeed: 6, colors: { primary: '#10B981', player: '#34D399', laser: '#059669', bgStar: '#D1FAE5' } },
      normal: { startSpeed: 3.5, spawnInterval: 1200, rampRate: 0.09, maxSpeed: 10, colors: { primary: '#8B5CF6', player: '#A78BFA', laser: '#7C3AED', bgStar: '#EDE9FE' } },
      hard: { startSpeed: 5.0, spawnInterval: 750, rampRate: 0.15, maxSpeed: 14, colors: { primary: '#EF4444', player: '#F87171', laser: '#DC2626', bgStar: '#FEE2E2' } }
    }[this.difficulty];

    // Theme Colors (Colorblind overrides)
    this.theme = this.getThemeColors();

    // Game Entities
    this.player = {
      x: this.width / 2,
      y: this.height - 75,
      width: 44,
      height: 44,
      speed: 8,
      lives: 3,
      invulnerableTime: 0, // In milliseconds
      shieldTime: 0,
      slowMoTime: 0,
      multiplierTime: 0,
      magnetTime: 0,
      // Boost / Dash
      boostCooldown: 0,
      boostActiveTime: 0,
      boostDirection: 0 // -1: left, 1: right, 0: forward
    };

    this.asteroids = [];
    this.lasers = [];
    this.powerups = [];
    this.particles = [];
    this.stars = [];

    // Scoring & Combos
    this.score = 0;
    this.combo = 0;
    this.survivalTimer = 0;
    this.nextBossScore = 500;
    this.bossActive = false;

    // Spawn Timers
    this.lastAsteroidSpawn = 0;
    this.lastPowerupSpawn = Date.now() + 5000; // delay first powerup spawn

    // Game loop control
    this.isPaused = false;
    this.isGameOver = false;
    this.animationFrameId = null;
    this.lastTime = 0;

    // Screen Shake
    this.shakeIntensity = 0;
    this.shakeDecay = 0.95;

    // Setup Parallax Starfield
    this.initStarfield();

    // Bind Event Listeners
    this.bindEvents();
    
    // Start Audio Music
    audio.setTempo(1.0);
    audio.startMusic();

    // Trigger initial updates
    this.onLivesUpdate(this.player.lives);
    this.onScoreUpdate(this.score);
    this.onComboUpdate(this.combo);
  }

  getThemeColors() {
    if (this.colorblind) {
      // Colorblind-friendly high-contrast theme
      return {
        easy: '#3B82F6', // Cobalt blue
        normal: '#F59E0B', // Amber
        hard: '#FFFFFF', // High-contrast White
        player: '#10B981', // Emerald
        laser: '#F59E0B', // Amber/Yellow
        asteroid: '#4B5563', // Grey
        homing: '#EF4444', // Red (remains red but thick glowing outlines)
        boss: '#EC4899', // Pink
        shield: '#3B82F6', // Blue
        slowMo: '#10B981', // Green
        multiplier: '#F59E0B', // Gold
        magnet: '#8B5CF6' // Purple
      };
    }
    return {
      easy: '#10B981', // Green
      normal: '#8B5CF6', // Purple
      hard: '#EF4444', // Red
      player: '#00F0FF', // Cyan Neon
      laser: '#FF00A0', // Neon Magenta
      asteroid: '#9CA3AF',
      homing: '#FF3B30', // Bright Red glow
      boss: '#FFA500', // Gold/Orange Armoured
      shield: '#10B981', // Green pulse
      slowMo: '#00F0FF', // Sky Blue
      multiplier: '#FFD700', // Gold
      magnet: '#D946EF' // Purple
    };
  }

  resize() {
    // Dynamic canvas sizes
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || 600;
    this.height = rect.height || 800;
    
    // Support High-DPI screens
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);

    // Keep player in bounds after resize
    if (this.player) {
      this.player.x = Math.max(this.player.width, Math.min(this.width - this.player.width, this.player.x));
      this.player.y = this.height - 75;
    }
  }

  initStarfield() {
    this.stars = [];
    const scale = this.isMobile ? 0.5 : 1.0;
    // Layer 1: Background (slow, tiny)
    for (let i = 0; i < Math.floor(40 * scale); i++) {
      this.stars.push({ x: Math.random() * this.width, y: Math.random() * this.height, size: 0.8, speed: 0.4, layer: 1 });
    }
    // Layer 2: Midground (medium, small)
    for (let i = 0; i < Math.floor(25 * scale); i++) {
      this.stars.push({ x: Math.random() * this.width, y: Math.random() * this.height, size: 1.5, speed: 0.8, layer: 2 });
    }
    // Layer 3: Foreground (fast, larger)
    for (let i = 0; i < Math.floor(12 * scale); i++) {
      this.stars.push({ x: Math.random() * this.width, y: Math.random() * this.height, size: 2.2, speed: 1.5, layer: 3 });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      if (this.isGameOver) return;

      this.keys[e.code] = true;

      // Handle pause toggling
      if (e.code === 'Escape') {
        this.togglePause();
      }

      // Handle Dash triggers via Shift
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.triggerBoost();
      }

      // Handle Fire trigger
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scroll
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      audio.stopMusic();
    } else {
      audio.startMusic();
      this.lastTime = performance.now();
      this.gameLoop(this.lastTime);
    }
  }

  triggerBoost() {
    if (this.player.boostCooldown > 0 || this.isPaused || this.isGameOver) return;
    
    // Determine boost direction
    let dir = 0;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) dir = -1;
    else if (this.keys['ArrowRight'] || this.keys['KeyD']) dir = 1;
    
    this.player.boostDirection = dir;
    this.player.boostActiveTime = 150; // Active for 150ms
    this.player.boostCooldown = 3000; // 3s cooldown
    this.player.invulnerableTime = Math.max(this.player.invulnerableTime, 150);

    audio.playBoost();
    this.triggerScreenShake(4);
    this.onHapticTrigger('impactLight');

    // Create a burst of backward exhaust particles
    const particleCount = Math.floor(25 * (this.isMobile ? 0.5 : 1.0));
    for (let i = 0; i < particleCount; i++) {
      this.createExhaustParticle(this.player.x, this.player.y + 15, dir, true);
    }
  }

  triggerScreenShake(intensity) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  createExhaustParticle(x, y, shipDir, isBoost = false) {
    if (this.isMobile && !isBoost && Math.random() > 0.5) return; // skip 50% exhaust on mobile
    const angle = Math.PI / 2 + (Math.random() * 0.4 - 0.2) - (shipDir * 0.3);
    const speed = isBoost ? (Math.random() * 8 + 6) : (Math.random() * 3 + 2);
    this.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed + (isBoost ? shipDir * -8 : 0),
      vy: Math.sin(angle) * speed,
      size: isBoost ? Math.random() * 5 + 3 : Math.random() * 3 + 1,
      color: isBoost 
        ? (this.colorblind ? '#3B82F6' : '#FF7F00') // blue vs orange boost fire
        : (this.colorblind ? '#E5E7EB' : 'rgba(0, 240, 255, 0.6)'),
      life: isBoost ? 1.0 : 0.6,
      decay: isBoost ? 0.04 : 0.05
    });
  }

  createExplosion(x, y, color, sizeMultiplier = 1.0) {
    const scale = this.isMobile ? 0.5 : 1.0;
    const particleCount = Math.floor((Math.random() * 15 + 15) * sizeMultiplier * scale);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 5 + 2) * sizeMultiplier;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: (Math.random() * 4 + 1.5) * sizeMultiplier,
        color,
        life: 1.0,
        decay: Math.random() * 0.03 + 0.02
      });
    }
    this.triggerScreenShake(3 * sizeMultiplier);
  }

  createLaserHitEffect(x, y, color) {
    const scale = this.isMobile ? 0.5 : 1.0;
    const particleCount = Math.floor(6 * scale);
    for (let i = 0; i < particleCount; i++) {
      const angle = -Math.PI / 2 + (Math.random() * 1 - 0.5);
      const speed = Math.random() * 4 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed, // shoot up slightly
        size: Math.random() * 2 + 1,
        color,
        life: 0.6,
        decay: 0.06
      });
    }
  }

  fireLaser() {
    if (this.isPaused || this.isGameOver) return;
    
    // Weapon fire
    const t = Date.now();
    if (!this.lastLaserFire || t - this.lastLaserFire >= 240) {
      this.lastLaserFire = t;
      this.lasers.push({
        x: this.player.x,
        y: this.player.y - 20,
        width: 4,
        height: 18,
        speed: 12
      });
      audio.playLaser();

      // Muzzle flash particle
      this.particles.push({
        x: this.player.x,
        y: this.player.y - 22,
        vx: 0,
        vy: 0,
        size: 10,
        color: this.theme.laser,
        life: 0.1,
        decay: 0.05
      });
    }
  }

  // Handle Touch Inputs for Mobile
  setTouchPosition(clientX, canvasRect) {
    if (this.isPaused || this.isGameOver) return;
    
    // Translate clientX to local canvas coordinates
    const scaleX = this.width / canvasRect.width;
    const x = (clientX - canvasRect.left) * scaleX;
    this.touchX = Math.max(22, Math.min(this.width - 22, x));
    this.touchActive = true;
  }

  stopTouch() {
    this.touchActive = false;
    this.touchX = null;
  }

  spawnAsteroid(isBoss = false) {
    const colors = this.theme;
    
    if (isBoss) {
      // Spawn a Mini-Boss
      this.asteroids.push({
        id: 'boss_' + Date.now(),
        x: this.width / 2,
        y: -60,
        vx: 0,
        vy: 1.2, // slow fall
        size: 55,
        type: 'boss',
        hp: 8,
        maxHp: 8,
        points: 250,
        rotation: 0,
        rotSpeed: 0.01,
        color: colors.boss,
        pulseTimer: 0
      });
      this.bossActive = true;
      return;
    }

    // Normal variety spawns
    const sizeRoll = Math.random();
    let size = 20 + Math.random() * 20; // Default size: 20 to 40
    let type = 'standard';
    let hp = 1;
    let color = colors.asteroid;
    let points = 10;

    // Splitting asteroids: Large, breaking into two
    if (sizeRoll < 0.25) {
      type = 'splitting';
      size = 38 + Math.random() * 12; // large size
      hp = 3;
      points = 30;
      color = '#F59E0B'; // amber/orange
    } 
    // Homing asteroids: Rare red glowing track
    else if (sizeRoll < 0.40) {
      type = 'homing';
      size = 22 + Math.random() * 10;
      hp = 1;
      points = 25;
      color = colors.homing;
    }

    const x = Math.random() * (this.width - size * 2) + size;
    const speedMult = this.player.slowMoTime > 0 ? 0.5 : 1.0;
    const speedBase = (this.diffConfig.startSpeed + Math.min(this.diffConfig.maxSpeed - this.diffConfig.startSpeed, this.score * this.diffConfig.rampRate * 0.005)) * speedMult;
    
    const vy = (Math.random() * 1.5 + 0.8) * speedBase;
    const vx = type === 'homing' ? 0 : (Math.random() * 1.2 - 0.6) * speedBase * 0.5;

    this.asteroids.push({
      id: 'ast_' + Math.random().toString(36).substr(2, 5) + Date.now(),
      x,
      y: -size,
      vx,
      vy,
      size,
      type,
      hp,
      maxHp: hp,
      points,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() * 0.04 - 0.02) * speedMult,
      color,
      glow: type === 'homing'
    });
  }

  spawnPowerup() {
    const types = ['shield', 'slowMo', 'multiplier', 'magnet'];
    const type = types[Math.floor(Math.random() * types.length)];
    const size = 18;
    const x = Math.random() * (this.width - size * 2) + size;
    
    let color = '#FFF';
    if (type === 'shield') color = this.theme.shield;
    else if (type === 'slowMo') color = this.theme.slowMo;
    else if (type === 'multiplier') color = this.theme.multiplier;
    else if (type === 'magnet') color = this.theme.magnet;

    this.powerups.push({
      x,
      y: -size,
      vy: 2.2,
      size,
      type,
      color
    });
  }

  update(dt) {
    if (this.isPaused || this.isGameOver) return;

    // Apply slow-mo effects to time delta
    const timeScale = this.player.slowMoTime > 0 ? 0.5 : 1.0;
    const adjustedDt = dt * timeScale;

    // 1. Timers Decrement
    if (this.player.invulnerableTime > 0) this.player.invulnerableTime -= dt;
    if (this.player.shieldTime > 0) this.player.shieldTime -= dt;
    if (this.player.slowMoTime > 0) {
      this.player.slowMoTime -= dt;
      if (this.player.slowMoTime <= 0) {
        audio.setTempo(1.0 + Math.min(0.5, this.score * 0.0005));
      }
    }
    if (this.player.multiplierTime > 0) this.player.multiplierTime -= dt;
    if (this.player.magnetTime > 0) this.player.magnetTime -= dt;
    if (this.player.boostCooldown > 0) {
      this.player.boostCooldown -= dt;
      this.onBoostCooldownUpdate(Math.max(0, this.player.boostCooldown));
    }
    if (this.player.boostActiveTime > 0) {
      this.player.boostActiveTime -= dt;
      if (this.player.boostActiveTime <= 0) {
        this.player.boostDirection = 0;
      }
    }

    // Send active powerup list
    const activePowerups = [];
    if (this.player.shieldTime > 0) activePowerups.push({ type: 'shield', time: this.player.shieldTime });
    if (this.player.slowMoTime > 0) activePowerups.push({ type: 'slowMo', time: this.player.slowMoTime });
    if (this.player.multiplierTime > 0) activePowerups.push({ type: 'multiplier', time: this.player.multiplierTime });
    if (this.player.magnetTime > 0) activePowerups.push({ type: 'magnet', time: this.player.magnetTime });
    this.onActivePowerupsUpdate(activePowerups);

    // Update Music tempo gradually with score, unless slowed
    if (this.player.slowMoTime <= 0) {
      audio.setTempo(1.0 + Math.min(0.6, this.score * 0.0004));
    } else {
      audio.setTempo(0.55); // Slow down the rhythm during slowMo
    }

    // 2. Parallax Starfield Movement
    this.stars.forEach(star => {
      // Moves based on layer depth
      star.y += star.speed * (this.player.slowMoTime > 0 ? 0.4 : 1.0) * (this.player.boostActiveTime > 0 ? 5.0 : 1.0);
      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
    });

    // 3. Player Movement (Interpolated / Smooth)
    let moveDir = 0;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) moveDir = -1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) moveDir = 1;

    let targetX = this.player.x;

    // Handle touch controls
    if (this.touchActive && this.touchX !== null) {
      const diffX = this.touchX - this.player.x;
      if (Math.abs(diffX) > 2) {
        moveDir = diffX > 0 ? 1 : -1;
        // Direct jump with lerp for responsiveness
        targetX = this.player.x + diffX * 0.25;
      }
    } else {
      // Handle keyboard speed
      const baseSpeed = this.player.speed;
      const boostMult = this.player.boostActiveTime > 0 ? 3.2 : 1.0;
      targetX = this.player.x + moveDir * baseSpeed * boostMult;
    }

    // Boundary check
    this.player.x = Math.max(this.player.width / 2, Math.min(this.width - this.player.width / 2, targetX));

    // Player fire triggers if holding space
    if (this.keys['Space']) {
      this.fireLaser();
    }

    // exhaust particle trails
    if (moveDir !== 0 || Math.random() > 0.3) {
      const offset = (this.player.width / 2) - 8;
      const isBoosting = this.player.boostActiveTime > 0;
      this.createExhaustParticle(this.player.x - 8 + (Math.random() * 16), this.player.y + 15, moveDir, isBoosting);
    }

    // 4. Lasers Movement
    this.lasers.forEach(l => {
      l.y -= l.speed;
    });
    this.lasers = this.lasers.filter(l => l.y > -20);

    // 5. Asteroids Spawns
    const now = Date.now();
    const spawnRate = this.bossActive ? 4000 : (this.diffConfig.spawnInterval * (this.player.slowMoTime > 0 ? 1.8 : 1.0));
    
    if (now - this.lastAsteroidSpawn >= spawnRate) {
      this.lastAsteroidSpawn = now;
      this.spawnAsteroid();
    }

    // Boss trigger at score milestones
    if (this.score >= this.nextBossScore && !this.bossActive) {
      this.spawnAsteroid(true);
      this.nextBossScore += 500;
    }

    // 6. Power-ups Spawn Logic
    const powerupInterval = 9000 + Math.random() * 6000; // every 9-15s
    if (now - this.lastPowerupSpawn >= powerupInterval && !this.bossActive) {
      this.lastPowerupSpawn = now;
      this.spawnPowerup();
    }

    // 7. Update Asteroids
    this.asteroids.forEach(a => {
      // Homing logic: tracking player X
      if (a.type === 'homing') {
        const dx = this.player.x - a.x;
        a.vx += Math.sign(dx) * 0.05 * timeScale;
        // Limit horizontal speed
        a.vx = Math.max(-2, Math.min(2, a.vx));
      }
      
      a.y += a.vy * timeScale;
      a.x += a.vx * timeScale;
      a.rotation += a.rotSpeed * timeScale;

      // Handle boss special actions (e.g. fire small debris sparks sideways)
      if (a.type === 'boss') {
        a.pulseTimer += adjustedDt;
        if (Math.floor(a.pulseTimer / 800) % 2 === 0 && Math.random() > 0.85) {
          // Boss fires particle rings
          const angle = Math.random() * Math.PI;
          this.particles.push({
            x: a.x,
            y: a.y + a.size,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3 + a.vy,
            size: 4,
            color: this.theme.boss,
            life: 1.0,
            decay: 0.03
          });
        }
      }
    });

    // 8. Update Power-ups
    this.powerups.forEach(p => {
      // Magnet attraction
      if (this.player.magnetTime > 0) {
        const dx = this.player.x - p.x;
        const dy = this.player.y - p.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < 220) {
          // Drag force
          const force = (220 - dist) / 220;
          p.x += (dx / dist) * 7 * force;
          p.y += (dy / dist) * 7 * force;
        } else {
          p.y += p.vy;
        }
      } else {
        p.y += p.vy;
      }
    });

    // Filter off-screen items
    this.asteroids = this.asteroids.filter(a => {
      // Near-miss detection before filtering off-screen
      if (a.y > this.player.y + 10 && !a.nearMissTracked && a.type !== 'boss') {
        a.nearMissTracked = true;
        const dx = Math.abs(a.x - this.player.x);
        const touchDist = a.size + this.player.width / 2;
        // If it passed close (within 55px beyond the hit boundary)
        if (dx < touchDist + 55 && dx >= touchDist - 5) {
          this.combo++;
          this.onComboUpdate(this.combo);
          
          // Show combo text effect
          this.particles.push({
            x: this.player.x,
            y: this.player.y - 30,
            vx: Math.random() * 2 - 1,
            vy: -2,
            size: 1, // Special text flag
            color: '#10B981',
            text: `NEAR MISS! +${5 * this.combo}`,
            life: 0.8,
            decay: 0.03
          });
          
          this.score += 5 * this.combo;
          this.onScoreUpdate(this.score);
        }
      }
      return a.y < this.height + a.size;
    });

    this.powerups = this.powerups.filter(p => p.y < this.height + p.size);

    // 9. Update Particles
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
    });
    this.particles = this.particles.filter(p => p.life > 0);

    // 10. Continuous survival score
    this.survivalTimer += adjustedDt;
    if (this.survivalTimer >= 1000) {
      this.survivalTimer = 0;
      const baseGain = 5;
      const mult = this.player.multiplierTime > 0 ? 2 : 1;
      this.score += baseGain * mult;
      this.onScoreUpdate(this.score);
    }

    // 11. Collisions Checking
    this.checkCollisions();

    // 12. Decrease screen shake intensity
    if (this.shakeIntensity > 0.05) {
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeIntensity = 0;
    }
  }

  checkCollisions() {
    // A. Lasers colliding with Asteroids
    for (let lIdx = this.lasers.length - 1; lIdx >= 0; lIdx--) {
      const l = this.lasers[lIdx];
      let laserHit = false;

      for (let aIdx = this.asteroids.length - 1; aIdx >= 0; aIdx--) {
        const a = this.asteroids[aIdx];
        
        // Simple circle-rectangle bounding box approximation
        const dx = Math.abs(l.x - a.x);
        const dy = Math.abs(l.y - a.y);
        const dist = Math.hypot(dx, dy);

        if (dist < a.size + l.width) {
          laserHit = true;
          a.hp--;
          
          this.createLaserHitEffect(l.x, l.y, a.color);

          if (a.hp <= 0) {
            // Destroy Asteroid
            audio.playExplosion(a.type === 'boss' ? 'boss' : a.size > 30 ? 'normal' : 'small');
            this.createExplosion(a.x, a.y, a.color, a.size / 22);

            const mult = this.player.multiplierTime > 0 ? 2 : 1;
            this.score += a.points * mult;
            this.onScoreUpdate(this.score);

            // Handle Boss clearance
            if (a.type === 'boss') {
              this.bossActive = false;
            }

            // Handle Splitting logic
            if (a.type === 'splitting') {
              const newSize = a.size / 1.7;
              for (let i = 0; i < 2; i++) {
                const angle = -Math.PI / 4 + (i * Math.PI / 2) + (Math.random() * 0.2 - 0.1);
                this.asteroids.push({
                  id: 'ast_split_' + Date.now() + i,
                  x: a.x,
                  y: a.y,
                  vx: Math.sin(angle) * 3,
                  vy: a.vy * 1.1,
                  size: newSize,
                  type: 'standard',
                  hp: 1,
                  maxHp: 1,
                  points: 15,
                  rotation: Math.random() * Math.PI * 2,
                  rotSpeed: Math.random() * 0.05 - 0.025,
                  color: '#EF4444' // red shards
                });
              }
            }

            this.asteroids.splice(aIdx, 1);
          } else {
            // Just damaged - quick screen shake / sparks
            this.triggerScreenShake(1.5);
          }
          break;
        }
      }

      if (laserHit) {
        this.lasers.splice(lIdx, 1);
      }
    }

    // B. Player colliding with Power-ups
    for (let pIdx = this.powerups.length - 1; pIdx >= 0; pIdx--) {
      const p = this.powerups[pIdx];
      const dist = Math.hypot(this.player.x - p.x, this.player.y - p.y);
      const touchDist = p.size + this.player.width / 2.3;

      if (dist < touchDist) {
        // Collect Powerup!
        audio.playPickup();
        this.onHapticTrigger('impactLight');

        // Create floaty text particle
        let typeName = '';
        if (p.type === 'shield') {
          this.player.shieldTime = 8000;
          typeName = 'SHIELD';
        } else if (p.type === 'slowMo') {
          this.player.slowMoTime = 5000;
          typeName = 'SLOW MO';
        } else if (p.type === 'multiplier') {
          this.player.multiplierTime = 8000;
          typeName = 'DOUBLE POINTS';
        } else if (p.type === 'magnet') {
          this.player.magnetTime = 6000;
          typeName = 'MAGNET';
        }

        // Score bonus for collection
        const mult = this.player.multiplierTime > 0 ? 2 : 1;
        this.score += 20 * mult;
        this.onScoreUpdate(this.score);

        // Powerup ring particles
        for (let i = 0; i < 15; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 3 + 1;
          this.particles.push({
            x: p.x,
            y: p.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 3 + 1,
            color: p.color,
            life: 0.8,
            decay: 0.04
          });
        }

        this.particles.push({
          x: this.player.x,
          y: this.player.y - 40,
          vx: 0,
          vy: -1.5,
          size: 1, // Special text flag
          color: p.color,
          text: `+ ${typeName}!`,
          life: 1.2,
          decay: 0.02
        });

        this.powerups.splice(pIdx, 1);
      }
    }

    // C. Player colliding with Asteroids
    if (this.player.invulnerableTime <= 0) {
      for (let aIdx = this.asteroids.length - 1; aIdx >= 0; aIdx--) {
        const a = this.asteroids[aIdx];
        const dist = Math.hypot(this.player.x - a.x, this.player.y - a.y);
        
        // Approximate ship hitbox (tight)
        const hitRadius = this.player.width / 2.5; 
        const touchDist = a.size + hitRadius;

        if (dist < touchDist) {
          // Collision!
          if (this.player.shieldTime > 0) {
            // Shield absorbs hit
            this.player.shieldTime = 0;
            this.player.invulnerableTime = 1000; // 1s brief immunity
            audio.playShieldBreak();
            this.triggerScreenShake(7);
            this.onHapticTrigger('impactHeavy');

            // Large blue/green blast
            this.createExplosion(a.x, a.y, this.theme.shield, a.size / 20);

            // Destroy the asteroid we crashed into (boss loses 2 HP instead of instant death)
            if (a.type === 'boss') {
              a.hp -= 2;
            } else {
              this.asteroids.splice(aIdx, 1);
            }
          } else {
            // Lose a life
            this.player.lives--;
            this.player.invulnerableTime = 1500; // 1.5s flashes
            this.combo = 0; // reset combo
            this.onComboUpdate(this.combo);
            this.onLivesUpdate(this.player.lives);

            audio.playExplosion('boss');
            this.triggerScreenShake(12);
            this.onHapticTrigger('impactMedium');

            // Large debris explosion
            this.createExplosion(this.player.x, this.player.y, '#FF3B30', 1.5);

            if (a.type !== 'boss') {
              this.asteroids.splice(aIdx, 1);
            }

            if (this.player.lives <= 0) {
              this.endGame();
            }
          }
          break;
        }
      }
    }
  }

  endGame() {
    this.isGameOver = true;
    audio.stopMusic();
    audio.playGameOver();
    this.onHapticTrigger('error');
    this.onGameOver(this.score);
  }

  draw() {
    // Clear screen
    this.ctx.fillStyle = '#06000F';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Apply Screen Shake Translation
    this.ctx.save();
    if (this.shakeIntensity > 0) {
      const dx = (Math.random() - 0.5) * this.shakeIntensity;
      const dy = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(dx, dy);
    }

    // 1. Draw Starfield Parallax
    this.stars.forEach(star => {
      this.ctx.fillStyle = star.layer === 3 
        ? '#FFF' 
        : (star.layer === 2 ? '#6B7280' : '#374151');
      this.ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // 2. Draw Particles
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.life;
      
      if (p.text) {
        // Draw floaty text indicator
        this.ctx.font = 'bold 13px "Outfit", system-ui, sans-serif';
        this.ctx.fillStyle = p.color;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 8;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(p.text, p.x, p.y);
      } else {
        this.ctx.fillStyle = p.color;
        this.ctx.shadowColor = p.color;
        if (!this.colorblind) {
          this.ctx.shadowBlur = p.size * 2;
        }
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    });

    // 3. Draw Lasers
    this.ctx.save();
    this.ctx.fillStyle = this.theme.laser;
    if (!this.colorblind) {
      this.ctx.shadowColor = this.theme.laser;
      this.ctx.shadowBlur = 10;
    }
    this.lasers.forEach(l => {
      // Glow trail
      this.ctx.fillRect(l.x - l.width / 2, l.y, l.width, l.height);
    });
    this.ctx.restore();

    // 4. Draw Powerups
    this.powerups.forEach(p => {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      
      // Outer glow pulse
      const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.15;
      
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      if (!this.colorblind) {
        this.ctx.shadowBlur = 12 * pulse;
      }
      
      // Draw hexagon power-up container
      this.ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const hx = Math.cos(angle) * (p.size * pulse);
        const hy = Math.sin(angle) * (p.size * pulse);
        if (i === 0) this.ctx.moveTo(hx, hy);
        else this.ctx.lineTo(hx, hy);
      }
      this.ctx.closePath();
      this.ctx.fill();

      // Draw interior white icon / letters
      this.ctx.fillStyle = '#06000F';
      this.ctx.font = '900 11px system-ui, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      let icon = '';
      if (p.type === 'shield') icon = '🛡️';
      else if (p.type === 'slowMo') icon = '⏱️';
      else if (p.type === 'multiplier') icon = '2x';
      else if (p.type === 'magnet') icon = '🧲';
      this.ctx.fillText(icon, 0, 0);

      this.ctx.restore();
    });

    // 5. Draw Asteroids
    this.asteroids.forEach(a => {
      this.ctx.save();
      this.ctx.translate(a.x, a.y);
      this.ctx.rotate(a.rotation);

      this.ctx.fillStyle = a.color;
      this.ctx.shadowColor = a.color;
      
      if (a.type === 'homing') {
        this.ctx.strokeStyle = '#FF3B30';
        this.ctx.lineWidth = 3;
        if (!this.colorblind) {
          this.ctx.shadowBlur = 15;
        }
      } else if (a.type === 'boss') {
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 4;
        if (!this.colorblind) {
          this.ctx.shadowBlur = 20;
        }
      } else {
        this.ctx.strokeStyle = '#4B5563';
        this.ctx.lineWidth = 1.5;
      }

      // Draw jagged asteroid shape based on unique ID hashes
      const vertices = 8;
      const seedVal = a.id.charCodeAt(5) || 5;
      this.ctx.beginPath();
      for (let i = 0; i < vertices; i++) {
        const angle = (i * Math.PI * 2) / vertices;
        // Make it jagged programmatically
        const jFactor = 0.8 + Math.abs(Math.sin(angle * seedVal)) * 0.25;
        const rx = Math.cos(angle) * (a.size * jFactor);
        const ry = Math.sin(angle) * (a.size * jFactor);
        if (i === 0) this.ctx.moveTo(rx, ry);
        else this.ctx.lineTo(rx, ry);
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.restore();

      // Draw health bars above damaged items
      if (a.hp < a.maxHp) {
        const barW = a.size * 1.5;
        const barH = 5;
        const bx = a.x - barW / 2;
        const by = a.y - a.size - 12;

        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(bx, by, barW, barH);
        
        this.ctx.fillStyle = a.type === 'boss' ? '#FFD700' : '#F59E0B';
        this.ctx.fillRect(bx, by, barW * (a.hp / a.maxHp), barH);
      }
    });

    // 6. Draw Player Ship
    if (this.player.lives > 0) {
      this.ctx.save();
      this.ctx.translate(this.player.x, this.player.y);

      // Flash ship when invulnerable
      let drawShip = true;
      if (this.player.invulnerableTime > 0) {
        // Toggle opacity rapidly
        drawShip = Math.floor(this.player.invulnerableTime / 100) % 2 === 0;
      }

      if (drawShip) {
        // Render stylized retro fighter
        this.ctx.fillStyle = this.theme.player;
        if (!this.colorblind) {
          this.ctx.shadowColor = this.theme.player;
          this.ctx.shadowBlur = 15;
        }

        this.ctx.beginPath();
        // Nose cone
        this.ctx.moveTo(0, -22);
        // Right wing
        this.ctx.lineTo(this.player.width / 2, 16);
        this.ctx.lineTo(this.player.width / 3, 10);
        this.ctx.lineTo(-this.player.width / 3, 10);
        // Left wing
        this.ctx.lineTo(-this.player.width / 2, 16);
        this.ctx.closePath();
        this.ctx.fill();

        // Ship canopy overlay
        this.ctx.fillStyle = '#06000F';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -10);
        this.ctx.lineTo(5, 5);
        this.ctx.lineTo(-5, 5);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw Boost Cooldown ring around the ship
        if (this.player.boostCooldown > 0) {
          const cooldownPct = this.player.boostCooldown / 3000;
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 32, -Math.PI / 2, -Math.PI / 2 + (cooldownPct * Math.PI * 2));
          this.ctx.stroke();
        }
      }
      this.ctx.restore();

      // Draw Green Shield Bubble around player
      if (this.player.shieldTime > 0) {
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        
        const pulse = 1 + Math.sin(Date.now() * 0.015) * 0.08;
        const shieldR = (this.player.width * 0.9) * pulse;
        
        const grad = this.ctx.createRadialGradient(0, 0, shieldR * 0.8, 0, 0, shieldR);
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.0)');
        grad.addColorStop(0.8, 'rgba(16, 185, 129, 0.15)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0.7)');

        this.ctx.fillStyle = grad;
        this.ctx.strokeStyle = '#10B981';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.restore();
      }
    }

    this.ctx.restore(); // Pop screen shake translate
  }

  gameLoop(time) {
    if (this.isPaused || this.isGameOver) return;

    if (!this.lastTime) this.lastTime = time;
    const dt = time - this.lastTime;
    this.lastTime = time;

    // Cap time steps to avoid huge leaps in background tabs
    const cappedDt = Math.min(dt, 100);

    this.update(cappedDt);
    this.draw();

    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  start() {
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  destroy() {
    this.isPaused = true;
    audio.stopMusic();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
