const PARTICLE_SIZE = 20;
const PARTICLE_LIFETIME = 2000;
const AUTO_SAVE_INTERVAL = 60000; // 1 minutes

// Upgrade classes:

class Upgrade {
  // Modified constructor: now accepts displayPrefix and sets it.
  constructor(cost, multiplier, displayPrefix, extra = null) {
    this.cost = cost;
    this.multiplier = multiplier;
    this.displayPrefix = displayPrefix;
    this.extra = extra;
  }
  // New: returns text for button display.
  getDisplayText() {
    return `${this.displayPrefix} (Cost: ${this.cost})`;
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
  // To be defined in subclasses.
  executePurchase(game) {
    // ...override in subclass...
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
    super(cost, multiplier, displayPrefix);
  }
  executePurchase(game) {
    const bonus = Math.floor(Math.random() * 10) + 1;
    game.state.cookies += bonus;
    game.showFloatingNumber(bonus, true);
  }
}

// ShopUpgrade using similar pattern:
class ShopUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, extra = null, baseCost) {
    super(cost, multiplier, displayPrefix, extra);
    this.baseCost = baseCost;
  }
  // Override purchase entirely (different cost update)
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
    // Changed 1.2 to use this.multiplier for cost update.
    this.cost = Math.floor(this.cost * this.multiplier);
    const costSpan = document.querySelector(
      `[data-upgrade="timeAccelerator"] .item-cost span`
    );
    if (costSpan) costSpan.textContent = this.cost;
    game.updateDisplay();
    game.showToast(`${this.extra} purchased!`);
  }
}

