// Handles UI interactions and event listeners

export function setupEventListeners(game) {
  // Add event listeners to upgrade buttons
  document.querySelectorAll("button.upgrade").forEach((btn) => {
    btn.addEventListener("click", () => {
      game.log("Upgrade button clicked:", btn.id);
      game.purchaseStandardUpgrade(btn.id);
    });
  });

  // Add hover sound to upgrade buttons
  const upgradeButtons = [
    game.clickUpgradeButton,
    game.autoClickerButton,
    game.grandmaButton,
    game.farmButton,
    game.luckyClickButton,
  ];
  
  upgradeButtons.forEach((btn) =>
    btn.addEventListener("mouseover", () => game.playHoverSound())
  );

  // Shop icon click handler
  if (game.shopIcon && game.shopContainer) {
    game.shopIcon.addEventListener("click", (e) => {
      e.stopPropagation(); 
      const isVisible = game.shopContainer.style.display === "block";
      game.shopContainer.style.display = isVisible ? "none" : "block";
    });
    
    // Prevent clicks inside the shop container from closing it
    game.shopContainer.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    
    // Close shop panel when clicking elsewhere
    document.addEventListener("click", () => {
      if (game.shopContainer.style.display === "block") {
        game.shopContainer.style.display = "none";
      }
    });
  }

  // Settings Panel
  setupSettingsPanel(game);
  
  // Achievements icon handler
  setupAchievementsPanel(game);
  
  // Cookie click handler
  game.cookie.addEventListener("click", (e) => game.handleCookieClick(e));

  // Set up shop item tooltips
  setupTooltips(game);
}

function setupTooltips(game) {
  console.log("Setting up shop item click handlers - tooltips completely removed");
  
  // Get all shop items first to see if they exist
  const shopItems = document.querySelectorAll('.shop-item');
  console.log(`Found ${shopItems.length} shop items to set up`);
  
  shopItems.forEach((item, index) => {
    // Create a clean replacement without any tooltip elements
    const upgradeKey = item.getAttribute("data-upgrade");
    console.log(`Shop item ${index + 1} has data-upgrade="${upgradeKey}"`);
    
    // Create a completely new element without tooltips
    const cleanItem = document.createElement('div');
    cleanItem.className = item.className;
    cleanItem.setAttribute('data-upgrade', upgradeKey);
    
    // Only copy essential child elements, excluding tooltips
    const essentialSelectors = ['img.shop-item-image', '.item-name', '.item-cost', '.time-accelerator-timer'];
    essentialSelectors.forEach(selector => {
      const element = item.querySelector(selector);
      if (element) {
        cleanItem.appendChild(element.cloneNode(true));
      }
    });
    
    // Replace the original item with our clean version
    item.parentNode.replaceChild(cleanItem, item);
    
    // Add click handler to the entire shop item
    cleanItem.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent bubbling
      console.log(`Shop item clicked with key: ${upgradeKey}`);
      
      if (upgradeKey && game.shopUpgrades[upgradeKey]) {
        console.log(`Found matching upgrade for ${upgradeKey} attempting purchase`);
        try {
          game.purchaseShopUpgrade(upgradeKey);
        } catch (error) {
          console.error(`Error purchasing ${upgradeKey}:`, error);
        }
      } else {
        console.error(`Shop upgrade not found in game.shopUpgrades: ${upgradeKey}`);
        console.log("Available upgrades:", Object.keys(game.shopUpgrades));
      }
    });
  });
}

function setupSettingsPanel(game) {
  // Settings Panel: Toggle display on settings icon click
  game.settingsIcon.addEventListener("click", (e) => {
    e.stopPropagation(); 
    game.settingsMenu.style.display = 
      game.settingsMenu.style.display === "block" ? "none" : "block";
  });
  
  // Prevent clicks inside the settings menu from closing it
  game.settingsMenu.addEventListener("click", (e) => {
    e.stopPropagation();
  });
  
  // Close settings menu when clicking elsewhere
  document.addEventListener("click", () => {
    if (game.settingsMenu.style.display === "block") {
      game.settingsMenu.style.display = "none";
    }
  });

  // Settings control buttons
  const settingsButtons = [
    game.saveGameButton,
    game.loadGameButton,
    game.resetGameButton,
    game.toggleSoundButton,
  ];
  
  settingsButtons.forEach((btn) =>
    btn.addEventListener("mouseover", () => game.playHoverSound())
  );
  
  game.saveGameButton.addEventListener("click", () => game.saveGame());
  game.loadGameButton.addEventListener("click", () => game.loadGame());
  game.resetGameButton.addEventListener("click", () => game.resetGame());
  game.toggleSoundButton.addEventListener("click", () => {
    game.soundOn = !game.soundOn;
    alert(`Sound is now ${game.soundOn ? "ON" : "OFF"}.`);
    game.log("Sound toggled:", game.soundOn);
  });
  
  // Remove the temporary golden cookie spawn button listener
}

function setupAchievementsPanel(game) {
  const achievementsIcon = document.getElementById("achievementsIcon");
  const achievementsContainer = document.getElementById("achievementsContainer");
  
  if (achievementsIcon && achievementsContainer) {
    // Toggle visibility
    achievementsIcon.addEventListener("click", (e) => {
      e.stopPropagation(); 
      const isVisible = achievementsContainer.style.display === "block";
      achievementsContainer.style.display = isVisible ? "none" : "block";
    });
    
    // Prevent clicks inside the achievements container from closing it
    achievementsContainer.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    
    // Close achievements panel when clicking elsewhere
    document.addEventListener("click", () => {
      if (achievementsContainer.style.display === "block") {
        achievementsContainer.style.display = "none";
      }
    });
  }
}

export function updateGameDisplay(game) {
  try {
    // Protect against NaN in cookie count
    if (isNaN(game.state.cookies)) {
      console.error("Cookie count is NaN, fixing...");
      game.state.cookies = 0;
    }
    
    const cookies = Math.floor(game.state.cookies);
    
    // Update text displays using formatted numbers for better readability
    if (game.cookieCount) game.cookieCount.textContent = formatNumber(cookies);
    
    // Limit click power display to 1 decimal place with fallback
    if (game.clickPowerDisplay) {
      try {
        game.clickPowerDisplay.textContent = formatNumberWithDecimals(game.state.clickPower);
      } catch (e) {
        console.error("Error formatting click power:", e);
        // Fallback to simple display
        game.clickPowerDisplay.textContent = game.state.clickPower;
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
  if (num === undefined || num === null) return "0";
  if (isNaN(num)) return "0";
  if (num < 1000) return Math.floor(num);
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  return (num / 1000000000).toFixed(1) + 'B';
}

// New helper function to format numbers with limited decimal places
function formatNumberWithDecimals(num) {
  // Safety checks
  if (num === undefined || num === null) return "0";
  if (isNaN(num)) return "0";
  
  // First check if it's an integer
  if (Number.isInteger(num)) {
    return num;
  }
  
  // If it's less than 1000, format with 1 decimal place
  if (num < 1000) {
    return parseFloat(num.toFixed(1));
  }
  
  // For larger numbers, use the regular formatter
  return formatNumber(num);
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
    // Update cookies per second display
    const autoClickers = game.upgrades?.autoClicker?.count || 0;
    const grandmas = game.upgrades?.grandma?.count || 0;
    const farms = game.upgrades?.farm?.count || 0;
    let cps = autoClickers * 1 + grandmas * 5 + farms * 10;
    
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
