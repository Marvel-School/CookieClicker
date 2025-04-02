// Mobile navigation and interface functionality

// Initialize mobile navigation
export function initMobileNavigation(game) {
  // Get all mobile navigation buttons
  const navButtons = document.querySelectorAll('.mobile-nav-button');
  
  // Handle navigation clicks
  navButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all buttons and sections
      navButtons.forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.mobile-section').forEach(section => section.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Get the section to show
      const sectionId = button.getAttribute('data-section');
      const section = document.getElementById(sectionId);
      
      if (section) {
        // Add active class to section
        section.classList.add('active');
        
        // Add class to body to indicate we're in a section view
        document.body.classList.add('in-section');
        
        // Update the section content
        updateSectionContent(sectionId, game);
      }
    });
  });
  
  // Setup mobile cookie click handler
  const mobileCookie = document.getElementById('mobile-cookie');
  if (mobileCookie) {
    mobileCookie.addEventListener('click', (e) => {
      if (game && typeof game.handleCookieClick === 'function') {
        game.handleCookieClick(e);
      }
    });
  }
  
  // Setup mobile upgrade buttons
  setupMobileUpgradeButtons(game);
  
  // Setup mobile shop items
  setupMobileShopItems(game);
  
  // Setup achievement tabs
  setupAchievementTabs();
  
  // Initial update of all mobile sections
  updateAllMobileSections(game);
  
  console.log('Mobile navigation initialized');
}

// Setup click handlers for mobile upgrade buttons
function setupMobileUpgradeButtons(game) {
  const upgradeButtons = {
    'mobile-clickUpgrade': 'clickUpgrade',
    'mobile-autoClicker': 'autoClicker',
    'mobile-grandma': 'grandma',
    'mobile-farm': 'farm',
    'mobile-luckyClick': 'luckyClick'
  };
  
  Object.entries(upgradeButtons).forEach(([mobileId, upgradeKey]) => {
    const button = document.getElementById(mobileId);
    if (button) {
      button.addEventListener('click', () => {
        if (game && typeof game.purchaseStandardUpgrade === 'function') {
          game.purchaseStandardUpgrade(upgradeKey);
          
          // Update upgrades display after purchase
          updateUpgradesSection(game);
          
          // Update inventory after purchase
          updateInventorySection(game);
        }
      });
    }
  });
}

// Setup click handlers for mobile shop items
function setupMobileShopItems(game) {
  const shopItems = document.querySelectorAll('#mobile-shop-section .shop-item');
  shopItems.forEach(item => {
    const upgradeKey = item.getAttribute('data-upgrade');
    if (upgradeKey) {
      item.addEventListener('click', () => {
        if (game && typeof game.purchaseShopUpgrade === 'function') {
          game.purchaseShopUpgrade(upgradeKey);
          
          // Update shop display after purchase
          updateShopSection(game);
          
          // Update inventory after purchase
          updateInventorySection(game);
        }
      });
    }
  });
}

// Setup achievement tabs
function setupAchievementTabs() {
  const tabs = document.querySelectorAll('.achievement-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Hide all achievement containers
      document.getElementById('unlocked-achievements').style.display = 'none';
      document.getElementById('locked-achievements').style.display = 'none';
      
      // Show the selected container
      const tabId = tab.getAttribute('data-tab');
      document.getElementById(tabId + '-achievements').style.display = 'block';
    });
  });
}

// Update all mobile section content
function updateAllMobileSections(game) {
  updateCookieSection(game);
  updateUpgradesSection(game);
  updateShopSection(game);
  updateAchievementsSection(game);
  updateInventorySection(game);
}

// Update specific section content
function updateSectionContent(sectionId, game) {
  switch (sectionId) {
    case 'mobile-cookie-section':
      updateCookieSection(game);
      break;
    case 'mobile-upgrades-section':
      updateUpgradesSection(game);
      break;
    case 'mobile-shop-section':
      updateShopSection(game);
      break;
    case 'mobile-achievements-section':
      updateAchievementsSection(game);
      break;
    case 'mobile-inventory-section':
      updateInventorySection(game);
      break;
  }
}

