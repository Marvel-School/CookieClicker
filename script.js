const PARTICLE_SIZE = 20;
const PARTICLE_LIFETIME = 2000;
const AUTO_SAVE_INTERVAL = 60000;

class Upgrade {
  constructor(cost, multiplier, displayPrefix, extra = null) {
    this.cost = cost;
    this.multiplier = multiplier;
    this.displayPrefix = displayPrefix;
    this.extra = extra;
  }
  canPurchase(game) {
    return game.state.cookies >= this.cost;
  }
  updateCost() {
    this.cost = Math.floor(this.cost * this.multiplier);
  }
  purchase(game) {
    if (!this.canPurchase(game)) {
      game.log(
        `Not enough cookies for ${this.constructor.name}. Cost: ${this.cost}, have: ${game.state.cookies}`
      );
      return;
    }
    game.state.cookies -= this.cost;
    this.executePurchase(game);
    this.updateCost();
    if (this.extra && typeof game[this.extra] === "function") {
      game[this.extra]();
    }
    game.updateDisplay();
  }
  executePurchase(game) {
  }
}

class ClickMultiplierUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix) {
    super(cost, multiplier, displayPrefix);
  }
  executePurchase(game) {
    game.state.clickPower *= 2;
  }
}

class IncrementUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, extra = null) {
    super(cost, multiplier, displayPrefix, extra);
    this.count = 0;
  }
  executePurchase(game) {
    this.count++;
  }
}

class LuckyUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix) {
    super(15, 1.15, displayPrefix);
  }
  
  executePurchase(game) {
    const autoClickers = game.upgrades.autoClicker.count || 0;
    const grandmas = game.upgrades.grandma.count || 0;
    const farms = game.upgrades.farm.count || 0;
    
    const baseCps = autoClickers * 1 + grandmas * 5 + farms * 10;
    
    const cps = baseCps * (game.state.cookieMultiplier || 1);
    
    const productionSeconds = 30 + Math.floor(Math.random() * 60);
    const baseBonus = Math.max(100, cps * productionSeconds);
    
    const gameProgress = game.state.cookies / 500;
    const adaptiveCap = Math.max(1000, 2000 + gameProgress * 2);
    const cappedBonus = Math.min(baseBonus, adaptiveCap);

    let bonus = 0;
    let effectMessage = "";
    let isCritical = false;
    
    if (Math.random() < 0.3) {
      const critMultiplier = 2.5 + Math.random();
      bonus = Math.floor(cappedBonus * critMultiplier);
      isCritical = true;
      effectMessage = "CRITICAL LUCKY HIT! 💥";
    } else {
      const randomFactor = 0.8 + (Math.random() * 0.6);
      bonus = Math.floor(cappedBonus * randomFactor);
    }
    
    game.state.cookies += bonus;
    
    game.showFloatingNumber(bonus, true);
    
    if (effectMessage) {
      const message = document.createElement("div");
      message.className = "floating-effect";
      message.textContent = effectMessage;
      message.style.position = "absolute";
      message.style.fontSize = isCritical ? "24px" : "18px";
      message.style.color = isCritical ? "#ff4500" : "#1e90ff";
      message.style.fontWeight = "bold";
      message.style.textShadow = "0px 0px 5px white";
      message.style.zIndex = "9999";
      
      const { left, top, width } = game.cookie.getBoundingClientRect();
      message.style.left = `${left + width / 2 - 120}px`;
      message.style.top = `${top - 50}px`;
      message.style.width = "240px";
      message.style.textAlign = "center";
      message.style.pointerEvents = "none";
      document.body.appendChild(message);
      
      setTimeout(() => message.remove(), 2000);
    }
    
    game.state.luckyStreak = (game.state.luckyStreak || 0) + 1;
  }
}

class ShopUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, extra = null, baseCost) {
    super(cost, multiplier, displayPrefix, extra);
    this.baseCost = baseCost;
  }
  purchase(game) {
    if (!this.canPurchase(game)) {
      game.log(
        `Not enough cookies for ${this.extra}. Cost: ${this.cost}, have: ${game.state.cookies}`
      );
      game.showToast(`Not enough cookies for ${this.extra}`);
      return;
    }
    game.state.cookies -= this.cost;
    if (this.extra === "timeAccelerator") {
      game.activateTimeAccelerator(this);
    }
    this.cost = Math.floor(this.cost * this.multiplier);
    const costSpan = document.querySelector(
      `[data-upgrade="timeAccelerator"] .item-cost span`
    );
    if (costSpan) costSpan.textContent = this.cost;
    game.updateDisplay();
    game.showToast(`${this.extra} purchased!`);
  }
}

