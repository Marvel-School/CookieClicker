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
      luckyStreak: 0
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

    // Set up event listeners
    setupEventListeners(this);
    
    // Update initial display
    updateGameDisplay(this);
    this.updateGrandmasVisual();
    
    // Start game loop
    this.startGameLoop();

    // Auto-save every minute
    setInterval(() => this.autoSave(), AUTO_SAVE_INTERVAL);
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
    const shopUpgrade = this.shopUpgrades[upgradeKey];
    if (!shopUpgrade) return;
    
    shopUpgrade.purchase(this);
  }

  activateTimeAccelerator(item) {
    const baseCost = item.baseCost || 1000;
    const minDuration = 30; // 30 seconds - shorter base duration
    const maxDuration = 60; // 1 minute max
    
    let duration = minDuration + (item.cost - baseCost) * 0.05;
    duration = Math.min(duration, maxDuration);

    this.state.timeAcceleratorActive = true;
    this.state.timeAcceleratorMultiplier = 4; // Increased from 2 to 4x
    this.state.timeAcceleratorEndTime = Date.now() + duration * 1000;

    // Add visual effects when activated
    applyTimeAcceleratorVisuals(this.cookie, this.cpsDisplay, true);
    
    this.log(
      "Time Accelerator activated for",
      duration,
      "seconds, multiplier:",
      this.state.timeAcceleratorMultiplier
    );
    
    showToast(`Time Accelerator activated! 4x production for ${Math.floor(duration)} seconds!`);

    setTimeout(() => {
      this.state.timeAcceleratorActive = false;
      this.state.timeAcceleratorMultiplier = 1;
      this.state.timeAcceleratorEndTime = 0;
      
      // Remove visual effects when deactivated
      applyTimeAcceleratorVisuals(this.cookie, this.cpsDisplay, false);
      
      this.log("Time Accelerator expired");
      showToast("Time Accelerator expired");
    }, duration * 1000);
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
      const cps = autoClickers * 1 + grandmas * 5 + farms * 10;
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
        };
        
        Object.keys(savedGame.shopUpgrades).forEach((key) => {
          if (savedGame.shopUpgrades[key].cost !== undefined) {
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
      luckyStreak: 0
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
}
