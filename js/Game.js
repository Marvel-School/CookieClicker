// Core Game class

import { ClickMultiplierUpgrade, IncrementUpgrade, LuckyUpgrade, ShopUpgrade } from './upgrades.js';
import { setupAchievements } from './achievements.js';
import { showFloatingNumber, createConfetti, applyTimeAcceleratorVisuals } from './animation.js';
import { log, showToast, AUTO_SAVE_INTERVAL } from './utils.js';
import { setupEventListeners, updateGameDisplay, updateAchievementsList } from './ui.js';

export default class Game {
  constructor() {
    // Enable debug logging
    this.debug = true;
    this.log("Initializing game...");

    // Centralized game state
    this.state = {
      cookies: 0,
      clickPower: 1,
      grandmas: 0,
      timeAcceleratorActive: false,
      timeAcceleratorMultiplier: 1,
      timeAcceleratorEndTime: 0,
      luckyStreak: 0,
      // New state properties for shop items
      cookieMultiplier: 1,
      goldenCookieChance: 0.1,
      goldenCookieActive: false,
      lastGoldenCookieTime: 0,
      // Personalization settings (will be populated by personalization.js)
      personalization: {
        theme: 'classic',
        cookieSkin: 'classic',
        cursorSkin: 'classic',
        animations: 'standard',
        particleIntensity: 1.0
      }
    };

    // Initialize upgrades
    this.upgrades = {
      clickUpgrade: new ClickMultiplierUpgrade(10, 3, "Upgrade Click Power"),
      autoClicker: new IncrementUpgrade(50, 1.5, "Buy Auto Clicker"),
      grandma: new IncrementUpgrade(100, 1.5, "Buy Grandma's Bakery", "updateGrandmasVisual"),
      farm: new IncrementUpgrade(500, 1.5, "Buy Cookie Farm"),
      luckyClick: new LuckyUpgrade(20, 1, "Lucky Click"),
    };

    // Shop upgrades
    this.shopUpgrades = {
      timeAccelerator: new ShopUpgrade(1000, 2.5, "Time Accelerator", "timeAccelerator", 1000),
      // Fix the references to match the method names
      cookieMultiplier: new ShopUpgrade(2000, 2, "Cookie Multiplier", "applyCookieMultiplier", 2000),
      goldenCookieChance: new ShopUpgrade(3000, 1.8, "Golden Cookie Charm", "increaseGoldenCookieChance", 3000)
    };

    // Achievements system
    this.achievements = [];
    this.setupAchievements();

    // Sound settings
    this.soundOn = true;
    this.clickSound = new Audio("sounds/click.mp3");
    this.clickSound.volume = 0.2;
    
    // For confetti animation
    this.lastConfettiTime = 0;

    // Initialize the game
    this.init();

    // Auto-load saved game if exists
    if (localStorage.getItem("cookieGameSave")) {
      this.loadGame();
      this.log("Auto-loaded saved game.");
    } else {
      // For new game, check achievements after a short delay
      setTimeout(() => this.checkAchievements(), 500);
    }
  }

  log(message, ...data) {
    log(this.debug, message, ...data);
  }

  playHoverSound() {
    if (this.soundOn) {
      this.clickSound.currentTime = 0;
      this.clickSound.play();
    }
  }

