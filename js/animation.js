const PARTICLE_SIZE = 20;
const PARTICLE_LIFETIME = 2000;
const MAX_ACTIVE_PARTICLES = 100;
const MAX_FALLING_COOKIES = 30;
let activeParticles = [];
let fallingCookies = [];
let animationFrameId = null;

const cookieElementPool = [];
const MAX_POOLED_COOKIES = 20;

let displayQuality = 'medium'; 

document.addEventListener('DOMContentLoaded', detectDevicePerformance);

function detectDevicePerformance() {
  displayQuality = 'medium';
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    displayQuality = 'low';
    return;
  }
  
  if (navigator.hardwareConcurrency) {
    if (navigator.hardwareConcurrency <= 2) {
      displayQuality = 'low';
    } else if (navigator.hardwareConcurrency >= 8) {
      displayQuality = 'high';
    }
  }
  
  if (navigator.deviceMemory) {
    if (navigator.deviceMemory <= 2) {
      displayQuality = 'low';
    } else if (navigator.deviceMemory >= 8) {
      displayQuality = 'high';
    }
  }
  
  console.log(`Display quality set to: ${displayQuality}`);
}

function getCookieElement() {
  if (cookieElementPool.length > 0) {
    return cookieElementPool.pop();
  }
  
  const img = document.createElement("img");
  img.classList.add("falling");
  return img;
}

function recycleCookieElement(img) {
  img.style.animation = '';
  img.style.opacity = '';
  img.style.transform = '';
  img.className = 'falling';
  
  if (cookieElementPool.length < MAX_POOLED_COOKIES) {
    img.remove();
    cookieElementPool.push(img);
  } else {
    img.remove();
  }
}

export function showFloatingNumber(element, amount, isBonus = false) {
  const floatingNumber = document.createElement("div");
  floatingNumber.className = isBonus ? "floating-number bonus" : "floating-number regular";

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
  const now = Date.now();
  if (lastConfettiTime && now - lastConfettiTime < 200) {
    return lastConfettiTime;
  }

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

    window.addEventListener("resize", () => {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    });
  } else {
    confettiCtx = confettiCanvas.getContext("2d");
  }

  const intensity = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--particle-intensity"
    ) || 1
  );

  const baseParticles = 10;
  const currentParticleCount = activeParticles.length;
  const availableSlots = MAX_ACTIVE_PARTICLES - currentParticleCount;
  
  if (availableSlots <= 0) {
    activeParticles.splice(0, baseParticles);
  }
  
  const numParticles = Math.min(baseParticles, Math.max(1, Math.round(baseParticles * intensity)));
  const newParticles = [];

  for (let i = 0; i < numParticles; i++) {
    const sizeMultiplier = 0.6 + intensity * 0.8;
    const baseSize = PARTICLE_SIZE * sizeMultiplier;

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
  
  activeParticles = [...activeParticles, ...newParticles];
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  const animate = () => {
    if (!confettiCtx || !confettiCanvas) return;
    
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    const currentTime = Date.now();
    activeParticles = activeParticles.filter(particle => {
      const lifetime = currentTime - particle.createdAt;
      return lifetime <= PARTICLE_LIFETIME;
    });

    for (const particle of activeParticles) {
      const lifetime = PARTICLE_LIFETIME - (currentTime - particle.createdAt);
      if (lifetime <= 0) continue;

      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.speedY += 0.1;
      particle.rotation += particle.rotationSpeed;
      particle.opacity = lifetime / PARTICLE_LIFETIME;

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

    if (activeParticles.length > 0) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      animationFrameId = null;
    }
  };

  animationFrameId = requestAnimationFrame(animate);

  return now;
}

export function applyTimeAcceleratorVisuals(cookie, cpsDisplay, active) {
  if (cookie) {
    if (active) {
      cookie.classList.add("accelerated");
    } else {
      cookie.classList.remove("accelerated");
    }
  }

  if (cpsDisplay) {
    if (active) {
      cpsDisplay.classList.add("boosted-display");
    } else {
      cpsDisplay.classList.remove("boosted-display");
    }
  }
}

