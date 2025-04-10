// Contains animation and visual effects

const PARTICLE_SIZE = 20;
const PARTICLE_LIFETIME = 2000;
// Add global particle management
const MAX_ACTIVE_PARTICLES = 100;
const MAX_FALLING_COOKIES = 30;
let activeParticles = [];
let fallingCookies = [];
let animationFrameId = null;

// Add a cookie element pool for reuse
const cookieElementPool = [];
const MAX_POOLED_COOKIES = 20;

// Add display quality tiers based on device performance
let displayQuality = 'medium'; // 'low', 'medium', 'high'

// Try to detect device performance on load
document.addEventListener('DOMContentLoaded', detectDevicePerformance);

// Improved performance detection
function detectDevicePerformance() {
  // Start with medium quality as default
  displayQuality = 'medium';
  
  // Check if device is mobile (they typically have lower performance)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    displayQuality = 'low';
    return;
  }
  
  // Try to detect performance based on hardware concurrency
  if (navigator.hardwareConcurrency) {
    if (navigator.hardwareConcurrency <= 2) {
      displayQuality = 'low';
    } else if (navigator.hardwareConcurrency >= 8) {
      displayQuality = 'high';
    }
  }
  
  // Also check memory if available (not supported in all browsers)
  if (navigator.deviceMemory) {
    if (navigator.deviceMemory <= 2) {
      displayQuality = 'low';
    } else if (navigator.deviceMemory >= 8) {
      displayQuality = 'high';
    }
  }
  
  console.log(`Display quality set to: ${displayQuality}`);
}

// Create reusable cookie element from pool
function getCookieElement() {
  if (cookieElementPool.length > 0) {
    return cookieElementPool.pop();
  }
  
  const img = document.createElement("img");
  img.classList.add("falling");
  return img;
}

// Return cookie element to pool when done
function recycleCookieElement(img) {
  // Clean up element for reuse
  img.style.animation = '';
  img.style.opacity = '';
  img.style.transform = '';
  img.className = 'falling';
  
  // Only store a reasonable number of elements in the pool
  if (cookieElementPool.length < MAX_POOLED_COOKIES) {
    img.remove(); // Remove from DOM first
    cookieElementPool.push(img);
  } else {
    img.remove();
  }
}

export function showFloatingNumber(element, amount, isBonus = false) {
  const floatingNumber = document.createElement("div");
  floatingNumber.className = isBonus ? "floating-number bonus" : "floating-number regular";

  // Format amount with fewer decimal places - limit to 1 decimal place
  const formattedAmount =
    typeof amount === "number"
      ? Number.isInteger(amount)
        ? amount
        : parseFloat(amount.toFixed(1))
      : amount;

  floatingNumber.textContent = `+${formattedAmount}`;
  
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
  let confettiCanvas = document.getElementById("confetti-canvas");
  let confettiCtx;

  if (!confettiCanvas) {
    confettiCanvas = document.createElement("canvas");
    confettiCanvas.id = "confetti-canvas";
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    confettiCanvas.style.position = "fixed";
    confettiCanvas.style.top = "0";
    confettiCanvas.style.left = "0";
    confettiCanvas.style.pointerEvents = "none";
    confettiCanvas.style.zIndex = "999999";
    document.body.appendChild(confettiCanvas);
    confettiCtx = confettiCanvas.getContext("2d");

    // Handle resize events
    window.addEventListener("resize", () => {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    });
  } else {
    confettiCtx = confettiCanvas.getContext("2d");
  }

  // Get particle intensity from CSS variable (set by personalization)
  const intensity = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--particle-intensity"
    ) || 1
  );

  // Create particles - scale count by intensity
  const baseParticles = 10;
  // Limit number of new particles based on how many are already active
  const currentParticleCount = activeParticles.length;
  const availableSlots = MAX_ACTIVE_PARTICLES - currentParticleCount;
  
  // Only create new particles if there's room for them
  if (availableSlots <= 0) {
    // Replace oldest particles instead of adding more
    activeParticles.splice(0, baseParticles);
  }
  
  const numParticles = Math.min(baseParticles, Math.max(1, Math.round(baseParticles * intensity)));
  const newParticles = [];

  // Create particle objects with more dramatic size variance based on intensity
  for (let i = 0; i < numParticles; i++) {
    // Make particles bigger when intensity is higher
    const sizeMultiplier = 0.6 + intensity * 0.8;
    const baseSize = PARTICLE_SIZE * sizeMultiplier;

    // More pronounced speed difference based on intensity
    const speedMultiplier = Math.min(2.5, intensity * 1.5);

    newParticles.push({
      x: x,
      y: y,
      size: baseSize * (0.7 + Math.random() * 0.6),
      color: ["#ff6b6b", "#48dbfb", "#feca57", "#1dd1a1", "#ff9ff3"][
        Math.floor(Math.random() * 5)
      ],
      speedX: (Math.random() * 6 - 3) * speedMultiplier,
      speedY: (Math.random() * -4 - 2) * speedMultiplier,
      rotation: 0,
      rotationSpeed: Math.random() * 0.4 - 0.2,
      opacity: 1,
      createdAt: now,
    });
  }
  
  // Add new particles to active particles
  activeParticles = [...activeParticles, ...newParticles];
  
  // Cancel existing animation frame if it exists
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  // Animation function with more efficient management of resources
  const animate = () => {
    if (!confettiCtx || !confettiCanvas) return;
    
    // Clear the entire canvas (more efficient than partial clears)
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    const currentTime = Date.now();
    // Filter out expired particles
    activeParticles = activeParticles.filter(particle => {
      const lifetime = currentTime - particle.createdAt;
      return lifetime <= PARTICLE_LIFETIME;
    });

    // Update and draw particles
    for (const particle of activeParticles) {
      // Calculate lifetime
      const lifetime = PARTICLE_LIFETIME - (currentTime - particle.createdAt);
      if (lifetime <= 0) continue;

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
      confettiCtx.fillRect(
        -particle.size / 2,
        -particle.size / 2,
        particle.size,
        particle.size
      );
      confettiCtx.restore();
    }

    // Continue animation if particles are still active
    if (activeParticles.length > 0) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      // If no particles are left, clear the canvas and free resources
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      animationFrameId = null;
    }
  };

  // Start animation
  animationFrameId = requestAnimationFrame(animate);

  return now;
}