  init() {
    this.log("Initializing DOM elements...");
    
    // Cache DOM elements
    this.cookie = document.getElementById("cookie");
    this.cookieCount = document.getElementById("cookieCount");
    this.count = document.getElementById("count");
    this.clickPowerDisplay = document.getElementById("clickPower");
    this.cpsDisplay = document.getElementById("cps");

    // Standard Upgrade Buttons
    this.clickUpgradeButton = document.getElementById("clickUpgrade");
    this.autoClickerButton = document.getElementById("autoClicker");
    this.grandmaButton = document.getElementById("grandma");
    this.farmButton = document.getElementById("farm");
    this.luckyClickButton = document.getElementById("luckyClick");

    // Shop Section
    this.shopIcon = document.getElementById("shopIcon");
    this.shopContainer = document.getElementById("shopContainer");

    // Settings Panel Elements
    this.saveGameButton = document.getElementById("saveGame");
    this.loadGameButton = document.getElementById("loadGame");
    this.resetGameButton = document.getElementById("resetGame");
    this.toggleSoundButton = document.getElementById("toggleSound");
    this.settingsIcon = document.getElementById("settingsIcon");
    this.settingsMenu = document.getElementById("settingsMenu");

    // Achievements Elements
    this.achievementsContainer = document.getElementById("achievementsContainer");
    this.achievementsList = document.getElementById("achievementsList");

    // Visualization Elements
    this.grandmaProgressBar = document.getElementById("grandmaProgressBar");
    this.grandmaCountDisplay = document.getElementById("grandmaCount");
    this.autoClickersProgressBar = document.getElementById("autoClickersProgressBar");
    this.autoClickersCountVisual = document.getElementById("autoClickersCountVisual");
    this.farmsProgressBar = document.getElementById("farmsProgressBar");
    this.farmsCountVisual = document.getElementById("farmsCountVisual");

    // Create container for golden cookies
    this.goldenCookieContainer = document.createElement('div');
    this.goldenCookieContainer.id = 'goldenCookieContainer';
    document.body.appendChild(this.goldenCookieContainer);

    // Set up event listeners
    setupEventListeners(this);
    
    // Update initial display
    updateGameDisplay(this);
    this.updateGrandmasVisual();
    
    // Start game loop
    this.startGameLoop();

    // Auto-save every minute
    setInterval(() => this.autoSave(), AUTO_SAVE_INTERVAL);

    // Start golden cookie spawning logic
    this.startGoldenCookieTimer();
    this.log("Golden cookie timer initialized with chance:", this.state.goldenCookieChance);
  }

  handleCookieClick(e) {
    if (this.soundOn) {
      this.clickSound.currentTime = 0;
      this.clickSound.play();
    }
    
    this.state.cookies += this.state.clickPower;
    this.log("Cookie clicked. New cookies:", this.state.cookies);
    
    showFloatingNumber(this.cookie, this.state.clickPower);
    this.lastConfettiTime = createConfetti(e.clientX, e.clientY, this.lastConfettiTime);
    
    this.checkAchievements();
    updateGameDisplay(this);
  }

  purchaseStandardUpgrade(upgradeKey) {
    const upgrade = this.upgrades[upgradeKey];
    if (!upgrade) return;
    
    upgrade.purchase(this);
    this.lastUpgradePurchased = upgradeKey;
    this.checkAchievements();
  }

  purchaseShopUpgrade(upgradeKey) {
    console.log(`Attempting to purchase shop upgrade: ${upgradeKey}`);
    console.log("Available shop upgrades:", Object.keys(this.shopUpgrades));
    
    const shopUpgrade = this.shopUpgrades[upgradeKey];
    if (!shopUpgrade) {
      this.log(`Shop upgrade not found: ${upgradeKey}`);
      console.error(`Failed to find shop upgrade with key: ${upgradeKey}`);
      return;
    }
    
    this.log(`Purchasing shop upgrade: ${upgradeKey} (${shopUpgrade.displayPrefix})`);
    console.log(`Purchase details: cost=${shopUpgrade.cost}, cookies=${this.state.cookies}`);
    
    try {
      shopUpgrade.purchase(this);
      console.log(`Successfully purchased ${upgradeKey}`);
    } catch (error) {
      console.error(`Error during purchase of ${upgradeKey}:`, error);
    }
  }

  // New method for cookie multiplier
  applyCookieMultiplier(item) {
    // Increase multiplier by 0.5 (50%)
    this.state.cookieMultiplier += 0.5;
    
    showToast(`Cookie production multiplier increased to ${this.state.cookieMultiplier}x!`);
    this.log(`Cookie multiplier upgraded to ${this.state.cookieMultiplier}x`);
  }

  // New method for golden cookie chance
  increaseGoldenCookieChance(item) {
    // Increase golden cookie chance by 0.05 (5%)
    this.state.goldenCookieChance = Math.min(this.state.goldenCookieChance + 0.05, 0.5);
    
    showToast(`Golden Cookie chance increased to ${Math.round(this.state.goldenCookieChance * 100)}%!`);
    this.log(`Golden cookie chance increased to ${this.state.goldenCookieChance}`);
    
    // Force spawn a golden cookie soon after purchase for immediate feedback
    setTimeout(() => {
        if (!this.state.goldenCookieActive) {
            this.spawnGoldenCookie();
        }
    }, 3000);
  }

