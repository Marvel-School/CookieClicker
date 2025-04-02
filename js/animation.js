// Contains animation and visual effects

const PARTICLE_SIZE = 20;
const PARTICLE_LIFETIME = 2000;

/**
 * Shows a floating number animation from an element
 * @param {HTMLElement} sourceElement - Element to show the floating number from
 * @param {number} amount - The number value to show
 * @param {boolean} isBonus - Whether this is a bonus amount
 */
export function showFloatingNumber(sourceElement, amount, isBonus = false) {
  if (!sourceElement) {
    console.error("Missing source element for floating number");
    return;
  }
  
  // Perform thorough validation of amount
  if (typeof amount !== 'number' || !isFinite(amount) || isNaN(amount)) {
    console.error("Invalid amount for floating number:", amount, "type:", typeof amount);
    amount = 1; // Default to 1 for safety
  }
  
  // Ensure amount is a reasonable size (prevent extreme values)
  amount = Math.min(Math.max(amount, 0), 1e12);
  
  // Create floating number element
  const floatingNumber = document.createElement('div');
  
  // Determine value class based on amount
  let valueClass = 'small';
  if (amount >= 1000) {
    valueClass = 'huge';
  } else if (amount >= 100) {
    valueClass = 'large';
  } else if (amount >= 10) {
    valueClass = 'medium';
  }
  
  // Add appropriate classes
  floatingNumber.className = `floating-number ${isBonus ? 'bonus' : valueClass}`;
  
  // Format the text based on the amount
  floatingNumber.textContent = formatFloatingNumber(amount);
  
  // Position the number randomly around where the click happened
  // This helps prevent stacking when clicking rapidly
  const rect = sourceElement.getBoundingClientRect();
  
  // Calculate a "spread factor" based on cookie size
  const spreadFactor = Math.min(rect.width, rect.height) * 0.3;
  
  // Calculate position with randomized offsets
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const randomOffsetX = (Math.random() - 0.5) * spreadFactor;
  const randomOffsetY = (Math.random() - 0.5) * spreadFactor * 0.5; // Less vertical spread
  
  // Set position
  floatingNumber.style.left = `${centerX + randomOffsetX}px`;
  floatingNumber.style.top = `${centerY + randomOffsetY}px`;
  
  // Set a custom X offset for the animation path
  // This will create varied floating paths
  const xOffset = (Math.random() - 0.5) * 60;
  floatingNumber.style.setProperty('--x-offset', `${xOffset}px`);
  
  // Add to body
  document.body.appendChild(floatingNumber);
  
  // Remove after animation completes
  setTimeout(() => {
    if (floatingNumber.parentNode) {
      floatingNumber.parentNode.removeChild(floatingNumber);
    }
  }, 2000); // Match the animation duration
}

/**
 * Format number for display in floating text
 */
function formatFloatingNumber(num) {
  // Perform complete validation
  if (typeof num !== 'number' || !isFinite(num) || isNaN(num)) {
    console.error("formatFloatingNumber received invalid input:", num);
    return '+1'; // Safe default
  }
  
  // Make sure it's a proper number by forcing conversion
  num = Number(num);
  
  try {
    if (num >= 1000000) {
      return '+' + (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (num >= 1000) {
      return '+' + (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    } else {
      // Use Math.floor for consistent integer results
      return '+' + Math.floor(num);
    }
  } catch (e) {
    console.error("Error in formatFloatingNumber:", e);
    return '+1'; // Ultimate fallback
  }
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
    } else {
      cpsDisplay.style.color = "";
      cpsDisplay.style.fontWeight = "";
    }
  }
}
