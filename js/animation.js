// Contains animation and visual effects

const PARTICLE_SIZE = 20;
const PARTICLE_LIFETIME = 2000;

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
  const numParticles = Math.max(1, Math.round(baseParticles * intensity));
  const particles = [];

  // Create particle objects with more dramatic size variance based on intensity
  for (let i = 0; i < numParticles; i++) {
    // Make particles bigger when intensity is higher
    const sizeMultiplier = 0.6 + intensity * 0.8;
    const baseSize = PARTICLE_SIZE * sizeMultiplier;

    // More pronounced speed difference based on intensity
    const speedMultiplier = Math.min(2.5, intensity * 1.5);

    particles.push({
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
      confettiCtx.fillRect(
        -particle.size / 2,
        -particle.size / 2,
        particle.size,
        particle.size
      );
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

// image falling

export function dropCookieImage() {
  let cookie = document.getElementById("cookie");
  let images = document.querySelectorAll(".set img");

  if (images.length === 0) return;
  let newImg = document.createElement("img");

  let randomIndex = Math.floor(Math.random() * images.length);
  let selectedImage = images[randomIndex];
  newImg.src = selectedImage.src;
  newImg.classList.add("falling");

  let screenWidth = window.innerWidth;
  let centerStart = screenWidth * 0.3; 
  let centerWidth = screenWidth * 0.4; 

  let screenLength = window.innerHeight
  let topStart = screenLength * -0.6
  let topWidth = screenLength * -0.6; 
  
  newImg.style.left = centerStart + Math.random() * centerWidth + "px";
  newImg.style.top = topStart + Math.random() * topWidth + "px";
  document.body.appendChild(newImg);

  setTimeout(() => {
      newImg.remove();
  }, 5000);
}

document.addEventListener("DOMContentLoaded", function () {
  let cookie = document.getElementById("cookie");
  let images = document.querySelectorAll(".set img");

  cookie.addEventListener("click", function () {
    dropCookieImage();
  });
});