  // Start golden cookie spawn timer
  startGoldenCookieTimer() {
    const checkGoldenCookie = () => {
        if (!this.state.goldenCookieActive) {
            const now = Date.now();
            // Make sure at least 30 seconds passed since last golden cookie
            if (now - this.state.lastGoldenCookieTime > 30000) {
                // Random chance based on goldenCookieChance
                const roll = Math.random();
                this.log(`Golden cookie check: rolled ${roll.toFixed(3)} vs chance ${this.state.goldenCookieChance.toFixed(3)}`);
                if (roll < this.state.goldenCookieChance) {
                    this.spawnGoldenCookie();
                }
            }
        }
        
        // Check again after a delay - use a shorter delay for more frequent checks
        setTimeout(checkGoldenCookie, 3000); // Check every 3 seconds instead of 5
    };
    
    // Start the timer with a shorter initial delay
    setTimeout(checkGoldenCookie, 5000); // First check after 5 seconds instead of 10
  }

  // Spawn a golden cookie
  spawnGoldenCookie() {
    // Force reset golden cookie active state for manual spawning
    if (this.state.goldenCookieActive) {
      console.log("Golden cookie was already active. Removing existing one...");
      const existingCookies = document.querySelectorAll('.golden-cookie');
      existingCookies.forEach(cookie => {
        if (cookie.parentNode) {
          cookie.parentNode.removeChild(cookie);
        }
      });
    }
    
    this.state.goldenCookieActive = true;
    console.log('Spawning golden cookie!');
    
    // Create the golden cookie element
    const goldenCookie = document.createElement('div');
    goldenCookie.className = 'golden-cookie';
    
    // Random position on screen - keep away from edges
    const padding = 100;
    const maxX = window.innerWidth - padding*2;
    const maxY = window.innerHeight - padding*2;
    const posX = Math.floor(Math.random() * maxX) + padding;
    const posY = Math.floor(Math.random() * maxY) + padding;
    
    goldenCookie.style.left = `${posX}px`;
    goldenCookie.style.top = `${posY}px`;
    
    // Debug information directly on element
    const debugInfo = document.createElement('div');
    debugInfo.style.position = 'absolute';
    debugInfo.style.bottom = '-20px';
    debugInfo.style.left = '0';
    debugInfo.style.right = '0';
    debugInfo.style.textAlign = 'center';
    debugInfo.style.color = 'white';
    debugInfo.style.textShadow = '0 0 3px black';
    debugInfo.style.fontSize = '12px';
    debugInfo.textContent = 'Click me!';
    goldenCookie.appendChild(debugInfo);
    
    // Add click handler
    goldenCookie.addEventListener('click', () => {
      console.log('Golden cookie clicked!');
      this.handleGoldenCookieClick(goldenCookie);
    });
    
    // Log the golden cookie container status
    if (!this.goldenCookieContainer) {
      console.error('Golden cookie container is missing! Creating it now...');
      this.goldenCookieContainer = document.createElement('div');
      this.goldenCookieContainer.id = 'goldenCookieContainer';
      document.body.appendChild(this.goldenCookieContainer);
    }
    
    // Add to container
    this.goldenCookieContainer.appendChild(goldenCookie);
    
    // Auto-disappear after 15 seconds
    setTimeout(() => {
      if (this.state.goldenCookieActive && goldenCookie.parentNode) {
        console.log('Golden cookie expired without being clicked');
        this.removeGoldenCookie(goldenCookie);
      }
    }, 15000);
    
    console.log('Golden cookie spawned at position:', posX, posY);
    console.log('Golden cookie element:', goldenCookie);
    console.log('Image path being used:', window.getComputedStyle(goldenCookie).backgroundImage);
    
    return goldenCookie;
  }

