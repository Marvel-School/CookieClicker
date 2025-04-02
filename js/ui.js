// Handles UI interactions and event listeners

export function setupEventListeners(game) {
  // Add event listeners to upgrade buttons
  document.querySelectorAll("button.upgrade").forEach((btn) => {
    const upgradeKey = btn.id;
    btn.addEventListener("click", () => {
      game.purchaseStandardUpgrade(upgradeKey);
    });

    // Add hover sound
    btn.addEventListener("mouseover", () => {
      game.playHoverSound();
    });
  });

  // Shop Items: Purchase functionality only
  document.querySelectorAll(".shop-item").forEach((item) => {
    const upgradeKey = item.dataset.upgrade;
    if (!upgradeKey) return;

    // Make the whole item clickable
    item.style.cursor = 'pointer';

    item.addEventListener("click", () => {
      game.purchaseShopUpgrade(upgradeKey);
    });

    // Add hover sound
    item.addEventListener("mouseover", () => {
      game.playHoverSound();
    });
  });

  // Cookie click handler - keep this
  if (game.cookie) {
    console.log("Setting up cookie click event listener");
    game.cookie.addEventListener("click", (e) => {
      console.log("Cookie click event triggered");
      game.handleCookieClick(e);
    });

    // Also add direct DOM event as a fallback
    document.getElementById('cookie')?.addEventListener("click", (e) => {
      console.log("Backup cookie click handler triggered");
      game.handleCookieClick(e);
    });
  } else {
    console.error("CRITICAL ERROR: game.cookie element not found when setting up event listeners");
  }

  // Set up tooltips
  setupTooltips(game);

  // Update upgrade descriptions on load
  game.uiManager.updateUpgradeDescriptions();
}

// Unified tooltip system
function setupTooltips(game) {
  // Clean up any existing tooltips
  document.querySelectorAll('body > .item-desc').forEach(t => t.remove());
  
  // Set up tooltips for shop items
  document.querySelectorAll('.shop-item').forEach(item => {
    const tooltip = item.querySelector('.item-desc');
    if (!tooltip) return;
    
    // Store original content
    const originalContent = tooltip.innerHTML;
    tooltip.style.display = 'none'; // Hide original
    
    // Add mouse events
    item.addEventListener('mouseenter', (e) => {
      // Remove any existing tooltips
      document.querySelectorAll('body > .item-desc').forEach(t => t.remove());
      
      // Create fresh tooltip element
      const newTooltip = document.createElement('div');
      newTooltip.className = 'item-desc';
      newTooltip.innerHTML = `<div class="text-container">${originalContent}</div>`;
      document.body.appendChild(newTooltip);
      
      // Position tooltip
      positionTooltip(newTooltip, item);
    });
    
    item.addEventListener('mouseleave', (e) => {
      // Clean up tooltips when mouse leaves
      document.querySelectorAll('body > .item-desc').forEach(t => t.remove());
    });
  });
  
  // Set up tooltips for upgrade buttons
  document.querySelectorAll('button.upgrade').forEach(button => {
    // Get the upgrade key from the button id
    const upgradeKey = button.id;
    if (!upgradeKey || !game.upgrades[upgradeKey]) return;
    
    const upgrade = game.upgrades[upgradeKey];
    if (!upgrade.description) return;
    
    button.addEventListener('mouseenter', (e) => {
      // Remove any existing tooltips
      document.querySelectorAll('body > .item-desc').forEach(t => t.remove());
      
      // Create tooltip with the upgrade description
      const newTooltip = document.createElement('div');
      newTooltip.className = 'item-desc';
      newTooltip.innerHTML = `<div class="text-container">${upgrade.description}</div>`;
      document.body.appendChild(newTooltip);
      
      // Position tooltip
      positionTooltip(newTooltip, button);
    });
    
    button.addEventListener('mouseleave', (e) => {
      // Clean up tooltips when mouse leaves
      document.querySelectorAll('body > .item-desc').forEach(t => t.remove());
    });
  });
}

