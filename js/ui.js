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
  console.log("Setting up shop item tooltips and click handlers");
  
  // Get all shop items first to see if they exist
  const shopItems = document.querySelectorAll('.shop-item');
  console.log(`Found ${shopItems.length} shop items to set up`);
  
  shopItems.forEach((item, index) => {
    // Log the original data-upgrade attribute to verify it exists
    const upgradeKey = item.getAttribute("data-upgrade");
    console.log(`Shop item ${index + 1} has data-upgrade="${upgradeKey}"`);
    
    // First, clone the item to remove existing event handlers
    const clone = item.cloneNode(true);
    item.parentNode.replaceChild(clone, item);
    
    // Add click handler to the ENTIRE shop item (not just the image)
    clone.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent bubbling
      const upgradeKey = clone.getAttribute("data-upgrade");
      console.log(`Shop item clicked with key: ${upgradeKey}`);
      
      if (upgradeKey && game.shopUpgrades[upgradeKey]) {
        console.log(`Found matching upgrade for ${upgradeKey}, attempting purchase`);
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
    
    // Also keep the image click handler as a backup
    const itemImage = clone.querySelector('img.shop-item-image');
    if (itemImage) {
      itemImage.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent bubbling
        const upgradeKey = clone.getAttribute("data-upgrade");
        console.log(`Shop item IMAGE clicked with key: ${upgradeKey}`);
        
        if (upgradeKey && game.shopUpgrades[upgradeKey]) {
          console.log(`Found matching upgrade for ${upgradeKey}, attempting purchase`);
          game.purchaseShopUpgrade(upgradeKey);
        } else {
          console.error(`Shop upgrade not found in game.shopUpgrades: ${upgradeKey}`);
          console.log("Available upgrades:", Object.keys(game.shopUpgrades));
        }
      });
    } else {
      console.warn(`No image found for shop item with upgrade ${upgradeKey}`);
    }
    
    // Single tooltip implementation with better cleanup
    const tooltip = clone.querySelector('.item-desc');
    if (tooltip) {
      // Store tooltip content
      const originalContent = tooltip.innerHTML;
      
      // Add mouse events
      clone.addEventListener('mouseenter', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        
        // Remove ANY tooltip elements from anywhere in the DOM
        document.querySelectorAll('.item-desc-tooltip').forEach(t => t.remove());
        
        // Create fresh tooltip element with special class for identification
        const newTooltip = document.createElement('div');
        newTooltip.className = 'item-desc item-desc-tooltip'; // Add specific class
        newTooltip.innerHTML = `<div class="text-container">${originalContent}</div>`;
        document.body.appendChild(newTooltip);
        
        // Get positioning information
        const rect = clone.getBoundingClientRect();
        const tooltipHeight = newTooltip.offsetHeight || 120;
        const tooltipWidth = newTooltip.offsetWidth || 220;
        const minPadding = 10;
        
        // Check if tooltip would be cut off at top
        const positionAbove = rect.top - tooltipHeight - 15;
        if (positionAbove < minPadding) {
          // Position below instead
          newTooltip.style.top = (rect.bottom + 15) + 'px';
          newTooltip.classList.add('position-below');
        } else {
          // Position above (standard)
          newTooltip.style.top = positionAbove + 'px';
        }
        
        // Handle horizontal positioning
        let leftPos = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        if (leftPos < minPadding) {
          leftPos = minPadding;
        } else if (leftPos + tooltipWidth > window.innerWidth - minPadding) {
          leftPos = window.innerWidth - tooltipWidth - minPadding;
        }
        newTooltip.style.left = leftPos + 'px';
        
        // Ensure visibility
        newTooltip.style.zIndex = '100000000';
      });
      
      clone.addEventListener('mouseleave', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        document.querySelectorAll('.item-desc-tooltip').forEach(t => t.remove());
      });
    }
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
  // Protect against NaN in cookie count
  if (isNaN(game.state.cookies)) {
    console.error("Cookie count is NaN, fixing...");
    game.state.cookies = 0;
  }
  
  const cookies = Math.floor(game.state.cookies);
  
  // Update text displays
  game.cookieCount.textContent = cookies;
  game.clickPowerDisplay.textContent = game.state.clickPower;
  game.count.textContent = cookies + " cookies";

  // Update button states
  updateButtonStates(game, cookies);
  
  // Update time accelerator display
  updateTimeAccelerator(game);
  
  // Update progression visuals
  updateProgressionVisuals(game);
  
  // Show multiplier in stats if above 1
  if (game.state.cookieMultiplier > 1) {
    if (!document.getElementById('multiplierDisplay')) {
      const multiplierEl = document.createElement('p');
      multiplierEl.id = 'multiplierDisplay';
      game.cpsDisplay.parentNode.insertBefore(multiplierEl, game.cpsDisplay.nextSibling);
    }
    const multiplierDisplay = document.getElementById('multiplierDisplay');
    multiplierDisplay.textContent = `Multiplier: ${Number(game.state.cookieMultiplier).toFixed(1)}x`;
    multiplierDisplay.style.color = game.state.cookieMultiplier >= 2 ? '#ffbb00' : '';
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
  // Update cookies per second display
  const autoClickers = game.upgrades.autoClicker.count || 0;
  const grandmas = game.upgrades.grandma.count || 0;
  const farms = game.upgrades.farm.count || 0;
  let cps = autoClickers * 1 + grandmas * 5 + farms * 10;
  
  // Apply cookie multiplier (protect against NaN)
  if (typeof game.state.cookieMultiplier === 'number' && !isNaN(game.state.cookieMultiplier)) {
    cps *= game.state.cookieMultiplier;
  } else {
    console.error("Cookie multiplier is not a valid number:", game.state.cookieMultiplier);
    game.state.cookieMultiplier = 1; // Reset to default if invalid
  }
  
  game.cpsDisplay.textContent = Math.floor(cps);
  
  // Update visual indicators for game resources
  updateResourceBar(game.autoClickersProgressBar, game.autoClickersCountVisual, autoClickers, 100);
  updateResourceBar(game.farmsProgressBar, game.farmsCountVisual, farms, 100);
  updateResourceBar(game.grandmaProgressBar, game.grandmaCountDisplay, grandmas, 100);
}

function updateResourceBar(progressBar, countDisplay, count, max) {
  if (progressBar && countDisplay) {
    const progressWidth = (count / max) * 100;
    progressBar.style.width = `${Math.min(progressWidth, 100)}%`;
    countDisplay.textContent = count;
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