  // Handle golden cookie click
  handleGoldenCookieClick(goldenCookie) {
    if (!this.state.goldenCookieActive) return;
    
    // Different possible rewards
    const rewards = [
      {
        type: 'cookies',
        value: () => Math.floor(this.state.cookies * 0.1), // 10% of current cookies
        message: (amt) => `Golden cookie grants you ${amt} cookies!`
      },
      {
        type: 'multiply',
        value: () => 2, // 2x production for 30 seconds
        message: () => `Golden cookie doubles production for 30 seconds!`
      },
      {
        type: 'clickPower',
        value: () => Math.ceil(this.state.clickPower * 0.5), // +50% click power
        message: (amt) => `Golden cookie increases click power by ${amt}!`
      }
    ];
    
    // Select random reward
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    
    // Apply the reward
    switch (reward.type) {
      case 'cookies':
        const cookieBonus = reward.value();
        this.state.cookies += cookieBonus;
        showToast(reward.message(cookieBonus));
        break;
      case 'multiply':
        const multiplier = reward.value();
        // Temporary production boost
        const oldMultiplier = this.state.cookieMultiplier;
        this.state.cookieMultiplier *= multiplier;
        showToast(reward.message());
        
        // Reset after 30 seconds
        setTimeout(() => {
          this.state.cookieMultiplier = oldMultiplier;
          showToast('Golden cookie production boost has ended.');
        }, 30000);
        break;
      case 'clickPower':
        const powerBonus = reward.value();
        this.state.clickPower += powerBonus;
        showToast(reward.message(powerBonus));
        break;
    }
    
    // Remove the golden cookie
    this.removeGoldenCookie(goldenCookie);
    
    // Update display
    this.updateDisplay();
    this.checkAchievements();
  }

  // Remove golden cookie from screen
  removeGoldenCookie(goldenCookie) {
    if (goldenCookie && goldenCookie.parentNode) {
      goldenCookie.parentNode.removeChild(goldenCookie);
    }
    
    this.state.goldenCookieActive = false;
    this.state.lastGoldenCookieTime = Date.now();
  }

  startGameLoop() {
    let lastTime = performance.now();
    let lastUpdateTime = 0;
    let lastAchievementCheck = 0;
    
    const UPDATE_INTERVAL = 100; // Update display every 100ms
    const ACHIEVEMENT_CHECK_INTERVAL = 1000; // Check achievements every second
    
    const loop = (now) => {
      // Calculate accurate delta time
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      
      // Core cookie calculation logic
      const autoClickers = this.upgrades.autoClicker.count || 0;
      const grandmas = this.upgrades.grandma.count || 0;
      const farms = this.upgrades.farm.count || 0;
      let cps = autoClickers * 1 + grandmas * 5 + farms * 10;
      
      // Apply cookie multiplier
      cps *= this.state.cookieMultiplier;
      
      const timeAccelMult = this.state.timeAcceleratorActive
        ? this.state.timeAcceleratorMultiplier
        : 1;
      
      // Update cookie count
      this.state.cookies += cps * timeAccelMult * delta;
      
      // Throttle visual updates to reduce DOM operations
      if (now - lastUpdateTime > UPDATE_INTERVAL) {
        updateGameDisplay(this);
        lastUpdateTime = now;
      }
      
      // Periodically check for new achievements
      if (now - lastAchievementCheck > ACHIEVEMENT_CHECK_INTERVAL) {
        this.checkAchievements();
        lastAchievementCheck = now;
      }
      
      requestAnimationFrame(loop);
    };
    
    requestAnimationFrame(loop);
  }

  updateDisplay() {
    updateGameDisplay(this);
  }

  showFloatingNumber(amount, isBonus = false) {
    showFloatingNumber(this.cookie, amount, isBonus);
  }

  updateGrandmasVisual() {
    const maxGrandmas = 100;
    const count = this.upgrades.grandma.count || 0;
    const progressWidth = (count / maxGrandmas) * 100;
    
    if (this.grandmaProgressBar) {
      this.grandmaProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
    }
    
    if (this.grandmaCountDisplay) {
      this.grandmaCountDisplay.textContent = count;
    }
    
    this.log("updateGrandmasVisual: count =", count, "progressWidth =", progressWidth);
  }

  updateAutoClickersVisual() {
    const maxAutoClickers = 100;
    const count = this.upgrades.autoClicker.count || 0;
    const progressWidth = (count / maxAutoClickers) * 100;
    
    if (this.autoClickersProgressBar) {
      this.autoClickersProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
    }
    
    if (this.autoClickersCountVisual) {
      this.autoClickersCountVisual.textContent = count;
    }
  }

