/**
 * Utility functions for Cookie Clicker
 */

// Constants
export const AUTO_SAVE_INTERVAL = 60000; // 1 minute

// Debug logging function
export function log(debug, message, ...data) {
  if (debug) {
    console.log(message, ...data);
  }
}

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

// Show toast notifications
export function showToast(message) {
  // First look for an existing toast container
  let toastContainer = document.querySelector('.toast-container');
  
  // Create one if it doesn't exist
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  const notification = document.createElement("div");
  notification.className = "toast-notification";
  notification.textContent = message;
  
  toastContainer.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Remove after animation
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Create confetti effect
export function createConfetti(x, y, lastTime) {
  // Skip if called too frequently
  const now = Date.now();
  if (lastTime && now - lastTime < 100) {
    return lastTime;
  }
  
  const numParticles = 15;
  const colors = ['#ff6b6b', '#48dbfb', '#feca57', '#1dd1a1', '#ff9ff3'];
  
  for (let i = 0; i < numParticles; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';
    
    // Randomize appearance and movement
    const size = Math.random() * 8 + 6;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const angle = Math.random() * 360;
    const spread = 30;
    const distance = Math.random() * 80 + 50;
    
    particle.style.backgroundColor = color;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.borderRadius = Math.random() > 0.3 ? '50%' : '0';
    particle.style.position = 'fixed';
    particle.style.zIndex = '9998';
    particle.style.pointerEvents = 'none';
    particle.style.left = `${x - size/2}px`;
    particle.style.top = `${y - size/2}px`;
    
    document.body.appendChild(particle);
    
    // Animate using JS for more control
    const startTime = Date.now();
    const duration = 700 + Math.random() * 600;
    const endX = x + Math.cos(angle * Math.PI / 180) * (distance + Math.random() * spread);
    const endY = y - Math.sin(angle * Math.PI / 180) * (distance + Math.random() * spread);
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for natural motion
      const easeOut = (t) => 1 - Math.pow(1 - t, 2);
      const easeProgress = easeOut(progress);
      
      // Position based on time
      const currentX = x + (endX - x) * easeProgress;
      const currentY = y + (endY - y) * easeProgress - (50 * Math.sin(Math.PI * easeProgress));
      
      // Opacity and rotation
      const opacity = 1 - easeProgress;
      const rotation = angle + easeProgress * 360 * (Math.random() > 0.5 ? 1 : -1);
      
      particle.style.transform = `translate(${currentX - x}px, ${currentY - y}px) rotate(${rotation}deg)`;
      particle.style.opacity = opacity.toString();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        particle.remove();
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  return now;
}

// Update game display
export function updateGameDisplay(game) {
  if (!game) return;
  
  try {
    // Cache values to avoid layout thrashing
    const cookies = Math.floor(game.state.cookies);
    
    // Group updates to minimize reflows
    if (game.cookieCount) {
      game.cookieCount.textContent = cookies.toLocaleString();
    }
    
    if (game.clickPowerDisplay) {
      game.clickPowerDisplay.textContent = game.state.clickPower;
    }
    
    if (game.count) {
      game.count.textContent = cookies.toLocaleString() + " cookies";
    }

    // Update CPS (cookies per second) display using upgrade methods
    if (game.cpsDisplay) {
      // Calculate CPS using each upgrade's getCPS method if available
      let cps = 0;
      
      Object.keys(game.upgrades || {}).forEach(key => {
        const upgrade = game.upgrades[key];
        if (upgrade.getCPS && typeof upgrade.getCPS === 'function') {
          cps += upgrade.getCPS(game.state.cookieMultiplier || 1);
        } else if (key === 'autoClicker' && upgrade.count) {
          cps += upgrade.count * 1;
        } else if (key === 'grandma' && upgrade.count) {
          cps += upgrade.count * 3;
        } else if (key === 'farm' && upgrade.count) {
          cps += upgrade.count * 6;
        }
      });
      
      // Apply cookie multiplier
      cps *= game.state.cookieMultiplier || 1;
      
      // Apply time accelerator if active
      if (game.state.timeAcceleratorActive && game.state.timeAcceleratorMultiplier > 1) {
        cps *= game.state.timeAcceleratorMultiplier;
      }
      
      // Apply production boost from golden cookies if active
      if (game.state.activeGoldenCookieBonuses?.production?.active) {
        cps *= game.state.activeGoldenCookieBonuses.production.bonusValue;
      }
      
      game.cpsDisplay.textContent = Math.floor(cps);
    }
    
    // Update upgrade buttons
    Object.keys(game.upgrades || {}).forEach(key => {
      const upgrade = game.upgrades[key];
      const button = document.getElementById(key);
      
      if (button && upgrade) {
        button.disabled = cookies < upgrade.cost;
        
        // Update button text to match current cost
        const buttonText = upgrade.getDisplayText ? 
          upgrade.getDisplayText() : 
          `${upgrade.displayPrefix || key} (Cost: ${upgrade.cost})`;
        
        const buttonTop = button.querySelector('.button_top');
        if (buttonTop) {
          buttonTop.textContent = buttonText;
        } else {
          button.textContent = buttonText;
        }
      }
    });
    
    // Update shop items
    Object.keys(game.shopUpgrades || {}).forEach(key => {
      const shopItem = document.querySelector(`[data-upgrade="${key}"] .item-cost span`);
      if (shopItem && game.shopUpgrades[key]) {
        shopItem.textContent = game.shopUpgrades[key].cost.toLocaleString();
      }
    });
    
    // Update active bonuses display
    updateActiveBonuses(game);
  } catch (e) {
    console.error("Error updating game display:", e);
  }
}

// New function to update active bonuses display
function updateActiveBonuses(game) {
  const activeBonusesContainer = document.getElementById('activeBonuses');
  if (!activeBonusesContainer) return;
  
  // Clear existing bonuses
  activeBonusesContainer.innerHTML = '';
  
  // Check for time accelerator bonus
  if (game.state.timeAcceleratorActive && game.state.timeAcceleratorEndTime > Date.now()) {
    const secondsLeft = Math.floor((game.state.timeAcceleratorEndTime - Date.now()) / 1000);
    const bonusEl = document.createElement("div");
    bonusEl.className = "bonus-indicator time-accelerator";
    bonusEl.innerHTML = `<span class="bonus-icon">⚡</span> 4x Production <span class="bonus-timer">${secondsLeft}s</span>`;
    activeBonusesContainer.appendChild(bonusEl);
  }
  
  // Check for cookie multiplier (permanent)
  if (game.state.cookieMultiplier > 1) {
    const bonusEl = document.createElement("div");
    bonusEl.className = "bonus-indicator cookie-multiplier";
    bonusEl.innerHTML = `<span class="bonus-icon">✨</span> ${Math.round((game.state.cookieMultiplier - 1) * 100)}% Bonus`;
    activeBonusesContainer.appendChild(bonusEl);
  }

  // Check for click power boost
  if (game.state.activeGoldenCookieBonuses?.clickPower?.active) {
    const secondsLeft = Math.floor((game.state.activeGoldenCookieBonuses.clickPower.endTime - Date.now()) / 1000);
    if (secondsLeft > 0) {
      const bonusEl = document.createElement("div");
      bonusEl.className = "bonus-indicator click-boost";
      bonusEl.innerHTML = `<span class="bonus-icon">👆</span> ${game.state.activeGoldenCookieBonuses.clickPower.bonusValue}x Click Power <span class="bonus-timer">${secondsLeft}s</span>`;
      activeBonusesContainer.appendChild(bonusEl);
    }
  }

  // Check for production boost
  if (game.state.activeGoldenCookieBonuses?.production?.active) {
    const secondsLeft = Math.floor((game.state.activeGoldenCookieBonuses.production.endTime - Date.now()) / 1000);
    if (secondsLeft > 0) {
      const bonusEl = document.createElement("div");
      bonusEl.className = "bonus-indicator production-boost";
      bonusEl.innerHTML = `<span class="bonus-icon">🚀</span> ${game.state.activeGoldenCookieBonuses.production.bonusValue}x Production <span class="bonus-timer">${secondsLeft}s</span>`;
      activeBonusesContainer.appendChild(bonusEl);
    }
  }

  // Check for clicking frenzy
  if (game.state.clickingFrenzy && game.state.clickingFrenzyEndTime > Date.now()) {
    const secondsLeft = Math.floor((game.state.clickingFrenzyEndTime - Date.now()) / 1000);
    const bonusEl = document.createElement("div");
    bonusEl.className = "bonus-indicator frenzy";
    bonusEl.innerHTML = `<span class="bonus-icon">🔥</span> CLICKING FRENZY <span class="bonus-timer">${secondsLeft}s</span>`;
    activeBonusesContainer.appendChild(bonusEl);
  }
}

// Setup achievements
export function setupAchievements(game) {
  // Example achievement registration
  // Replace with actual achievement setup logic
  console.log("Setting up achievements");
}

// Update achievements list
export function updateAchievementsList(game, earnedAchievements) {
  const achievementsList = game.achievementsList;
  if (!achievementsList) return;
  
  if (earnedAchievements.length === 0) {
    achievementsList.innerHTML = `
      <div class="no-achievements">
        <p>No achievements yet!</p>
        <p>Keep baking cookies to unlock achievements.</p>
      </div>
    `;
    return;
  }
  
  // Sort by rarity (legendary first)
  const rarityOrder = {
    'legendary': 0,
    'epic': 1,
    'rare': 2,
    'uncommon': 3,
    'common': 4
  };
  
  earnedAchievements.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
  
  const achievementItems = earnedAchievements.map((ach) => {
    return `<li class="achievement-item ${ach.rarity}" data-category="${ach.category}">
      <div class="achievement-icon">${ach.icon}</div>
      <div class="achievement-content">
        <h3>${ach.name}</h3>
        <p>${ach.description}</p>
        <span class="achievement-rarity ${ach.rarity}">${ach.rarity}</span>
      </div>
    </li>`;
  }).join("");
  
  achievementsList.innerHTML = achievementItems;
}

// Setup event listeners
export function setupEventListeners(game) {
  // Click handlers for upgrade buttons
  document.querySelectorAll("button.upgrade").forEach((btn) => {
    const upgradeKey = btn.id;
    btn.addEventListener("click", () => {
      game.purchaseStandardUpgrade(upgradeKey);
    });
  });

  // Shop Items: Purchase by clicking the item image
  document.querySelectorAll(".shop-item").forEach((item) => {
    const upgradeKey = item.dataset.upgrade;
    if (!upgradeKey) return;
    
    item.addEventListener("click", () => {
      game.purchaseShopUpgrade(upgradeKey);
    });
  });
}
