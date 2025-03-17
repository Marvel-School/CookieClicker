/**
 * Manages visual effects like confetti, floating numbers, and boost indicators
 */
export class VisualEffectsManager {
  constructor(game) {
    this.game = game;
    this.confettiCanvas = null;
    this.confettiCtx = null;
    this.lastConfettiTime = 0;
  }
  
  // Single implementation of floating numbers
  showFloatingNumber(element, amount, isBonus = false) {
    const floatingNumber = document.createElement("div");
    floatingNumber.className = "floating-number";
    
    // Format with 0 or 1 decimal place only
    const formattedAmount = typeof amount === 'number' ? 
      (Number.isInteger(amount) ? amount : parseFloat(amount.toFixed(1))) : 
      amount;
      
    floatingNumber.textContent = `+${formattedAmount}`;
    floatingNumber.style.color = isBonus ? "blue" : "red";
    
    const { left, top, width } = element.getBoundingClientRect();
    floatingNumber.style.left = `${left + width / 2 - 15}px`;
    floatingNumber.style.top = `${top - 10}px`;
    
    document.body.appendChild(floatingNumber);
    setTimeout(() => floatingNumber.remove(), 1000);
  }
  
  // Unified confetti implementation
  createConfetti(x, y) {
    const PARTICLE_SIZE = 20;
    const PARTICLE_LIFETIME = 2000;
    
    // Skip if called too frequently
    const now = Date.now();
    if (this.lastConfettiTime && now - this.lastConfettiTime < 200) {
      return this.lastConfettiTime;
    }
    
    // Setup canvas
    if (!this.confettiCanvas) {
      this.confettiCanvas = document.createElement('canvas');
      this.confettiCanvas.id = 'confetti-canvas';
      this.confettiCanvas.width = window.innerWidth;
      this.confettiCanvas.height = window.innerHeight;
      this.confettiCanvas.style.position = 'fixed';
      this.confettiCanvas.style.top = '0';
      this.confettiCanvas.style.left = '0';
      this.confettiCanvas.style.pointerEvents = 'none';
      this.confettiCanvas.style.zIndex = '999999';
      document.body.appendChild(this.confettiCanvas);
      this.confettiCtx = this.confettiCanvas.getContext('2d');
      
      window.addEventListener('resize', () => {
        this.confettiCanvas.width = window.innerWidth;
        this.confettiCanvas.height = window.innerHeight;
      });
    }
    
    // Get particle intensity from personalization
    const intensity = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--particle-intensity') || 1);
    
    // Create particles
    const baseParticles = 10;
    const numParticles = Math.max(1, Math.round(baseParticles * intensity));
    const particles = [];
    
    // Generate particles
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: x,
        y: y,
        size: PARTICLE_SIZE * (0.8 + (Math.random() * 0.4 * intensity)),
        color: ['#ff6b6b', '#48dbfb', '#feca57', '#1dd1a1', '#ff9ff3'][Math.floor(Math.random() * 5)],
        speedX: (Math.random() * 6 - 3) * intensity,
        speedY: (Math.random() * -3 - 2) * intensity,
        rotation: 0,
        rotationSpeed: Math.random() * 0.2 - 0.1,
        opacity: 1,
        createdAt: now
      });
    }
    
    // Animation function
    const animate = () => {
      this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
      let hasActiveParticles = false;
      
      for (const particle of particles) {
        const lifetime = now + PARTICLE_LIFETIME - particle.createdAt;
        if (lifetime <= 0) continue;
        
        hasActiveParticles = true;
        
        // Update particle
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.speedY += 0.1; // gravity
        particle.rotation += particle.rotationSpeed;
        particle.opacity = lifetime / PARTICLE_LIFETIME;
        
        // Draw particle
        this.confettiCtx.save();
        this.confettiCtx.globalAlpha = particle.opacity;
        this.confettiCtx.translate(particle.x, particle.y);
        this.confettiCtx.rotate(particle.rotation);
        this.confettiCtx.fillStyle = particle.color;
        this.confettiCtx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
        this.confettiCtx.restore();
      }
      
      if (hasActiveParticles) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
    this.lastConfettiTime = now;
    return now;
  }
  
  // Centralized visual boost effect management
  applyBoostVisual(element, className, active) {
    if (!element) return;
    
    if (active) {
      element.classList.add(className);
    } else {
      element.classList.remove(className);
    }
  }
  
  // Time accelerator visual effects
  applyTimeAcceleratorVisuals(active) {
    // Apply to cookie
    this.applyBoostVisual(this.game.cookie, 'accelerated', active);
    
    // Apply to CPS display
    if (this.game.cpsDisplay) {
      if (active) {
        this.game.cpsDisplay.style.color = "#ff4500";
        this.game.cpsDisplay.style.fontWeight = "bold";
      } else {
        this.game.cpsDisplay.style.color = "";
        this.game.cpsDisplay.style.fontWeight = "";
      }
    }
  }
  
  // Click power boost visuals
  applyClickPowerBoostVisuals(active) {
    this.applyBoostVisual(this.game.cookie, 'click-boosted', active);
    
    if (this.game.clickPowerDisplay) {
      if (active) {
        this.game.clickPowerDisplay.style.color = "#ff6600";
        this.game.clickPowerDisplay.style.fontWeight = "bold";
      } else {
        this.game.clickPowerDisplay.style.color = "";
        this.game.clickPowerDisplay.style.fontWeight = "";
      }
    }
  }
  
  // Frenzy visuals
  applyClickingFrenzyVisuals(active) {
    this.applyBoostVisual(this.game.cookie, 'frenzy-boosted', active);
    
    if (this.game.clickPowerDisplay) {
      if (active) {
        this.game.clickPowerDisplay.style.color = "#ff0000";
        this.game.clickPowerDisplay.style.fontWeight = "bold";
        this.game.clickPowerDisplay.style.fontSize = "1.2em";
      } else {
        this.game.clickPowerDisplay.style.color = "";
        this.game.clickPowerDisplay.style.fontWeight = "";
        this.game.clickPowerDisplay.style.fontSize = "";
      }
    }
  }
}