class Game {
  constructor() {
    // Enable debug logging
    this.debug = true;
    this.log("Initializing game...");

    // Centralized game state
    this.state = {
      cookies: 0,
      clickPower: 1,
      grandmas: 0,

      // Time Accelerator state
      timeAcceleratorActive: false,
      timeAcceleratorMultiplier: 1,
      timeAcceleratorEndTime: 0,
    };

    // Use the new upgrade classes instead of one size–fits–all:
    this.upgrades = {
      clickUpgrade: new ClickMultiplierUpgrade(10, 3, "Upgrade Click Power"),
      autoClicker: new IncrementUpgrade(50, 1.5, "Buy Auto Clicker"),
      grandma: new IncrementUpgrade(100, 1.5, "Buy Grandma's Bakery", "updateGrandmasVisual"),
      farm: new IncrementUpgrade(500, 1.5, "Buy Cookie Farm"),
      luckyClick: new LuckyUpgrade(20, 1, "Lucky Click"),
    };

    this.shopUpgrades = {
      timeAccelerator: new ShopUpgrade(300, 2, "Time Accelerator", "timeAccelerator", 300),
    };

    // Achievements
    this.achievements = [];

    // Sound settings
    this.soundOn = true;
    this.clickSound = new Audio("sounds/click.mp3");
    this.clickSound.volume = 0.2;

    this.init();

    // Auto-load saved game if exists
    if (localStorage.getItem("cookieGameSave")) {
      this.loadGame();
      this.log("Auto-loaded saved game.");
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
    this.shopElement = document.getElementById("shop");

    // Settings Panel Elements
    this.saveGameButton = document.getElementById("saveGame");
    this.loadGameButton = document.getElementById("loadGame");
    this.resetGameButton = document.getElementById("resetGame");
    this.toggleSoundButton = document.getElementById("toggleSound");
    this.settingsIcon = document.getElementById("settingsIcon");
    this.settingsMenu = document.getElementById("settingsMenu");

    // Achievements Elements
    this.achievementsContainer = document.getElementById(
      "achievementsContainer"
    );
    this.achievementsList = document.getElementById("achievementsList");

    // Visualization Elements
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

    // Auto-save every 5 minutes
    setInterval(() => this.autoSave(), AUTO_SAVE_INTERVAL);
  }

  setupEventListeners() {
    // Add event listeners to every upgrade button:
    document.querySelectorAll("button.upgrade").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.log("Upgrade button clicked:", btn.id);
        this.purchaseStandardUpgrade(btn.id);
      });
    });

    // Add hover sound to upgrade buttons
    [
      this.clickUpgradeButton,
      this.autoClickerButton,
      this.grandmaButton,
      this.farmButton,
      this.luckyClickButton,
    ].forEach((btn) =>
      btn.addEventListener("mouseover", () => this.playHoverSound())
    );

    // Shop Items: Purchase by clicking the item image
    this.shopElement.querySelectorAll(".shop-item img").forEach((itemImage) => {
      itemImage.addEventListener("click", () => {
        const upgradeKey = itemImage
          .closest(".shop-item")
          .getAttribute("data-upgrade");
        this.purchaseShopUpgrade(upgradeKey);
      });
    });

    // Settings Panel: Toggle display on settings icon click with improved handling
    this.settingsIcon.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent document click from immediately closing it
      this.settingsMenu.style.display = 
        this.settingsMenu.style.display === "block" ? "none" : "block";
      this.log(
        `Settings menu ${
          this.settingsMenu.style.display === "block" ? "shown" : "hidden"
        }`
      );
    });
    
    // Prevent clicks inside the settings menu from closing it
    this.settingsMenu.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    
    // Add click-outside handling for settings menu
    document.addEventListener("click", () => {
      if (this.settingsMenu.style.display === "block") {
        this.settingsMenu.style.display = "none";
      }
    });

    // Add hover sound to settings control buttons
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

    // Fix achievements icon click handler
    const achievementsIcon = document.getElementById("achievementsIcon");
    const achievementsContainer = document.getElementById("achievementsContainer");
    
    if (achievementsIcon && achievementsContainer) {
      // Simplified toggle logic
      achievementsIcon.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent closing when clicking the icon
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
    } else {
      this.log("ERROR: achievementsIcon or achievementsContainer not found!");
    }

    // Cookie click handler
    this.cookie.addEventListener("click", (e) => this.handleCookieClick(e));
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
  }

  purchaseShopUpgrade(upgradeKey) {
    const shopUpgrade = this.shopUpgrades[upgradeKey];
    if (!shopUpgrade) return;
    shopUpgrade.purchase(this);
  }

  activateTimeAccelerator(item) {
    const baseCost = item.baseCost || 300;
    const minDuration = 120; // 2 minutes
    const maxDuration = 300; // 5 minutes
    let duration = minDuration + (item.cost - baseCost) * 0.2;
    duration = Math.min(duration, maxDuration);

    this.state.timeAcceleratorActive = true;
    this.state.timeAcceleratorMultiplier = item.multiplier;
    this.state.timeAcceleratorEndTime = Date.now() + duration * 1000;

    this.log(
      "Time Accelerator activated for",
      duration,
      "seconds, multiplier:",
      item.multiplier
    );
    this.showToast("Time Accelerator activated!");

    setTimeout(() => {
      this.state.timeAcceleratorActive = false;
      this.state.timeAcceleratorMultiplier = 1;
      this.state.timeAcceleratorEndTime = 0;
      this.log("Time Accelerator expired");
      this.showToast("Time Accelerator expired");
    }, duration * 1000);
  }

  startGameLoop() {
    let lastTime = performance.now();
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 100; // Update display at most every 100ms
    
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
        this.updateDisplay();
        lastUpdateTime = now;
      }
      
      requestAnimationFrame(loop);
    };
    
    requestAnimationFrame(loop);
  }

  updateDisplay() {
    // Cache values to avoid layout thrashing
    const cookies = Math.floor(this.state.cookies);
    
    // Group updates to minimize reflows
    this.cookieCount.textContent = cookies;
    this.clickPowerDisplay.textContent = this.state.clickPower;
    this.count.textContent = cookies + " cookies";
  
    // Cache & update button states in batch
    const hasCookies = {};
    Object.keys(this.upgrades).forEach(key => {
      hasCookies[key] = cookies >= this.upgrades[key].cost;
    });
    
    // Update button texts (optimized to reduce DOM operations)
    Object.keys(this.upgrades).forEach((key) => {
      const buttons = document.querySelectorAll(`button#${key}`);
      
      // Skip if no buttons found or disabled state is already correct
      if (!buttons.length) return;
      
      const text = this.upgrades[key].getDisplayText();
      const disabled = !hasCookies[key];
      
      buttons.forEach((btn) => {
        // Only update if changed
        if (btn.dataset.content !== text) {
          btn.dataset.content = text;
          const btnTop = btn.querySelector(".button_top");
          if (btnTop) btnTop.textContent = text;
        }
        
        // Only update disabled state if it's changed
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
        timerSpan.textContent = `Active: ${secondsLeft}s left`;
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
    floatingNumber.textContent = `+${amount}`;
    floatingNumber.style.color = isBonus ? "blue" : "red";
    const { left, top, width } = this.cookie.getBoundingClientRect();
    floatingNumber.style.left = `${left + width / 2 - 15}px`;
    floatingNumber.style.top = `${top - 10}px`;
    document.body.appendChild(floatingNumber);
    setTimeout(() => floatingNumber.remove(), 1000);
  }

  createConfetti(x, y) {
    // Skip if called too frequently (improved debouncing)
    const now = Date.now();
    if (this.lastConfettiTime && now - this.lastConfettiTime < 200) {
      return;
    }
    this.lastConfettiTime = now;
    
    // Use canvas instead of DOM elements for better performance
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
      
      // Handle resize events
      window.addEventListener('resize', () => {
        this.confettiCanvas.width = window.innerWidth;
        this.confettiCanvas.height = window.innerHeight;
      });
    }
  
    // Create particles
    const numParticles = 10;
    const particles = [];
    
    // Create particle objects (not DOM elements)
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
  
    // Animation function for canvas rendering
    const animate = () => {
      // Clear only the needed part of canvas
      this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
      
      // Check if there are any active particles
      let hasActiveParticles = false;
  
      // Update and draw particles
      for (const particle of particles) {
        // Calculate lifetime
        const lifetime = now + PARTICLE_LIFETIME - particle.createdAt;
        if (lifetime <= 0) continue;
        
        hasActiveParticles = true;
        
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.speedY += 0.1; // gravity
        particle.rotation += particle.rotationSpeed;
        particle.opacity = lifetime / PARTICLE_LIFETIME;
        
        // Draw particle
        this.confettiCtx.save();
        this.confettiCtx.globalAlpha = particle.opacity;
        this.confettiCtx.translate(particle.x, particle.y);
        this.confettiCtx.rotate(particle.rotation);
        this.confettiCtx.fillStyle = particle.color;
        this.confettiCtx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
        this.confettiCtx.restore();
      }
      
      // Continue animation if particles are still active
      if (hasActiveParticles) {
        requestAnimationFrame(animate);
      }
    };
    
    // Start animation
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

  checkAchievements() {
    const achievementsToCheck = [
      { condition: this.state.cookies >= 100, text: "100 Cookies!" },
      { condition: this.state.cookies >= 1000, text: "1000 Cookies!" },
      {
        condition: (this.upgrades.autoClicker.count || 0) >= 5,
        text: "5 Auto Clickers!",
      },
      {
        condition: (this.upgrades.grandma.count || 0) >= 3,
        text: "3 Grandma's Bakeries!",
      },
    ];
    achievementsToCheck.forEach(({ condition, text }) => {
      if (condition && !this.achievements.includes(text)) {
        this.achievements.push(text);
        this.updateAchievements();
      }
    });
  }

  updateAchievements() {
    // Use the cached achievementsList element from init.
    if (this.achievementsList) {
      this.achievementsList.innerHTML = this.achievements
        .map((ach) => `<li>${ach}</li>`)
        .join("");
    } else {
      this.log("ERROR: achievementsList element is not cached!");
    }
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
          timeAccelerator: new ShopUpgrade(300, 2, "Time Accelerator", "timeAccelerator", 300),
        };
        Object.keys(savedGame.shopUpgrades).forEach((key) => {
          if (savedGame.shopUpgrades[key].cost !== undefined) {
            this.shopUpgrades[key].cost = savedGame.shopUpgrades[key].cost;
          }
        });
      }

      this.achievements = savedGame.achievements || [];
      this.soundOn = savedGame.soundOn !== undefined ? savedGame.soundOn : true;

      this.updateDisplay();
      this.updateAchievements();
      this.updateGrandmasVisual();
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
    };
    this.upgrades = {
      clickUpgrade: new ClickMultiplierUpgrade(10, 3, "Upgrade Click Power"),
      autoClicker: new IncrementUpgrade(50, 1.5, "Buy Auto Clicker"),
      grandma: new IncrementUpgrade(100, 1.5, "Buy Grandma's Bakery", "updateGrandmasVisual"),
      farm: new IncrementUpgrade(500, 1.5, "Buy Cookie Farm"),
      luckyClick: new LuckyUpgrade(20, 1, "Lucky Click"),
    };
    this.shopUpgrades = {
      timeAccelerator: new ShopUpgrade(300, 2, "Time Accelerator", "timeAccelerator", 300),
    };
    this.achievements = [];
    this.soundOn = true;
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
    // Compute display dynamically on click.
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