// Helper function to position tooltips with boundary checking
function positionTooltip(tooltip, target) {
  // Get positioning information
  const rect = target.getBoundingClientRect();
  
  // Wait for the tooltip to be rendered to get its dimensions
  setTimeout(() => {
    const tooltipHeight = tooltip.offsetHeight || 100;
    const tooltipWidth = tooltip.offsetWidth || 200;
    const minPadding = 10;
    
    // Check if tooltip would be cut off at top
    const positionAbove = rect.top - tooltipHeight - 15;
    if (positionAbove < minPadding) {
      // Position below instead
      tooltip.style.top = (rect.bottom + 15) + 'px';
      tooltip.classList.add('position-below');
    } else {
      // Position above (standard)
      tooltip.style.top = positionAbove + 'px';
    }
    
    // Handle horizontal positioning
    let leftPos = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    if (leftPos < minPadding) {
      leftPos = minPadding;
    } else if (leftPos + tooltipWidth > window.innerWidth - minPadding) {
      leftPos = window.innerWidth - tooltipWidth - minPadding;
    }
    tooltip.style.left = leftPos + 'px';
    
    // Ensure visibility
    tooltip.style.zIndex = '100000';
  }, 0);
}

export function updateGameDisplay(game) {
  try {
    // Sanitize game state before updating display
    game.sanitizeGameState();
    
    // Protect against NaN in cookie count with thorough validation
    if (typeof game.state.cookies !== 'number' || isNaN(game.state.cookies)) {
      console.error("Cookie count is invalid, fixing...", game.state.cookies);
      game.state.cookies = 0;
    }
    
    const cookies = Math.floor(game.state.cookies);
    
    // Update text displays using formatted numbers for better readability
    if (game.cookieCount) game.cookieCount.textContent = formatNumber(cookies);
    
    // Limit click power display to 1 decimal place with improved fallback
    if (game.clickPowerDisplay) {
      try {
        const clickPower = game.state.clickPower;
        if (typeof clickPower !== 'number' || isNaN(clickPower)) {
          console.error("Click power is invalid:", clickPower);
          game.state.clickPower = 1; // Reset
          game.clickPowerDisplay.textContent = "1";
        } else {
          game.clickPowerDisplay.textContent = formatNumberWithDecimals(clickPower);
        }
      } catch (e) {
        console.error("Error formatting click power:", e);
        // Safe fallback display
        game.clickPowerDisplay.textContent = "1";
      }
    }
    
    if (game.count) game.count.textContent = formatNumber(cookies) + " cookies";

    // Update button states
    updateButtonStates(game, cookies);
    
    // Update time accelerator display
    updateTimeAccelerator(game);
    
    // Update progression visuals
    updateProgressionVisuals(game);
    
    // Show multiplier in stats if above 1
    if (game.state.cookieMultiplier > 1) {
      if (!document.getElementById('multiplierDisplay')) {
        const multiplierEl = document.createElement('div');
        multiplierEl.id = 'multiplierDisplay';
        const statsDiv = document.querySelector('.stats');
        if (statsDiv) statsDiv.appendChild(multiplierEl);
      }
      const multiplierDisplay = document.getElementById('multiplierDisplay');
      if (multiplierDisplay) {
        multiplierDisplay.textContent = `Multiplier: ${Number(game.state.cookieMultiplier).toFixed(1)}x`;
        multiplierDisplay.style.color = game.state.cookieMultiplier >= 2 ? '#ffbb00' : '';
      }
    }
  } catch (e) {
    console.error("ERROR in updateGameDisplay:", e);
  }
}

// Helper function to format large numbers
function formatNumber(num) {
  // Complete validation
  if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
    console.error("Invalid number in formatNumber:", num);
    return "0";
  }
  
  // Ensure it's a number type and not a string
  num = Number(num);
  
  try {
    if (num < 1000) return Math.floor(num).toString();
    if (num < 1000000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  } catch (e) {
    console.error("Error in formatNumber:", e);
    return "0"; // Safe fallback
  }
}

// New helper function to format numbers with limited decimal places
function formatNumberWithDecimals(num) {
  // Complete validation
  if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
    console.error("Invalid number in formatNumberWithDecimals:", num);
    return "0";
  }
  
  // Ensure it's a number type
  num = Number(num);
  
  try {
    // First check if it's an integer
    if (Number.isInteger(num)) {
      return num.toString();
    }
    
    // If it's less than 1000, format with 1 decimal place
    if (num < 1000) {
      return num.toFixed(1).replace(/\.0$/, '');
    }
    
    // For larger numbers, use the regular formatter
    return formatNumber(num);
  } catch (e) {
    console.error("Error in formatNumberWithDecimals:", e);
    return "0"; // Safe fallback
  }
}

