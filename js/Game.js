// Core Game class

// Add this constant at the beginning of the file, before the Game class
const AUTO_SAVE_INTERVAL = 60000; // Auto-save every minute

import { ClickMultiplierUpgrade, IncrementUpgrade, LuckyUpgrade, ShopUpgrade } from './upgrades.js';
import { setupAchievements } from './achievements.js';
import { showFloatingNumber, createConfetti, applyTimeAcceleratorVisuals } from './animation.js';
import { log, showToast } from './utils.js';
import { setupEventListeners, updateGameDisplay, updateAchievementsList } from './ui.js';
import { PersonalizationManager } from './personalization.js';
import { UIManager } from './UIManager.js';
import { ShopPanel } from './components/ShopPanel.js';
import { AchievementsPanel } from './components/AchievementsPanel.js';
import { SettingsPanel } from './components/SettingsPanel.js';
import { PersonalizationPanel } from './components/PersonalizationPanel.js';
import { createConfetti as createConfettiEffect } from './animation.js';

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
      },
      // Track for temporary bonuses
      activeGoldenCookieBonuses: {
        clickPower: {
          active: false,
          originalValue: 1,
          bonusValue: 0,
          endTime: 0
        },
        production: {
          active: false,
          originalValue: 1,
          bonusValue: 0,
          endTime: 0
        }
      }
    };

    // Add tracking for visual updates
    this._lastGrandmaCount = 0;
    this._lastAutoClickerCount = 0;
    this._lastFarmCount = 0;

    // Initialize upgrades with descriptions - REBALANCED
    this.upgrades = {
      clickUpgrade: new ClickMultiplierUpgrade(15, 1.8, "Upgrade Click Power", "Doubles your click power"),
      autoClicker: new IncrementUpgrade(50, 1.15, "Buy Auto Clicker", "Automatically clicks once per second"),
      grandma: new IncrementUpgrade(100, 1.15, "Buy Grandma's Bakery", "Each grandma produces 3 cookies per second", "updateGrandmasVisual"),
      farm: new IncrementUpgrade(500, 1.15, "Buy Cookie Farm", "Each farm produces 8 cookies per second"),
      luckyClick: new LuckyUpgrade(30, 1.2, "Lucky Click", "Chance to earn a bonus of cookies"),
    };

    // Shop upgrades - BALANCED PROGRESSION
    this.shopUpgrades = {
      timeAccelerator: new ShopUpgrade(800, 2.0, "Time Accelerator", "timeAccelerator", 800),
      cookieMultiplier: new ShopUpgrade(2000, 1.8, "Cookie Multiplier", "applyCookieMultiplier", 2000),
      goldenCookieChance: new ShopUpgrade(2500, 1.5, "Golden Cookie Charm", "increaseGoldenCookieChance", 2500)
    };

    // Achievements system
    this.achievements = [];

    // Sound settings
    this.soundOn = true;
    this.clickSound = new Audio("sounds/click.mp3");
    this.clickSound.volume = 0.2;

    // Add error handling for audio loading
    this.clickSound.addEventListener('error', (e) => {
      console.warn("Error loading click sound:", e);
      // Continue initialization even if sounds fail to load
    });

    // Create UI manager
    this.uiManager = new UIManager(this);

    // Initialize personalization manager
    this.personalizationManager = new PersonalizationManager(this);

    // Initialize UI panels
    this.shopPanel = null;
    this.achievementsPanel = null;
    this.settingsPanel = null;
    this.personalizationPanel = null;
  }

  log(message, ...data) {
    if (this.debug) {
      console.log(`[Game] ${message}`, ...data);
    }
  }

  // Add a safe play method that checks for user interaction first
  safePlaySound(audioElement) {
    if (!this.soundOn) return;

    try {
      const playPromise = audioElement.play();

      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Auto-play was prevented, we'll ignore this error
          this.log("Audio playback was prevented:", error);
        });
      }
    } catch (e) {
      this.log("Error playing sound:", e);
    }
  }

  playHoverSound() {
    if (this.soundOn) {
      this.clickSound.currentTime = 0;
      this.safePlaySound(this.clickSound);
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

    // Initialize the active bonuses container
    this.activeBonusesContainer = document.getElementById('activeBonuses');

    // Initialize tracking variables for visual updates
    this._lastGrandmaCount = this.upgrades.grandma.count || 0;
    this._lastAutoClickerCount = this.upgrades.autoClicker.count || 0;
    this._lastFarmCount = this.upgrades.farm.count || 0;

    // Set up event listeners
    setupEventListeners(this);

    // Update initial display
    updateGameDisplay(this);

    // Update all visuals after implementing the methods
    this.updateGrandmasVisual();
    this.updateAutoClickersVisual();
    this.updateFarmsVisual();

    // Start game loop
    this.startGameLoop();

    // Auto-save every minute
    setInterval(() => this.autoSave(), AUTO_SAVE_INTERVAL);

    // Start golden cookie spawning logic
    this.startGoldenCookieTimer();
    this.log("Golden cookie timer initialized with chance:", this.state.goldenCookieChance);

    // Update upgrade descriptions on init
    this.uiManager.updateUpgradeDescriptions();

    // Initialize UI Panels
    this.initPanels();

    // Setup achievements during initialization
    this.setupAchievements();
  }

  initPanels() {
    try {
      // Initialize UI panels using DOM elements directly instead of IDs
      const shopContainer = document.getElementById('shopContainer');
      const shopIcon = document.getElementById('shopIcon');
      const achievementsContainer = document.getElementById('achievementsContainer');
      const achievementsIcon = document.getElementById('achievementsIcon');
      const achievementsList = document.getElementById('achievementsList');
      const settingsMenu = document.getElementById('settingsMenu');
      const settingsIcon = document.getElementById('settingsIcon');
      const personalizationContainer = document.getElementById('personalizationContainer');
      const personalizationBtn = document.getElementById('personalizationBtn');
      
      // Only create panels if the elements exist
      if (shopContainer && shopIcon) {
        this.shopPanel = new ShopPanel(this, shopContainer, shopIcon);
      }
      
      if (achievementsContainer && achievementsIcon && achievementsList) {
        this.achievementsPanel = new AchievementsPanel(this, achievementsContainer, achievementsIcon, achievementsList);
      }
      
      if (settingsMenu && settingsIcon) {
        this.settingsPanel = new SettingsPanel(this, settingsMenu, settingsIcon);
      }
      
      if (personalizationContainer && personalizationBtn) {
        this.personalizationPanel = new PersonalizationPanel(this, personalizationContainer, personalizationBtn);
      }
      
      this.log("UI panels initialized");
    } catch (error) {
      console.error("Error initializing panels:", error);
      // Game can continue without panels
    }
  }

  // Update all shop prices
  updateShopPrices() {
    Object.keys(this.shopUpgrades).forEach(key => {
      const upgrade = this.shopUpgrades[key];
      const costElement = document.querySelector(`[data-upgrade="${key}"] .item-cost span`);
      if (costElement) {
        costElement.textContent = this.uiManager.formatNumber(upgrade.cost);
      }
    });
  }

  // Add a new method to create and manage bonus indicators
  addBonusIndicator(id, type, icon, text, duration = null) {
    if (!this.activeBonusesContainer) return;

    // Remove any existing indicator with the same ID
    this.removeBonusIndicator(id);

    // Create new indicator
    const indicator = document.createElement('div');
    indicator.id = id;
    indicator.className = `bonus-indicator ${type}-bonus`;

    let content = `<span class="bonus-icon">${icon}</span><span class="bonus-text">${text}</span>`;

    if (duration) {
      content += `<span class="bonus-timer">${duration}s</span>`;
    }

    indicator.innerHTML = content;
    this.activeBonusesContainer.appendChild(indicator);

    // Add animation
    indicator.style.animation = 'bonus-appear 0.3s forwards';
  }

  // Remove a bonus indicator by ID
  removeBonusIndicator(id) {
    const existing = document.getElementById(id);
    if (existing) {
      // Add exit animation
      existing.style.animation = 'bonus-disappear 0.3s forwards';

      // Remove after animation completes
      setTimeout(() => {
        if (existing.parentNode) {
          existing.parentNode.removeChild(existing);
        }
      }, 300);
    }
  }

  // Update an existing bonus indicator
  updateBonusIndicator(id, newText = null, newDuration = null) {
    const indicator = document.getElementById(id);
    if (!indicator) return;

    if (newText) {
      const textElement = indicator.querySelector('.bonus-text');
      if (textElement) {
        textElement.textContent = newText;
      }
    }

    if (newDuration !== null) {
      const timerElement = indicator.querySelector('.bonus-timer');
      if (timerElement) {
        timerElement.textContent = `${newDuration}s`;
      }
    }
  }

  handleCookieClick(e) {
    console.log("Cookie clicked!"); // Add debugging output

    if (this.soundOn) {
      try {
        this.clickSound.currentTime = 0;
        this.safePlaySound(this.clickSound);
      } catch (error) {
        console.warn("Sound error:", error);
        // Continue with click handling anyway
      }
    }

    // Ensure state values are valid numbers - comprehensive validation
    if (typeof this.state.clickPower !== 'number' || isNaN(this.state.clickPower)) {
      console.error("Invalid click power detected:", this.state.clickPower);
      this.state.clickPower = 1; // Reset to default
    }
    
    if (typeof this.state.cookieMultiplier !== 'number' || isNaN(this.state.cookieMultiplier)) {
      console.error("Invalid cookie multiplier detected:", this.state.cookieMultiplier);
      this.state.cookieMultiplier = 1; // Reset to default
    }
    
    // Calculate click amount with sanitized values 
    let clickAmount = this.state.clickPower;
    
    // Apply any active bonuses with validation
    if (this.state.activeGoldenCookieBonuses && 
        this.state.activeGoldenCookieBonuses.clickPower && 
        this.state.activeGoldenCookieBonuses.clickPower.active) {
      
      // Ensure we have a valid bonus value
      const bonusValue = this.state.activeGoldenCookieBonuses.clickPower.bonusValue;
      if (typeof bonusValue === 'number' && !isNaN(bonusValue)) {
        clickAmount += bonusValue;
      }
    }
    
    // Final validation before adding to cookies
    if (typeof clickAmount !== 'number' || isNaN(clickAmount)) {
      console.error("Final click amount is invalid:", clickAmount);
      clickAmount = 1; // Use safe default
    }
    
    // Update cookies count
    const oldCookies = this.state.cookies || 0;
    this.state.cookies = oldCookies + clickAmount;
    
    // Validate cookies after addition
    if (typeof this.state.cookies !== 'number' || isNaN(this.state.cookies)) {
      console.error("Cookies value became invalid after addition:", this.state.cookies);
      this.state.cookies = oldCookies + 1; // Use safe fallback
    }
    
    this.log("Cookie clicked. New cookies:", this.state.cookies);
    this.showFloatingNumber(clickAmount);
    this.createConfetti(e.clientX, e.clientY);
    this.checkAchievements();
    this.updateDisplay();
  }

  showFloatingNumber(amount, isBonus = false) {
    // Validate amount is a number with complete sanitization
    if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
      console.error("Invalid amount for floating number:", amount);
      amount = 1; // Default to 1 if not a valid number
    }
    
    // Ensure amount is a reasonable number (prevent extremely large values)
    if (amount > 1e12) { // Cap at trillion
      console.warn("Extremely large floating number capped:", amount);
      amount = 1e12;
    }
    
    // Check if cookie element exists
    if (!this.cookie) {
      console.error("Cookie element not found when showing floating number");
      return;
    }

    // Import and call the floating number function with validated parameters
    showFloatingNumber(this.cookie, amount, isBonus);
  }

  sanitizeGameState() {
    const numericProperties = [
      'cookies',
      'clickPower',
      'timeAcceleratorMultiplier',
      'cookieMultiplier',
      'goldenCookieChance'
    ];
    
    // Default values for properties if they are missing or invalid
    const defaultValues = {
      'cookies': 0,
      'clickPower': 1,
      'timeAcceleratorMultiplier': 1,
      'cookieMultiplier': 1,
      'goldenCookieChance': 0.1
    };
    
    if (!this.state) {
      console.error("State object is missing, creating a new one");
      this.state = {}; // Create empty state if missing
    }
    
    // Ensure all numeric properties are valid numbers
    numericProperties.forEach(prop => {
      if (typeof this.state[prop] !== 'number' || isNaN(this.state[prop])) {
        console.error(`Invalid ${prop} found in game state:`, this.state[prop]);
        
        // Fix the property with the default value
        this.state[prop] = defaultValues[prop];
      }
    });
    
    // Validate active bonuses
    if (this.state.activeGoldenCookieBonuses) {
      const bonusTypes = ['clickPower', 'production'];
      bonusTypes.forEach(type => {
        if (this.state.activeGoldenCookieBonuses[type]) {
          const bonus = this.state.activeGoldenCookieBonuses[type];
          if (typeof bonus.bonusValue !== 'number' || isNaN(bonus.bonusValue)) {
            bonus.bonusValue = 0;
          }
          if (typeof bonus.originalValue !== 'number' || isNaN(bonus.originalValue)) {
            bonus.originalValue = 1;
          }
        }
      });
    } else {
      // Initialize active bonus state if missing
      this.state.activeGoldenCookieBonuses = {
        clickPower: { active: false, originalValue: 1, bonusValue: 0, endTime: 0 },
        production: { active: false, originalValue: 1, bonusValue: 0, endTime: 0 }
      };
    }
    
    // Ensure personalization is present
    if (!this.state.personalization) {
      this.state.personalization = {
        theme: 'classic',
        cookieSkin: 'classic',
        cursorSkin: 'classic',
        animations: 'standard',
        particleIntensity: 1.0
      };
    }
    
    return this.state; // Return sanitized state
  }

  loadGame() {
    try {
      const savedGame = localStorage.getItem("cookieGameSave");
      if (savedGame) {
        const parsedState = JSON.parse(savedGame);
        
        // Ensure we have valid default values before replacing state
        const defaultState = {
          cookies: 0,
          clickPower: 1,
          grandmas: 0,
          timeAcceleratorActive: false,
          timeAcceleratorMultiplier: 1,
          timeAcceleratorEndTime: 0,
          luckyStreak: 0,
          cookieMultiplier: 1,
          goldenCookieChance: 0.1,
          goldenCookieActive: false,
          lastGoldenCookieTime: 0,
          personalization: {
            theme: 'classic',
            cookieSkin: 'classic',
            cursorSkin: 'classic',
            animations: 'standard',
            particleIntensity: 1.0
          },
          activeGoldenCookieBonuses: {
            clickPower: {
              active: false,
              originalValue: 1,
              bonusValue: 0,
              endTime: 0
            },
            production: {
              active: false,
              originalValue: 1,
              bonusValue: 0,
              endTime: 0
            }
          }
        };
        
        // Create a new state merging defaults with saved values
        this.state = Object.assign({}, defaultState, parsedState);
        
        // Run thorough state sanitization
        this.sanitizeGameState();
        
        // Restore upgrade counts
        for (const key in this.upgrades) {
          if (parsedState.upgrades && parsedState.upgrades[key]) {
            this.upgrades[key].count = parsedState.upgrades[key].count || 0;
            this.upgrades[key].cost = parsedState.upgrades[key].cost || this.upgrades[key].cost;
          }
        }
        
        // Update shop prices based on saved state
        this.updateShopPrices();
        
        // Restore achievement progress
        if (parsedState.achievements) {
          for (let i = 0; i < parsedState.achievements.length; i++) {
            if (i < this.achievements.length) {
              this.achievements[i].earned = parsedState.achievements[i].earned || false;
            }
          }
        }
        
        this.updateDisplay();
        this.updateAchievements();
        
        console.log("Game loaded from localStorage", this.state);
        this.showToast("Game loaded!");
        
        // Re-initialize the golden cookie timer with the loaded chance
        this.startGoldenCookieTimer();
        
        return true;
      }
    } catch (error) {
      console.error("Error loading game:", error);
      this.showToast("Error loading game.");
    }
    return false;
  }

  startGameLoop() {
    // Sanitize before starting
    this.sanitizeGameState();

    let lastTime = performance.now();
    let lastUpdateTime = 0;
    let lastAchievementCheck = 0;

    const UPDATE_INTERVAL = 100; // Update display every 100ms
    const ACHIEVEMENT_CHECK_INTERVAL = 1000; // Check achievements every second

    const loop = (now) => {
      // Calculate accurate delta time
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Core cookie calculation logic with REBALANCED VALUES
      const autoClickers = this.upgrades.autoClicker.count || 0;
      const grandmas = this.upgrades.grandma.count || 0;
      const farms = this.upgrades.farm.count || 0;

      // Balanced CPS values
      let cps = autoClickers * 1 + grandmas * 3 + farms * 6;

      // Apply cookie multiplier
      cps *= this.state.cookieMultiplier;

      // Apply time accelerator if active
      const timeAccelMult = this.state.timeAcceleratorActive 
        ? this.state.timeAcceleratorMultiplier 
        : 1;

      // Update cookies
      this.state.cookies += cps * timeAccelMult * delta;

      // Update active bonuses timers
      this.updateActiveBoostTimers();

      // Throttle visual updates to reduce DOM operations
      if (now - lastUpdateTime > UPDATE_INTERVAL) {
        this.updateDisplay();
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

  setupAchievements() {
    // Define basic achievements
    this.achievements = [
      {
        id: 'first_cookie',
        name: 'First Cookie',
        description: 'Click the cookie for the first time',
        icon: '🍪',
        rarity: 'common',
        category: 'clicks',
        earned: false,
        condition: (state) => state.cookies >= 1
      },
      {
        id: 'ten_cookies',
        name: 'Cookie Newbie',
        description: 'Bake 10 cookies in total',
        icon: '🍪',
        rarity: 'common',
        category: 'cookies',
        earned: false,
        condition: (state) => state.cookies >= 10
      },
      {
        id: 'hundred_cookies',
        name: 'Cookie Apprentice',
        description: 'Bake 100 cookies in total',
        icon: '🍪',
        rarity: 'uncommon',
        category: 'cookies',
        earned: false,
        condition: (state) => state.cookies >= 100
      },
      {
        id: 'first_upgrade',
        name: 'Upgrader',
        description: 'Buy your first upgrade',
        icon: '⬆️',
        rarity: 'common',
        category: 'upgrades',
        earned: false,
        condition: (state, game) => {
          // Check if any upgrade has a count > 0
          return Object.values(game.upgrades).some(upgrade => upgrade.count > 0);
        }
      }
      // More achievements can be added here
    ];
    
    this.log(`Initialized ${this.achievements.length} achievements`);
  }

  /**
   * Check for achievements that should be unlocked
   */
  checkAchievements() {
    // Skip if no achievements are defined
    if (!this.achievements || this.achievements.length === 0) {
      return;
    }
    
    try {
      // Check each achievement's condition
      for (const achievement of this.achievements) {
        // Skip already earned achievements
        if (achievement.earned) continue;
        
        // Check if condition is met
        if (achievement.condition(this.state, this)) {
          // Mark as earned
          achievement.earned = true;
          
          // Show notification
          this.showToast(`Achievement unlocked: ${achievement.name}`);
          
          // Log for debugging
          this.log(`Achievement unlocked: ${achievement.name}`);
        }
      }
      
      // Update achievements visual
      this.updateAchievements();
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  }

  /**
   * Update achievements display
   */
  updateAchievements() {
    if (!this.achievementsList) return;
    
    try {
      // Get earned achievements
      const earnedAchievements = this.achievements.filter(a => a.earned);
      
      // Use UI helper to update the list
      import('./ui.js').then(ui => {
        ui.updateAchievementsList(this, earnedAchievements);
      });
    } catch (error) {
      console.error("Error updating achievements:", error);
    }
  }

  /**
   * Updates the visual display for Grandmas
   */
  updateGrandmasVisual() {
    try {
      if (!this.grandmaProgressBar || !this.grandmaCountDisplay) {
        this.log("Grandma visual elements not found, skipping update");
        return;
      }
      
      const grandmaCount = this.upgrades.grandma?.count || 0;
      const maxGrandmas = 100; // visual cap for progress bar
      
      // Update count display
      this.grandmaCountDisplay.textContent = grandmaCount;
      
      // Update progress bar
      const progressWidth = (grandmaCount / maxGrandmas) * 100;
      this.grandmaProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
      
      // Store last count for comparison in game loop
      this._lastGrandmaCount = grandmaCount;
      
      this.log(`Updated grandma visuals, count: ${grandmaCount}`);
    } catch (error) {
      console.error("Error updating grandma visuals:", error);
    }
  }

  /**
   * Updates the visual display for Auto Clickers
   */
  updateAutoClickersVisual() {
    try {
      if (!this.autoClickersProgressBar || !this.autoClickersCountVisual) {
        this.log("Auto Clicker visual elements not found, skipping update");
        return;
      }
      
      const autoClickerCount = this.upgrades.autoClicker?.count || 0;
      const maxAutoClickers = 100; // visual cap for progress bar
      
      // Update count display
      this.autoClickersCountVisual.textContent = autoClickerCount;
      
      // Update progress bar
      const progressWidth = (autoClickerCount / maxAutoClickers) * 100;
      this.autoClickersProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
      
      // Store last count for comparison in game loop
      this._lastAutoClickerCount = autoClickerCount;
      
      this.log(`Updated auto clicker visuals, count: ${autoClickerCount}`);
    } catch (error) {
      console.error("Error updating auto clicker visuals:", error);
    }
  }

  /**
   * Updates the visual display for Farms
   */
  updateFarmsVisual() {
    try {
      if (!this.farmsProgressBar || !this.farmsCountVisual) {
        this.log("Farm visual elements not found, skipping update");
        return;
      }
      
      const farmCount = this.upgrades.farm?.count || 0;
      const maxFarms = 100; // visual cap for progress bar
      
      // Update count display
      this.farmsCountVisual.textContent = farmCount;
      
      // Update progress bar
      const progressWidth = (farmCount / maxFarms) * 100;
      this.farmsProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
      
      // Store last count for comparison in game loop
      this._lastFarmCount = farmCount;
      
      this.log(`Updated farm visuals, count: ${farmCount}`);
    } catch (error) {
      console.error("Error updating farm visuals:", error);
    }
  }

  // Start the golden cookie timer
  startGoldenCookieTimer(enforceMinCooldown = false) {
    // Clear any existing timer
    if (this.goldenCookieTimer) {
      clearTimeout(this.goldenCookieTimer);
    }

    // Skip if a golden cookie is already active
    if (this.state.goldenCookieActive) {
      return;
    }

    // Minimum and maximum time between golden cookies (in milliseconds)
    const MIN_GOLDEN_COOKIE_TIME = 60000; // 60 seconds minimum
    const MAX_GOLDEN_COOKIE_TIME = 180000; // 3 minutes maximum

    // If we need to enforce a cooldown period (after purchase)
    if (enforceMinCooldown) {
      this.state.lastGoldenCookieTime = Date.now();
    }

    // Calculate time since last golden cookie
    const timeSinceLastCookie = Date.now() - (this.state.lastGoldenCookieTime || 0);

    // Calculate the spawn delay - chance affects the range but respects minimum time
    let delay;
    if (timeSinceLastCookie < MIN_GOLDEN_COOKIE_TIME) {
      // Enforce minimum time between cookies by adding to the elapsed time
      delay = MIN_GOLDEN_COOKIE_TIME - timeSinceLastCookie;
    } else {
      // Calculate random delay based on chance
      const range = MAX_GOLDEN_COOKIE_TIME - MIN_GOLDEN_COOKIE_TIME;
      // Higher chance = lower delay (but never below minimum)
      const chanceModifier = 1 - Math.min(0.9, this.state.goldenCookieChance);
      delay = MIN_GOLDEN_COOKIE_TIME + (range * chanceModifier * Math.random());
    }

    // Schedule next golden cookie spawn
    this.log(`Next golden cookie in ${Math.round(delay / 1000)} seconds (chance: ${this.state.goldenCookieChance})`);
    this.goldenCookieTimer = setTimeout(() => this.spawnGoldenCookie(), delay);
  }

  // Spawn a golden cookie
  spawnGoldenCookie() {
    if (this.state.goldenCookieActive) {
      // Already a cookie active, try again later
      this.startGoldenCookieTimer();
      return;
    }

    // Create golden cookie element
    const goldenCookie = document.createElement('div');
    goldenCookie.className = 'golden-cookie';

    // Position randomly on screen with safe margins
    const margin = 100; // Keep 100px from edges
    const posX = margin + Math.random() * (window.innerWidth - margin * 2);
    const posY = margin + Math.random() * (window.innerHeight - margin * 2);

    goldenCookie.style.left = `${posX}px`;
    goldenCookie.style.top = `${posY}px`;

    // Add click handler
    goldenCookie.addEventListener('click', () => {
      this.handleGoldenCookieClick(goldenCookie);
    });

    // Log the golden cookie container status
    if (!this.goldenCookieContainer) {
      console.error("Golden cookie container not found!");
      return;
    }

    // Add to container
    this.goldenCookieContainer.appendChild(goldenCookie);

    // Set timeout to remove it if not clicked
    const lifespan = 15000; // 15 seconds
    setTimeout(() => {
      this.removeGoldenCookie(goldenCookie);
    }, lifespan);

    this.state.goldenCookieActive = true;
    this.log('Golden cookie spawned');

    // Play a subtle sound to alert the player
    if (this.soundOn) {
      // Play golden cookie sound (if available)
      const goldenSound = new Audio("sounds/golden.mp3");
      goldenSound.volume = 0.3;
      this.safePlaySound(goldenSound);
    }
  }

  // Add method to update boost timers with safety checks
  updateActiveBoostTimers() {
    try {
      const now = Date.now();
      
      // Update time accelerator if active
      if (this.state.timeAcceleratorActive && this.state.timeAcceleratorEndTime) {
        if (now >= this.state.timeAcceleratorEndTime) {
          // Time accelerator has expired
          this.state.timeAcceleratorActive = false;
          this.state.timeAcceleratorMultiplier = 1;
          this.applyTimeAcceleratorVisuals(false);
          this.showToast("Time acceleration has ended");
          this.log("Time accelerator expired");
          
          // Remove visual indicator
          this.removeBonusIndicator('time-accelerator-boost');
        } else {
          // Update time display if needed
          const secondsLeft = Math.floor((this.state.timeAcceleratorEndTime - now) / 1000);
          this.updateBonusIndicator('time-accelerator-boost', null, secondsLeft);
        }
      }
      
      // Check and update golden cookie bonuses
      if (this.state.activeGoldenCookieBonuses) {
        // Click power boosts
        if (this.state.activeGoldenCookieBonuses.clickPower && 
            this.state.activeGoldenCookieBonuses.clickPower.active) {
          
          const clickBoost = this.state.activeGoldenCookieBonuses.clickPower;
          
          if (now >= clickBoost.endTime) {
            // Click boost expired
            clickBoost.active = false;
            this.state.clickPower = clickBoost.originalValue || 1;
            this.applyClickPowerBoostVisuals(false);
            this.showToast("Click power boost has ended");
            this.log("Click power boost expired");
            
            // Remove visual indicator
            this.removeBonusIndicator('click-power-boost');
          } else {
            // Update time display
            const secondsLeft = Math.floor((clickBoost.endTime - now) / 1000);
            this.updateBonusIndicator('click-power-boost', null, secondsLeft);
          }
        }
        
        // Production boosts
        if (this.state.activeGoldenCookieBonuses.production && 
            this.state.activeGoldenCookieBonuses.production.active) {
          
          const prodBoost = this.state.activeGoldenCookieBonuses.production;
          
          if (now >= prodBoost.endTime) {
            // Production boost expired
            prodBoost.active = false;
            this.state.cookieMultiplier = prodBoost.originalValue || 1;
            this.applyProductionBoostVisuals(false);
            this.showToast("Production boost has ended");
            this.log("Production boost expired");
            
            // Remove visual indicator
            this.removeBonusIndicator('production-boost');
          } else {
            // Update time display
            const secondsLeft = Math.floor((prodBoost.endTime - now) / 1000);
            this.updateBonusIndicator('production-boost', null, secondsLeft);
          }
        }
      }
    } catch (error) {
      console.error("Error updating boost timers:", error);
    }
  }

  // Add utility method for applying time accelerator visuals
  applyTimeAcceleratorVisuals(active) {
    // Apply visual effects to cookie
    if (this.cookie) {
      if (active) {
        this.cookie.classList.add('accelerated');
      } else {
        this.cookie.classList.remove('accelerated');
      }
    }
    
    // Apply visual effects to CPS display
    if (this.cpsDisplay) {
      if (active) {
        this.cpsDisplay.classList.add('boosted');
      } else {
        this.cpsDisplay.classList.remove('boosted');
      }
    }
  }

  // Remove golden cookie from screen
  removeGoldenCookie(goldenCookie) {
    if (goldenCookie && goldenCookie.parentNode) {
      goldenCookie.classList.add('golden-cookie-fade');
      setTimeout(() => {
        if (goldenCookie.parentNode) {
          goldenCookie.parentNode.removeChild(goldenCookie);
        }
      }, 1000);
    }
    
    this.state.goldenCookieActive = false;
    this.state.lastGoldenCookieTime = Date.now();
  }

  // Handle golden cookie click
  handleGoldenCookieClick(goldenCookie) {
    // Play sound
    if (this.soundOn) {
      const popSound = new Audio("sounds/pop.mp3");
      popSound.volume = 0.5;
      this.safePlaySound(popSound);
    }
    
    // Add visual effect for click
    goldenCookie.classList.add('golden-cookie-clicked');
    
    // Define possible rewards
    const rewards = [
      {
        type: 'cookies',
        value: () => Math.floor(this.state.cookies * 0.1) + 100, // 10% current cookies + 100
        message: (amount) => `Lucky! +${this.uiManager.formatNumber(amount)} cookies!`,
        weight: 40
      },
      {
        type: 'clickPower',
        value: () => Math.floor(5 + Math.random() * 11), // 5-15 bonus
        message: (amount) => `Click power boosted by +${amount} for 30 seconds!`,
        weight: 30
      },
      {
        type: 'production',
        value: () => 2 + Math.floor(Math.random() * 2), // 2-3x multiplier
        message: () => `Frenzy! Cookie production multiplied for 30 seconds!`,
        weight: 20
      },
      {
        type: 'frenzy',
        value: () => 7, // 7x multiplier
        message: () => `Clicking frenzy! Click power multiplied by 7x for 15 seconds!`,
        weight: 10
      }
    ];
    
    // Choose a reward weighted by the weight property
    let totalWeight = rewards.reduce((sum, reward) => sum + reward.weight, 0);
    let random = Math.random() * totalWeight;
    let reward;
    
    for (const r of rewards) {
      if (random < r.weight) {
        reward = r;
        break;
      }
      random -= r.weight;
    }
    
    // Default to cookies if somehow we didn't select anything
    reward = reward || rewards[0];
    
    // Apply the reward
    switch (reward.type) {
      case 'cookies':
        const amount = reward.value();
        this.state.cookies += amount;
        this.showToast(reward.message(amount));
        this.showFloatingNumber(amount, true);
        break;
        
      case 'clickPower':
        // Store original value and set up temporary boost
        const clickBoost = reward.value();
        
        // Initialize boost object if needed
        if (!this.state.activeGoldenCookieBonuses.clickPower) {
          this.state.activeGoldenCookieBonuses.clickPower = { active: false };
        }
        
        const clickBoostObj = this.state.activeGoldenCookieBonuses.clickPower;
        clickBoostObj.active = true;
        clickBoostObj.originalValue = this.state.clickPower;
        clickBoostObj.bonusValue = clickBoost;
        clickBoostObj.endTime = Date.now() + 30000; // 30 seconds
        
        // Apply boost
        this.state.clickPower += clickBoost;
        this.applyClickPowerBoostVisuals(true);
        
        // Add visual indicator
        this.addBonusIndicator(
          'click-power-boost',
          'click-boost',
          '👆',
          `+${clickBoost} per click`,
          30
        );
        
        this.showToast(reward.message(clickBoost));
        break;
        
      case 'production':
        // Store original value and set up temporary boost
        const prodMultiplier = reward.value();
        
        // Initialize boost object if needed
        if (!this.state.activeGoldenCookieBonuses.production) {
          this.state.activeGoldenCookieBonuses.production = { active: false };
        }
        
        const prodBoostObj = this.state.activeGoldenCookieBonuses.production;
        prodBoostObj.active = true;
        prodBoostObj.originalValue = this.state.cookieMultiplier;
        prodBoostObj.bonusValue = prodMultiplier;
        prodBoostObj.endTime = Date.now() + 30000; // 30 seconds
        
        // Apply boost
        this.state.cookieMultiplier *= prodMultiplier;
        this.applyProductionBoostVisuals(true);
        
        // Add visual indicator
        this.addBonusIndicator(
          'production-boost',
          'production-boost',
          '⚡',
          `${prodMultiplier}x Production`,
          30
        );
        
        this.showToast(reward.message());
        break;
        
      case 'frenzy':
        // Setup clicking frenzy (shorter but more powerful)
        const frenzyMultiplier = reward.value();
        
        // Initialize boost object if needed
        if (!this.state.activeGoldenCookieBonuses.clickPower) {
          this.state.activeGoldenCookieBonuses.clickPower = { active: false };
        }
        
        const frenzyBoostObj = this.state.activeGoldenCookieBonuses.clickPower;
        frenzyBoostObj.active = true;
        frenzyBoostObj.originalValue = this.state.clickPower;
        frenzyBoostObj.bonusValue = this.state.clickPower * (frenzyMultiplier - 1); // Multiply by 7 total
        frenzyBoostObj.endTime = Date.now() + 15000; // 15 seconds
        
        // Apply boost
        this.state.clickPower = this.state.clickPower * frenzyMultiplier;
        this.applyClickingFrenzyVisuals(true);
        
        // Add visual indicator
        this.addBonusIndicator(
          'click-frenzy-boost',
          'click-frenzy',
          '🔥',
          `${frenzyMultiplier}x Clicks`,
          15
        );
        
        this.showToast(reward.message());
        break;
    }
    
    // Remove golden cookie
    this.removeGoldenCookie(goldenCookie);
    
    // Start timer for next golden cookie
    this.startGoldenCookieTimer();
  }

  /**
   * Updates all game display elements with current state
   */
  updateDisplay() {
    try {
      // Import UI functions if needed
      import('./ui.js').then(ui => {
        ui.updateGameDisplay(this);
      }).catch(error => {
        console.error("Error importing UI module for display update:", error);
        // Basic fallback if UI module fails to load
        this.updateBasicDisplay();
      });
    } catch (error) {
      console.error("Error updating display:", error);
      this.updateBasicDisplay(); // Use fallback on error
    }
  }

  /**
   * Basic display update fallback if UI module fails
   */
  updateBasicDisplay() {
    // Update cookie count
    if (this.cookieCount) {
      this.cookieCount.textContent = Math.floor(this.state.cookies).toLocaleString();
    }
    
    // Update document title
    if (this.count) {
      this.count.textContent = Math.floor(this.state.cookies).toLocaleString() + " cookies";
    }
    
    // Update click power display
    if (this.clickPowerDisplay) {
      this.clickPowerDisplay.textContent = this.state.clickPower.toLocaleString();
    }
    
    // Enable/disable buttons based on available cookies
    this.updateButtonStates();
  }

  /**
   * Update all button states based on available cookies
   */
  updateButtonStates() {
    // Make sure we have the state
    if (!this.state || typeof this.state.cookies !== 'number') {
      console.error("Invalid state when updating button states");
      return;
    }
    
    // Get current cookies
    const cookies = this.state.cookies;
    
    // Update standard upgrade buttons
    for (const key in this.upgrades) {
      const btn = document.getElementById(key);
      if (btn && this.upgrades[key]) {
        btn.disabled = cookies < this.upgrades[key].cost;
      }
    }
  }

  /**
   * Shows a toast notification to the user
   * @param {string} message - The message to display
   */
  showToast(message) {
    try {
      console.log("Toast:", message);
      
      // Create toast element
      const toast = document.createElement('div');
      toast.className = 'auto-save-notification';
      toast.textContent = message;
      
      // Add to document
      document.body.appendChild(toast);
      
      // Remove after animation completes
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 3000); // Match the animation duration
    } catch (error) {
      console.error("Error showing toast:", error);
    }
  }

  /**
   * Automatic save function (called by interval)
   */
  autoSave() {
    try {
      // Save the game silently (no notification)
      this.saveGame(true);
      console.log("Game auto-saved");
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }

  /**
   * Creates confetti particles at the given coordinates
   * @param {number} x - X coordinate for the confetti
   * @param {number} y - Y coordinate for the confetti
   */
  createConfetti(x, y) {
    // Use the imported createConfetti function from animation.js
    // Keep track of the last confetti creation time to avoid too many particles
    this.lastConfettiTime = createConfettiEffect(x, y, this.lastConfettiTime);
  }

  /**
   * Apply visual effects for click power boost
   * @param {boolean} active - Whether the boost is active
   */
  applyClickPowerBoostVisuals(active) {
    // Apply visual effects to cookie when click power is boosted
    if (this.cookie) {
      if (active) {
        this.cookie.classList.add('click-boosted');
      } else {
        this.cookie.classList.remove('click-boosted');
      }
    }
    
    // Apply visual effects to click power display
    if (this.clickPowerDisplay) {
      if (active) {
        this.clickPowerDisplay.classList.add('boosted');
      } else {
        this.clickPowerDisplay.classList.remove('boosted');
      }
    }
  }

  /**
   * Apply visual effects for production boost
   * @param {boolean} active - Whether the boost is active
   */
  applyProductionBoostVisuals(active) {
    // Apply visual effects to CPS display during production boost
    if (this.cpsDisplay) {
      if (active) {
        this.cpsDisplay.classList.add('boosted');
      } else {
        this.cpsDisplay.classList.remove('boosted');
      }
    }
  }

  /**
   * Apply visual effects for clicking frenzy
   * @param {boolean} active - Whether the frenzy is active
   */
  applyClickingFrenzyVisuals(active) {
    // Apply visual effects to cookie during clicking frenzy
    if (this.cookie) {
      if (active) {
        this.cookie.classList.add('frenzy-boosted');
      } else {
        this.cookie.classList.remove('frenzy-boosted');
      }
    }
    
    // Apply visual effects to click power display
    if (this.clickPowerDisplay) {
      if (active) {
        this.clickPowerDisplay.classList.add('frenzy');
      } else {
        this.clickPowerDisplay.classList.remove('frenzy');
      }
    }
  }

  /**
   * Save the game state to localStorage
   * @param {boolean} silent - Whether to show a notification
   */
  saveGame(silent = false) {
    try {
      // Create a simplified version of the state to save
      const saveData = {
        cookies: this.state.cookies,
        clickPower: this.state.clickPower,
        cookieMultiplier: this.state.cookieMultiplier,
        goldenCookieChance: this.state.goldenCookieChance,
        timeAcceleratorMultiplier: this.state.timeAcceleratorMultiplier,
        luckyStreak: this.state.luckyStreak,
        personalization: this.state.personalization,
        upgrades: {}
      };
      
      // Save upgrade counts and costs
      for (const key in this.upgrades) {
        saveData.upgrades[key] = {
          count: this.upgrades[key].count,
          cost: this.upgrades[key].cost
        };
      }
      
      // Save achievements
      saveData.achievements = this.achievements.map(a => ({
        id: a.id,
        earned: a.earned
      }));
      
      // Save to localStorage
      localStorage.setItem("cookieGameSave", JSON.stringify(saveData));
      
      if (!silent) {
        this.showToast("Game saved successfully!");
      }
      
      this.log("Game saved to localStorage");
      return true;
    } catch (error) {
      console.error("Error saving game:", error);
      if (!silent) {
        this.showToast("Error saving game!");
      }
      return false;
    }
  }

  /**
   * Save the game silently without notification
   */
  silentSave() {
    return this.saveGame(true);
  }

  /**
   * Purchases a shop upgrade
   * @param {string} upgradeKey - Key of the shop upgrade to purchase
   */
  purchaseShopUpgrade(upgradeKey) {
    try {
      const upgrade = this.shopUpgrades[upgradeKey];
      
      if (!upgrade) {
        console.error(`Shop upgrade ${upgradeKey} not found`);
        return false;
      }
      
      // Check if player can afford the upgrade
      if (this.state.cookies < upgrade.cost) {
        this.log(`Not enough cookies for ${upgrade.displayPrefix}. Need ${upgrade.cost}, have ${this.state.cookies}`);
        this.showToast(`Not enough cookies for ${upgrade.displayPrefix}`);
        return false;
      }
      
      // Apply the purchase
      this.state.cookies -= upgrade.cost;
      
      // Handle specific shop upgrades
      switch (upgradeKey) {
        case 'timeAccelerator':
          this.timeAccelerator(upgrade);
          break;
          
        case 'cookieMultiplier':
          this.applyCookieMultiplier(upgrade);
          break;
          
        case 'goldenCookieChance':
          this.increaseGoldenCookieChance(upgrade);
          break;
          
        default:
          console.warn(`No handler for shop upgrade ${upgradeKey}`);
          return false;
      }
      
      // Update the cost for next time
      upgrade.updateCost();
      
      // Update display
      this.updateDisplay();
      this.updateShopPrices();
      
      return true;
    } catch (error) {
      console.error("Error purchasing shop upgrade:", error);
      return false;
    }
  }

  /**
   * Apply time accelerator effect
   * @param {ShopUpgrade} upgrade - The time accelerator upgrade
   */
  timeAccelerator(upgrade) {
    // Apply effect - 4x production for 60 seconds
    this.state.timeAcceleratorActive = true;
    this.state.timeAcceleratorMultiplier = 4;
    this.state.timeAcceleratorEndTime = Date.now() + 60000;
    
    // Apply visual effects
    this.applyTimeAcceleratorVisuals(true);
    
    // Show notification
    this.showToast("Time Accelerator activated! 4x production for 60 seconds!");
    
    // Add visual indicator
    this.addBonusIndicator(
      'time-accelerator-boost',
      'time-accelerator',
      '⏱️',
      '4x Production Speed',
      60
    );
  }

  /**
   * Apply cookie multiplier effect
   * @param {ShopUpgrade} upgrade - The cookie multiplier upgrade
   */
  applyCookieMultiplier(upgrade) {
    // Boost cookie multiplier by 50%
    this.state.cookieMultiplier = (this.state.cookieMultiplier || 1) * 1.5;
    
    // Show notification
    this.showToast(`Cookie production multiplier increased to ${this.state.cookieMultiplier.toFixed(1)}x!`);
  }

  /**
   * Increase golden cookie chance
   * @param {ShopUpgrade} upgrade - The golden cookie chance upgrade
   */
  increaseGoldenCookieChance(upgrade) {
    // Reduce multiplier from 1.3x to 1.1x for better balance
    const previousChance = this.state.goldenCookieChance;
    this.state.goldenCookieChance = (this.state.goldenCookieChance || 0.1) * 1.1;

    // Show notification with actual percentage
    const previousPercent = Math.round(previousChance * 100);
    const newPercent = Math.round(this.state.goldenCookieChance * 100);
    this.showToast(`Golden cookie chance increased from ${previousPercent}% to ${newPercent}%!`);

    // Restart golden cookie timer with new chance but ensure cooldown
    if (typeof this.startGoldenCookieTimer === 'function') {
      this.startGoldenCookieTimer(true); // Pass true to enforce cooldown
    }
  }

  /**
   * Reset the game to its initial state
   */
  resetGame() {
    try {
      // Confirm with the user before resetting
      if (!confirm("Are you sure you want to reset the game? All progress will be lost!")) {
        return false;
      }
      
      this.log("Resetting game state...");
      
      // Reset game state to initial values
      this.state = {
        cookies: 0,
        clickPower: 1,
        grandmas: 0,
        timeAcceleratorActive: false,
        timeAcceleratorMultiplier: 1,
        timeAcceleratorEndTime: 0,
        luckyStreak: 0,
        cookieMultiplier: 1,
        goldenCookieChance: 0.1,
        goldenCookieActive: false,
        lastGoldenCookieTime: 0,
        personalization: this.state.personalization, // Keep personalization settings
        activeGoldenCookieBonuses: {
          clickPower: {
            active: false,
            originalValue: 1,
            bonusValue: 0,
            endTime: 0
          },
          production: {
            active: false,
            originalValue: 1,
            bonusValue: 0,
            endTime: 0
          }
        }
      };
      
      // Reset upgrade counts and costs
      for (const key in this.upgrades) {
        this.upgrades[key].count = 0;
        // Use the resetToBaseValues method if available, otherwise fall back to basic reset
        if (typeof this.upgrades[key].resetToBaseValues === 'function') {
          this.upgrades[key].resetToBaseValues();
        } else {
          // Fallback if method doesn't exist
          this.upgrades[key].cost = this.upgrades[key].baseCost || this.upgrades[key].cost;
        }
      }
      
      // Reset shop upgrades
      for (const key in this.shopUpgrades) {
        // Use the resetToBaseValues method if available, otherwise fall back to basic reset
        if (typeof this.shopUpgrades[key].resetToBaseValues === 'function') {
          this.shopUpgrades[key].resetToBaseValues();
        } else {
          // Fallback if method doesn't exist
          this.shopUpgrades[key].cost = this.shopUpgrades[key].baseCost || this.shopUpgrades[key].baseCost || this.shopUpgrades[key].cost;
        }
      }
      
      // Reset achievements
      for (const achievement of this.achievements) {
        achievement.earned = false;
      }
      
      // Clear any active bonuses
      this.removeBonusIndicator('time-accelerator-boost');
      this.removeBonusIndicator('click-power-boost');
      this.removeBonusIndicator('production-boost');
      
      // Update tracking variables
      this._lastGrandmaCount = 0;
      this._lastAutoClickerCount = 0;
      this._lastFarmCount = 0;
      
      // Update all visuals
      this.updateDisplay();
      this.updateGrandmasVisual();
      this.updateAutoClickersVisual();
      this.updateFarmsVisual();
      this.updateAchievements();
      
      // Show notification
      this.showToast("Game reset successfully!");
      
      // Save the reset state
      this.saveGame(true);
      
      return true;
    } catch (error) {
      console.error("Error resetting game:", error);
      this.showToast("Error resetting game!");
      return false;
    }
  }

  /**
   * Purchase a standard upgrade by key
   * @param {string} upgradeKey - Key of the upgrade to purchase
   * @returns {boolean} - Whether the purchase was successful
   */
  purchaseStandardUpgrade(upgradeKey) {
    try {
      // Get the upgrade object
      const upgrade = this.upgrades[upgradeKey];
      
      if (!upgrade) {
        console.error(`Upgrade ${upgradeKey} not found`);
        return false;
      }
      
      // Log attempt
      this.log(`Attempting to purchase upgrade: ${upgradeKey}`);
      
      // Call the upgrade's purchase method
      const success = upgrade.purchase(this);
      
      if (success) {
        // Play purchase sound
        if (this.soundOn) {
          const purchaseSound = new Audio("sounds/purchase.mp3");
          purchaseSound.volume = 0.3;
          this.safePlaySound(purchaseSound);
        }
        
        // Check for achievements
        this.checkAchievements();
      }
      
      return success;
    } catch (error) {
      console.error(`Error purchasing upgrade ${upgradeKey}:`, error);
      return false;
    }
  }
}
