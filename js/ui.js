export function setupEventListeners(game) {
  document.querySelectorAll("button.upgrade").forEach((btn) => {
    btn.addEventListener("click", () => {
      game.log("Upgrade button clicked:", btn.id);
      game.purchaseStandardUpgrade(btn.id);
    });
  });

  const upgradeButtons = [
    game.clickUpgradeButton,
    game.autoClickerButton,
    game.grandmaButton,
    game.farmButton,
    game.mineButton,
    game.factoryButton, 
    game.bankButton,
    game.templeButton,
    game.luckyClickButton,
  ];
  
  upgradeButtons.forEach((btn) =>
    btn.addEventListener("mouseover", () => game.playHoverSound())
  );

  if (game.shopIcon && game.shopContainer) {
    game.shopIcon.addEventListener("click", (e) => {
      e.stopPropagation(); 
      const isVisible = game.shopContainer.style.display === "block";
      game.shopContainer.style.display = isVisible ? "none" : "block";
    });
    
    game.shopContainer.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    
    document.addEventListener("click", () => {
      if (game.shopContainer.style.display === "block") {
        game.shopContainer.style.display = "none";
      }
    });
  }

  setupSettingsPanel(game);
  
  setupAchievementsPanel(game);
  
  game.cookie.addEventListener("click", (e) => game.handleCookieClick(e));

  setupTooltips(game);

  setupShopItems(game);
}

function setupTooltips(game) {
  console.log("Setting up shop item click handlers");
  
  document.querySelectorAll('.shop-item').forEach(item => {
    const upgradeKey = item.getAttribute("data-upgrade");
    
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      if (upgradeKey && game.shopUpgrades[upgradeKey]) {
        game.purchaseShopUpgrade(upgradeKey);
      } else {
        console.error(`Shop upgrade not found: ${upgradeKey}`);
      }
    });
  });
}

function setupShopItems(game) {
  document.querySelectorAll('.shop-item').forEach(item => {
    const imgElement = item.querySelector('img');
    if (imgElement) {
      if (!imgElement.src.includes('image/')) {
        const imageName = imgElement.getAttribute('data-image') || 'default.png';
        imgElement.src = `image/${imageName}`;
      }
    }
  });
}

function setupSettingsPanel(game) {
  game.settingsIcon.addEventListener("click", (e) => {
    e.stopPropagation(); 
    game.settingsMenu.style.display = 
      game.settingsMenu.style.display === "block" ? "none" : "block";
  });
  
  game.settingsMenu.addEventListener("click", (e) => {
    e.stopPropagation();
  });
  
  document.addEventListener("click", () => {
    if (game.settingsMenu.style.display === "block") {
      game.settingsMenu.style.display = "none";
    }
  });

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
    achievementsIcon.addEventListener("click", (e) => {
      e.stopPropagation(); 
      const isVisible = achievementsContainer.style.display === "block";
      achievementsContainer.style.display = isVisible ? "none" : "block";
    });
    
    achievementsContainer.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    
    document.addEventListener("click", () => {
      if (achievementsContainer.style.display === "block") {
        achievementsContainer.style.display = "none";
      }
    });
  }
}

export function updateGameDisplay(game) {
  try {
    if (isNaN(game.state.cookies)) {
      console.error("Cookie count is NaN, fixing...");
      game.state.cookies = 0;
    }
    
    const cookies = Math.floor(game.state.cookies);
    
    if (game.cookieCount) game.cookieCount.textContent = formatNumber(cookies);
    
    if (game.clickPowerDisplay) {
      try {
        game.clickPowerDisplay.textContent = formatNumberWithDecimals(game.state.clickPower);
      } catch (e) {
        console.error("Error formatting click power:", e);
        game.clickPowerDisplay.textContent = game.state.clickPower;
      }
    }
    
    if (game.count) game.count.textContent = formatNumber(cookies) + " cookies";

    updateButtonStates(game, cookies);
    
    updateTimeAccelerator(game);
    
    updateProgressionVisuals(game);
    
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

function formatNumber(num) {
  if (num === undefined || num === null) return "0";
  if (isNaN(num)) return "0";
  if (num < 1000) return Math.floor(num);
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  return (num / 1000000000).toFixed(1) + 'B';
}

function formatNumberWithDecimals(num) {
  if (num === undefined || num === null) return "0";
  if (isNaN(num)) return "0";
  
  if (Number.isInteger(num)) {
    return num;
  }
  
  if (num < 1000) {
    return parseFloat(num.toFixed(1));
  }
  
  return formatNumber(num);
}

function updateButtonStates(game, cookies) {
  const hasCookies = {};
  Object.keys(game.upgrades).forEach(key => {
    hasCookies[key] = cookies >= game.upgrades[key].cost;
  });
  
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
  
  Object.keys(game.shopUpgrades).forEach((key) => {
    const costElement = document.querySelector(`[data-upgrade="${key}"] .item-cost span`);
    if (costElement && game.shopUpgrades[key]) {
      costElement.textContent = game.shopUpgrades[key].cost;
    }
  });
  
  game.clickUpgradeButton.disabled = cookies < game.upgrades.clickUpgrade.cost;
  game.autoClickerButton.disabled = cookies < game.upgrades.autoClicker.cost;
  game.grandmaButton.disabled = cookies < game.upgrades.grandma.cost;
  game.farmButton.disabled = cookies < game.upgrades.farm.cost;
  game.mineButton.disabled = cookies < game.upgrades.mine.cost;
  game.factoryButton.disabled = cookies < game.upgrades.factory.cost;
  game.bankButton.disabled = cookies < game.upgrades.bank.cost;
  game.templeButton.disabled = cookies < game.upgrades.temple.cost;
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
    const autoClickers = game.upgrades?.autoClicker?.count || 0;
    const grandmas = game.upgrades?.grandma?.count || 0;
    const farms = game.upgrades?.farm?.count || 0;
    const mines = game.upgrades?.mine?.count || 0;
    const factories = game.upgrades?.factory?.count || 0;
    const banks = game.upgrades?.bank?.count || 0;
    const temples = game.upgrades?.temple?.count || 0;
    
    let cps = autoClickers * 1 + 
              grandmas * 3 + 
              farms * 6 + 
              mines * 12 + 
              factories * 25 + 
              temples * 80;
    
    if (banks > 0) {
      cps += (game.state.cookies * 0.0005) * banks;
    }
    
    if (typeof game.state.cookieMultiplier === 'number' && !isNaN(game.state.cookieMultiplier)) {
      cps *= game.state.cookieMultiplier;
    } else {
      console.error("Cookie multiplier is not a valid number:", game.state.cookieMultiplier);
      game.state.cookieMultiplier = 1;
    }
    
    if (game.cpsDisplay) game.cpsDisplay.textContent = Math.floor(cps);
    
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
    
    if (game.mineProgressBar && game.mineCountDisplay) {
      updateResourceBar(game.mineProgressBar, game.mineCountDisplay, mines, 100);
    }
    
    if (game.factoryProgressBar && game.factoryCountDisplay) {
      updateResourceBar(game.factoryProgressBar, game.factoryCountDisplay, factories, 100);
    }
    
    if (game.bankProgressBar && game.bankCountDisplay) {
      updateResourceBar(game.bankProgressBar, game.bankCountDisplay, banks, 100);
    }
    
    if (game.templeProgressBar && game.templeCountDisplay) {
      updateResourceBar(game.templeProgressBar, game.templeCountDisplay, temples, 100);
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
