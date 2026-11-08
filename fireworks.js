/**
 * High-Performance Diwali Fireworks & Skyshot Particle Engine
 * Features additive blending, realistic projectile physics, spark trails,
 * multi-tier chrysanthemum/willow bursts, and mobile-friendly particle limits.
 */

class FireworksEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.rockets = [];
    this.particles = [];
    this.ambientTimer = null;
    this.isRunning = false;
    this.isReducedMotion = false;

    // Mobile vs Desktop particle bounds
    this.isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent) || window.innerWidth < 768;
    this.maxParticles = this.isMobile ? 700 : 1800;

    // Check prefers-reduced-motion
    if (window.matchMedia) {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.isReducedMotion = motionQuery.matches;
      motionQuery.addEventListener('change', (e) => {
        this.isReducedMotion = e.matches;
      });
    }

    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    this.resize();
    window.addEventListener('resize', this.resize);

    // Modern background processing: pause when document hidden to save CPU/battery
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  pause() {
    this.isRunning = false;
  }

  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      requestAnimationFrame(this.loop);
    }
  }

  /**
   * Main render loop
   */
  loop(currentTime) {
    if (!this.isRunning) return;

    // Clear with slight trailing fade
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Switch to additive blending for luminous fireworks sparks
    this.ctx.globalCompositeOperation = 'lighter';

    // Update & draw active rockets
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const rocket = this.rockets[i];
      rocket.update();
      rocket.draw(this.ctx);

      if (rocket.hasReachedTarget) {
        this.detonateRocket(rocket);
        this.rockets.splice(i, 1);
      }
    }

    // Update & draw active particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      p.draw(this.ctx);

      if (p.isDead()) {
        this.particles.splice(i, 1);
      }
    }

    // Reset composite operation
    this.ctx.globalCompositeOperation = 'source-over';

    requestAnimationFrame(this.loop);
  }

  /**
   * Launch a skyshot rocket from (startX, startY) towards (targetX, targetY)
   */
  launchRocket(startX, startY, targetX, targetY, options = {}) {
    const rocket = new SkyshotRocket({
      startX: startX !== undefined ? startX : this.width * (0.3 + Math.random() * 0.4),
      startY: startY !== undefined ? startY : this.height + 10,
      targetX: targetX !== undefined ? targetX : this.width * (0.2 + Math.random() * 0.6),
      targetY: targetY !== undefined ? targetY : this.height * (0.15 + Math.random() * 0.3),
      type: options.type || this.getRandomShellType(),
      color: options.color || this.getRandomColorPalette(),
      speed: options.speed || (this.isMobile ? 12 : 14),
      onApex: options.onApex,
      power: options.power || 1.0,
      trailDensity: this.isMobile ? 1 : 2
    });

    this.rockets.push(rocket);

    // Sound effect trigger
    if (window.soundFX) {
      window.soundFX.playRocketLaunch(rocket.flightDuration);
    }

    return rocket;
  }

  /**
   * Detonate rocket into hundreds of festive sparks
   */
  detonateRocket(rocket) {
    if (rocket.onApex) {
      try {
        rocket.onApex(rocket);
      } catch (err) {
        console.error('onApex error:', err);
      }
    }

    // Play explosion sound
    if (window.soundFX) {
      window.soundFX.playExplosion({
        power: rocket.power,
        hasCrackle: rocket.type === 'cracklingStrobe' || rocket.type === 'willow' || Math.random() > 0.3
      });
    }

    // Generate burst particles based on shell pattern
    this.spawnShellExplosion(rocket.x, rocket.y, rocket.type, rocket.color, rocket.power);
  }

  /**
   * Shell Explosion Factory
   */
  spawnShellExplosion(x, y, type, colorPalette, power = 1.0) {
    // Check particle limits
    const room = this.maxParticles - this.particles.length;
    if (room <= 20) return;

    let baseCount = this.isMobile ? 65 : 125;
    if (this.isReducedMotion) baseCount = 30;
    const count = Math.min(Math.floor(baseCount * power), room);

    switch (type) {
      case 'heart':
        this.createHeartBurst(x, y, colorPalette, count);
        break;
      case 'willow':
        this.createWillowBurst(x, y, colorPalette, count * 1.1);
        break;
      case 'ring':
        this.createRingBurst(x, y, colorPalette, count);
        break;
      case 'cracklingStrobe':
        this.createCracklingBurst(x, y, colorPalette, count);
        break;
      case 'peony':
        this.createPeonyBurst(x, y, colorPalette, count);
        break;
      case 'chrysanthemum':
      default:
        this.createChrysanthemumBurst(x, y, colorPalette, count);
        break;
    }

    // Add secondary micro-spark center flash
    this.createCoreFlash(x, y);
  }

  createCoreFlash(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push(new FireworkParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#ffffff',
        size: 3.5,
        alpha: 1,
        decay: 0.05,
        gravity: 0.02,
        friction: 0.95
      }));
    }
  }

  createChrysanthemumBurst(x, y, palette, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      const color = palette[Math.floor(Math.random() * palette.length)];
      this.particles.push(new FireworkParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 2.5 + 1.5,
        decay: Math.random() * 0.012 + 0.014,
        gravity: 0.07,
        friction: 0.97,
        hasTrail: Math.random() > 0.45,
        flicker: Math.random() > 0.5
      }));
    }
  }

  createWillowBurst(x, y, palette, count) {
    // Willow has heavy drooping golden streamers with low friction and slow decay
    const goldPalette = ['#ffd700', '#ffec8b', '#ffb700', '#fff3a8'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5;
      const color = goldPalette[Math.floor(Math.random() * goldPalette.length)];
      this.particles.push(new FireworkParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 2.2 + 1.2,
        decay: Math.random() * 0.007 + 0.008, // Longer life
        gravity: 0.09, // Drooping willow trails
        friction: 0.98,
        hasTrail: true,
        flicker: true
      }));
    }
  }

  createPeonyBurst(x, y, palette, count) {
    const mainColor = palette[Math.floor(Math.random() * palette.length)];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.2 - 0.1);
      const speed = 4.5 + Math.random() * 3.5;
      this.particles.push(new FireworkParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: mainColor,
        size: Math.random() * 2.6 + 1.4,
        decay: Math.random() * 0.015 + 0.018,
        gravity: 0.05,
        friction: 0.965,
        flicker: false
      }));
    }
  }

  createRingBurst(x, y, palette, count) {
    const ringColor = palette[0] || '#00e5ff';
    const centerColor = palette[1] || '#ffd700';

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 5.2 + (Math.random() * 0.4 - 0.2);
      this.particles.push(new FireworkParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: ringColor,
        size: 2.4,
        decay: 0.016,
        gravity: 0.04,
        friction: 0.975
      }));
    }

    // Inner stars
    for (let j = 0; j < Math.floor(count * 0.25); j++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.2;
      this.particles.push(new FireworkParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: centerColor,
        size: 2.8,
        decay: 0.02,
        gravity: 0.03,
        friction: 0.96
      }));
    }
  }

  createHeartBurst(x, y, palette, count) {
    const heartColor = palette[Math.floor(Math.random() * palette.length)] || '#ff1744';
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      // Parametric 2D heart curve
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      const scale = 0.28 + Math.random() * 0.05;

      this.particles.push(new FireworkParticle({
        x,
        y,
        vx: hx * scale,
        vy: hy * scale,
        color: heartColor,
        size: Math.random() * 2.4 + 1.4,
        decay: 0.015,
        gravity: 0.04,
        friction: 0.97,
        flicker: true
      }));
    }
  }

  createCracklingBurst(x, y, palette, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6.5 + 1.5;
      const color = palette[Math.floor(Math.random() * palette.length)];
      this.particles.push(new FireworkParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 2.6 + 1.2,
        decay: Math.random() * 0.013 + 0.012,
        gravity: 0.065,
        friction: 0.97,
        flicker: true,
        strobe: true
      }));
    }
  }

  /**
   * The Grand Surprise Launch Sequence
   * Triggered when clicking "Click on me for Diwali surprise"
   * Shoots a towering golden rocket straight to zenith, then detonates with
   * cascading companion rockets flanking it!
   */
  launchGrandSurprise(onRevealCallback) {
    const centerX = this.width * 0.5;
    const startY = this.height + 20;
    const apexY = this.height * (this.isMobile ? 0.22 : 0.25);

    // 1. Grand Primary Skyshot
    this.launchRocket(centerX, startY, centerX, apexY, {
      type: 'willow',
      color: ['#ffd700', '#ff9100', '#ffffff', '#ff1744'],
      power: 1.6,
      speed: 15,
      onApex: () => {
        // Callback when main rocket blooms at apex
        if (onRevealCallback) onRevealCallback();

        // 2. Launch secondary flanker rockets right after apex!
        setTimeout(() => {
          this.launchRocket(this.width * 0.25, this.height + 10, this.width * 0.28, this.height * 0.32, {
            type: 'chrysanthemum',
            color: ['#00e5ff', '#d500f9', '#ffffff'],
            power: 1.2
          });
        }, 180);

        setTimeout(() => {
          this.launchRocket(this.width * 0.75, this.height + 10, this.width * 0.72, this.height * 0.30, {
            type: 'cracklingStrobe',
            color: ['#00e676', '#ffd700', '#ff3d00'],
            power: 1.2
          });
        }, 360);

        setTimeout(() => {
          this.launchRocket(this.width * 0.5, this.height + 10, this.width * 0.5, this.height * 0.18, {
            type: 'heart',
            color: ['#ff1744', '#ff4081', '#ffd700'],
            power: 1.3
          });
        }, 650);
      }
    });
  }

  /**
   * Launch traditional Anar / Flowerpot fountain of sparks
   */
  launchFountain(x, y) {
    const originX = x !== undefined ? x : this.width * 0.5;
    const originY = y !== undefined ? y : this.height - 10;
    const durationMs = 2800;
    const startTime = performance.now();

    if (window.soundFX) {
      window.soundFX.playFountainSound(2.8);
    }

    const interval = setInterval(() => {
      if (document.hidden) return;
      const elapsed = performance.now() - startTime;
      if (elapsed > durationMs) {
        clearInterval(interval);
        return;
      }

      // Height increases then tapers off
      const progress = elapsed / durationMs;
      const peakMultiplier = progress < 0.6 ? (progress / 0.6) : (1 - (progress - 0.6) / 0.4);
      const sparkCount = this.isMobile ? 4 : 8;

      for (let i = 0; i < sparkCount; i++) {
        const spread = (Math.random() - 0.5) * 4.6;
        const upwardSpeed = (9 + Math.random() * 8) * (0.4 + peakMultiplier * 0.7);
        const palette = ['#ffd700', '#ffea00', '#ff9100', '#ffffff', '#ff3d00'];
        const color = palette[Math.floor(Math.random() * palette.length)];

        this.particles.push(new FireworkParticle({
          x: originX + (Math.random() * 14 - 7),
          y: originY,
          vx: spread,
          vy: -upwardSpeed,
          color,
          size: Math.random() * 2.5 + 1.2,
          decay: 0.02 + Math.random() * 0.015,
          gravity: 0.22,
          friction: 0.985,
          hasTrail: Math.random() > 0.5,
          flicker: true
        }));
      }
    }, 40);
  }

  /**
   * Launch spinning ground Chakri / Firewheel
   */
  launchChakri(x, y) {
    const originX = x !== undefined ? x : this.width * (0.35 + Math.random() * 0.3);
    const originY = y !== undefined ? y : this.height - 20;
    const durationMs = 3200;
    const startTime = performance.now();
    let angle = 0;

    if (window.soundFX) {
      window.soundFX.playChakriSound(3.2);
    }

    const interval = setInterval(() => {
      if (document.hidden) return;
      const elapsed = performance.now() - startTime;
      if (elapsed > durationMs) {
        clearInterval(interval);
        if (window.soundFX) window.soundFX.playExplosion({ power: 0.45, hasCrackle: true });
        return;
      }

      const progress = elapsed / durationMs;
      const angularSpeed = progress < 0.7 ? 0.35 + progress * 0.35 : (1 - progress) * 1.6;
      angle += angularSpeed;

      const arms = 2;
      for (let a = 0; a < arms; a++) {
        const jetAngle = angle + (a * Math.PI);
        const speed = 4.2 + Math.random() * 4.2;
        const vx = Math.cos(jetAngle) * speed;
        const vy = Math.sin(jetAngle) * (speed * 0.4) - (Math.random() * 1.2);

        const colors = ['#ffd700', '#ffffff', '#ff9100', '#00e5ff', '#00e676'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        this.particles.push(new FireworkParticle({
          x: originX,
          y: originY,
          vx,
          vy,
          color,
          size: Math.random() * 2.2 + 1.2,
          decay: 0.024,
          gravity: 0.12,
          friction: 0.975,
          hasTrail: true,
          flicker: true
        }));
      }
    }, 28);
  }

  /**
   * Emit micro sparkler sparks at cursor or touch point
   */
  spawnSparkler(x, y) {
    const count = this.isMobile ? 2 : 3;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 0.8;
      this.particles.push(new FireworkParticle({
        x: x + (Math.random() * 6 - 3),
        y: y + (Math.random() * 6 - 3),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.3 ? '#ffd700' : '#ffffff',
        size: Math.random() * 2 + 1,
        decay: 0.045,
        gravity: 0.08,
        friction: 0.95,
        flicker: true
      }));
    }
  }

  /**
   * Start gentle continuous ambient background fireworks
   */
  startAmbient(intervalMs = 3200) {
    if (this.ambientTimer) return;
    this.ambientTimer = setInterval(() => {
      if (document.hidden) return;
      const startX = this.width * (0.2 + Math.random() * 0.6);
      const targetX = startX + (Math.random() * 200 - 100);
      const targetY = this.height * (0.16 + Math.random() * 0.32);

      this.launchRocket(startX, this.height + 10, targetX, targetY, {
        power: 0.95 + Math.random() * 0.4
      });
    }, intervalMs);
  }

  stopAmbient() {
    if (this.ambientTimer) {
      clearInterval(this.ambientTimer);
      this.ambientTimer = null;
    }
  }

  getRandomShellType() {
    const types = ['chrysanthemum', 'willow', 'peony', 'ring', 'heart', 'cracklingStrobe'];
    return types[Math.floor(Math.random() * types.length)];
  }

  getRandomColorPalette() {
    const palettes = [
      ['#ffd700', '#ff9100', '#ffffff'],           // Royal Gold
      ['#ff1744', '#ffd700', '#ffea00'],           // Festive Vermilion
      ['#00e5ff', '#00e676', '#76ff03'],           // Jewel Emerald & Cyan
      ['#d500f9', '#ff007f', '#ffd700'],           // Imperial Purple & Magenta
      ['#ff5252', '#ff4081', '#ffffff', '#ffd700'] // Rose & Champagne
    ];
    return palettes[Math.floor(Math.random() * palettes.length)];
  }
}