// Update cookie section display
function updateCookieSection(game) {
  if (!game) return;
  
  // Update cookie count and stats
  const cookieCount = document.getElementById('mobile-cookie-count');
  const clickPower = document.getElementById('mobile-click-power');
  const cps = document.getElementById('mobile-cps');
  
  if (cookieCount) cookieCount.textContent = Math.floor(game.state.cookies);
  if (clickPower) clickPower.textContent = game.state.clickPower.toFixed(1);
  
  // Calculate CPS
  if (cps) {
    const autoClickers = game.upgrades.autoClicker.count || 0;
    const grandmas = game.upgrades.grandma.count || 0;
    const farms = game.upgrades.farm.count || 0;
    let cpsValue = autoClickers * 1 + grandmas * 3 + farms * 8;
    
    // Apply cookie multiplier
    cpsValue *= game.state.cookieMultiplier;
    
    cps.textContent = Math.floor(cpsValue);
  }
}

// Update upgrades section display
function updateUpgradesSection(game) {
  if (!game) return;
  
  // Update upgrade button states and costs
  const upgradeButtons = {
    'mobile-clickUpgrade': 'clickUpgrade',
    'mobile-autoClicker': 'autoClicker',
    'mobile-grandma': 'grandma',
    'mobile-farm': 'farm',
    'mobile-luckyClick': 'luckyClick'
  };
  
  Object.entries(upgradeButtons).forEach(([mobileId, upgradeKey]) => {
    const button = document.getElementById(mobileId);
    const upgrade = game.upgrades[upgradeKey];
    
    if (button && upgrade) {
      // Update button text
      const buttonTop = button.querySelector('.button_top');
      if (buttonTop) {
        buttonTop.textContent = `${upgrade.displayPrefix} (Cost: ${upgrade.cost})`;
      }
      
      // Update button state
      button.disabled = game.state.cookies < upgrade.cost;
    }
  });
}

// Update shop section display
function updateShopSection(game) {
  if (!game) return;
  
  // Update shop item costs
  const shopItems = document.querySelectorAll('#mobile-shop-section .shop-item');
  shopItems.forEach(item => {
    const upgradeKey = item.getAttribute('data-upgrade');
    if (upgradeKey && game.shopUpgrades[upgradeKey]) {
      const costElement = item.querySelector('.item-cost span');
      if (costElement) {
        costElement.textContent = game.shopUpgrades[upgradeKey].cost;
      }
      
      // Check if item is affordable
      if (game.state.cookies < game.shopUpgrades[upgradeKey].cost) {
        item.classList.add('disabled');
      } else {
        item.classList.remove('disabled');
      }
      
      // Update time accelerator timer if active
      if (upgradeKey === 'timeAccelerator') {
        const timerSpan = item.querySelector('.time-accelerator-timer');
        if (timerSpan) {
          if (game.state.timeAcceleratorActive && game.state.timeAcceleratorEndTime) {
            const secondsLeft = Math.floor((game.state.timeAcceleratorEndTime - Date.now()) / 1000);
            if (secondsLeft > 0) {
              timerSpan.textContent = `⚡ 4x ACTIVE: ${secondsLeft}s ⚡`;
              item.classList.add('active');
            } else {
              timerSpan.textContent = '';
              item.classList.remove('active');
            }
          } else {
            timerSpan.textContent = '';
            item.classList.remove('active');
          }
        }
      }
    }
  });
}

