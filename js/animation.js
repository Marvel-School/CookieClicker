// Contains animation and visual effects

const PARTICLE_SIZE = 20;
const PARTICLE_LIFETIME = 2000;

export function showFloatingNumber(element, amount, isBonus = false) {
  const floatingNumber = document.createElement("div");
  floatingNumber.className = "floating-number";
  floatingNumber.textContent = `+${amount}`;
  floatingNumber.style.color = isBonus ? "blue" : "red";
  const { left, top, width } = element.getBoundingClientRect();
  floatingNumber.style.left = `${left + width / 2 - 15}px`;
  floatingNumber.style.top = `${top - 10}px`;
  document.body.appendChild(floatingNumber);
  setTimeout(() => floatingNumber.remove(), 1000);
}

export function createConfetti(x, y, lastConfettiTime) {
  // Skip if called too frequently (improved debouncing)
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

  // Create particles
  const numParticles = 10;
  const particles = [];
  
  // Create particle objects (not DOM elements)
  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: x,
      y: y,
      size: PARTICLE_SIZE,
      color: ['#ff6b6b', '#48dbfb', '#feca57', '#1dd1a1', '#ff9ff3'][Math.floor(Math.random() * 5)],
      speedX: Math.random() * 6 - 3,
      speedY: Math.random() * -3 - 2,
      rotation: 0,
      rotationSpeed: Math.random() * 0.2 - 0.1,
      opacity: 1,
      createdAt: now
    });
  }

  // Animation function for canvas rendering
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
    } else {
      cpsDisplay.style.color = "";
      cpsDisplay.style.fontWeight = "";
    }
  }
}
