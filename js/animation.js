// Contains animation and visual effects

const PARTICLE_SIZE = 20;
const PARTICLE_LIFETIME = 2000;

// Show floating number animation
export function showFloatingNumber(element, amount, isBonus = false) {
  if (!element) return;
  
  const floatingNumber = document.createElement("div");
  floatingNumber.className = "floating-number";
  
  // Format number to reduce decimal places
  let displayAmount;
  if (typeof amount === 'number') {
    // If it's an integer, show as is
    if (Number.isInteger(amount)) {
      displayAmount = amount;
    } else {
      displayAmount = amount.toFixed(1);
    }
  } else {
    displayAmount = amount;
  }
  
  floatingNumber.textContent = `+${displayAmount}`;
  floatingNumber.style.color = isBonus ? "#4caf50" : "#ff5722";
  floatingNumber.style.position = "absolute";
  floatingNumber.style.fontSize = isBonus ? "24px" : "20px";
  floatingNumber.style.fontWeight = "bold";
  floatingNumber.style.zIndex = "100";
  
  const { left, top, width } = element.getBoundingClientRect();
  floatingNumber.style.left = `${left + width / 2 - 15}px`;
  floatingNumber.style.top = `${top - 10}px`;
  document.body.appendChild(floatingNumber);
  
  // Animate using CSS animation
  floatingNumber.style.animation = "float-up 1s forwards";
  
  // Remove after animation completes
  setTimeout(() => floatingNumber.remove(), 1000);
}

// Create confetti effect
export function createConfetti(x, y, lastConfettiTime) {
  // Skip if called too frequently
  const now = Date.now();
  if (lastConfettiTime && now - lastConfettiTime < 200) {
    return lastConfettiTime;
  }
  
  // Use canvas instead of DOM elements for better performance
  let confettiCanvas = document.getElementById('confetti-canvas');
  let confettiCtx;
  
  if (!confettiCanvas) {
    confettiCanvas = document.createElement('canvas');
    confettiCanvas.id = 'confetti-canvas';
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    confettiCanvas.style.position = 'fixed';
    confettiCanvas.style.top = '0';
    confettiCanvas.style.left = '0';
    confettiCanvas.style.pointerEvents = 'none';
    confettiCanvas.style.zIndex = '999999';
    document.body.appendChild(confettiCanvas);
    confettiCtx = confettiCanvas.getContext('2d');
    
    // Handle resize events
    window.addEventListener('resize', () => {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    });
  } else {
    confettiCtx = confettiCanvas.getContext('2d');
  }

  // Get particle intensity from CSS variable (set by personalization)
  const intensity = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--particle-intensity') || 1);
  
  // Create particles - scale count by intensity
  const baseParticles = 10;
  const numParticles = Math.max(1, Math.round(baseParticles * intensity));
  const particles = [];
  
  // Create particle objects with more dramatic size variance based on intensity
  for (let i = 0; i < numParticles; i++) {
    // Make particles bigger when intensity is higher
    const sizeMultiplier = 0.6 + (intensity * 0.8);
    const baseSize = PARTICLE_SIZE * sizeMultiplier;
    
    // More pronounced speed difference based on intensity
    const speedMultiplier = Math.min(2.5, intensity * 1.5);
    
    particles.push({
      x: x,
      y: y,
      size: baseSize * (0.7 + (Math.random() * 0.6)),
      color: ['#ff6b6b', '#48dbfb', '#feca57', '#1dd1a1', '#ff9ff3'][Math.floor(Math.random() * 5)],
      speedX: (Math.random() * 6 - 3) * speedMultiplier,
      speedY: (Math.random() * -4 - 2) * speedMultiplier,
      rotation: 0,
      rotationSpeed: Math.random() * 0.4 - 0.2,
      opacity: 1,
      createdAt: now
    });
  }

  // Animation function with more dramatic effects based on intensity
  const animate = () => {
    // Clear only the needed part of canvas
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    
    // Check if there are any active particles
    let hasActiveParticles = false;

    // Update and draw particles
    for (const particle of particles) {
      // Calculate lifetime
      const lifetime = now + PARTICLE_LIFETIME - particle.createdAt;
      if (lifetime <= 0) continue;
      
      hasActiveParticles = true;
      
      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.speedY += 0.1; // gravity
      particle.rotation += particle.rotationSpeed;
      particle.opacity = lifetime / PARTICLE_LIFETIME;
      
      // Add a pulsing effect for high intensity
      if (intensity > 1.5) {
        particle.size += Math.sin(now / 100) * 0.5;
      }
      
      // Draw particle
      confettiCtx.save();
      confettiCtx.globalAlpha = particle.opacity;
      confettiCtx.translate(particle.x, particle.y);
      confettiCtx.rotate(particle.rotation);
      confettiCtx.fillStyle = particle.color;
      confettiCtx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
      confettiCtx.restore();
    }
    
    // Continue animation if particles are still active
    if (hasActiveParticles) {
      requestAnimationFrame(animate);
    }
  };
  
  // Start animation
  requestAnimationFrame(animate);
  
  return now;
}

// Apply visual effects for time accelerator
export function applyTimeAcceleratorVisuals(cookie, cpsDisplay, active) {
  // Apply effects to cookie
  if (cookie) {
    if (active) {
      cookie.classList.add('accelerated');
      cookie.style.filter = "brightness(1.5) drop-shadow(0 0 10px gold)";
    } else {
      cookie.classList.remove('accelerated');
      cookie.style.filter = "";
    }
  }
  
  // Apply effects to CPS display
  if (cpsDisplay) {
    if (active) {
      cpsDisplay.style.color = "#ff4500";
      cpsDisplay.style.fontWeight = "bold";
      cpsDisplay.classList.add('boosted');
      
      // Add pulsing animation
      const animation = document.createElement('style');
      animation.id = 'cps-animation';
      animation.textContent = `
        #cps.boosted {
          animation: cps-pulse 1s infinite alternate;
        }
        @keyframes cps-pulse {
          from { transform: scale(1); }
          to { transform: scale(1.1); text-shadow: 0 0 5px #ff4500; }
        }
      `;
      document.head.appendChild(animation);
    } else {
      cpsDisplay.style.color = "";
      cpsDisplay.style.fontWeight = "";
      cpsDisplay.classList.remove('boosted');
      
      // Remove animation
      const animation = document.getElementById('cps-animation');
      if (animation) animation.remove();
    }
  }
  
  // Update display with current theme
  if (document.body.classList.contains('theme-dark')) {
    // Dark theme adjustments
    if (active && cpsDisplay) {
      cpsDisplay.style.color = "#ff6600";
      cpsDisplay.style.textShadow = "0 0 5px rgba(255, 102, 0, 0.7)";
    }
  } else if (document.body.classList.contains('theme-neon')) {
    // Neon theme adjustments
    if (active && cpsDisplay) {
      cpsDisplay.style.color = "#ffcc00";
      cpsDisplay.style.textShadow = "0 0 8px rgba(255, 204, 0, 0.9)";
    }
    if (active && cookie) {
      cookie.style.filter = "brightness(1.6) drop-shadow(0 0 15px #ffcc00)";
    }
  }
}