  updateFarmsVisual() {
    const maxFarms = 100;
    const count = this.upgrades.farm.count || 0;
    const progressWidth = (count / maxFarms) * 100;
    
    if (this.farmsProgressBar) {
      this.farmsProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
    }
    
    if (this.farmsCountVisual) {
      this.farmsCountVisual.textContent = count;
    }
  }

  setupAchievements() {
    setupAchievements(this);
  }

  registerAchievement(achievement) {
    this.achievements.push(achievement);
  }

  checkAchievements() {
    let newAchievements = false;
    
    this.achievements.forEach(achievement => {
      if (!achievement.earned && achievement.condition(this)) {
        achievement.earned = true;
        newAchievements = true;
        showToast(`🏆 Achievement Unlocked: ${achievement.name}!`);
      }
    });
    
    if (newAchievements) {
      this.updateAchievements();
    }
    
    // Special tracking for lucky streak achievement
    if (this.lastUpgradePurchased === 'luckyClick') {
      this.state.luckyStreak = (this.state.luckyStreak || 0) + 1;
    } else if (this.lastUpgradePurchased && this.lastUpgradePurchased !== 'luckyClick') {
      this.state.luckyStreak = 0;
    }
  }

  updateAchievements() {
    const earnedAchievements = this.achievements.filter(a => a.earned);
    updateAchievementsList(this, earnedAchievements);
  }

  doSaveGame() {
    const gameState = {
      state: this.state,
      upgrades: this.upgrades,
      shopUpgrades: this.shopUpgrades,
      achievements: this.achievements,
      soundOn: this.soundOn,
      // Make sure to save personalization settings
      personalization: this.state.personalization
    };
    
    localStorage.setItem("cookieGameSave", JSON.stringify(gameState));
    this.log("Game saved", gameState);
  }

  saveGame() {
    this.doSaveGame();
    showToast("Game saved!");
    this.log("Manual save complete.");
  }

  autoSave() {
    this.doSaveGame();
    showToast("Game auto-saved!");
    this.log("Auto-saved game at", new Date());
  }

  loadGame() {
    try {
      const savedStr = localStorage.getItem("cookieGameSave");
      if (!savedStr) {
        showToast("No saved game found!");
        return;
      }
      
      const savedGame = JSON.parse(savedStr);
      this.log("Saved game data loaded:", savedGame);

      // Load main state
      this.state = savedGame.state || this.state;

      // Reinitialize upgrades using class constructors and override with saved data
      if (typeof savedGame.upgrades === "object") {
        this.upgrades = {
          clickUpgrade: new ClickMultiplierUpgrade(10, 3, "Upgrade Click Power"),
          autoClicker: new IncrementUpgrade(50, 1.5, "Buy Auto Clicker"),
          grandma: new IncrementUpgrade(100, 1.5, "Buy Grandma's Bakery", "updateGrandmasVisual"),
          farm: new IncrementUpgrade(500, 1.5, "Buy Cookie Farm"),
          luckyClick: new LuckyUpgrade(20, 1, "Lucky Click"),
        };
        
        Object.keys(savedGame.upgrades).forEach((key) => {
          if (savedGame.upgrades[key].cost !== undefined) {
            this.upgrades[key].cost = savedGame.upgrades[key].cost;
          }
          if (savedGame.upgrades[key].count !== undefined) {
            this.upgrades[key].count = savedGame.upgrades[key].count;
          }
        });
      }

      // Reinitialize shopUpgrades similarly
      if (typeof savedGame.shopUpgrades === "object") {
        this.shopUpgrades = {
          timeAccelerator: new ShopUpgrade(1000, 2.5, "Time Accelerator", "timeAccelerator", 1000),
          // Make sure to include the new shop items here too
          cookieMultiplier: new ShopUpgrade(2000, 2, "Cookie Multiplier", "applyCookieMultiplier", 2000),
          goldenCookieChance: new ShopUpgrade(3000, 1.8, "Golden Cookie Charm", "increaseGoldenCookieChance", 3000)
        };
        
        Object.keys(savedGame.shopUpgrades).forEach((key) => {
          if (savedGame.shopUpgrades[key].cost !== undefined && this.shopUpgrades[key]) {
            this.shopUpgrades[key].cost = savedGame.shopUpgrades[key].cost;
          }
        });
      }

      // Reset and recreate achievements then restore earned status
      this.achievements = [];
      this.setupAchievements();
      
      if (Array.isArray(savedGame.achievements)) {
        // For old format (simple array of strings)
        if (typeof savedGame.achievements[0] === 'string') {
          savedGame.achievements.forEach(name => {
            const achievement = this.achievements.find(a => a.name === name);
            if (achievement) {
              achievement.earned = true;
            }
          });
        } 
        // For new format (array of Achievement objects)
        else {
          savedGame.achievements.forEach(savedAch => {
            const achievement = this.achievements.find(a => a.id === savedAch.id);
            if (achievement) {
              achievement.earned = savedAch.earned;
            }
          });
        }
      }

      this.soundOn = savedGame.soundOn !== undefined ? savedGame.soundOn : true;

      // Ensure personalization settings are preserved
      if (this.personalizer && this.state.personalization) {
        this.personalizer.settings = {...this.personalizer.settings, ...this.state.personalization};
        this.personalizer.applyAllSettings();
      }

      this.updateDisplay();
      this.updateAchievements();
      this.updateGrandmasVisual();
      this.checkAchievements(); // Check achievements right after loading
      
      this.log("Load complete.");
      showToast("Game loaded successfully!");
    } catch (e) {
      this.log("Failed to load game:", e);
      showToast("Failed to load game data!");
    }
  }