// Update achievements section display
function updateAchievementsSection(game) {
  if (!game || !game.achievements) return;
  
  // Separate achievements into unlocked and locked
  const unlockedAchievements = game.achievements.filter(a => a.earned);
  const lockedAchievements = game.achievements.filter(a => !a.earned);
  
  // Update unlocked achievements
  const unlockedList = document.getElementById('mobile-achievement-list');
  if (unlockedList) {
    if (unlockedAchievements.length === 0) {
      unlockedList.innerHTML = `<li class="no-achievements">No achievements unlocked yet!</li>`;
    } else {
      unlockedList.innerHTML = unlockedAchievements.map(achievement => `
        <li class="achievement-item ${achievement.rarity || 'common'}">
          <div class="achievement-icon">${achievement.icon || '🏆'}</div>
          <div class="achievement-content">
            <h3>${achievement.name}</h3>
            <p>${achievement.description}</p>
            <span class="achievement-rarity ${achievement.rarity || 'common'}">${achievement.rarity || 'common'}</span>
          </div>
        </li>
      `).join('');
    }
  }
  
  // Update locked achievements
  const lockedList = document.getElementById('mobile-locked-achievement-list');
  if (lockedList) {
    if (lockedAchievements.length === 0) {
      lockedList.innerHTML = `<li class="no-achievements">All achievements unlocked!</li>`;
    } else {
      lockedList.innerHTML = lockedAchievements.map(achievement => `
        <li class="achievement-item locked-achievement ${achievement.rarity || 'common'}">
          <div class="achievement-icon">${achievement.icon || '🏆'}</div>
          <div class="achievement-content">
            <h3>${achievement.name}</h3>
            <p>${achievement.description}</p>
            <span class="achievement-rarity ${achievement.rarity || 'common'}">${achievement.rarity || 'common'}</span>
            <div class="achievement-requirement">
              <strong>Requirement:</strong> ${getAchievementRequirement(achievement)}
            </div>
          </div>
        </li>
      `).join('');
    }
  }
}

// Helper function to get readable achievement requirements
function getAchievementRequirement(achievement) {
  if (!achievement.condition) return "Unknown requirement";
  
  switch (achievement.condition.type) {
    case 'cookies':
      return `Bake ${achievement.condition.value} cookies`;
    case 'clicks':
      return `Click the cookie ${achievement.condition.value} times`;
    case 'buildings':
      return `Own ${achievement.condition.value} ${achievement.condition.building}s`;
    case 'cps':
      return `Reach ${achievement.condition.value} cookies per second`;
    case 'goldenCookies':
      return `Click ${achievement.condition.value} golden cookies`;
    default:
      return achievement.condition.description || "Special requirement";
  }
}

// Update inventory section display
function updateInventorySection(game) {
  if (!game) return;
  
  const inventoryList = document.getElementById('mobile-inventory-list');
  if (!inventoryList) return;
  
  // Create an inventory array with counts of all purchased upgrades
  const inventory = [];
  
  // Add building-type upgrades to inventory
  Object.entries(game.upgrades).forEach(([key, upgrade]) => {
    if (upgrade.count && upgrade.count > 0) {
      inventory.push({
        name: upgrade.displayPrefix.replace('Buy ', ''),
        count: upgrade.count,
        image: getUpgradeImage(key),
        type: 'building'
      });
    }
  });
  
  // Add special purchased upgrades to inventory
  if (game.state.cookieMultiplier > 1) {
    inventory.push({
      name: 'Cookie Multiplier',
      count: `${game.state.cookieMultiplier.toFixed(1)}x`,
      image: 'image/multiplier.png',
      type: 'special'
    });
  }
  
  if (game.state.goldenCookieChance > 0.1) {
    inventory.push({
      name: 'Golden Cookie Charm',
      count: `${Math.round(game.state.goldenCookieChance * 100)}%`,
      image: 'image/goldencookie.png',
      type: 'special'
    });
  }
  
  // Generate HTML for inventory items
  if (inventory.length === 0) {
    inventoryList.innerHTML = `<div class="empty-inventory">No upgrades purchased yet</div>`;
  } else {
    inventoryList.innerHTML = inventory.map(item => `
      <div class="inventory-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="inventory-item-details">
          <div class="inventory-item-name">${item.name}</div>
          <div class="inventory-item-count">${item.count}</div>
        </div>
      </div>
    `).join('');
  }
}

// Helper function to get image for upgrade type
function getUpgradeImage(upgradeKey) {
  const imageMap = {
    'clickUpgrade': 'image/cursor.png',
    'autoClicker': 'image/hand.png',
    'grandma': 'image/grandma.png',
    'farm': 'image/farm.png',
    'luckyClick': 'image/lucky.png'
  };
  
  return imageMap[upgradeKey] || 'image/cookie.png';
}

// Update mobile UI on game state changes
export function updateMobileUI(game) {
  // Only update if mobile nav is visible (viewport is mobile size)
  if (window.innerWidth <= 768) {
    updateAllMobileSections(game);
  }
}