export function dropCookieImage(speed = 1, size = 'normal') {
  if (fallingCookies.length >= MAX_FALLING_COOKIES) {
    const oldestCookie = fallingCookies.shift();
    if (oldestCookie) {
      recycleCookieElement(oldestCookie);
    }
  }

  const cookie = document.getElementById("cookie");
  const images = document.querySelectorAll(".set img");

  if (images.length === 0) return;

  const newImg = getCookieElement();

  let useMainCookie = Math.random() < 0.7;
  let selectedImage;
  
  if (useMainCookie && cookie) {
    selectedImage = cookie;
  } else {
    const randomIndex = Math.floor(Math.random() * images.length);
    selectedImage = images[randomIndex];
  }
  
  newImg.src = selectedImage.src;
  
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  const horizontalPadding = screenWidth * 0.1;
  const horizontalPosition = horizontalPadding + (Math.random() * (screenWidth - (horizontalPadding * 2)));
  
  const verticalPosition = -50 - (Math.random() * 100);
  
  newImg.style.left = `${horizontalPosition}px`;
  newImg.style.top = `${verticalPosition}px`;
  
  let sizeMultiplier;
  switch(size) {
    case 'tiny': sizeMultiplier = 0.3; break;
    case 'small': sizeMultiplier = 0.5; break;
    case 'large': sizeMultiplier = 1.3; break;
    case 'huge': sizeMultiplier = 1.8; break;
    case 'normal':
    default: sizeMultiplier = 0.8 + (Math.random() * 0.4);
  }
  
  const finalSize = 40 * sizeMultiplier;
  newImg.style.width = `${finalSize}px`;
  newImg.style.height = `${finalSize}px`;
  
  const duration = (4 + Math.random() * 2) / speed;
  const delay = Math.random() * 0.5;
  const rotationDirection = Math.random() > 0.5 ? 1 : -1;
  const rotationAmount = Math.random() * 360 * rotationDirection;
  const horizontalDrift = -15 + Math.random() * 30;
  
  let animationName;
  
  if (displayQuality === 'high') {
    animationName = `cookieFallHigh_${Math.floor(Math.random() * 1000)}`;
    
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
    
    setTimeout(() => {
      document.head.removeChild(styleSheet);
    }, duration * 1000 + 500);
  } 
  else if (displayQuality === 'medium') {
    animationName = 'cookieFallMedium';
    
    const endRotation = Math.floor(rotationAmount);
    newImg.style.setProperty('--horizontal-drift', `${horizontalDrift}px`);
    newImg.style.setProperty('--rotation', `${endRotation}deg`);
  }
  else {
    animationName = 'cookieFallLow';
  }
  
  newImg.style.animation = `${animationName} ${duration}s ease-in forwards ${delay}s`;
  
  document.body.appendChild(newImg);
  fallingCookies.push(newImg);

  setTimeout(() => {
    const index = fallingCookies.indexOf(newImg);
    if (index !== -1) {
      fallingCookies.splice(index, 1);
    }
    
    recycleCookieElement(newImg);
  }, (duration + delay) * 1000);
  
  return newImg;
}

export function cleanupAnimations() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  fallingCookies.forEach(cookie => {
    if (cookie.parentNode) {
      cookie.parentNode.removeChild(cookie);
    }
  });
  fallingCookies = [];
  
  activeParticles = [];
  
  const canvas = document.getElementById("confetti-canvas");
  if (canvas && canvas.parentNode) {
    canvas.parentNode.removeChild(canvas);
  }
}

window.addEventListener('unload', cleanupAnimations);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cleanupAnimations();
  }
});

export function createCookieShower(cps, duration = 2000, intensity = 1) {
  const baseCount = Math.min(20, Math.ceil(Math.log2(cps + 1) * 3) * intensity);
  
  let dropped = 0;
  
  const dropInterval = setInterval(() => {
    const sizes = ['tiny', 'small', 'normal', 'large'];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    
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