  resetGame() {
    if (!confirm("Are you sure you want to reset your game? This action cannot be undone.")) return;
    
    localStorage.removeItem("cookieGameSave");
    this.state = {
      cookies: 0,
      clickPower: 1,
      grandmas: 0,
      timeAcceleratorActive: false,
      timeAcceleratorMultiplier: 1,
      timeAcceleratorEndTime: 0,
      luckyStreak: 0,
      // New state properties for shop items
      cookieMultiplier: 1,
      goldenCookieChance: 0.1,
      goldenCookieActive: false,
      lastGoldenCookieTime: 0,
      // Personalization settings (will be populated by personalization.js)
      personalization: {
        theme: 'classic',
        cookieSkin: 'classic',
        cursorSkin: 'classic',
        animations: 'standard',
        particleIntensity: 1.0
      }
    };
    
    this.upgrades = {
      clickUpgrade: new ClickMultiplierUpgrade(10, 3, "Upgrade Click Power"),
      autoClicker: new IncrementUpgrade(50, 1.5, "Buy Auto Clicker"),
      grandma: new IncrementUpgrade(100, 1.5, "Buy Grandma's Bakery", "updateGrandmasVisual"),
      farm: new IncrementUpgrade(500, 1.5, "Buy Cookie Farm"),
      luckyClick: new LuckyUpgrade(20, 1, "Lucky Click"),
    };
    
    this.shopUpgrades = {
      timeAccelerator: new ShopUpgrade(1000, 2.5, "Time Accelerator", "timeAccelerator", 1000),
      // Add new shop items
      cookieMultiplier: new ShopUpgrade(2000, 2, "Cookie Multiplier", "applyCookieMultiplier", 2000),
      goldenCookieChance: new ShopUpgrade(3000, 1.8, "Golden Cookie Charm", "increaseGoldenCookieChance", 3000)
    };
    
    // Properly reset achievements
    this.achievements = [];
    this.setupAchievements();
    
    this.updateDisplay();
    this.updateAchievements();
    this.updateGrandmasVisual();
    
    this.log("Game reset.");
    alert("Game has been reset.");
  }

  // Fix the broken showToast method
  showToast(message) {
    try {
      showToast(message); // Call the imported showToast function
    } catch (e) {
      console.error("Error showing toast:", e);
      // Fallback implementation uses the same container pattern
      const toastContainer = document.querySelector('.toast-container') || 
        (() => {
          const container = document.createElement("div");
          container.className = "toast-container";
          document.body.appendChild(container);
          return container;
        })();
      
      const notification = document.createElement("div");
      notification.className = "auto-save-notification";
      notification.textContent = message;
      toastContainer.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
  }

  updateDisplay() {
    updateGameDisplay(this);
  }
}
