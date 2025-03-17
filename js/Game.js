// Core Game class

import { ClickMultiplierUpgrade, IncrementUpgrade, LuckyUpgrade, ShopUpgrade } from './upgrades.js';
import { setupAchievements } from './achievements.js';
import { showFloatingNumber, createConfetti, applyTimeAcceleratorVisuals } from './animation.js';
import { log, showToast, AUTO_SAVE_INTERVAL } from './utils.js';
import { setupEventListeners, updateGameDisplay, updateAchievementsList } from './ui.js';
import { PersonalizationManager } from './personalization.js';

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
      // Add tracking for temporary bonuses
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

    // Initialize upgrades - REBALANCED VALUES
    this.upgrades = {
      clickUpgrade: new ClickMultiplierUpgrade(15, 2.5, "Upgrade Click Power"),  // Was 10, 3 - now more expensive with slower scaling
      autoClicker: new IncrementUpgrade(60, 1.6, "Buy Auto Clicker"),           // Was 50, 1.5 - slightly more expensive
      grandma: new IncrementUpgrade(120, 1.7, "Buy Grandma's Bakery", "updateGrandmasVisual"), // Was 100, 1.5 - more expensive with better scaling
      farm: new IncrementUpgrade(600, 1.8, "Buy Cookie Farm"),                  // Was 500, 1.5 - more expensive with better scaling
      luckyClick: new LuckyUpgrade(25, 1.3, "Lucky Click"),                     // Was 20, 1 - now properly scales in cost
    };

    // Shop upgrades - REBALANCED VALUES
    this.shopUpgrades = {
      timeAccelerator: new ShopUpgrade(1000, 2.8, "Time Accelerator", "timeAccelerator", 1000),  // Increased cost scaling from 2.5 to 2.8
      cookieMultiplier: new ShopUpgrade(2500, 2.2, "Cookie Multiplier", "applyCookieMultiplier", 2500), // Increased base cost from 2000 to 2500
      goldenCookieChance: new ShopUpgrade(3000, 1.9, "Golden Cookie Charm", "increaseGoldenCookieChance", 3000) // Slightly higher cost scaling (1.8 to 1.9)
    };

    // Achievements system
    this.achievements = [];
    this.setupAchievements();

    // Sound settings
    this.soundOn = true;
    this.clickSound = new Audio("sounds/click.mp3");
    this.clickSound.volume = 0.2;
    this.userHasInteracted = false; // Track if user has interacted with the page
    
    // For confetti animation
    this.lastConfettiTime = 0;

    // Initialize personalization manager
    this.personalization = new PersonalizationManager(this);

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

    // Add user interaction detection
    document.addEventListener('click', () => {
      this.userHasInteracted = true;
    }, { once: true });

    // Load and apply personalization settings
    this.initPersonalization();
  }

  log(message, ...data) {
    log(this.debug, message, ...data);
  }

  // Add a safe play method that checks for user interaction first
  safePlaySound(audioElement) {
    if (!this.soundOn) return;
    
    if (this.userHasInteracted) {
      try {
        audioElement.currentTime = 0;
        const playPromise = audioElement.play();
        
        // Handle play() promise to avoid uncaught rejection errors
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Audio play failed:", error);
          });
        }
      } catch (e) {
        console.log("Error playing sound:", e);
      }
    }
  }

  playHoverSound() {
    // Use the safe play method instead of directly playing
    this.safePlaySound(this.clickSound);
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

  // Add a new method to create and manage bonus indicators
  addBonusIndicator(id, type, icon, text, duration = null) {
    // Remove any existing indicator with the same ID
    this.removeBonusIndicator(id);
    
    if (!this.activeBonusesContainer) {
      this.activeBonusesContainer = document.getElementById('activeBonuses');
      if (!this.activeBonusesContainer) {
        console.error("Active bonuses container not found");
        return;
      }
    }
    
    // Create the indicator element
    const indicator = document.createElement('div');
    indicator.id = id;
    indicator.className = `bonus-indicator ${type}`;
    
    // Add icon and text
    indicator.innerHTML = `
      <span class="bonus-icon">${icon}</span>
      <span class="bonus-text">${text}</span>
      ${duration ? `<span class="bonus-timer">${duration}s</span>` : ''}
    `;
    
    // Add to container
    this.activeBonusesContainer.appendChild(indicator);
    
    return indicator;
  }

  // Remove a bonus indicator by ID
  removeBonusIndicator(id) {
    const indicator = document.getElementById(id);
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }

  // Update an existing bonus indicator
  updateBonusIndicator(id, newText = null, newDuration = null) {
    const indicator = document.getElementById(id);
    if (!indicator) return;
    
    if (newText) {
      const textElement = indicator.querySelector('.bonus-text');
      if (textElement) textElement.textContent = newText;
    }
    
    if (newDuration !== null) {
      let timerElement = indicator.querySelector('.bonus-timer');
      if (!timerElement && newDuration) {
        timerElement = document.createElement('span');
        timerElement.className = 'bonus-timer';
        indicator.appendChild(timerElement);
      }
      if (timerElement) {
        timerElement.textContent = `${newDuration}s`;
      }
    }
  }

  handleCookieClick(e) {
    // Set user interaction flag on first click
    this.userHasInteracted = true;
    
    if (this.soundOn) {
      this.safePlaySound(this.clickSound);
    }
    
    // Apply click power boost if active
    let clickPower = this.state.clickPower;
    if (this.state.clickPowerBoostActive && this.state.clickPowerBoostEndTime > Date.now()) {
      clickPower *= this.state.clickPowerBoostMultiplier;
    }
    
    this.state.cookies += clickPower;
    this.log("Cookie clicked. New cookies:", this.state.cookies);
    
    showFloatingNumber(this.cookie, this.state.clickPower);
    this.lastConfettiTime = createConfetti(e.clientX, e.clientY, this.lastConfettiTime);
    
    // Add animation to the cookie count
    if (this.cookieCount) {
      this.cookieCount.classList.add('updating');
      this.cookieCount.classList.add('cookie-gain');
      setTimeout(() => {
        this.cookieCount.classList.remove('updating');
        this.cookieCount.classList.remove('cookie-gain');
      }, 300);
    }
    
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
    // Apply a temporary 2x multiplier for 2 minutes
    const boostDuration = 120000; // 2 minutes in ms
    const boostMultiplier = 2;
    const durationSec = boostDuration / 1000;
    
    // Store the original multiplier
    const originalMultiplier = this.state.cookieMultiplier;
    
    // Apply the multiplier
    this.state.cookieMultiplier *= boostMultiplier;
    
    // Add visual indicator
    this.addBonusIndicator(
      'cookie-multiplier-boost',
      'cookie-multiplier',
      '🍪',
      `${boostMultiplier}x Cookies`,
      durationSec
    );
    
    // Apply production boost visuals
    this.applyProductionBoostVisuals(true);
    
    showToast(`Cookie production multiplied by ${boostMultiplier}x for 2 minutes!`);
    this.log(`Cookie multiplier boosted to ${this.state.cookieMultiplier}x for 2 minutes`);
    
    // Start a timer to update the countdown
    let timeLeft = durationSec;
    const countdownInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
      } else {
        this.updateBonusIndicator('cookie-multiplier-boost', null, timeLeft);
      }
    }, 1000);
    
    // Reset after duration
    setTimeout(() => {
      this.state.cookieMultiplier = originalMultiplier;
      this.applyProductionBoostVisuals(false);
      this.removeBonusIndicator('cookie-multiplier-boost');
      showToast('Cookie multiplier boost has ended.');
      this.updateDisplay();
      clearInterval(countdownInterval);
    }, boostDuration);
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
    
    // Different possible rewards - REBALANCED
    const rewards = [
      {
        type: 'cookies',
        value: () => {
          // Scale with current production rather than total cookies
          const autoClickers = this.upgrades.autoClicker.count || 0;
          const grandmas = this.upgrades.grandma.count || 0;
          const farms = this.upgrades.farm.count || 0;
          const cps = autoClickers * 1 + grandmas * 3 + farms * 6;  // Using rebalanced production values
          
          // Base reward is 30 seconds of production, minimum 50 cookies
          return Math.max(50, Math.floor(cps * 30 * this.state.cookieMultiplier));
        },
        message: (amt) => `Golden cookie grants you ${amt} cookies!`
      },
      {
        type: 'production',
        value: () => 2.5, // 2.5x production for 30 seconds (reduced from 2x)
        message: () => `Golden cookie boosts production by 150% for 30 seconds!`
      },
      {
        type: 'clickPower',
        value: () => Math.ceil(this.state.clickPower * 0.4), // +40% click power (reduced from 50%)
        message: (amt) => `Golden cookie increases click power by ${amt} for 30 seconds!`
      },
      {
        type: 'frenzy', 
        value: () => 7, // New reward: Short frenzy that rewards rapidly clicking
        message: () => `Clicking Frenzy! Click power x7 for 15 seconds!`
      }
    ];
    
    // Select random reward (weighted to avoid too many frenzies)
    let reward;
    const roll = Math.random();
    if (roll < 0.1) { // 10% chance for frenzy
      reward = rewards[3]; // frenzy
    } else {
      // Distribute the remaining rewards evenly
      const idx = Math.floor(Math.random() * 3);
      reward = rewards[idx];
    }
    
    // Apply the reward
    switch (reward.type) {
      case 'cookies':
        // Direct cookie rewards are kept
        const cookieBonus = reward.value();
        this.state.cookies += cookieBonus;
        showToast(reward.message(cookieBonus));
        break;
        
      case 'production':
        // Production boost is temporary
        const multiplier = reward.value();
        const duration = 30; // 30 seconds
        
        // Store original multiplier before applying boost
        this.state.activeGoldenCookieBonuses.production = {
          active: true,
          originalValue: this.state.cookieMultiplier,
          bonusValue: this.state.cookieMultiplier * (multiplier - 1),
          endTime: Date.now() + duration * 1000
        };
        
        // Apply the boost
        this.state.cookieMultiplier *= multiplier;
        showToast(reward.message());
        
        // Add visual indicator
        this.addBonusIndicator(
          'golden-cookie-production-boost',
          'production-boost',
          '✨',
          `${multiplier}x Production`,
          duration
        );
        
        // Apply visual effects
        this.applyProductionBoostVisuals(true);
        
        // Start a timer to update the countdown
        let timeLeft = duration;
        const countdownInterval = setInterval(() => {
          timeLeft--;
          if (timeLeft <= 0) {
            clearInterval(countdownInterval);
          } else {
            this.updateBonusIndicator('golden-cookie-production-boost', null, timeLeft);
          }
        }, 1000);
        
        // Reset after duration
        setTimeout(() => {
          if (this.state.activeGoldenCookieBonuses.production.active) {
            this.state.cookieMultiplier = this.state.activeGoldenCookieBonuses.production.originalValue;
            this.state.activeGoldenCookieBonuses.production.active = false;
            
            // Remove visual effects
            this.applyProductionBoostVisuals(false);
            this.removeBonusIndicator('golden-cookie-production-boost');
            
            showToast('Production boost has ended.');
            this.updateDisplay();
          }
          clearInterval(countdownInterval);
        }, duration * 1000);
        break;
        
      case 'clickPower':
        // Click power boost is temporary
        const powerBonus = reward.value();
        const clickDuration = 30; // 30 seconds
        
        // Store original click power before applying boost
        this.state.activeGoldenCookieBonuses.clickPower = {
          active: true,
          originalValue: this.state.clickPower,
          bonusValue: powerBonus,
          endTime: Date.now() + clickDuration * 1000
        };
        
        // Apply the temporary boost
        this.state.clickPower += powerBonus;
        showToast(reward.message(powerBonus));
        
        // Add visual indicator
        this.addBonusIndicator(
          'golden-cookie-click-boost',
          'click-boost',
          '👆',
          `+${powerBonus} Click`,
          clickDuration
        );
        
        // Apply visual effect for click power boost
        this.applyClickPowerBoostVisuals(true);
        
        // Start a timer to update the countdown
        let clickTimeLeft = clickDuration;
        const clickCountdownInterval = setInterval(() => {
          clickTimeLeft--;
          if (clickTimeLeft <= 0) {
            clearInterval(clickCountdownInterval);
          } else {
            this.updateBonusIndicator('golden-cookie-click-boost', null, clickTimeLeft);
          }
        }, 1000);
        
        // Reset after duration
        setTimeout(() => {
          if (this.state.activeGoldenCookieBonuses.clickPower.active) {
            this.state.clickPower = this.state.activeGoldenCookieBonuses.clickPower.originalValue;
            this.state.activeGoldenCookieBonuses.clickPower.active = false;
            
            // Remove visual effects
            this.applyClickPowerBoostVisuals(false);
            this.removeBonusIndicator('golden-cookie-click-boost');
            
            showToast('Click power boost has ended.');
            this.updateDisplay();
          }
          clearInterval(clickCountdownInterval);
        }, clickDuration * 1000);
        break;
        
      case 'frenzy':
        // Clicking frenzy - massive but short-lived click power boost
        const frenzyMultiplier = reward.value();
        const frenzyDuration = 15; // 15 seconds
        
        // Store original click power before applying boost
        this.state.activeGoldenCookieBonuses.clickPower = {
          active: true,
          originalValue: this.state.clickPower,
          bonusValue: this.state.clickPower * (frenzyMultiplier - 1),
          endTime: Date.now() + frenzyDuration * 1000
        };
        
        // Apply the temporary boost
        this.state.clickPower *= frenzyMultiplier;
        showToast(reward.message());
        
        // Add visual indicator
        this.addBonusIndicator(
          'golden-cookie-frenzy',
          'frenzy',
          '🔥',
          `${frenzyMultiplier}x Click Power`,
          frenzyDuration
        );
        
        // Apply stronger visual effect for clicking frenzy
        this.applyClickingFrenzyVisuals(true);
        
        // Start a timer to update the countdown
        let frenzyTimeLeft = frenzyDuration;
        const frenzyCountdownInterval = setInterval(() => {
          frenzyTimeLeft--;
          if (frenzyTimeLeft <= 0) {
            clearInterval(frenzyCountdownInterval);
          } else {
            this.updateBonusIndicator('golden-cookie-frenzy', null, frenzyTimeLeft);
          }
        }, 1000);
        
        // Reset after duration
        setTimeout(() => {
          if (this.state.activeGoldenCookieBonuses.clickPower.active) {
            this.state.clickPower = this.state.activeGoldenCookieBonuses.clickPower.originalValue;
            this.state.activeGoldenCookieBonuses.clickPower.active = false;
            
            // Remove visual effects
            this.applyClickingFrenzyVisuals(false);
            this.removeBonusIndicator('golden-cookie-frenzy');
            
            showToast('Clicking frenzy has ended.');
            this.updateDisplay();
          }
          clearInterval(frenzyCountdownInterval);
        }, frenzyDuration * 1000);
        break;
    }
    
    // Remove the golden cookie
    this.removeGoldenCookie(goldenCookie);
    
    // Update display
    this.updateDisplay();
    this.checkAchievements();
  }

  // Add new method to handle production boost visuals
  applyProductionBoostVisuals(active) {
    // Apply visual effects to CPS display
    if (this.cpsDisplay) {
      if (active) {
        this.cpsDisplay.style.color = "#ffaa00";
        this.cpsDisplay.style.fontWeight = "bold";
        this.cpsDisplay.style.textShadow = "0 0 5px gold";
      } else {
        this.cpsDisplay.style.color = "";
        this.cpsDisplay.style.fontWeight = "";
        this.cpsDisplay.style.textShadow = "";
      }
    }
    
    // Add a visual indicator in the stats area
    const statsDiv = document.querySelector('.stats');
    
    // Remove any existing indicator first
    const existingIndicator = document.getElementById('production-boost-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    // Add new indicator if boost is active
    if (active && statsDiv) {
      const boost = document.createElement('div');
      boost.id = 'production-boost-indicator';
      boost.innerHTML = '⚡ Production Boost Active! ⚡';
      boost.style.color = '#ffaa00';
      boost.style.fontWeight = 'bold';
      boost.style.marginTop = '5px';
      boost.style.animation = 'pulse 1s infinite alternate';
      statsDiv.appendChild(boost);
    }
  }

  // Add new method to handle click power boost visuals
  applyClickPowerBoostVisuals(active) {
    // Apply visual effects to click power display
    if (this.clickPowerDisplay) {
      if (active) {
        this.clickPowerDisplay.style.color = "#ff6600";
        this.clickPowerDisplay.style.fontWeight = "bold";
        this.clickPowerDisplay.style.textShadow = "0 0 5px orange";
      } else {
        this.clickPowerDisplay.style.color = "";
        this.clickPowerDisplay.style.fontWeight = "";
        this.clickPowerDisplay.style.textShadow = "";
      }
    }
    
    // Apply visual effect to cookie
    if (this.cookie && active) {
      this.cookie.classList.add('click-boosted');
    } else if (this.cookie) {
      this.cookie.classList.remove('click-boosted');
    }
    
    // Add a visual indicator in the stats area
    const statsDiv = document.querySelector('.stats');
    
    // Remove any existing indicator first
    const existingIndicator = document.getElementById('click-boost-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    // Add new indicator if boost is active
    if (active && statsDiv) {
      const boost = document.createElement('div');
      boost.id = 'click-boost-indicator';
      boost.innerHTML = '👆 Click Power Boost Active! 👆';
      boost.style.color = '#ff6600';
      boost.style.fontWeight = 'bold';
      boost.style.marginTop = '5px';
      boost.style.animation = 'pulse 1s infinite alternate';
      statsDiv.appendChild(boost);
    }
  }

  // New method for clicking frenzy visuals
  applyClickingFrenzyVisuals(active) {
    // Apply intense effects to cookie
    if (this.cookie) {
      if (active) {
        this.cookie.classList.add('frenzy-boosted');
        this.cookie.style.filter = "brightness(1.8) saturate(1.5) drop-shadow(0 0 15px crimson)";
        this.cookie.style.transform = "scale(1.15)";
      } else {
        this.cookie.classList.remove('frenzy-boosted');
        this.cookie.style.filter = "";
        this.cookie.style.transform = "";
      }
    }
    
    // Apply effects to click power display
    if (this.clickPowerDisplay) {
      if (active) {
        this.clickPowerDisplay.style.color = "#ff0000";
        this.clickPowerDisplay.style.fontWeight = "bold";
        this.clickPowerDisplay.style.textShadow = "0 0 8px red";
        this.clickPowerDisplay.style.fontSize = "1.2em";
      } else {
        this.clickPowerDisplay.style.color = "";
        this.clickPowerDisplay.style.fontWeight = "";
        this.clickPowerDisplay.style.textShadow = "";
        this.clickPowerDisplay.style.fontSize = "";
      }
    }
    
    // Add a frenzy indicator in the stats area
    const statsDiv = document.querySelector('.stats');
    
    // Remove any existing indicator first
    const existingIndicator = document.getElementById('frenzy-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    // Add new indicator if boost is active
    if (active && statsDiv) {
      const boost = document.createElement('div');
      boost.id = 'frenzy-indicator';
      boost.innerHTML = '🔥 CLICKING FRENZY! 🔥';
      boost.style.color = '#ff0000';
      boost.style.fontWeight = 'bold';
      boost.style.marginTop = '5px';
      boost.style.animation = 'pulse 0.5s infinite alternate';
      boost.style.fontSize = '1.2em';
      statsDiv.appendChild(boost);
    }
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
      
      // Core cookie calculation logic with REBALANCED VALUES
      const autoClickers = this.upgrades.autoClicker.count || 0;
      const grandmas = this.upgrades.grandma.count || 0;
      const farms = this.upgrades.farm.count || 0;
      
      // Reduced CPS values for better game balance
      let cps = autoClickers * 1 + grandmas * 3 + farms * 6;  // Changed from 5 and 10 to 3 and 6
      
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
    
    // Add null check before updating timers
    if (this.state && this.state.activeGoldenCookieBonuses) {
      this.updateActiveBoostTimers();
    }
    
    // Update click power boost visuals if implemented
    if (this.state.clickPowerBoostActive && this.state.clickPowerBoostEndTime > Date.now()) {
      const secondsLeft = Math.floor((this.state.clickPowerBoostEndTime - Date.now()) / 1000);
      
      // Add a visual indicator
      if (!document.getElementById('click-boost-indicator')) {
        const boostIndicator = document.createElement('div');
        boostIndicator.id = 'click-boost-indicator';
        boostIndicator.innerHTML = `Click Power x${this.state.clickPowerBoostMultiplier} (${secondsLeft}s)`;
        const statsDiv = document.querySelector('.stats');
        if (statsDiv) statsDiv.appendChild(boostIndicator);
      } else {
        const indicator = document.getElementById('click-boost-indicator');
        indicator.innerHTML = `Click Power x${this.state.clickPowerBoostMultiplier} (${secondsLeft}s)`;
      }
      
      // Add visual effect to click power display
      if (this.clickPowerDisplay) {
        this.clickPowerDisplay.classList.add('boosted');
      }
    } else {
      // Remove the indicator when boost ends
      const indicator = document.getElementById('click-boost-indicator');
      if (indicator) indicator.remove();
      
      // Remove visual effect from click power display
      if (this.clickPowerDisplay) {
        this.clickPowerDisplay.classList.remove('boosted');
      }
    }
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

      // Initialize activeGoldenCookieBonuses with default values if not in saved data
      if (!savedGame.state.activeGoldenCookieBonuses) {
        savedGame.state.activeGoldenCookieBonuses = {
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
        };
      }

      // Load main state
      this.state = savedGame.state || this.state;

      // Ensure activeGoldenCookieBonuses is properly structured
      if (!this.state.activeGoldenCookieBonuses) {
        this.state.activeGoldenCookieBonuses = {
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
        };
      }

      // Reinitialize upgrades using class constructors and override with saved data
      if (typeof savedGame.upgrades === "object") {
        this.upgrades = {
          clickUpgrade: new ClickMultiplierUpgrade(15, 2.5, "Upgrade Click Power"),  // Was 10, 3 - now more expensive with slower scaling
          autoClicker: new IncrementUpgrade(60, 1.6, "Buy Auto Clicker"),           // Was 50, 1.5 - slightly more expensive
          grandma: new IncrementUpgrade(120, 1.7, "Buy Grandma's Bakery", "updateGrandmasVisual"), // Was 100, 1.5 - more expensive with better scaling
          farm: new IncrementUpgrade(600, 1.8, "Buy Cookie Farm"),                  // Was 500, 1.5 - more expensive with better scaling
          luckyClick: new LuckyUpgrade(25, 1.3, "Lucky Click"),                     // Was 20, 1 - now properly scales in cost
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
          timeAccelerator: new ShopUpgrade(1000, 2.8, "Time Accelerator", "timeAccelerator", 1000),  // Increased cost scaling from 2.5 to 2.8
          cookieMultiplier: new ShopUpgrade(2500, 2.2, "Cookie Multiplier", "applyCookieMultiplier", 2500), // Increased base cost from 2000 to 2500
          goldenCookieChance: new ShopUpgrade(3000, 1.9, "Golden Cookie Charm", "increaseGoldenCookieChance", 3000) // Slightly higher cost scaling (1.8 to 1.9)
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
      },
      // Ensure activeGoldenCookieBonuses is properly initialized
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
    
    this.upgrades = {
      clickUpgrade: new ClickMultiplierUpgrade(15, 2.5, "Upgrade Click Power"),  // Was 10, 3 - now more expensive with slower scaling
      autoClicker: new IncrementUpgrade(60, 1.6, "Buy Auto Clicker"),           // Was 50, 1.5 - slightly more expensive
      grandma: new IncrementUpgrade(120, 1.7, "Buy Grandma's Bakery", "updateGrandmasVisual"), // Was 100, 1.5 - more expensive with better scaling
      farm: new IncrementUpgrade(600, 1.8, "Buy Cookie Farm"),                  // Was 500, 1.5 - more expensive with better scaling
      luckyClick: new LuckyUpgrade(25, 1.3, "Lucky Click"),                     // Was 20, 1 - now properly scales in cost
    };
    
    this.shopUpgrades = {
      timeAccelerator: new ShopUpgrade(1000, 2.8, "Time Accelerator", "timeAccelerator", 1000),  // Increased cost scaling from 2.5 to 2.8
      cookieMultiplier: new ShopUpgrade(2500, 2.2, "Cookie Multiplier", "applyCookieMultiplier", 2500), // Increased base cost from 2000 to 2500
      goldenCookieChance: new ShopUpgrade(3000, 1.9, "Golden Cookie Charm", "increaseGoldenCookieChance", 3000) // Slightly higher cost scaling (1.8 to 1.9)
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

  // Add method to update boost timers with safety checks
  updateActiveBoostTimers() {
    const now = Date.now();
    
    // Check time accelerator status and update the indicator if needed
    if (this.state.timeAcceleratorActive && this.state.timeAcceleratorEndTime > now) {
      const timeLeft = Math.max(0, Math.floor((this.state.timeAcceleratorEndTime - now) / 1000));
      this.updateBonusIndicator('time-accelerator-bonus', null, timeLeft);
    } else if (this.state.timeAcceleratorActive && this.state.timeAcceleratorEndTime <= now) {
      // Time accelerator has expired but wasn't properly deactivated
      this.state.timeAcceleratorActive = false;
      this.state.timeAcceleratorMultiplier = 1;
      this.removeBonusIndicator('time-accelerator-bonus');
      
      // Remove cookie animation
      if (this.cookie) {
        this.cookie.classList.remove('accelerated');
      }
      
      // Remove CPS display effect
      if (this.cpsDisplay) {
        this.cpsDisplay.classList.remove('boosted');
      }
    }
    
    // Check if activeGoldenCookieBonuses and its properties exist before accessing
    if (this.state.activeGoldenCookieBonuses && this.state.activeGoldenCookieBonuses.production && 
        this.state.activeGoldenCookieBonuses.production.active) {
      const timeLeft = Math.max(0, Math.floor((this.state.activeGoldenCookieBonuses.production.endTime - now) / 1000));
      
      if (timeLeft > 0) {
        this.updateBonusIndicator('golden-cookie-production-boost', null, timeLeft);
      } else {
        // Boost has expired
        this.state.cookieMultiplier = this.state.activeGoldenCookieBonuses.production.originalValue;
        this.state.activeGoldenCookieBonuses.production.active = false;
        this.applyProductionBoostVisuals(false);
        this.removeBonusIndicator('golden-cookie-production-boost');
      }
      
      // Add 'boosted' class to CPS display
      if (this.cpsDisplay) {
        this.cpsDisplay.classList.add('boosted');
      }
    } else if (this.cpsDisplay) {
      this.cpsDisplay.classList.remove('boosted');
    }
    
    // Check if activeGoldenCookieBonuses and its properties exist before accessing
    if (this.state.activeGoldenCookieBonuses && this.state.activeGoldenCookieBonuses.clickPower && 
        this.state.activeGoldenCookieBonuses.clickPower.active) {
      const timeLeft = Math.max(0, Math.floor((this.state.activeGoldenCookieBonuses.clickPower.endTime - now) / 1000));
      
      // Check which boost it is - frenzy or regular click boost - and update the correct indicator
      if (this.state.activeGoldenCookieBonuses.clickPower.bonusValue >= this.state.activeGoldenCookieBonuses.clickPower.originalValue) {
        // This is a frenzy (multiplier effect)
        if (timeLeft > 0) {
          this.updateBonusIndicator('golden-cookie-frenzy', null, timeLeft);
        } else {
          // Boost has expired
          this.state.clickPower = this.state.activeGoldenCookieBonuses.clickPower.originalValue;
          this.state.activeGoldenCookieBonuses.clickPower.active = false;
          this.applyClickingFrenzyVisuals(false);
          this.removeBonusIndicator('golden-cookie-frenzy');
        }
      } else {
        // This is a regular click boost (additive effect)
        if (timeLeft > 0) {
          this.updateBonusIndicator('golden-cookie-click-boost', null, timeLeft);
        } else {
          // Boost has expired
          this.state.clickPower = this.state.activeGoldenCookieBonuses.clickPower.originalValue;
          this.state.activeGoldenCookieBonuses.clickPower.active = false;
          this.applyClickPowerBoostVisuals(false);
          this.removeBonusIndicator('golden-cookie-click-boost');
        }
      }
      
      // Add 'boosted' class to click power display
      if (this.clickPowerDisplay) {
        this.clickPowerDisplay.classList.add('boosted');
      }
    } else if (this.clickPowerDisplay) {
      this.clickPowerDisplay.classList.remove('boosted');
    }
  }

  // Modified timeAccelerator method to use the new indicator system
  timeAccelerator(item) {
    const baseCost = item.baseCost || 1000;
    const minDuration = 30; // 30 seconds - shorter base duration
    const maxDuration = 60; // 1 minute max
    let duration = minDuration + (item.cost - baseCost) * 0.05;
    duration = Math.min(duration, maxDuration);

    this.state.timeAcceleratorActive = true;
    this.state.timeAcceleratorMultiplier = 4; // 4x multiplier
    this.state.timeAcceleratorEndTime = Date.now() + duration * 1000;

    // Add visual indicator
    this.addBonusIndicator(
      'time-accelerator-bonus',
      'time-accelerator',
      '⚡',
      '4x Production',
      Math.floor(duration)
    );
    
    // Apply cookie animation effect
    if (this.cookie) {
      this.cookie.classList.add('accelerated');
    }
    
    // Apply CPS display effect
    if (this.cpsDisplay) {
      this.cpsDisplay.classList.add('boosted');
    }
    
    this.log(
      "Time Accelerator activated for",
      duration,
      "seconds, multiplier:",
      this.state.timeAcceleratorMultiplier
    );
    this.showToast(`Time Accelerator activated! 4x production for ${Math.floor(duration)} seconds!`);

    // Start a timer to update the countdown
    let timeLeft = Math.floor(duration);
    const countdownInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
      } else {
        this.updateBonusIndicator('time-accelerator-bonus', null, timeLeft);
      }
    }, 1000);

    setTimeout(() => {
      this.state.timeAcceleratorActive = false;
      this.state.timeAcceleratorMultiplier = 1;
      this.state.timeAcceleratorEndTime = 0;
      
      // Remove visual indicator
      this.removeBonusIndicator('time-accelerator-bonus');
      
      // Remove cookie animation
      if (this.cookie) {
        this.cookie.classList.remove('accelerated');
      }
      
      // Remove CPS display effect
      if (this.cpsDisplay) {
        this.cpsDisplay.classList.remove('boosted');
      }
      
      this.log("Time Accelerator expired");
      this.showToast("Time Accelerator expired");
      clearInterval(countdownInterval);
    }, duration * 1000);
  }

  initPersonalization() {
    try {
      // Load personalization settings from game state
      this.personalization.loadFromGameState();
      
      // Link particle intensity slider if it exists
      const intensitySlider = document.getElementById('particle-intensity');
      const intensityValue = document.getElementById('intensity-value');
      
      if (intensitySlider && intensityValue) {
        // Set initial value from current settings
        intensitySlider.value = this.state.personalization?.particleIntensity || 1.0;
        intensityValue.textContent = intensitySlider.value;
        
        // Update when slider changes
        intensitySlider.addEventListener('input', () => {
          const value = parseFloat(intensitySlider.value);
          intensityValue.textContent = value.toFixed(1);
          this.personalization.setParticleIntensity(value);
          this.saveGame(); // Save settings when changed
        });
      }
      
      this.log("Personalization system initialized");
    } catch (e) {
      this.log("Error initializing personalization:", e);
    }
  }
}