function updateButtonStates(game, cookies) {
  // Cache & update button states in batch
  const hasCookies = {};
  Object.keys(game.upgrades).forEach(key => {
    hasCookies[key] = cookies >= game.upgrades[key].cost;
  });
  
  // Update button texts
  Object.keys(game.upgrades).forEach((key) => {
    const buttons = document.querySelectorAll(`button#${key}`);
    
    if (!buttons.length) return;
    
    const text = game.upgrades[key].getDisplayText();
    const disabled = !hasCookies[key];
    
    buttons.forEach((btn) => {
      if (btn.dataset.content !== text) {
        btn.dataset.content = text;
        const btnTop = btn.querySelector(".button_top");
        if (btnTop) btnTop.textContent = text;
      }
      
      if (btn.disabled !== disabled) {
        btn.disabled = disabled;
      }
    });
  });
  
  // Update all shop item costs
  Object.keys(game.shopUpgrades).forEach((key) => {
    const costElement = document.querySelector(`[data-upgrade="${key}"] .item-cost span`);
    if (costElement && game.shopUpgrades[key]) {
      costElement.textContent = game.shopUpgrades[key].cost;
    }
  });
  
  // Update individual button states
  game.clickUpgradeButton.disabled = cookies < game.upgrades.clickUpgrade.cost;
  game.autoClickerButton.disabled = cookies < game.upgrades.autoClicker.cost;
  game.grandmaButton.disabled = cookies < game.upgrades.grandma.cost;
  game.farmButton.disabled = cookies < game.upgrades.farm.cost;
  game.luckyClickButton.disabled = cookies < game.upgrades.luckyClick.cost;
}

function updateTimeAccelerator(game) {
  const itemEl = document.querySelector(`[data-upgrade="timeAccelerator"]`);
  const timerSpan = itemEl ? itemEl.querySelector(".time-accelerator-timer") : null;
  
  if (game.state.timeAcceleratorActive && game.state.timeAcceleratorEndTime) {
    if (itemEl) itemEl.classList.add("active");
    const secondsLeft = Math.floor((game.state.timeAcceleratorEndTime - Date.now()) / 1000);
    
    if (secondsLeft > 0 && timerSpan) {
      timerSpan.textContent = `⚡ 4x ACTIVE: ${secondsLeft}s ⚡`;
    } else if (timerSpan) {
      timerSpan.textContent = "";
    }
  } else {
    if (itemEl) itemEl.classList.remove("active");
    if (timerSpan) timerSpan.textContent = "";
  }
}

function updateProgressionVisuals(game) {
  try {
    // Update cookies per second display - REBALANCED PRODUCTION VALUES
    const autoClickers = game.upgrades?.autoClicker?.count || 0;
    const grandmas = game.upgrades?.grandma?.count || 0;
    const farms = game.upgrades?.farm?.count || 0;
    let cps = autoClickers * 1 + grandmas * 3 + farms * 8; // Updated production values
    
    // Apply cookie multiplier (protect against NaN)
    if (typeof game.state.cookieMultiplier === 'number' && !isNaN(game.state.cookieMultiplier)) {
      cps *= game.state.cookieMultiplier;
    } else {
      console.error("Cookie multiplier is not a valid number:", game.state.cookieMultiplier);
      game.state.cookieMultiplier = 1; // Reset to default if invalid
    }
    
    if (game.cpsDisplay) game.cpsDisplay.textContent = Math.floor(cps);
    
    // Check if elements exist before trying to update them
    if (game.autoClickersProgressBar && game.autoClickersCountVisual) {
      updateResourceBar(game.autoClickersProgressBar, game.autoClickersCountVisual, autoClickers, 100);
    }
    
    if (game.farmsProgressBar && game.farmsCountVisual) {
      updateResourceBar(game.farmsProgressBar, game.farmsCountVisual, farms, 100);
    }
    
    if (game.grandmaProgressBar && game.grandmaCountDisplay) {
      updateResourceBar(game.grandmaProgressBar, game.grandmaCountDisplay, grandmas, 100);
    } else {
      console.warn("Grandma visual elements not found, will try again later");
    }
  } catch (e) {
    console.error("ERROR in updateProgressionVisuals:", e);
  }
}

function updateResourceBar(progressBar, countDisplay, count, max) {
  if (!progressBar || !countDisplay) return;
  
  try {
    const progressWidth = (count / max) * 100;
    progressBar.style.width = `${Math.min(progressWidth, 100)}%`;
    countDisplay.textContent = count;
  } catch (e) {
    console.error("ERROR updating resource bar:", e);
  }
}

export function updateAchievementsList(game, earnedAchievements) {
  if (!game.achievementsList) {
    game.log("ERROR: achievementsList element is not cached!");
    return;
  }
  
  if (earnedAchievements.length === 0) {
    game.achievementsList.innerHTML = `
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
  
  game.achievementsList.innerHTML = achievementItems;
}
