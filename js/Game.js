// Core Game class

import { ClickMultiplierUpgrade, IncrementUpgrade, LuckyUpgrade, ShopUpgrade } from './upgrades.js';
import { setupAchievements } from './achievements.js';
import { showFloatingNumber, createConfetti, applyTimeAcceleratorVisuals,dropCookieImage} from './animation.js';
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
      // New upgrades
      mine: new IncrementUpgrade(3000, 1.9, "Buy Cookie Mine", "updateMinesVisual"),
      factory: new IncrementUpgrade(10000, 2.0, "Buy Cookie Factory", "updateFactoriesVisual"),
      bank: new IncrementUpgrade(30000, 2.1, "Buy Cookie Bank", "updateBanksVisual"), 
      temple: new IncrementUpgrade(100000, 2.2, "Buy Cookie Temple", "updateTemplesVisual"),
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
    // New upgrade buttons
    this.mineButton = document.getElementById("mine");
    this.factoryButton = document.getElementById("factory");
    this.bankButton = document.getElementById("bank");
    this.templeButton = document.getElementById("temple");
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
    // New visualization elements
    this.mineProgressBar = document.getElementById("mineProgressBar");
    this.mineCountDisplay = document.getElementById("mineCount");
    this.factoryProgressBar = document.getElementById("factoryProgressBar");
    this.factoryCountDisplay = document.getElementById("factoryCount");
    this.bankProgressBar = document.getElementById("bankProgressBar");
    this.bankCountDisplay = document.getElementById("bankCount");
    this.templeProgressBar = document.getElementById("templeProgressBar");
    this.templeCountDisplay = document.getElementById("templeCount");

    // Create container for golden cookies
    this.goldenCookieContainer = document.createElement('div');
    this.goldenCookieContainer.id = 'goldenCookieContainer';
    document.body.appendChild(this.goldenCookieContainer);

    // Initialize the active bonuses container
    this.activeBonusesContainer = document.getElementById('activeBonuses');
    if (!this.activeBonusesContainer) {
      // Create the container if it doesn't exist
      this.activeBonusesContainer = document.createElement('div');
      this.activeBonusesContainer.id = 'activeBonuses';
      document.body.appendChild(this.activeBonusesContainer);
    }

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

    const cookieImageInterval = setInterval(() => {
      // Get your production values
      const autoClickers = this.upgrades.autoClicker.count || 0;
      const grandmas = this.upgrades.grandma.count || 0;
      const farms = this.upgrades.farm.count || 0;
      const baseCps = autoClickers * 1 + grandmas * 3 + farms * 6;
      
      // Use the rate limiter
      const particleRate = this.limitParticleRate(baseCps);
      
      // Only create a limited number of particles
      for(let i = 0; i < particleRate; i++) {
        dropCookieImage();
      }
    }, 1000);
    
    // Store the interval ID for cleanup later
    this.cookieImageInterval = cookieImageInterval;

    // Replace the existing setInterval with our improved cookie spawning system
    if (this.cookieImageInterval) {
      clearInterval(this.cookieImageInterval);
    }

    // Schedule cookie animations based on game progress
    this.cookieImageInterval = setInterval(() => {
      // Get production values - consider all buildings now
      const autoClickers = this.upgrades.autoClicker.count || 0;
      const grandmas = this.upgrades.grandma.count || 0;
      const farms = this.upgrades.farm.count || 0;
      const mines = this.upgrades.mine.count || 0;
      const factories = this.upgrades.factory.count || 0;
      const banks = this.upgrades.bank.count || 0;
      const temples = this.upgrades.temple.count || 0;
      
      // Calculate base CPS from all production buildings
      let cps = autoClickers * 1 + 
                grandmas * 3 + 
                farms * 6 +
                mines * 12 +
                factories * 25 +
                temples * 80;
                
      // Apply bank bonus if present
      if (banks > 0) {
        cps += (this.state.cookies * 0.0005) * banks;
      }
      
      // Apply any multipliers
      cps *= this.state.cookieMultiplier || 1;
      
      // Apply time accelerator if active
      if (this.state.timeAcceleratorActive) {
        cps *= this.state.timeAcceleratorMultiplier;
      }
      
      // Get the game phase by checking total CPS
      let gamePhase = 'early';
      if (cps > 1000) gamePhase = 'late';
      else if (cps > 100) gamePhase = 'mid';
      
      // Scale cookie drop rate based on CPS with diminishing returns
      // This prevents excessive cookies at high CPS values
      const scaledRate = Math.min(12, Math.ceil(Math.log10(cps + 1) * 2));
      
      // Use our improved rate limiter
      const cookieRate = this.limitCookieRate(scaledRate, gamePhase);
      
      // Spawn the determined number of cookies with appropriate sizing
      for (let i = 0; i < cookieRate; i++) {
        // Vary cookie sizes based on game phase
        const sizes = ['tiny', 'small', 'normal'];
        
        if (gamePhase === 'mid') {
          sizes.push('normal', 'large');  // More medium/large in mid-game
        }
        else if (gamePhase === 'late') {
          sizes.push('normal', 'large', 'large', 'huge');  // More large/huge in late-game
        }
        
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        
        // Speed up cookies during active boosts
        let speed = 1.0;
        if (this.state.timeAcceleratorActive) {
          speed = 1.5;  // 50% faster during time acceleration
        }
        
        // Spawn the cookie with appropriate parameters
        dropCookieImage(speed, size);
      }
    }, 1000);  // Update every second
  }

  // Add a safe play method that checks for user interaction first
  limitParticleRate(cps) {
    // Cap CPS-based particles at a reasonable rate
    // For every 10 CPS, show 1 particle per second, up to a maximum
    const MAX_PARTICLES_PER_SECOND = 10;
    
    return Math.min(Math.floor(cps / 10), MAX_PARTICLES_PER_SECOND);
  }

  // Add a new method to create and manage bonus indicators
  addBonusIndicator(id, type, icon, text, duration = null) {
    // Remove any existing indicator with the same ID
    this.removeBonusIndicator(id);
    
    if (!this.activeBonusesContainer) {
      this.activeBonusesContainer = document.getElementById('activeBonuses');
      if (!this.activeBonusesContainer) {
        // Create the container if it doesn't exist
        this.activeBonusesContainer = document.createElement('div');
        this.activeBonusesContainer.id = 'activeBonuses';
        document.body.appendChild(this.activeBonusesContainer);
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
    
    // Add small cookie shower effect on click with 10% chance
    if (Math.random() < 0.1) {
      const intensity = this.state.personalization?.particleIntensity || 1.0;
      createCookieShower(Math.min(10, this.state.clickPower), 1000, intensity * 0.5);
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
        dropCookieImage();
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

  // Spawn a golden cookie with improved positioning and tracking
  spawnGoldenCookie() {
    // Force reset golden cookie active state for manual spawning
    if (this.state.goldenCookieActive) {
      console.log("Golden cookie was already active. Removing existing one...");
      document.querySelectorAll('.golden-cookie').forEach(cookie => {
        if (cookie && cookie.parentNode) {
          cookie.parentNode.removeChild(cookie);
        }
      });
    }
    
    this.state.goldenCookieActive = true;
    console.log('Spawning golden cookie!');
    
    // Create the golden cookie element with enhanced visibility for debugging
    const goldenCookie = document.createElement('div');
    goldenCookie.className = 'golden-cookie';
    
    // Random position on screen - keep away from edges
    const padding = 100;
    // Use viewport dimensions to ensure it stays within visible area
    const maxX = Math.min(window.innerWidth, document.documentElement.clientWidth) - padding*2;
    const maxY = Math.min(window.innerHeight, document.documentElement.clientHeight) - padding*2;
    const posX = Math.floor(Math.random() * maxX) + padding;
    const posY = Math.floor(Math.random() * maxY) + padding;
    
    goldenCookie.style.left = `${posX}px`;
    goldenCookie.style.top = `${posY}px`;
    
    // Make it more obvious for debugging
    goldenCookie.innerHTML = `
      <span style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); 
      color:#fff; font-weight:bold; font-size:16px; text-shadow:0 0 3px black; pointer-events:none;">
        Click me!
      </span>
    `;
    
    // Add click handler with debugging info and IMPROVED CLICK PROTECTION
    const clickHandler = (e) => {
      // Prevent event from bubbling up
      e.stopPropagation();
      
      // Only handle if still active
      if (!this.state.goldenCookieActive) return;
      
      console.log('Golden cookie clicked!');
      
      // Immediately prevent further clicks
      goldenCookie.removeEventListener('click', clickHandler);
      goldenCookie.style.pointerEvents = 'none';
      
      // Handle the click
      this.handleGoldenCookieClick(goldenCookie);
    };
    
    goldenCookie.addEventListener('click', clickHandler);
    
    // Make sure the container exists
    if (!this.goldenCookieContainer) {
      console.error('Golden cookie container is missing! Creating it now...');
      this.goldenCookieContainer = document.createElement('div');
      this.goldenCookieContainer.id = 'goldenCookieContainer';
      this.goldenCookieContainer.style.position = 'fixed';
      this.goldenCookieContainer.style.top = '0';
      this.goldenCookieContainer.style.left = '0';
      this.goldenCookieContainer.style.width = '100%';
      this.goldenCookieContainer.style.height = '100%';
      this.goldenCookieContainer.style.zIndex = '999';
      this.goldenCookieContainer.style.pointerEvents = 'none';
      document.body.appendChild(this.goldenCookieContainer);
    }
    
    // Add this important style to make the golden cookie clickable
    goldenCookie.style.pointerEvents = 'auto';
    
    // Add to container
    this.goldenCookieContainer.appendChild(goldenCookie);
    
    // Auto-disappear after 15 seconds
    setTimeout(() => {
      if (goldenCookie.parentNode) {
        console.log('Golden cookie expired without being clicked');
        this.removeGoldenCookie(goldenCookie);
      }
    }, 15000);
    
    console.log('Golden cookie spawned at position:', posX, posY);
    console.log('Golden cookie element:', goldenCookie);
    
    return goldenCookie;
  }

  // Handle golden cookie click with improved removal
  handleGoldenCookieClick(goldenCookie) {
    // Important: Check if the cookie is still active and immediately set to inactive
    // This prevents multiple clicks/rewards from the same cookie
    if (!this.state.goldenCookieActive) return;
    
    // Immediately mark as inactive and remove visually to prevent multiple clicks
    this.state.goldenCookieActive = false;
    
    // Add a class to disable pointer events immediately
    goldenCookie.classList.add('clicked');
    goldenCookie.style.pointerEvents = 'none';
    
    // Move the intensity declaration outside the switch statement
    const intensity = this.state.personalization?.particleIntensity || 1.0;
    
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

        // Add a cookie shower effect matching the reward size
        // Use the intensity declared above
        createCookieShower(cookieBonus / 30, 3000, intensity);
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
            dropCookieImage();
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
            dropCookieImage();
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
            dropCookieImage();
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

        // Add a dramatic cookie shower for frenzy boost
        // Use the intensity declared above rather than redeclaring it
        createCookieShower(50, 5000, intensity * 2);
        break;
    }
    
    // Remove the golden cookie immediately after handling the click
    this.removeGoldenCookie(goldenCookie);
    
    // Update display
    this.updateDisplay();
    this.checkAchievements();
  }

  // Improved golden cookie removal to ensure it's always removed
  removeGoldenCookie(goldenCookie) {
    if (goldenCookie) {
      // First disable pointer events to prevent further clicks during removal
      goldenCookie.style.pointerEvents = 'none';
      
      // Remove from DOM
      if (goldenCookie.parentNode) {
        goldenCookie.parentNode.removeChild(goldenCookie);
      }
      
      // Also remove any other golden cookies that may have been created
      document.querySelectorAll('.golden-cookie').forEach(cookie => {
        if (cookie.parentNode) {
          cookie.parentNode.removeChild(cookie);
        }
      });
    }
    
    // Update game state
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
      const mines = this.upgrades.mine.count || 0;
      const factories = this.upgrades.factory.count || 0;
      const banks = this.upgrades.bank.count || 0;
      const temples = this.upgrades.temple.count || 0;
      
      // Reduced CPS values for better game balance
      let cps = autoClickers * 1 + 
                grandmas * 3 + 
                farms * 6 +
                mines * 12 +
                factories * 25 +
                temples * 80;
      
      // Banks generate cookies based on current total (like interest)
      if (banks > 0) {
        // 0.05% of total cookies per second per bank
        cps += (this.state.cookies * 0.0005) * banks;
      }
      
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
        
        // This part needs to be changed to use our new rate limiting
        // Find the code where cookies are dropped in the game loop
        const autoClickers = this.upgrades.autoClicker.count || 0;
        const grandmas = this.upgrades.grandma.count || 0;
        const farms = this.upgrades.farm.count || 0;
        const mines = this.upgrades.mine.count || 0;
        const factories = this.upgrades.factory.count || 0;
        // ...other production buildings...
        
        let baseCps = autoClickers * 1 + grandmas * 3 + farms * 6 + mines * 12 + factories * 25; // etc
        
        // Apply rate limiting to avoid excessive particles
        const particleRate = this.limitParticleRate(baseCps);
        
        // Only drop particles at the limited rate, scaled to update interval
        const particlesToDrop = Math.floor(particleRate * (UPDATE_INTERVAL / 1000));
        
        // Create the limited number of particles
        for (let i = 0; i < particlesToDrop; i++) {
          dropCookieImage();
        }
        
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

    // Define cookies variable before using it
    const cookies = this.state.cookies || 0;

    this.clickUpgradeButton.disabled = cookies < this.upgrades.clickUpgrade.cost;
    this.autoClickerButton.disabled = cookies < this.upgrades.autoClicker.cost;
    this.grandmaButton.disabled = cookies < this.upgrades.grandma.cost;
    this.farmButton.disabled = cookies < this.upgrades.farm.cost;
    // Add new buttons
    this.mineButton.disabled = cookies < this.upgrades.mine.cost;
    this.factoryButton.disabled = cookies < this.upgrades.factory.cost;
    this.bankButton.disabled = cookies < this.upgrades.bank.cost;
    this.templeButton.disabled = cookies < this.upgrades.temple.cost;
    this.luckyClickButton.disabled = cookies < this.upgrades.luckyClick.cost;
    
    // ...existing code...
    
    // Also update the new building visuals
    this.updateMinesVisual();
    this.updateFactoriesVisual();
    this.updateBanksVisual(); 
    this.updateTemplesVisual();
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

  updateMinesVisual() {
    const maxMines = 100;
    const count = this.upgrades.mine.count || 0;
    const progressWidth = (count / maxMines) * 100;
    
    if (this.mineProgressBar) {
      this.mineProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
    }
    
    if (this.mineCountDisplay) {
      this.mineCountDisplay.textContent = count;
    }
  }

  updateFactoriesVisual() {
    const maxFactories = 100;
    const count = this.upgrades.factory.count || 0;
    const progressWidth = (count / maxFactories) * 100;
    
    if (this.factoryProgressBar) {
      this.factoryProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
    }
    
    if (this.factoryCountDisplay) {
      this.factoryCountDisplay.textContent = count;
    }
  }

  updateBanksVisual() {
    const maxBanks = 100;
    const count = this.upgrades.bank.count || 0;
    const progressWidth = (count / maxBanks) * 100;
    
    if (this.bankProgressBar) {
      this.bankProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
    }
    
    if (this.bankCountDisplay) {
      this.bankCountDisplay.textContent = count;
    }
  }

  updateTemplesVisual() {
    const maxTemples = 100;
    const count = this.upgrades.temple.count || 0;
    const progressWidth = (count / maxTemples) * 100;
    
    if (this.templeProgressBar) {
      this.templeProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
    }
    
    if (this.templeCountDisplay) {
      this.templeCountDisplay.textContent = count;
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
  
  // New silent save method - saves without showing a toast notification
  silentSave() {
    this.doSaveGame();
    this.log("Silent save complete - no notification shown");
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
          // New upgrades
          mine: new IncrementUpgrade(3000, 1.9, "Buy Cookie Mine", "updateMinesVisual"),
          factory: new IncrementUpgrade(10000, 2.0, "Buy Cookie Factory", "updateFactoriesVisual"),
          bank: new IncrementUpgrade(30000, 2.1, "Buy Cookie Bank", "updateBanksVisual"), 
          temple: new IncrementUpgrade(100000, 2.2, "Buy Cookie Temple", "updateTemplesVisual"),
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
      // New upgrades
      mine: new IncrementUpgrade(3000, 1.9, "Buy Cookie Mine", "updateMinesVisual"),
      factory: new IncrementUpgrade(10000, 2.0, "Buy Cookie Factory", "updateFactoriesVisual"),
      bank: new IncrementUpgrade(30000, 2.1, "Buy Cookie Bank", "updateBanksVisual"), 
      temple: new IncrementUpgrade(100000, 2.2, "Buy Cookie Temple", "updateTemplesVisual"),
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
      this.cpsDisplay.classList.add('boosted-display');
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
        dropCookieImage();
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
        this.cpsDisplay.classList.remove('boosted-display');
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
      
      // Example of ensuring correct paths when setting images programmatically
      const cookieElement = this.cookie;
      if (cookieElement && cookieElement.src && !cookieElement.src.includes('/image/')) {
        cookieElement.src = 'image/cookie.png';  // Use relative path from root
      }
      
      this.log("Personalization system initialized");
    } catch (e) {
      this.log("Error initializing personalization:", e);
    }
  }

  // Add this new method for improved cookie rate limiting
  limitCookieRate(rate, gamePhase) {
    // Base limit depends on game phase
    let maxRate;
    
    switch (gamePhase) {
      case 'early':
        maxRate = 3;  // Maximum 3 cookies per second in early game
        break;
      case 'mid':
        maxRate = 6;  // Maximum 6 cookies per second in mid game
        break;
      case 'late':
        maxRate = 10; // Maximum 10 cookies per second in late game
        break;
      default:
        maxRate = 3;
    }
    
    // Apply special effects during golden cookie boosts
    if (this.state.activeGoldenCookieBonuses) {
      // Increase rate during production boosts
      if (this.state.activeGoldenCookieBonuses.production && 
          this.state.activeGoldenCookieBonuses.production.active) {
        maxRate *= 1.5;  // 50% more cookies during production boost
      }
      
      // Increase rate during frenzy
      if (this.state.activeGoldenCookieBonuses.clickPower && 
          this.state.activeGoldenCookieBonuses.clickPower.active) {
        maxRate *= 1.3;  // 30% more cookies during click power boost
      }
    }
    
    // Apply adjustment based on personalization settings
    if (this.state.personalization && this.state.personalization.animations) {
      switch (this.state.personalization.animations) {
        case 'standard':
          // No adjustment needed
          break;
        case 'reduced':
          maxRate = Math.max(1, Math.floor(maxRate * 0.5));  // 50% fewer cookies
          break;
        case 'minimal':
          maxRate = Math.max(1, Math.floor(maxRate * 0.2));  // 80% fewer cookies
          break;
      }
    }
    
    // Return the lower of the requested rate or max rate
    return Math.min(rate, Math.floor(maxRate));
  }
}