export function applyTimeAcceleratorVisuals(cookie, cpsDisplay, active) {
  // Apply effects to cookie
  if (cookie) {
    if (active) {
      cookie.classList.add("accelerated");
    } else {
      cookie.classList.remove("accelerated");
    }
  }

  // Apply effects to CPS display
  if (cpsDisplay) {
    if (active) {
      cpsDisplay.classList.add("boosted-display");
    } else {
      cpsDisplay.classList.remove("boosted-display");
    }
  }
}

// Improved falling cookie image performance and visual appeal
export function dropCookieImage(speed = 1, size = 'normal') {
  // Check if we've reached the maximum number of falling cookies
  if (fallingCookies.length >= MAX_FALLING_COOKIES) {
    // Remove the oldest cookie to make room for a new one
    const oldestCookie = fallingCookies.shift();
    if (oldestCookie) {
      recycleCookieElement(oldestCookie);
    }
  }

  const cookie = document.getElementById("cookie");
  const images = document.querySelectorAll(".set img");

  if (images.length === 0) return;
  console.log('test2');

  // Get a cookie element (reused or new)
  const newImg = getCookieElement();

  // Select random cookie image (with preference for main cookie)
  let useMainCookie = Math.random() < 0.7; // 70% chance to use main cookie
  let selectedImage;
  
  if (useMainCookie && cookie) {
    selectedImage = cookie;
  } else {
    const randomIndex = Math.floor(Math.random() * images.length);
    selectedImage = images[randomIndex];
  }
  
  // Set the image source
  newImg.src = selectedImage.src;
  
  // Randomize cookie attributes for natural look
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  // Horizontal position - spread across more of the screen width but constrain to prevent overflow
  // Use a 10% padding on each side to keep cookies from causing scrollbars
  const horizontalPadding = screenWidth * 0.1;
  const horizontalPosition = horizontalPadding + (Math.random() * (screenWidth - (horizontalPadding * 2)));
  
  // Start above the visible screen
  const verticalPosition = -50 - (Math.random() * 100);
  
  // Set position
  newImg.style.left = `${horizontalPosition}px`;
  newImg.style.top = `${verticalPosition}px`;
  
  // Apply sizing based on parameter
  let sizeMultiplier;
  switch(size) {
    case 'tiny': sizeMultiplier = 0.3; break;
    case 'small': sizeMultiplier = 0.5; break;
    case 'large': sizeMultiplier = 1.3; break;
    case 'huge': sizeMultiplier = 1.8; break;
    case 'normal':
    default: sizeMultiplier = 0.8 + (Math.random() * 0.4); // 0.8-1.2x for variety
  }
  
  // Apply slight randomness for visual variety
  const finalSize = 40 * sizeMultiplier; // Base cookie size of 40px
  newImg.style.width = `${finalSize}px`;
  newImg.style.height = `${finalSize}px`;
  
  // Create unique animation for this cookie
  // This makes them all fall differently for a more natural effect
  const duration = (4 + Math.random() * 2) / speed; // 4-6 seconds, adjusted by speed
  const delay = Math.random() * 0.5; // Slight randomized delay
  const rotationDirection = Math.random() > 0.5 ? 1 : -1; // Clockwise or counter-clockwise
  const rotationAmount = Math.random() * 360 * rotationDirection; // Random rotation amount
  const horizontalDrift = -15 + Math.random() * 30; // Drift left or right during fall (-15px to +15px)
  
  // Apply animation that combines falling, rotation, and fading
  let animationName;
  
  // Create different quality animations based on device performance
  if (displayQuality === 'high') {
    animationName = `cookieFallHigh_${Math.floor(Math.random() * 1000)}`; // Unique animation name
    
    // Create unique keyframe animation for this cookie
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes ${animationName} {
        0% { 
          opacity: 0;
          transform: translate3d(0, 0, 0) rotate(0deg) scale(0.8);
        }
        10% { 
          opacity: 1;
          transform: translate3d(${horizontalDrift * 0.1}px, 10vh, 0) rotate(${rotationAmount * 0.1}deg) scale(0.9);
        }
        80% {
          opacity: 1;
          transform: translate3d(${horizontalDrift * 0.8}px, 80vh, 0) rotate(${rotationAmount * 0.8}deg) scale(1);
        }
        100% { 
          opacity: 0;
          transform: translate3d(${horizontalDrift}px, 110vh, 0) rotate(${rotationAmount}deg) scale(0.9);
        }
      }
    `;
    document.head.appendChild(styleSheet);
    
    // Schedule cleanup of created style after animation completes
    setTimeout(() => {
      document.head.removeChild(styleSheet);
    }, duration * 1000 + 500);
  } 
  else if (displayQuality === 'medium') {
    // Use a simpler animation for medium quality
    animationName = 'cookieFallMedium';
    
    // Apply simple random rotation and horizontal drift with inline styles
    const endRotation = Math.floor(rotationAmount);
    newImg.style.setProperty('--horizontal-drift', `${horizontalDrift}px`);
    newImg.style.setProperty('--rotation', `${endRotation}deg`);
  }
  else {
    // Use the simplest animation for low quality
    animationName = 'cookieFallLow';
  }
  
  // Apply the animation
  newImg.style.animation = `${animationName} ${duration}s ease-in forwards ${delay}s`;
  
  // Add to DOM and tracking array
  document.body.appendChild(newImg);
  fallingCookies.push(newImg);

  // Schedule removal
  setTimeout(() => {
    const index = fallingCookies.indexOf(newImg);
    if (index !== -1) {
      fallingCookies.splice(index, 1);
    }
    
    recycleCookieElement(newImg);
  }, (duration + delay) * 1000);
  
  return newImg;
}

// Add a cleanup function to ensure we don't leak memory when navigating away
export function cleanupAnimations() {
  // Cancel any active animation frame
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  // Clear all falling cookies
  fallingCookies.forEach(cookie => {
    if (cookie.parentNode) {
      cookie.parentNode.removeChild(cookie);
    }
  });
  fallingCookies = [];
  
  // Clear particles array
  activeParticles = [];
  
  // Remove canvas if it exists
  const canvas = document.getElementById("confetti-canvas");
  if (canvas && canvas.parentNode) {
    canvas.parentNode.removeChild(canvas);
  }
}

// Call cleanup when page unloads
window.addEventListener('unload', cleanupAnimations);

// Call cleanup when page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // When tab is not visible, clean up to save resources
    cleanupAnimations();
  }
});

// Function to create a cookie shower based on CPS
export function createCookieShower(cps, duration = 2000, intensity = 1) {
  // Calculate how many cookies to drop based on CPS
  // Use logarithmic scaling to prevent too many at high CPS values
  const baseCount = Math.min(20, Math.ceil(Math.log2(cps + 1) * 3) * intensity);
  
  let dropped = 0;
  
  // Create a shower of cookies
  const dropInterval = setInterval(() => {
    // Random size for variety
    const sizes = ['tiny', 'small', 'normal', 'large'];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    
    // Random speed for variety
    const speed = 0.7 + Math.random() * 0.6;
    
    dropCookieImage(speed, size);
    dropped++;
    
    if (dropped >= baseCount) {
      clearInterval(dropInterval);
    }
  }, 100);
  
  return dropInterval;
}

document.addEventListener("DOMContentLoaded", function () {
  let cookie = document.getElementById("cookie");
  let images = document.querySelectorAll(".set img");

  cookie.addEventListener("click", function () {
    dropCookieImage();
  });
});