/**
 * Ascending Skyshot Rocket
 */
class SkyshotRocket {
  constructor(config) {
    this.x = config.startX;
    this.y = config.startY;
    this.targetX = config.targetX;
    this.targetY = config.targetY;
    this.type = config.type;
    this.color = config.color;
    this.power = config.power || 1.0;
    this.onApex = config.onApex;

    // Trajectory calculations
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    this.distance = Math.hypot(dx, dy);

    this.angle = Math.atan2(dy, dx);
    this.speed = config.speed || 13;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;

    // Approximate flight time in seconds for audio sync
    this.flightDuration = Math.max(0.6, (this.distance / (this.speed * 60)));

    this.trail = [];
    this.maxTrail = 18;
    this.hasReachedTarget = false;
    this.trailDensity = config.trailDensity || 2;
  }

  update() {
    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrail) {
      this.trail.pop();
    }

    this.x += this.vx;
    this.y += this.vy;

    // Apply gentle gravity and drag
    this.vy += 0.08;
    this.vx *= 0.995;

    // Check apex condition: near target altitude or rocket starts decelerating
    if (this.y <= this.targetY || this.vy >= -0.5) {
      this.hasReachedTarget = true;
    }
  }

  draw(ctx) {
    // Glowing rocket head
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ffd700';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Fiery spark smoke trail
    for (let i = 0; i < this.trail.length; i++) {
      const pt = this.trail[i];
      const alpha = (1 - i / this.trail.length) * 0.85;
      const radius = (1 - i / this.trail.length) * 2.8 + 0.8;

      ctx.beginPath();
      ctx.arc(pt.x + (Math.random() * 2 - 1), pt.y + (Math.random() * 2 - 1), radius, 0, Math.PI * 2);
      ctx.fillStyle = i < 4 ? `rgba(255, 240, 180, ${alpha})` : `rgba(255, 120, 20, ${alpha * 0.7})`;
      ctx.fill();
    }
  }
}

