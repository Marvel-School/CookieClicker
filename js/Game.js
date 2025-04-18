// Core Game class

import { ClickMultiplierUpgrade, IncrementUpgrade, LuckyUpgrade, ShopUpgrade } from './upgrades.js';
import { setupAchievements } from './achievements.js';
import { showFloatingNumber, createConfetti, applyTimeAcceleratorVisuals, dropCookieImage, createCookieShower } from './animation.js';
import { log, showToast, AUTO_SAVE_INTERVAL } from './utils.js';
import { setupEventListeners, updateGameDisplay, updateAchievementsList } from './ui.js';
import { PersonalizationManager } from './personalization.js';

export default class Game {
  constructor() {
    this.debug = true;
    this.log("Initializing game...");

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

    this.upgrades = {
      clickUpgrade: new ClickMultiplierUpgrade(15, 2.5, "Upgrade Click Power"),
      autoClicker: new IncrementUpgrade(60, 1.6, "Buy Auto Clicker"),
      grandma: new IncrementUpgrade(120, 1.7, "Buy Grandma's Bakery", "updateGrandmasVisual"),
      farm: new IncrementUpgrade(600, 1.8, "Buy Cookie Farm"),
      mine: new IncrementUpgrade(3000, 1.9, "Buy Cookie Mine", "updateMinesVisual"),
      factory: new IncrementUpgrade(10000, 2.0, "Buy Cookie Factory", "updateFactoriesVisual"),
      bank: new IncrementUpgrade(30000, 2.1, "Buy Cookie Bank", "updateBanksVisual"), 
      temple: new IncrementUpgrade(100000, 2.2, "Buy Cookie Temple", "updateTemplesVisual"),
      luckyClick: new LuckyUpgrade(25, 1.3, "Lucky Click"),
    };

    this.shopUpgrades = {
      timeAccelerator: new ShopUpgrade(1000, 2.8, "Time Accelerator", "timeAccelerator", 1000),
      cookieMultiplier: new ShopUpgrade(2500, 2.2, "Cookie Multiplier", "applyCookieMultiplier", 2500),
      goldenCookieChance: new ShopUpgrade(3000, 1.9, "Golden Cookie Charm", "increaseGoldenCookieChance", 3000)
    };

    this.achievements = [];
    this.setupAchievements();

    this.soundOn = true;
    this.clickSound = document.getElementById('click-sound');
    this.clickSound.volume = 0.2;
    this.userHasInteracted = false;
    
    this.lastConfettiTime = 0;

    this.personalization = new PersonalizationManager(this);

    this.init();

    if (localStorage.getItem("cookieGameSave")) {
      this.loadGame();
      this.log("Auto-loaded saved game.");
    } else {
      setTimeout(() => this.checkAchievements(), 500);
    }

    document.addEventListener('click', () => {
      this.userHasInteracted = true;
    }, { once: true });

    this.initPersonalization();
  }

  log(message, ...data) {
    log(this.debug, message, ...data);
  }