class Achievement {
  constructor(id, name, description, condition, rarity = 'common', category = 'general', icon = '🍪') {
    this.id = id;
    this.name = name;
    this.description = description;
    this.condition = condition;
    this.earned = false;
    this.rarity = rarity;
    this.category = category;
    this.icon = icon;
  }
}

class Game {
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
    };

    this.upgrades = {
      clickUpgrade: new ClickMultiplierUpgrade(10, 3, "Upgrade Click Power"),
      autoClicker: new IncrementUpgrade(50, 1.5, "Buy Auto Clicker"),
      grandma: new IncrementUpgrade(100, 1.5, "Buy Grandma's Bakery", "updateGrandmasVisual"),
      farm: new IncrementUpgrade(500, 1.5, "Buy Cookie Farm"),
      luckyClick: new LuckyUpgrade(15, 1.15, "Lucky Click"),
    };

    this.shopUpgrades = {
      timeAccelerator: new ShopUpgrade(1000, 2.5, "Time Accelerator", "timeAccelerator", 1000),
    };

    this.achievements = [];
    this.setupAchievements();

    this.soundOn = true;
    this.clickSound = new Audio("sounds/click.mp3");
    this.clickSound.volume = 0.2;

    this.init();

    if (localStorage.getItem("cookieGameSave")) {
      this.loadGame();
      this.log("Auto-loaded saved game.");
    } else {
      setTimeout(() => this.checkAchievements(), 500);
    }
  }

  log(message, ...data) {
    if (this.debug) {
      console.log(message, ...data);
    }
  }

  playHoverSound() {
    if (this.soundOn) {
      this.clickSound.currentTime = 0;
      this.clickSound.play();
    }
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
    this.luckyClickButton = document.getElementById("luckyClick");

    this.shopElement = document.getElementById("shop");

    this.shopIcon = document.getElementById("shopIcon");
    this.shopContainer = document.getElementById("shopContainer");

    this.saveGameButton = document.getElementById("saveGame");
    this.loadGameButton = document.getElementById("loadGame");
    this.resetGameButton = document.getElementById("resetGame");
    this.toggleSoundButton = document.getElementById("toggleSound");
    this.settingsIcon = document.getElementById("settingsIcon");
    this.settingsMenu = document.getElementById("settingsMenu");

    this.achievementsContainer = document.getElementById(
      "achievementsContainer"
    );
    this.achievementsList = document.getElementById("achievementsList");

    this.grandmaProgressBar = document.getElementById("grandmaProgressBar");
    this.grandmaCountDisplay = document.getElementById("grandmaCount");
    this.autoClickersProgressBar = document.getElementById(
      "autoClickersProgressBar"
    );
    this.autoClickersCountVisual = document.getElementById(
      "autoClickersCountVisual"
    );
    this.farmsProgressBar = document.getElementById("farmsProgressBar");
    this.farmsCountVisual = document.getElementById("farmsCountVisual");

    this.setupEventListeners();
    this.updateDisplay();
    this.updateGrandmasVisual();
    this.startGameLoop();

    setInterval(() => this.autoSave(), AUTO_SAVE_INTERVAL);
  }

  setupEventListeners() {
    document.querySelectorAll("button.upgrade").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.log("Upgrade button clicked:", btn.id);
        this.purchaseStandardUpgrade(btn.id);
      });
    });

    [
      this.clickUpgradeButton,
      this.autoClickerButton,
      this.grandmaButton,
      this.farmButton,
      this.luckyClickButton,
    ].forEach((btn) =>
      btn.addEventListener("mouseover", () => this.playHoverSound())
    );

    document.querySelectorAll(".shop-item img").forEach((itemImage) => {
      itemImage.addEventListener("click", () => {
        const upgradeKey = itemImage
          .closest(".shop-item")
          .getAttribute("data-upgrade");
        this.purchaseShopUpgrade(upgradeKey);
      });
    });

    if (this.shopIcon && this.shopContainer) {
      this.shopIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        const isVisible = this.shopContainer.style.display === "block";
        this.shopContainer.style.display = isVisible ? "none" : "block";
      });
      
      this.shopContainer.addEventListener("click", (e) => {
        e.stopPropagation();
      });
      
      document.addEventListener("click", () => {
        if (this.shopContainer.style.display === "block") {
          this.shopContainer.style.display = "none";
        }
      });
    } else {
      this.log("ERROR: shopIcon or shopContainer not found!");
    }

    this.settingsIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      this.settingsMenu.style.display = 
        this.settingsMenu.style.display === "block" ? "none" : "block";
      this.log(
        `Settings menu ${
          this.settingsMenu.style.display === "block" ? "shown" : "hidden"
        }`
      );
    });
    
    this.settingsMenu.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    
    document.addEventListener("click", () => {
      if (this.settingsMenu.style.display === "block") {
        this.settingsMenu.style.display = "none";
      }
    });

    [
      this.saveGameButton,
      this.loadGameButton,
      this.resetGameButton,
      this.toggleSoundButton,
    ].forEach((btn) =>
      btn.addEventListener("mouseover", () => this.playHoverSound())
    );
    this.saveGameButton.addEventListener("click", () => this.saveGame());
    this.loadGameButton.addEventListener("click", () => this.loadGame());
    this.resetGameButton.addEventListener("click", () => this.resetGame());
    this.toggleSoundButton.addEventListener("click", () => {
      this.soundOn = !this.soundOn;
      alert(`Sound is now ${this.soundOn ? "ON" : "OFF"}.`);
      this.log("Sound toggled:", this.soundOn);
    });

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
    } else {
      this.log("ERROR: achievementsIcon or achievementsContainer not found!");
    }

    this.cookie.addEventListener("click", (e) => this.handleCookieClick(e));

    document.querySelectorAll('.shop-item').forEach(item => {
      const clone = item.cloneNode(true);
      item.parentNode.replaceChild(clone, item);
      
      const itemImage = clone.querySelector('img.shop-item-image');
      if (itemImage) {
        itemImage.addEventListener('click', () => {
          const upgradeKey = clone.getAttribute("data-upgrade");
          if (upgradeKey) this.purchaseShopUpgrade(upgradeKey);
        });
      }
      
      const tooltip = clone.querySelector('.item-desc');
      if (tooltip) {
        const originalContent = tooltip.innerHTML;
        
        clone.addEventListener('mouseenter', () => {
          document.querySelectorAll('body > .item-desc').forEach(t => t.remove());
          
          const newTooltip = document.createElement('div');
          newTooltip.className = 'item-desc';
          newTooltip.innerHTML = `<div class="text-container">${originalContent}</div>`;
          document.body.appendChild(newTooltip);
          
          const rect = clone.getBoundingClientRect();
          const tooltipHeight = newTooltip.offsetHeight || 120;
          const tooltipWidth = newTooltip.offsetWidth || 220;
          const minPadding = 10;
          
          const positionAbove = rect.top - tooltipHeight - 15;
          if (positionAbove < minPadding) {
            newTooltip.style.top = (rect.bottom + 15) + 'px';
            newTooltip.classList.add('position-below');
          } else {
            newTooltip.style.top = positionAbove + 'px';
          }
          
          let leftPos = rect.left + (rect.width / 2) - (tooltipWidth / 2);
          if (leftPos < minPadding) {
            leftPos = minPadding;
          } else if (leftPos + tooltipWidth > window.innerWidth - minPadding) {
            leftPos = window.innerWidth - tooltipWidth - minPadding;
          }
          newTooltip.style.left = leftPos + 'px';
          
          newTooltip.style.zIndex = '100000000';
        });
        
        clone.addEventListener('mouseleave', () => {
          document.querySelectorAll('body > .item-desc').forEach(t => t.remove());
        });
      }
    });

    document.querySelectorAll('.shop-item').forEach(item => {
      const clone = item.cloneNode(true);
      item.parentNode.replaceChild(clone, item);
      
      const itemImage = clone.querySelector('img.shop-item-image');
      if (itemImage) {
        itemImage.addEventListener('click', (e) => {
          e.stopPropagation();
          const upgradeKey = clone.getAttribute("data-upgrade");
          if (upgradeKey) this.purchaseShopUpgrade(upgradeKey);
        });
      }
      
      const tooltip = clone.querySelector('.item-desc');
      if (tooltip) {
        const originalContent = tooltip.innerHTML;
        
        clone.addEventListener('mouseenter', (e) => {
          e.stopPropagation();
          
          document.querySelectorAll('.item-desc-tooltip').forEach(t => t.remove());
          
          const newTooltip = document.createElement('div');
          newTooltip.className = 'item-desc item-desc-tooltip';
          newTooltip.innerHTML = `<div class="text-container">${originalContent}</div>`;
          document.body.appendChild(newTooltip);
          
          const rect = clone.getBoundingClientRect();
          const tooltipHeight = newTooltip.offsetHeight || 120;
          const tooltipWidth = newTooltip.offsetWidth || 220;
          const minPadding = 10;
          
          const positionAbove = rect.top - tooltipHeight - 15;
          if (positionAbove < minPadding) {
            newTooltip.style.top = (rect.bottom + 15) + 'px';
            newTooltip.classList.add('position-below');
          } else {
            newTooltip.style.top = positionAbove + 'px';
          }
          
          let leftPos = rect.left + (rect.width / 2) - (tooltipWidth / 2);
          if (leftPos < minPadding) {
            leftPos = minPadding;
          } else if (leftPos + tooltipWidth > window.innerWidth - minPadding) {
            leftPos = window.innerWidth - tooltipWidth - minPadding;
          }
          newTooltip.style.left = leftPos + 'px';
          
          newTooltip.style.zIndex = '100000000';
        });
        
        clone.addEventListener('mouseleave', (e) => {
          e.stopPropagation();
          document.querySelectorAll('.item-desc-tooltip').forEach(t => t.remove());
        });
      }
    });
  }

  handleCookieClick(e) {
    if (this.soundOn) {
      this.clickSound.currentTime = 0;
      this.clickSound.play();
    }
    this.state.cookies += this.state.clickPower;
    this.log("Cookie clicked. New cookies:", this.state.cookies);
    this.showFloatingNumber(this.state.clickPower);
    this.createConfetti(e.clientX, e.clientY);
    this.checkAchievements();
    this.updateDisplay();
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
    const minDuration = 30;
    const maxDuration = 60;
    let duration = minDuration + (item.cost - baseCost) * 0.05;
    duration = Math.min(duration, maxDuration);

    this.state.timeAcceleratorActive = true;
    this.state.timeAcceleratorMultiplier = 4;
    this.state.timeAcceleratorEndTime = Date.now() + duration * 1000;

    this.applyTimeAcceleratorVisuals(true);
    
    this.log(
      "Time Accelerator activated for",
      duration,
      "seconds, multiplier:",
      this.state.timeAcceleratorMultiplier
    );
    this.showToast(`Time Accelerator activated! 4x production for ${Math.floor(duration)} seconds!`);

    setTimeout(() => {
      this.state.timeAcceleratorActive = false;
      this.state.timeAcceleratorMultiplier = 1;
      this.state.timeAcceleratorEndTime = 0;
      
      this.applyTimeAcceleratorVisuals(false);
      
      this.log("Time Accelerator expired");
      this.showToast("Time Accelerator expired");
    }, duration * 1000);
  }
  
  applyTimeAcceleratorVisuals(active) {
    if (this.cookie) {
      if (active) {
        this.cookie.classList.add('accelerated');
        this.cookie.style.filter = "brightness(1.5) drop-shadow(0 0 10px gold)";
      } else {
        this.cookie.classList.remove('accelerated');
        this.cookie.style.filter = "";
      }
    }
    
    if (this.cpsDisplay) {
      if (active) {
        this.cpsDisplay.style.color = "#ff4500";
        this.cpsDisplay.style.fontWeight = "bold";
      } else {
        this.cpsDisplay.style.color = "";
        this.cpsDisplay.style.fontWeight = "";
      }
    }
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
      const cps = autoClickers * 1 + grandmas * 5 + farms * 10;
      const timeAccelMult = this.state.timeAcceleratorActive
        ? this.state.timeAcceleratorMultiplier
        : 1;
      
      this.state.cookies += cps * timeAccelMult * delta;
      
      if (now - lastUpdateTime > UPDATE_INTERVAL) {
        this.updateDisplay();
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
    const cookies = Math.floor(this.state.cookies);
    
    this.cookieCount.textContent = cookies;
    this.clickPowerDisplay.textContent = this.state.clickPower;
    this.count.textContent = cookies + " cookies";
  
    const hasCookies = {};
    Object.keys(this.upgrades).forEach(key => {
      hasCookies[key] = cookies >= this.upgrades[key].cost;
    });
    
    Object.keys(this.upgrades).forEach((key) => {
      const buttons = document.querySelectorAll(`button#${key}`);
      
      if (!buttons.length) return;
      
      const text = this.upgrades[key].getDisplayText();
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
    
    const timeAccelEl = document.querySelector(
      `[data-upgrade="timeAccelerator"] .item-cost span`
    );
    if (timeAccelEl && this.shopUpgrades.timeAccelerator) {
      timeAccelEl.textContent = this.shopUpgrades.timeAccelerator.cost;
    }
  
    this.clickUpgradeButton.disabled =
      this.state.cookies < this.upgrades.clickUpgrade.cost;
    this.autoClickerButton.disabled =
      this.state.cookies < this.upgrades.autoClicker.cost;
    this.grandmaButton.disabled =
      this.state.cookies < this.upgrades.grandma.cost;
    this.farmButton.disabled = this.state.cookies < this.upgrades.farm.cost;
    this.luckyClickButton.disabled =
      this.state.cookies < this.upgrades.luckyClick.cost;
  
    const autoClickers = this.upgrades.autoClicker.count || 0;
    const grandmas = this.upgrades.grandma.count || 0;
    const farms = this.upgrades.farm.count || 0;
    const cps = autoClickers * 1 + grandmas * 5 + farms * 10;
    this.cpsDisplay.textContent = Math.floor(cps);
  
    const itemEl = document.querySelector(`[data-upgrade="timeAccelerator"]`);
    const timerSpan = itemEl
      ? itemEl.querySelector(".time-accelerator-timer")
      : null;
    if (this.state.timeAcceleratorActive && this.state.timeAcceleratorEndTime) {
      if (itemEl) itemEl.classList.add("active");
      const secondsLeft = Math.floor(
        (this.state.timeAcceleratorEndTime - Date.now()) / 1000
      );
      if (secondsLeft > 0 && timerSpan) {
        timerSpan.textContent = `⚡ 4x ACTIVE: ${secondsLeft}s ⚡`;
      } else if (timerSpan) {
        timerSpan.textContent = "";
      }
    } else {
      if (itemEl) itemEl.classList.remove("active");
      if (timerSpan) timerSpan.textContent = "";
    }
  
    this.updateAutoClickersVisual();
    this.updateFarmsVisual();
  }

  showFloatingNumber(amount, isBonus = false) {
    const floatingNumber = document.createElement("div");
    floatingNumber.className = "floating-number";
    
    let displayAmount;
    if (typeof amount === 'number') {
      if (Number.isInteger(amount)) {
        displayAmount = amount;
      } else {
        displayAmount = parseFloat(amount.toFixed(1));
      }
    } else {
      displayAmount = amount;
    }
    
    floatingNumber.textContent = `+${displayAmount}`;
    floatingNumber.style.color = isBonus ? "blue" : "red";
    const { left, top, width } = this.cookie.getBoundingClientRect();
    floatingNumber.style.left = `${left + width / 2 - 15}px`;
    floatingNumber.style.top = `${top - 10}px`;
    document.body.appendChild(floatingNumber);
    setTimeout(() => floatingNumber.remove(), 1000);
  }

  createConfetti(x, y) {
    const now = Date.now();
    if (this.lastConfettiTime && now - this.lastConfettiTime < 200) {
      return;
    }
    this.lastConfettiTime = now;
    
    if (!this.confettiCanvas) {
      this.confettiCanvas = document.createElement('canvas');
      this.confettiCanvas.width = window.innerWidth;
      this.confettiCanvas.height = window.innerHeight;
      this.confettiCanvas.style.position = 'fixed';
      this.confettiCanvas.style.top = '0';
      this.confettiCanvas.style.left = '0';
      this.confettiCanvas.style.pointerEvents = 'none';
      this.confettiCanvas.style.zIndex = '999999';
      document.body.appendChild(this.confettiCanvas);
      this.confettiCtx = this.confettiCanvas.getContext('2d');
      
      window.addEventListener('resize', () => {
        this.confettiCanvas.width = window.innerWidth;
        this.confettiCanvas.height = window.innerHeight;
      });
    }
  
    const numParticles = 10;
    const particles = [];
    
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: x,
        y: y,
        size: PARTICLE_SIZE,
        color: ['#ff6b6b', '#48dbfb', '#feca57', '#1dd1a1', '#ff9ff3'][Math.floor(Math.random() * 5)],
        speedX: Math.random() * 6 - 3,
        speedY: Math.random() * -3 - 2,
        rotation: 0,
        rotationSpeed: Math.random() * 0.2 - 0.1,
        opacity: 1,
        createdAt: now
      });
    }
  
    const animate = () => {
      this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
      
      let hasActiveParticles = false;
  
      for (const particle of particles) {
        const lifetime = now + PARTICLE_LIFETIME - particle.createdAt;
        if (lifetime <= 0) continue;
        
        hasActiveParticles = true;
        
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.speedY += 0.1;
        particle.rotation += particle.rotationSpeed;
        particle.opacity = lifetime / PARTICLE_LIFETIME;
        
        this.confettiCtx.save();
        this.confettiCtx.globalAlpha = particle.opacity;
        this.confettiCtx.translate(particle.x, particle.y);
        this.confettiCtx.rotate(particle.rotation);
        this.confettiCtx.fillStyle = particle.color;
        this.confettiCtx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
        this.confettiCtx.restore();
      }
      
      if (hasActiveParticles) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  updateGrandmasVisual() {
    const maxGrandmas = 100;
    const count = this.upgrades.grandma.count || 0;
    const progressWidth = (count / maxGrandmas) * 100;
    this.grandmaProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
    this.grandmaCountDisplay.textContent = count;
    this.log(
      "updateGrandmasVisual: count =",
      count,
      "progressWidth =",
      progressWidth
    );
  }

  updateAutoClickersVisual() {
    const maxAutoClickers = 100;
    const count = this.upgrades.autoClicker.count || 0;
    const progressWidth = (count / maxAutoClickers) * 100;
    this.autoClickersProgressBar.style.width = `${Math.min(
      progressWidth,
      100
    )}%`;
    this.autoClickersCountVisual.textContent = count;
  }

  updateFarmsVisual() {
    const maxFarms = 100;
    const count = this.upgrades.farm.count || 0;
    const progressWidth = (count / maxFarms) * 100;
    this.farmsProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
    this.farmsCountVisual.textContent = count;
  }

  setupAchievements() {
    this.registerAchievement(new Achievement(
      'cookies_100',
      'Cookie Novice',
      'Bake 100 cookies in total.',
      (game) => game.state.cookies >= 100,
      'common',
      'production',
      '🍪'
    ));
    
    this.registerAchievement(new Achievement(
      'cookies_1000',
      'Cookie Apprentice',
      'Bake 1,000 cookies in total.',
      (game) => game.state.cookies >= 1000,
      'common',
      'production',
      '🍪'
    ));
    
    this.registerAchievement(new Achievement(
      'cookies_10000',
      'Cookie Professional',
      'Bake 10,000 cookies in total.',
      (game) => game.state.cookies >= 10000,
      'uncommon',
      'production',
      '🍪'
    ));
    
    this.registerAchievement(new Achievement(
      'cookies_100000',
      'Cookie Maestro',
      'Bake 100,000 cookies in total.',
      (game) => game.state.cookies >= 100000,
      'rare',
      'production',
      '👨‍🍳'
    ));
    
    this.registerAchievement(new Achievement(
      'cookies_1000000',
      'Cookie Mogul',
      'Bake 1,000,000 cookies in total.',
      (game) => game.state.cookies >= 1000000,
      'epic',
      'production',
      '👑'
    ));
    
    this.registerAchievement(new Achievement(
      'click_power_10',
      'Finger of Destiny',
      'Reach a click power of 10 or higher.',
      (game) => game.state.clickPower >= 10,
      'uncommon',
      'clicking',
      '👆'
    ));
    
    this.registerAchievement(new Achievement(
      'click_power_50',
      'Hand of Destruction',
      'Reach a click power of 50 or higher.',
      (game) => game.state.clickPower >= 50, 
      'rare',
      'clicking',
      '✋'
    ));
    
    this.registerAchievement(new Achievement(
      'click_power_100',
      'Cookie Annihilator',
      'Reach a click power of 100 or higher.',
      (game) => game.state.clickPower >= 100,
      'epic',
      'clicking',
      '💪'
    ));
    
    this.registerAchievement(new Achievement(
      'autoclicker_5',
      'Automation Beginner',
      'Own 5 Auto Clickers.',
      (game) => (game.upgrades.autoClicker.count || 0) >= 5,
      'common',
      'collection',
      '🤖'
    ));
    
    this.registerAchievement(new Achievement(
      'autoclicker_25',
      'Automation Expert',
      'Own 25 Auto Clickers.',
      (game) => (game.upgrades.autoClicker.count || 0) >= 25,
      'uncommon',
      'collection',
      '🤖'
    ));
    
    this.registerAchievement(new Achievement(
      'autoclicker_50',
      'Army of Clickers',
      'Own 50 Auto Clickers.',
      (game) => (game.upgrades.autoClicker.count || 0) >= 50,
      'rare',
      'collection',
      '⚙️'
    ));
    
    this.registerAchievement(new Achievement(
      'grandma_5',
      'Family Baker',
      'Recruit 5 Grandmas for your bakery.',
      (game) => (game.upgrades.grandma.count || 0) >= 5,
      'common',
      'collection',
      '👵'
    ));
    
    this.registerAchievement(new Achievement(
      'grandma_25',
      'Grandma Commune',
      'Recruit 25 Grandmas for your bakery.',
      (game) => (game.upgrades.grandma.count || 0) >= 25,
      'uncommon',
      'collection',
      '👵'
    ));
    
    this.registerAchievement(new Achievement(
      'grandma_50',
      'Grandmapocalypse',
      'Control an army of 50 Grandmas.',
      (game) => (game.upgrades.grandma.count || 0) >= 50,
      'epic',
      'collection',
      '👵'
    ));
    
    this.registerAchievement(new Achievement(
      'farm_5',
      'Cookie Farmer',
      'Own 5 Cookie Farms.',
      (game) => (game.upgrades.farm.count || 0) >= 5,
      'common',
      'collection',
      '🌱'
    ));
    
    this.registerAchievement(new Achievement(
      'farm_25',
      'Agribusiness',
      'Own 25 Cookie Farms.',
      (game) => (game.upgrades.farm.count || 0) >= 25,
      'uncommon',
      'collection', 
      '🌾'
    ));
    
    this.registerAchievement(new Achievement(
      'farm_50',
      'Cookie Plantation Empire',
      'Own 50 Cookie Farms across the land.',
      (game) => (game.upgrades.farm.count || 0) >= 50,
      'rare',
      'collection',
      '🚜'
    ));
    
    this.registerAchievement(new Achievement(
      'cps_100',
      'Industrial Revolution',
      'Reach 100 cookies per second.',
      (game) => {
        const autoClickers = game.upgrades.autoClicker.count || 0;
        const grandmas = game.upgrades.grandma.count || 0;
        const farms = game.upgrades.farm.count || 0;
        return (autoClickers * 1 + grandmas * 5 + farms * 10) >= 100;
      },
      'uncommon',
      'special',
      '⚡'
    ));
    
    this.registerAchievement(new Achievement(
      'cps_500',
      'Cookie Factory',
      'Reach 500 cookies per second.',
      (game) => {
        const autoClickers = game.upgrades.autoClicker.count || 0;
        const grandmas = game.upgrades.grandma.count || 0;
        const farms = game.upgrades.farm.count || 0;
        return (autoClickers * 1 + grandmas * 5 + farms * 10) >= 500;
      },
      'rare',
      'special',
      '🏭'
    ));
    
    this.registerAchievement(new Achievement(
      'balanced_force',
      'Balanced Force',
      'Have exactly the same number of Auto Clickers, Grandmas, and Farms (at least 10 each).',
      (game) => {
        const autoClickers = game.upgrades.autoClicker.count || 0;
        const grandmas = game.upgrades.grandma.count || 0;
        const farms = game.upgrades.farm.count || 0;
        return autoClickers >= 10 && autoClickers === grandmas && grandmas === farms;
      },
      'legendary',
      'special',
      '⚖️'
    ));
    
    this.registerAchievement(new Achievement(
      'lucky_streak',
      'Fortune Favors the Bold',
      'Purchase the Lucky Click upgrade 7 times in a row without buying any other upgrade.',
      (game) => game.state.luckyStreak >= 7,
      'epic',
      'special',
      '🍀'
    ));
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
        this.showToast(`🏆 Achievement Unlocked: ${achievement.name}!`);
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
    if (this.achievementsList) {
      const earnedAchievements = this.achievements.filter(a => a.earned);
      
      if (earnedAchievements.length === 0) {
        this.achievementsList.innerHTML = `
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
      
      earnedAchievements.sort((a, b) => 
        rarityOrder[a.rarity] - rarityOrder[b.rarity]
      );
      
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
      
      this.achievementsList.innerHTML = achievementItems;
    } else {
      this.log("ERROR: achievementsList element is not cached!");
    }
  }

  showFloatingNumber(amount, isBonus = false) {
    const floatingNumber = document.createElement("div");
    floatingNumber.className = "floating-number";
    
    let displayAmount;
    if (typeof amount === 'number') {
      if (Number.isInteger(amount)) {
        displayAmount = amount;
      } else {
        displayAmount = parseFloat(amount.toFixed(1));
      }
    } else {
      displayAmount = amount;
    }
    
    floatingNumber.textContent = `+${displayAmount}`;
    floatingNumber.style.color = isBonus ? "blue" : "red";
    const { left, top, width } = this.cookie.getBoundingClientRect();
    floatingNumber.style.left = `${left + width / 2 - 15}px`;
    floatingNumber.style.top = `${top - 10}px`;
    document.body.appendChild(floatingNumber);
    setTimeout(() => floatingNumber.remove(), 1000);
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
    this.showToast("Game saved!");
    this.log("Manual save complete.");
  }

  autoSave() {
    this.doSaveGame();
    this.showToast("Game auto-saved!");
    this.log("Auto-saved game at", new Date());
  }

  showToast(message) {
    const notification = document.createElement("div");
    notification.className = "auto-save-notification";
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
      this.log("Notification removed");
    }, 3000);
  }

  loadGame() {
    try {
      const savedStr = localStorage.getItem("cookieGameSave");
      if (!savedStr) {
        this.showToast("No saved game found!");
        return;
      }
      const savedGame = JSON.parse(savedStr);
      this.log("Saved game data loaded:", savedGame);

      this.state = savedGame.state || this.state;

      if (typeof savedGame.upgrades === "object") {
        this.upgrades = {
          clickUpgrade: new ClickMultiplierUpgrade(10, 3, "Upgrade Click Power"),
          autoClicker: new IncrementUpgrade(50, 1.5, "Buy Auto Clicker"),
          grandma: new IncrementUpgrade(100, 1.5, "Buy Grandma's Bakery", "updateGrandmasVisual"),
          farm: new IncrementUpgrade(500, 1.5, "Buy Cookie Farm"),
          luckyClick: new LuckyUpgrade(15, 1.15, "Lucky Click"),
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
          timeAccelerator: new ShopUpgrade(300, 2, "Time Accelerator", "timeAccelerator", 300),
        };
        Object.keys(savedGame.shopUpgrades).forEach((key) => {
          if (savedGame.shopUpgrades[key].cost !== undefined) {
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

      this.updateDisplay();
      this.updateAchievements();
      this.updateGrandmasVisual();
      this.checkAchievements();
      this.log("Load complete.");
      this.showToast("Game loaded successfully!");
    } catch (e) {
      this.log("Failed to load game:", e);
      this.showToast("Failed to load game data!");
    }
  }

  resetGame() {
    if (
      !confirm(
        "Are you sure you want to reset your game? This action cannot be undone."
      )
    )
      return;
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
      luckyClick: new LuckyUpgrade(15, 1.15, "Lucky Click"),
    };
    this.shopUpgrades = {
      timeAccelerator: new ShopUpgrade(300, 2, "Time Accelerator", "timeAccelerator", 300),
    };
    this.achievements = [];
    this.setupAchievements();
    
    this.updateDisplay();
    this.updateAchievements();
    this.updateGrandmasVisual();
    
    this.log("Game reset.");
    alert("Game has been reset.");
  }
}

const game = new Game();

document.addEventListener("DOMContentLoaded", function () {
  let achieveWrapper = document.getElementById("achievementsWrapper");
  let dropdownContent = document.getElementById("achievementsContainer");

  achieveWrapper.addEventListener("click", function (event) {
    let dropdownContentDisplay = window.getComputedStyle(dropdownContent, null).getPropertyValue("display");
    if (dropdownContentDisplay === "none") {
      dropdownContent.style.display = "block";
    } else {
      dropdownContent.style.display = "none";
    }
  });

  achieveWrapper.addEventListener("blur", function (event) {
    dropdownContent.style.display = "none";
  });
});

console.log("Loading Cookie Clicker through module system...");