/**
 * Single Firework Spark Particle
 */
class FireworkParticle {
  constructor(config) {
    this.x = config.x;
    this.y = config.y;
    this.vx = config.vx;
    this.vy = config.vy;
    this.color = config.color || '#ffd700';
    this.size = config.size || 2;
    this.alpha = config.alpha !== undefined ? config.alpha : 1;
    this.decay = config.decay || 0.015;
    this.gravity = config.gravity !== undefined ? config.gravity : 0.06;
    this.friction = config.friction || 0.97;
    this.hasTrail = config.hasTrail || false;
    this.flicker = config.flicker || false;
    this.strobe = config.strobe || false;

    this.trail = [];
    this.maxTrail = this.hasTrail ? 5 : 0;
  }

  update() {
    if (this.hasTrail) {
      this.trail.unshift({ x: this.x, y: this.y, alpha: this.alpha });
      if (this.trail.length > this.maxTrail) {
        this.trail.pop();
      }
    }

    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;

    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;

    let currentAlpha = this.alpha;
    if (this.strobe && Math.random() > 0.5) {
      currentAlpha = Math.min(1, currentAlpha * 1.8);
    } else if (this.flicker) {
      currentAlpha *= 0.65 + Math.random() * 0.7;
    }

    // Draw particle trail if enabled
    if (this.hasTrail && this.trail.length > 1) {
      for (let i = 0; i < this.trail.length; i++) {
        const pt = this.trail[i];
        const tAlpha = pt.alpha * (1 - i / this.trail.length) * 0.5;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, this.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0, tAlpha);
        ctx.fill();
      }
    }

    // Draw particle core
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  isDead() {
    return this.alpha <= 0;
  }
}

window.FireworksEngine = FireworksEngine;