  safePlaySound(audioElement) {
    if (!this.soundOn) return;
    
    if (this.userHasInteracted) {
      try {
        audioElement.currentTime = 0;
        const playPromise = audioElement.play();
        
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
    this.safePlaySound(this.clickSound);
  }

  init() {
    this.log("Initializing DOM elements...");
    
    this.cookie = document.getElementById("cookie");
    this.cookieCount = document.getElementById("cookieCount");
    this.count = document.getElementById("count");
    this.clickPowerDisplay = document.getElementById("clickPower");
    this.cpsDisplay = document.getElementById("cps");

    this.clickUpgradeButton = document.getElementById("clickUpgrade");
    this.autoClickerButton = document.getElementById("autoClicker");
    this.grandmaButton = document.getElementById("grandma");
    this.farmButton = document.getElementById("farm");
    this.mineButton = document.getElementById("mine");
    this.factoryButton = document.getElementById("factory");
    this.bankButton = document.getElementById("bank");
    this.templeButton = document.getElementById("temple");
    this.luckyClickButton = document.getElementById("luckyClick");

    this.shopIcon = document.getElementById("shopIcon");
    this.shopContainer = document.getElementById("shopContainer");

    this.saveGameButton = document.getElementById("saveGame");
    this.loadGameButton = document.getElementById("loadGame");
    this.resetGameButton = document.getElementById("resetGame");
    this.toggleSoundButton = document.getElementById("toggleSound");
    this.settingsIcon = document.getElementById("settingsIcon");
    this.settingsMenu = document.getElementById("settingsMenu");

    this.achievementsContainer = document.getElementById("achievementsContainer");
    this.achievementsList = document.getElementById("achievementsList");

    this.grandmaProgressBar = document.getElementById("grandmaProgressBar");
    this.grandmaCountDisplay = document.getElementById("grandmaCount");
    this.autoClickersProgressBar = document.getElementById("autoClickersProgressBar");
    this.autoClickersCountVisual = document.getElementById("autoClickersCountVisual");
    this.farmsProgressBar = document.getElementById("farmsProgressBar");
    this.farmsCountVisual = document.getElementById("farmsCountVisual");
    this.mineProgressBar = document.getElementById("mineProgressBar");
    this.mineCountDisplay = document.getElementById("mineCount");
    this.factoryProgressBar = document.getElementById("factoryProgressBar");
    this.factoryCountDisplay = document.getElementById("factoryCount");
    this.bankProgressBar = document.getElementById("bankProgressBar");
    this.bankCountDisplay = document.getElementById("bankCount");
    this.templeProgressBar = document.getElementById("templeProgressBar");
    this.templeCountDisplay = document.getElementById("templeCount");

    this.goldenCookieContainer = document.createElement('div');
    this.goldenCookieContainer.id = 'goldenCookieContainer';
    document.body.appendChild(this.goldenCookieContainer);

    this.activeBonusesContainer = document.getElementById('activeBonuses');
    if (!this.activeBonusesContainer) {
      this.activeBonusesContainer = document.createElement('div');
      this.activeBonusesContainer.id = 'activeBonuses';
      document.body.appendChild(this.activeBonusesContainer);
    }

    setupEventListeners(this);
    
    updateGameDisplay(this);
    this.updateGrandmasVisual();
    
    this.startGameLoop();

    setInterval(() => this.autoSave(), AUTO_SAVE_INTERVAL);

    this.startGoldenCookieTimer();
    this.log("Golden cookie timer initialized with chance:", this.state.goldenCookieChance);

    const cookieImageInterval = setInterval(() => {
      const autoClickers = this.upgrades.autoClicker.count || 0;
      const grandmas = this.upgrades.grandma.count || 0;
      const farms = this.upgrades.farm.count || 0;
      const baseCps = autoClickers * 1 + grandmas * 3 + farms * 6;
      
      const particleRate = this.limitParticleRate(baseCps);
      
      for(let i = 0; i < particleRate; i++) {
        dropCookieImage();
      }
    }, 1000);
    
    this.cookieImageInterval = cookieImageInterval;

    if (this.cookieImageInterval) {
      clearInterval(this.cookieImageInterval);
    }

    this.cookieImageInterval = setInterval(() => {
      const autoClickers = this.upgrades.autoClicker.count || 0;
      const grandmas = this.upgrades.grandma.count || 0;
      const farms = this.upgrades.farm.count || 0;
      const mines = this.upgrades.mine.count || 0;
      const factories = this.upgrades.factory.count || 0;
      const banks = this.upgrades.bank.count || 0;
      const temples = this.upgrades.temple.count || 0;
      
      let cps = autoClickers * 1 + 
                grandmas * 3 + 
                farms * 6 +
                mines * 12 +
                factories * 25 +
                temples * 80;
                
      if (banks > 0) {
        cps += (this.state.cookies * 0.0005) * banks;
      }
      
      cps *= this.state.cookieMultiplier || 1;
      
      if (this.state.timeAcceleratorActive) {
        cps *= this.state.timeAcceleratorMultiplier;
      }
      
      let gamePhase = 'early';
      if (cps > 1000) gamePhase = 'late';
      else if (cps > 100) gamePhase = 'mid';
      
      const scaledRate = Math.min(12, Math.ceil(Math.log10(cps + 1) * 2));
      
      const cookieRate = this.limitCookieRate(scaledRate, gamePhase);
      
      for (let i = 0; i < cookieRate; i++) {
        const sizes = ['tiny', 'small', 'normal'];
        
        if (gamePhase === 'mid') {
          sizes.push('normal', 'large');
        }
        else if (gamePhase === 'late') {
          sizes.push('normal', 'large', 'large', 'huge');
        }
        
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        
        let speed = 1.0;
        if (this.state.timeAcceleratorActive) {
          speed = 1.5;
        }
        
        dropCookieImage(speed, size);
      }
    }, 1000);
  }

  limitParticleRate(cps) {
    const MAX_PARTICLES_PER_SECOND = 10;
    
    return Math.min(Math.floor(cps / 10), MAX_PARTICLES_PER_SECOND);
  }

  addBonusIndicator(id, type, icon, text, duration = null) {
    this.removeBonusIndicator(id);
    
    if (!this.activeBonusesContainer) {
      this.activeBonusesContainer = document.getElementById('activeBonuses');
      if (!this.activeBonusesContainer) {
        this.activeBonusesContainer = document.createElement('div');
        this.activeBonusesContainer.id = 'activeBonuses';
        document.body.appendChild(this.activeBonusesContainer);
      }
    }
    
    const indicator = document.createElement('div');
    indicator.id = id;
    indicator.className = `bonus-indicator ${type}`;
    
    indicator.innerHTML = `
      <span class="bonus-icon">${icon}</span>
      <span class="bonus-text">${text}</span>
      ${duration ? `<span class="bonus-timer">${duration}s</span>` : ''}
    `;
    
    this.activeBonusesContainer.appendChild(indicator);
    
    return indicator;
  }

  removeBonusIndicator(id) {
    const indicator = document.getElementById(id);
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }

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
    this.userHasInteracted = true;
    
    if (this.soundOn) {
      this.safePlaySound(this.clickSound);
    }
    
    let clickPower = this.state.clickPower;
    if (this.state.clickPowerBoostActive && this.state.clickPowerBoostEndTime > Date.now()) {
      clickPower *= this.state.clickPowerBoostMultiplier;
    }
    
    this.state.cookies += clickPower;
    this.log("Cookie clicked. New cookies:", this.state.cookies);
    
    showFloatingNumber(this.cookie, this.state.clickPower);
    this.lastConfettiTime = createConfetti(e.clientX, e.clientY, this.lastConfettiTime);
    
    if (this.cookieCount) {
      this.cookieCount.classList.add('updating');
      this.cookieCount.classList.add('cookie-gain');
      setTimeout(() => {
        this.cookieCount.classList.remove('updating');
        this.cookieCount.classList.remove('cookie-gain');
      }, 300);
    }
    
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

  applyCookieMultiplier(item) {
    const boostDuration = 120000;
    const boostMultiplier = 2;
    const durationSec = boostDuration / 1000;
    
    const originalMultiplier = this.state.cookieMultiplier;
    
    this.state.cookieMultiplier *= boostMultiplier;
    
    this.addBonusIndicator(
      'cookie-multiplier-boost',
      'cookie-multiplier',
      '🍪',
      `${boostMultiplier}x Cookies`,
      durationSec
    );
    
    this.applyProductionBoostVisuals(true);
    
    showToast(`Cookie production multiplied by ${boostMultiplier}x for 2 minutes!`);
    this.log(`Cookie multiplier boosted to ${this.state.cookieMultiplier}x for 2 minutes`);
    
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
    
    setTimeout(() => {
      this.state.cookieMultiplier = originalMultiplier;
      this.applyProductionBoostVisuals(false);
      this.removeBonusIndicator('cookie-multiplier-boost');
      showToast('Cookie multiplier boost has ended.');
      this.updateDisplay();
      clearInterval(countdownInterval);
    }, boostDuration);
  }

  increaseGoldenCookieChance(item) {
    this.state.goldenCookieChance = Math.min(this.state.goldenCookieChance + 0.05, 0.5);
    
    showToast(`Golden Cookie chance increased to ${Math.round(this.state.goldenCookieChance * 100)}%!`);
    this.log(`Golden cookie chance increased to ${this.state.goldenCookieChance}`);
    
    setTimeout(() => {
        if (!this.state.goldenCookieActive) {
            this.spawnGoldenCookie();
        }
    }, 3000);
  }

  startGoldenCookieTimer() {
    if (this.goldenCookieTimerID) {
      clearTimeout(this.goldenCookieTimerID);
      this.goldenCookieTimerID = null;
    }
    
    const checkGoldenCookie = () => {
      this.goldenCookieTimerID = null;
      
      if (!this.state.goldenCookieActive) {
        const now = Date.now();
        if (now - this.state.lastGoldenCookieTime > 60000) {
          const baseChance = this.state.goldenCookieChance * 0.5; 
          const roll = Math.random();
          this.log(`Golden cookie check: rolled ${roll.toFixed(3)} vs chance ${baseChance.toFixed(3)}`);
          if (roll < baseChance) {
            this.spawnGoldenCookie();
          }
        }
      }
      
      if (!this.goldenCookieTimerID) {
        this.goldenCookieTimerID = setTimeout(checkGoldenCookie, 10000);
      }
    };
    
    this.goldenCookieTimerID = setTimeout(checkGoldenCookie, 10000);
  }

  spawnGoldenCookie() {
    if (this.state.goldenCookieActive) {
      console.log("Golden cookie already active. Not spawning another one.");
      
      const existingCookies = document.querySelectorAll('.golden-cookie');
      if (existingCookies.length > 0) {
        console.log(`Found ${existingCookies.length} existing golden cookies. Cleaning up.`);
        existingCookies.forEach(cookie => {
          if (cookie.parentNode) {
            cookie.parentNode.removeChild(cookie);
          }
        });
      }
      return;
    }
    
    this.state.goldenCookieActive = true;
    console.log('Spawning golden cookie!');
    
    const goldenCookie = document.createElement('div');
    goldenCookie.className = 'golden-cookie';
    
    const padding = 100;
    const maxX = Math.min(window.innerWidth, document.documentElement.clientWidth) - padding*2;
    const maxY = Math.min(window.innerHeight, document.documentElement.clientHeight) - padding*2;
    const posX = Math.floor(Math.random() * maxX) + padding;
    const posY = Math.floor(Math.random() * maxY) + padding;
    
    goldenCookie.style.left = `${posX}px`;
    goldenCookie.style.top = `${posY}px`;
    
    goldenCookie.innerHTML = `
      <span style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); 
      color:#fff; font-weight:bold; font-size:16px; text-shadow:0 0 3px black; pointer-events:none;">
        Click me!
      </span>
    `;
    
    const clickHandler = (e) => {
      e.stopPropagation();
      
      if (!this.state.goldenCookieActive) return;
      
      console.log('Golden cookie clicked!');
      
      goldenCookie.removeEventListener('click', clickHandler);
      goldenCookie.style.pointerEvents = 'none';
      
      this.handleGoldenCookieClick(goldenCookie);
    };
    
    goldenCookie.addEventListener('click', clickHandler);
    
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
    
    goldenCookie.style.pointerEvents = 'auto';
    
    this.goldenCookieContainer.appendChild(goldenCookie);
    
    setTimeout(() => {
      if (goldenCookie.parentNode) {
        console.log('Golden cookie expired without being clicked');
        this.removeGoldenCookie(goldenCookie);
        
        this.state.goldenCookieActive = false;
        this.state.lastGoldenCookieTime = Date.now();
      }
    }, 15000);
    
    console.log('Golden cookie spawned at position:', posX, posY);
    console.log('Golden cookie element:', goldenCookie);
    
    return goldenCookie;
  }

  handleGoldenCookieClick(goldenCookie) {
    if (!this.state.goldenCookieActive) return;
    
    this.state.goldenCookieActive = false;
    
    if (goldenCookie) {
      goldenCookie.style.pointerEvents = 'none';
      
      goldenCookie.style.opacity = '0.5';
      goldenCookie.style.transform = 'scale(0.1)';
      goldenCookie.style.transition = 'all 0.2s ease-out';
      
      if (goldenCookie.parentNode) {
        goldenCookie.parentNode.removeChild(goldenCookie);
      }
    }
    
    document.querySelectorAll('.golden-cookie').forEach(cookie => {
      if (cookie !== goldenCookie && cookie.parentNode) {
        cookie.parentNode.removeChild(cookie);
      }
    });
    
    this.state.lastGoldenCookieTime = Date.now();
    
    const intensity = this.state.personalization?.particleIntensity || 1.0;
    
    const rewards = [
      {
        type: 'cookies',
        value: () => {
          const autoClickers = this.upgrades.autoClicker.count || 0;
          const grandmas = this.upgrades.grandma.count || 0;
          const farms = this.upgrades.farm.count || 0;
          const cps = autoClickers * 1 + grandmas * 3 + farms * 6;
          
          return Math.max(50, Math.floor(cps * 30 * this.state.cookieMultiplier));
        },
        message: (amt) => `Golden cookie grants you ${amt} cookies!`
      },
      {
        type: 'production',
        value: () => 2.5,
        message: () => `Golden cookie boosts production by 150% for 30 seconds!`
      },
      {
        type: 'clickPower',
        value: () => Math.ceil(this.state.clickPower * 0.4),
        message: (amt) => `Golden cookie increases click power by ${amt} for 30 seconds!`
      },
      {
        type: 'frenzy', 
        value: () => 7,
        message: () => `Clicking Frenzy! Click power x7 for 15 seconds!`
      }
    ];
    
    let reward;
    const roll = Math.random();
    if (roll < 0.1) {
      reward = rewards[3];
    } else {
      const idx = Math.floor(Math.random() * 3);
      reward = rewards[idx];
    }
    
    switch (reward.type) {
      case 'cookies':
        const cookieBonus = reward.value();
        this.state.cookies += cookieBonus;
        showToast(reward.message(cookieBonus));

        createCookieShower(cookieBonus / 30, 3000, intensity);
        break;
        
      case 'production':
        const multiplier = reward.value();
        const duration = 30;
        
        this.state.activeGoldenCookieBonuses.production = {
          active: true,
          originalValue: this.state.cookieMultiplier,
          bonusValue: this.state.cookieMultiplier * (multiplier - 1),
          endTime: Date.now() + duration * 1000
        };
        
        this.state.cookieMultiplier *= multiplier;
        showToast(reward.message());
        
        this.addBonusIndicator(
          'golden-cookie-production-boost',
          'production-boost',
          '✨',
          `${multiplier}x Production`,
          duration
        );
        
        this.applyProductionBoostVisuals(true);
        
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
        
        setTimeout(() => {
          if (this.state.activeGoldenCookieBonuses.production.active) {
            this.state.cookieMultiplier = this.state.activeGoldenCookieBonuses.production.originalValue;
            this.state.activeGoldenCookieBonuses.production.active = false;
            
            this.applyProductionBoostVisuals(false);
            this.removeBonusIndicator('golden-cookie-production-boost');
            
            showToast('Production boost has ended.');
            this.updateDisplay();
          }
          clearInterval(countdownInterval);
        }, duration * 1000);
        break;
        
      case 'clickPower':
        const powerBonus = reward.value();
        const clickDuration = 30;
        
        this.state.activeGoldenCookieBonuses.clickPower = {
          active: true,
          originalValue: this.state.clickPower,
          bonusValue: powerBonus,
          endTime: Date.now() + clickDuration * 1000
        };
        
        this.state.clickPower += powerBonus;
        showToast(reward.message(powerBonus));
        
        this.addBonusIndicator(
          'golden-cookie-click-boost',
          'click-boost',
          '👆',
          `+${powerBonus} Click`,
          clickDuration
        );
        
        this.applyClickPowerBoostVisuals(true);
        
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
        
        setTimeout(() => {
          if (this.state.activeGoldenCookieBonuses.clickPower.active) {
            this.state.clickPower = this.state.activeGoldenCookieBonuses.clickPower.originalValue;
            this.state.activeGoldenCookieBonuses.clickPower.active = false;
            
            this.applyClickPowerBoostVisuals(false);
            this.removeBonusIndicator('golden-cookie-click-boost');
            
            showToast('Click power boost has ended.');
            this.updateDisplay();
          }
          clearInterval(clickCountdownInterval);
        }, clickDuration * 1000);
        break;
        
      case 'frenzy':
        const frenzyMultiplier = reward.value();
        const frenzyDuration = 15;
        
        this.state.activeGoldenCookieBonuses.clickPower = {
          active: true,
          originalValue: this.state.clickPower,
          bonusValue: this.state.clickPower * (frenzyMultiplier - 1),
          endTime: Date.now() + frenzyDuration * 1000
        };
        
        this.state.clickPower *= frenzyMultiplier;
        showToast(reward.message());
        
        this.addBonusIndicator(
          'golden-cookie-frenzy',
          'frenzy',
          '🔥',
          `${frenzyMultiplier}x Click Power`,
          frenzyDuration
        );
        
        this.applyClickingFrenzyVisuals(true);
        
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
        
        setTimeout(() => {
          if (this.state.activeGoldenCookieBonuses.clickPower.active) {
            this.state.clickPower = this.state.activeGoldenCookieBonuses.clickPower.originalValue;
            this.state.activeGoldenCookieBonuses.clickPower.active = false;
            
            this.applyClickingFrenzyVisuals(false);
            this.removeBonusIndicator('golden-cookie-frenzy');
            
            showToast('Clicking frenzy has ended.');
            this.updateDisplay();
          }
          clearInterval(frenzyCountdownInterval);
        }, frenzyDuration * 1000);

        createCookieShower(50, 5000, intensity * 2);
        break;
    }
    
    this.removeGoldenCookie(goldenCookie);
    
    this.updateDisplay();
    this.checkAchievements();
  }

  removeGoldenCookie(goldenCookie) {
    if (goldenCookie) {
      goldenCookie.style.pointerEvents = 'none';
      
      if (goldenCookie.parentNode) {
        goldenCookie.parentNode.removeChild(goldenCookie);
      }
      
      document.querySelectorAll('.golden-cookie').forEach(cookie => {
        if (cookie.parentNode) {
          cookie.parentNode.removeChild(cookie);
        }
      });
    }
    
    this.state.goldenCookieActive = false;
    this.state.lastGoldenCookieTime = Date.now();
  }

  startGameLoop() {
    let lastTime = performance.now();
    let lastUpdateTime = 0;
    let lastAchievementCheck = 0;
    
    const UPDATE_INTERVAL = 100;
    const ACHIEVEMENT_CHECK_INTERVAL = 1000;
    
    const loop = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      
      const autoClickers = this.upgrades.autoClicker.count || 0;
      const grandmas = this.upgrades.grandma.count || 0;
      const farms = this.upgrades.farm.count || 0;
      const mines = this.upgrades.mine.count || 0;
      const factories = this.upgrades.factory.count || 0;
      const banks = this.upgrades.bank.count || 0;
      const temples = this.upgrades.temple.count || 0;
      
      let cps = autoClickers * 1 + 
                grandmas * 3 + 
                farms * 6 +
                mines * 12 +
                factories * 25 +
                temples * 80;
      
      if (banks > 0) {
        cps += (this.state.cookies * 0.0005) * banks;
      }
      
      cps *= this.state.cookieMultiplier;
      
      const timeAccelMult = this.state.timeAcceleratorActive
        ? this.state.timeAcceleratorMultiplier
        : 1;
      
      this.state.cookies += cps * timeAccelMult * delta;
      
      if (now - lastUpdateTime > UPDATE_INTERVAL) {
        updateGameDisplay(this);
        
        const autoClickers = this.upgrades.autoClicker.count || 0;
        const grandmas = this.upgrades.grandma.count || 0;
        const farms = this.upgrades.farm.count || 0;
        const mines = this.upgrades.mine.count || 0;
        const factories = this.upgrades.factory.count || 0;
        
        let baseCps = autoClickers * 1 + grandmas * 3 + farms * 6 + mines * 12 + factories * 25;
        
        const particleRate = this.limitParticleRate(baseCps);
        
        const particlesToDrop = Math.floor(particleRate * (UPDATE_INTERVAL / 1000));
        
        for (let i = 0; i < particlesToDrop; i++) {
          dropCookieImage();
        }
        
        lastUpdateTime = now;
      }
      
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
    
    if (this.state && this.state.activeGoldenCookieBonuses) {
      this.updateActiveBoostTimers();
    }
    
    if (this.state.clickPowerBoostActive && this.state.clickPowerBoostEndTime > Date.now()) {
      const secondsLeft = Math.floor((this.state.clickPowerBoostEndTime - Date.now()) / 1000);
      
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
      
      if (this.clickPowerDisplay) {
        this.clickPowerDisplay.classList.add('boosted');
      }
    } else {
      const indicator = document.getElementById('click-boost-indicator');
      if (indicator) indicator.remove();
      
      if (this.clickPowerDisplay) {
        this.clickPowerDisplay.classList.remove('boosted');
      }
    }

    const cookies = this.state.cookies || 0;

    this.clickUpgradeButton.disabled = cookies < this.upgrades.clickUpgrade.cost;
    this.autoClickerButton.disabled = cookies < this.upgrades.autoClicker.cost;
    this.grandmaButton.disabled = cookies < this.upgrades.grandma.cost;
    this.farmButton.disabled = cookies < this.upgrades.farm.cost;
    this.mineButton.disabled = cookies < this.upgrades.mine.cost;
    this.factoryButton.disabled = cookies < this.upgrades.factory.cost;
    this.bankButton.disabled = cookies < this.upgrades.bank.cost;
    this.templeButton.disabled = cookies < this.upgrades.temple.cost;
    this.luckyClickButton.disabled = cookies < this.upgrades.luckyClick.cost;
    
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

      this.state = savedGame.state || this.state;

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

      if (typeof savedGame.upgrades === "object") {
        this.upgrades = {
          clickUpgrade: new ClickMultiplierUpgrade(15, 2.5, "Upgrade Click Power"),
          autoClicker: new IncrementUpgrade(60, 1.6, "Buy Auto Clicker"),
          grandma: new IncrementUpgrade(120, 1.7, "Buy Grandma's Bakery", "updateGrandmasVisual"),
          farm: new IncrementUpgrade(600, 1.8, "Buy Cookie Farm"),
          mine: new IncrementUpgrade(3000, 1.9, "Buy Cookie Mine", "updateMinesVisual"),
          factory: new IncrementUpgrade(10000, 2.0, "Buy Cookie Factory", "updateFactoriesVisual"),
          bank: new IncrementUpgrade(30000, 2.1, "Buy Cookie Bank", "updateBanksVisual"), 
          temple: new IncrementUpgrade(100000, 2.2, "Buy Cookie Temple", "updateTemplesVisual"),
          luckyClick: new LuckyUpgrade(25, 1.3, "Lucky Click"),
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

      if (typeof savedGame.shopUpgrades === "object") {
        this.shopUpgrades = {
          timeAccelerator: new ShopUpgrade(1000, 2.8, "Time Accelerator", "timeAccelerator", 1000),
          cookieMultiplier: new ShopUpgrade(2500, 2.2, "Cookie Multiplier", "applyCookieMultiplier", 2500),
          goldenCookieChance: new ShopUpgrade(3000, 1.9, "Golden Cookie Charm", "increaseGoldenCookieChance", 3000)
        };
        
        Object.keys(savedGame.shopUpgrades).forEach((key) => {
          if (savedGame.shopUpgrades[key].cost !== undefined && this.shopUpgrades[key]) {
            this.shopUpgrades[key].cost = savedGame.shopUpgrades[key].cost;
          }
        });
      }

      this.achievements = [];
      this.setupAchievements();
      
      if (Array.isArray(savedGame.achievements)) {
        if (typeof savedGame.achievements[0] === 'string') {
          savedGame.achievements.forEach(name => {
            const achievement = this.achievements.find(a => a.name === name);
            if (achievement) {
              achievement.earned = true;
            }
          });
        } 
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

      if (this.personalizer && this.state.personalization) {
        this.personalizer.settings = {...this.personalizer.settings, ...this.state.personalization};
        this.personalizer.applyAllSettings();
      }

      this.updateDisplay();
      this.updateAchievements();
      this.updateGrandmasVisual();
      this.checkAchievements();
      
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
    
    this.upgrades = {
      clickUpgrade: new ClickMultiplierUpgrade(15, 2.5, "Upgrade Click Power"),
      autoClicker: new IncrementUpgrade(60, 1.6, "Buy Auto Clicker"),
      grandma: new IncrementUpgrade(120, 1.7, "Buy Grandma's Bakery", "updateGrandmasVisual"),
      farm: new IncrementUpgrade(600, 1.8, "Buy Cookie Farm"),
      mine: new IncrementUpgrade(3000, 1.9, "Buy Cookie Mine", "updateMinesVisual"),
      factory: new IncrementUpgrade(10000, 2.0, "Buy Cookie Factory", "updateFactoriesVisual"),
      bank: new IncrementUpgrade(30000, 2.1, "Buy Cookie Bank", "updateBanksVisual"), 
      temple: new IncrementUpgrade(100000, 2.2, "Buy Cookie Temple", "updateTemplesVisual"),
      luckyClick: new LuckyUpgrade(25, 1.3, "Lucky Click"),
    };
    
    this.shopUpgrades = {
      timeAccelerator: new ShopUpgrade(1000, 2.8, "Time Accelerator", "timeAccelerator", 1000),
      cookieMultiplier: new ShopUpgrade(2500, 2.2, "Cookie Multiplier", "applyCookieMultiplier", 2500),
      goldenCookieChance: new ShopUpgrade(3000, 1.9, "Golden Cookie Charm", "increaseGoldenCookieChance", 3000)
    };
    
    this.achievements = [];
    this.setupAchievements();
    
    this.updateDisplay();
    this.updateAchievements();
    this.updateGrandmasVisual();
    
    this.log("Game reset.");
    alert("Game has been reset.");
  }

  showToast(message) {
    try {
      showToast(message);
    } catch (e) {
      console.error("Error showing toast:", e);
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

  updateActiveBoostTimers() {
    const now = Date.now();
    
    if (this.state.timeAcceleratorActive && this.state.timeAcceleratorEndTime > now) {
      const timeLeft = Math.max(0, Math.floor((this.state.timeAcceleratorEndTime - now) / 1000));
      this.updateBonusIndicator('time-accelerator-bonus', null, timeLeft);
    } else if (this.state.timeAcceleratorActive && this.state.timeAcceleratorEndTime <= now) {
      this.state.timeAcceleratorActive = false;
      this.state.timeAcceleratorMultiplier = 1;
      this.removeBonusIndicator('time-accelerator-bonus');
      
      if (this.cookie) {
        this.cookie.classList.remove('accelerated');
      }
      
      if (this.cpsDisplay) {
        this.cpsDisplay.classList.remove('boosted');
      }
    }
    
    if (this.state.activeGoldenCookieBonuses && this.state.activeGoldenCookieBonuses.production && 
        this.state.activeGoldenCookieBonuses.production.active) {
      const timeLeft = Math.max(0, Math.floor((this.state.activeGoldenCookieBonuses.production.endTime - now) / 1000));
      
      if (timeLeft > 0) {
        this.updateBonusIndicator('golden-cookie-production-boost', null, timeLeft);
      } else {
        this.state.cookieMultiplier = this.state.activeGoldenCookieBonuses.production.originalValue;
        this.state.activeGoldenCookieBonuses.production.active = false;
        this.applyProductionBoostVisuals(false);
        this.removeBonusIndicator('golden-cookie-production-boost');
      }
      
      if (this.cpsDisplay) {
        this.cpsDisplay.classList.add('boosted');
      }
    } else if (this.cpsDisplay) {
      this.cpsDisplay.classList.remove('boosted');
    }
    
    if (this.state.activeGoldenCookieBonuses && this.state.activeGoldenCookieBonuses.clickPower && 
        this.state.activeGoldenCookieBonuses.clickPower.active) {
      const timeLeft = Math.max(0, Math.floor((this.state.activeGoldenCookieBonuses.clickPower.endTime - now) / 1000));
      
      if (this.state.activeGoldenCookieBonuses.clickPower.bonusValue >= this.state.activeGoldenCookieBonuses.clickPower.originalValue) {
        if (timeLeft > 0) {
          this.updateBonusIndicator('golden-cookie-frenzy', null, timeLeft);
        } else {
          this.state.clickPower = this.state.activeGoldenCookieBonuses.clickPower.originalValue;
          this.state.activeGoldenCookieBonuses.clickPower.active = false;
          this.applyClickingFrenzyVisuals(false);
          this.removeBonusIndicator('golden-cookie-frenzy');
        }
      } else {
        if (timeLeft > 0) {
          this.updateBonusIndicator('golden-cookie-click-boost', null, timeLeft);
        } else {
          this.state.clickPower = this.state.activeGoldenCookieBonuses.clickPower.originalValue;
          this.state.activeGoldenCookieBonuses.clickPower.active = false;
          this.applyClickPowerBoostVisuals(false);
          this.removeBonusIndicator('golden-cookie-click-boost');
        }
      }
      
      if (this.clickPowerDisplay) {
        this.clickPowerDisplay.classList.add('boosted');
      }
    } else if (this.clickPowerDisplay) {
      this.clickPowerDisplay.classList.remove('boosted');
    }
  }

  timeAccelerator(item) {
    const baseCost = item.baseCost || 1000;
    const minDuration = 30;
    const maxDuration = 60;
    let duration = minDuration + (item.cost - baseCost) * 0.05;
    duration = Math.min(duration, maxDuration);

    this.state.timeAcceleratorActive = true;
    this.state.timeAcceleratorMultiplier = 4;
    this.state.timeAcceleratorEndTime = Date.now() + duration * 1000;

    this.addBonusIndicator(
      'time-accelerator-bonus',
      'time-accelerator',
      '⚡',
      '4x Production',
      Math.floor(duration)
    );
    
    if (this.cookie) {
      this.cookie.classList.add('accelerated');
    }
    
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
      
      this.removeBonusIndicator('time-accelerator-bonus');
      
      if (this.cookie) {
        this.cookie.classList.remove('accelerated');
      }
      
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
      this.personalization.loadFromGameState();
      
      const intensitySlider = document.getElementById('particle-intensity');
      const intensityValue = document.getElementById('intensity-value');
      
      if (intensitySlider && intensityValue) {
        intensitySlider.value = this.state.personalization?.particleIntensity || 1.0;
        intensityValue.textContent = intensitySlider.value;
        
        intensitySlider.addEventListener('input', () => {
          const value = parseFloat(intensitySlider.value);
          intensityValue.textContent = value.toFixed(1);
          this.personalization.setParticleIntensity(value);
          this.saveGame();
        });
      }
      
      const cookieElement = this.cookie;
      if (cookieElement && cookieElement.src && !cookieElement.src.includes('/image/')) {
        cookieElement.src = 'image/cookie.png';
      }
      
      this.log("Personalization system initialized");
    } catch (e) {
      this.log("Error initializing personalization:", e);
    }
  }

  limitCookieRate(rate, gamePhase) {
    let maxRate;
    
    switch (gamePhase) {
      case 'early':
        maxRate = 3;
        break;
      case 'mid':
        maxRate = 6;
        break;
      case 'late':
        maxRate = 10;
        break;
      default:
        maxRate = 3;
    }
    
    if (this.state.activeGoldenCookieBonuses) {
      if (this.state.activeGoldenCookieBonuses.production && 
          this.state.activeGoldenCookieBonuses.production.active) {
        maxRate *= 1.5;
      }
      
      if (this.state.activeGoldenCookieBonuses.clickPower && 
          this.state.activeGoldenCookieBonuses.clickPower.active) {
        maxRate *= 1.3;
      }
    }
    
    if (this.state.personalization && this.state.personalization.animations) {
      switch (this.state.personalization.animations) {
        case 'standard':
          break;
        case 'reduced':
          maxRate = Math.max(1, Math.floor(maxRate * 0.5));
          break;
        case 'minimal':
          maxRate = Math.max(1, Math.floor(maxRate * 0.2));
          break;
      }
    }
    
    return Math.min(rate, Math.floor(maxRate));
  }

  applyProductionBoostVisuals(active) {
    if (this.cpsDisplay) {
      if (active) {
        this.cpsDisplay.classList.add('boosted-display');
      } else {
        this.cpsDisplay.classList.remove('boosted-display');
      }
    }
    
    const statsDiv = document.querySelector('.stats');
    
    const existingIndicator = document.getElementById('production-boost-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    if (active && statsDiv) {
      const boost = document.createElement('div');
      boost.id = 'production-boost-indicator';
      boost.className = 'boost-indicator production-boost-indicator';
      boost.innerHTML = '⚡ Production Boost Active! ⚡';
      statsDiv.appendChild(boost);
    }
  }

  applyClickPowerBoostVisuals(active) {
    if (this.clickPowerDisplay) {
      if (active) {
        this.clickPowerDisplay.classList.add('click-power-boosted');
      } else {
        this.clickPowerDisplay.classList.remove('click-power-boosted');
      }
    }
    
    if (this.cookie) {
      if (active) {
        this.cookie.classList.add('click-boosted');
      } else {
        this.cookie.classList.remove('click-boosted');
      }
    }
    
    const statsDiv = document.querySelector('.stats');
    
    const existingIndicator = document.getElementById('click-boost-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    if (active && statsDiv) {
      const boost = document.createElement('div');
      boost.id = 'click-boost-indicator';
      boost.className = 'boost-indicator click-boost-indicator';
      boost.innerHTML = '👆 Click Power Boost Active! 👆';
      statsDiv.appendChild(boost);
    }
  }

  applyClickingFrenzyVisuals(active) {
    if (this.cookie) {
      if (active) {
        this.cookie.classList.add('frenzy-boosted');
      } else {
        this.cookie.classList.remove('frenzy-boosted');
      }
    }
    
    if (this.clickPowerDisplay) {
      if (active) {
        this.clickPowerDisplay.classList.add('frenzy-boosted-text');
      } else {
        this.clickPowerDisplay.classList.remove('frenzy-boosted-text');
      }
    }
    
    const statsDiv = document.querySelector('.stats');
    
    const existingIndicator = document.getElementById('frenzy-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    if (active && statsDiv) {
      const boost = document.createElement('div');
      boost.id = 'frenzy-indicator';
      boost.className = 'boost-indicator frenzy-indicator';
      boost.innerHTML = '🔥 CLICKING FRENZY! 🔥';
      statsDiv.appendChild(boost);
    }
  }
}
