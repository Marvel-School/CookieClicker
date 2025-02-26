/**
 * Game class
 * ----------
 * Centralizes state & upgrade data, uses a smooth game loop,
 * organizes settings into a compact panel, and includes a Shop section
 * for special items such as the "Time Accelerator."
 *
 * The Time Accelerator is purchased by clicking its image in the Shop.
 * Its description appears as a speech bubble on hover, and when active,
 * the shop item is highlighted with a countdown.
 *
 * A logging system is included to help debug.
 */

const PARTICLE_SIZE = 40;
const PARTICLE_LIFETIME = 1000;
const AUTO_SAVE_INTERVAL = 300000; // 5 minutes

class Game {
  constructor() {
    // Enable debug logging
    this.debug = true;
    this.log("Initializing game...");

    // Centralized game state
    this.state = {
      cookies: 0,
      clickPower: 1,
      grandmas: 0, // fallback for older saves

      // Time Accelerator state
      timeAcceleratorActive: false,
      timeAcceleratorMultiplier: 1,
      timeAcceleratorEndTime: 0,
    };

    // Standard Upgrades (left side)
    this.upgrades = {
      clickUpgrade: { cost: 10, multiplier: 3, action: "multiplyClickPower" },
      autoClicker: { cost: 50, count: 0, multiplier: 1.5, action: "increment" },
      grandma: {
        cost: 100,
        count: 0,
        multiplier: 1.5,
        action: "increment",
        extra: "updateGrandmasVisual",
      },
      farm: { cost: 500, count: 0, multiplier: 1.5, action: "increment" },
      luckyClick: { cost: 20, action: "lucky", multiplier: 1 },
    };

    // Shop Upgrades
    this.shopUpgrades = {
      timeAccelerator: {
        cost: 300,
        multiplier: 2,
        baseCost: 300, // used for duration calculations
      },
    };

    // Achievements
    this.achievements = [];

    // Sound settings
    this.soundOn = true;
    this.clickSound = new Audio("sounds/click.mp3");
    this.clickSound.volume = 0.2;

    this.init();
  }

  log(message, ...data) {
    if (this.debug) {
      console.log(message, ...data);
    }
  }

  // playHoverSound remains but is no longer attached to left or shop items
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

    // Settings Panel
    this.saveGameButton = document.getElementById("saveGame");
    this.loadGameButton = document.getElementById("loadGame");
    this.resetGameButton = document.getElementById("resetGame");
    this.toggleSoundButton = document.getElementById("toggleSound");
    this.settingsIcon = document.getElementById("settingsIcon");
    this.settingsMenu = document.getElementById("settingsMenu");

    // Visualization Elements
    this.grandmaProgressBar = document.getElementById("grandmaProgressBar");
    this.grandmaCountDisplay = document.getElementById("grandmaCount");
    this.autoClickersProgressBar = document.getElementById("autoClickersProgressBar");
    this.autoClickersCountVisual = document.getElementById("autoClickersCountVisual");
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
    // Standard Upgrades (Left Section)
    const leftSection = document.querySelector(".left");
    leftSection.addEventListener("click", (e) => {
      if (e.target.matches("button.upgrade")) {
        this.log("Upgrade button clicked:", e.target.id);
        this.purchaseStandardUpgrade(e.target.id);
      }
    });
    // (No hover sound for left buttons)

    // Shop Items: Purchase by clicking the item image
    const shopItems = this.shopElement.querySelectorAll(".shop-item");
    shopItems.forEach((item) => {
      const itemImage = item.querySelector("img");
      itemImage.addEventListener("click", () => {
        const upgradeKey = item.getAttribute("data-upgrade");
        this.purchaseShopUpgrade(upgradeKey);
      });
    });
    // (No hover sound for shop items)

    // Settings Panel: Remove hover sound for settings buttons as well
    this.settingsIcon.addEventListener("click", () => {
      if (!this.settingsMenu.style.display || this.settingsMenu.style.display === "none") {
        this.settingsMenu.style.display = "block";
        this.log("Settings menu shown");
      } else {
        this.settingsMenu.style.display = "none";
        this.log("Settings menu hidden");
      }
    });
    // Do not attach hover sound events to settings buttons

    // Save, Load, Reset, Toggle Sound actions
    this.saveGameButton.addEventListener("click", () => this.saveGame());
    this.loadGameButton.addEventListener("click", () => this.loadGame());
    this.resetGameButton.addEventListener("click", () => this.resetGame());
    this.toggleSoundButton.addEventListener("click", () => {
      this.soundOn = !this.soundOn;
      alert(`Sound is now ${this.soundOn ? "ON" : "OFF"}.`);
      this.log("Sound toggled:", this.soundOn);
    });

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
    const config = this.upgrades[upgradeKey];
    if (!config) return;
    if (this.state.cookies >= config.cost) {
      this.state.cookies -= config.cost;
      this.log(`Purchased standard upgrade: ${upgradeKey}, cost was: ${config.cost}`);

      switch (config.action) {
        case "multiplyClickPower":
          this.state.clickPower *= 2;
          break;
        case "increment":
          config.count = (config.count || 0) + 1;
          break;
        case "lucky":
          const bonus = Math.floor(Math.random() * 10) + 1;
          this.state.cookies += bonus;
          this.showFloatingNumber(bonus, true);
          break;
        default:
          break;
      }
      config.cost = Math.floor(config.cost * config.multiplier);
      if (config.extra && typeof this[config.extra] === "function") {
        this[config.extra]();
      }
      this.updateDisplay();
    } else {
      this.log(`Not enough cookies for ${upgradeKey}. Cost: ${config.cost}, have: ${this.state.cookies}`);
    }
  }

  purchaseShopUpgrade(upgradeKey) {
    const item = this.shopUpgrades[upgradeKey];
    if (!item) return;
    if (this.state.cookies >= item.cost) {
      this.state.cookies -= item.cost;
      this.log(`Purchased shop item: ${upgradeKey}, cost was: ${item.cost}`);

      if (upgradeKey === "timeAccelerator") {
        this.activateTimeAccelerator(item);
      }

      // Increase cost for subsequent purchases
      item.cost = Math.floor(item.cost * 1.2);

      // Update the cost in the shop UI
      const costSpan = document.querySelector(`[data-upgrade="${upgradeKey}"] .item-cost span`);
      if (costSpan) {
        costSpan.textContent = item.cost;
      }

      this.updateDisplay();
      this.showToast(`${upgradeKey} purchased!`);
    } else {
      this.log(`Not enough cookies for ${upgradeKey}. Need: ${item.cost}, have: ${this.state.cookies}`);
      this.showToast(`Not enough cookies for ${upgradeKey}`);
    }
  }

  activateTimeAccelerator(item) {
    const baseCost = item.baseCost || 300;
    const minDuration = 120; // 2 minutes
    const maxDuration = 300; // 5 minutes
    let duration = minDuration + ((item.cost - baseCost) * 0.2);
    duration = Math.min(duration, maxDuration);

    this.state.timeAcceleratorActive = true;
    this.state.timeAcceleratorMultiplier = item.multiplier;
    this.state.timeAcceleratorEndTime = Date.now() + duration * 1000;

    this.log("Time Accelerator activated for", duration, "seconds, multiplier:", item.multiplier);
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
    const loop = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const autoClickers = this.upgrades.autoClicker.count || 0;
      const grandmas = this.upgrades.grandma.count || 0;
      const farms = this.upgrades.farm.count || 0;
      const cps = (autoClickers * 1) + (grandmas * 5) + (farms * 10);

      const timeAccelMult = this.state.timeAcceleratorActive ? this.state.timeAcceleratorMultiplier : 1;
      this.state.cookies += cps * timeAccelMult * delta;

      this.updateDisplay();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  updateDisplay() {
    this.cookieCount.textContent = Math.floor(this.state.cookies);
    this.clickPowerDisplay.textContent = this.state.clickPower;

    this.clickUpgradeButton.textContent = `Upgrade Click Power (Cost: ${this.upgrades.clickUpgrade.cost})`;
    this.autoClickerButton.textContent = `Buy Auto Clicker (Cost: ${this.upgrades.autoClicker.cost})`;
    this.grandmaButton.textContent = `Buy Grandma's Bakery (Cost: ${this.upgrades.grandma.cost})`;
    this.farmButton.textContent = `Buy Cookie Farm (Cost: ${this.upgrades.farm.cost})`;
    this.luckyClickButton.textContent = `Lucky Click (Cost: ${this.upgrades.luckyClick.cost})`;

    const timeAcceleratorEl = document.querySelector('[data-upgrade="timeAccelerator"] .item-cost span');
    if (timeAcceleratorEl && this.shopUpgrades.timeAccelerator) {
      timeAcceleratorEl.textContent = this.shopUpgrades.timeAccelerator.cost;
    }

    this.clickUpgradeButton.disabled = this.state.cookies < this.upgrades.clickUpgrade.cost;
    this.autoClickerButton.disabled = this.state.cookies < this.upgrades.autoClicker.cost;
    this.grandmaButton.disabled = this.state.cookies < this.upgrades.grandma.cost;
    this.farmButton.disabled = this.state.cookies < this.upgrades.farm.cost;
    this.luckyClickButton.disabled = this.state.cookies < this.upgrades.luckyClick.cost;

    const autoClickers = this.upgrades.autoClicker.count || 0;
    const grandmas = this.upgrades.grandma.count || 0;
    const farms = this.upgrades.farm.count || 0;
    const cps = (autoClickers * 1) + (grandmas * 5) + (farms * 10);
    this.cpsDisplay.textContent = Math.floor(cps);

    const itemEl = document.querySelector('[data-upgrade="timeAccelerator"]');
    const timerSpan = itemEl ? itemEl.querySelector(".time-accelerator-timer") : null;
    if (this.state.timeAcceleratorActive && this.state.timeAcceleratorEndTime) {
      if (itemEl) itemEl.classList.add("active");
      const secondsLeft = Math.floor((this.state.timeAcceleratorEndTime - Date.now()) / 1000);
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
    this.log("createConfetti triggered at:", { x, y });
    const numParticles = 20;
    const cookieImages = [
      "image/cookie.png",
      "image/cookie3.png",
      "image/cookie4.png",
      "image/cookie1.png",
      "image/cookie2.png",
    ];
    for (let i = 0; i < numParticles; i++) {
      const particle = document.createElement("img");
      const randomIndex = Math.floor(Math.random() * cookieImages.length);
      particle.src = cookieImages[randomIndex];
      particle.className = "confetti";
      particle.style.width = `${PARTICLE_SIZE}px`;
      particle.style.height = `${PARTICLE_SIZE}px`;
      particle.style.position = "absolute";
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      const offsetX = `${(Math.random() * 200 - 100).toFixed(0)}px`;
      const offsetY = `${(Math.random() * 200 - 100).toFixed(0)}px`;
      particle.style.setProperty("--x", offsetX);
      particle.style.setProperty("--y", offsetY);
      document.body.appendChild(particle);
      setTimeout(() => {
        particle.remove();
        this.log(`Particle ${i} removed`);
      }, PARTICLE_LIFETIME);
    }
  }

  updateGrandmasVisual() {
    const maxGrandmas = 100;
    const count = this.upgrades.grandma.count || 0;
    const progressWidth = (count / maxGrandmas) * 100;
    this.grandmaProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
    this.grandmaCountDisplay.textContent = count;
    this.log("updateGrandmasVisual: count =", count, "progressWidth =", progressWidth);
  }

  updateAutoClickersVisual() {
    const maxAutoClickers = 100;
    const count = this.upgrades.autoClicker.count || 0;
    const progressWidth = (count / maxAutoClickers) * 100;
    this.autoClickersProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
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
      { condition: (this.upgrades.autoClicker.count || 0) >= 5, text: "5 Auto Clickers!" },
      { condition: (this.upgrades.grandma.count || 0) >= 3, text: "3 Grandma's Bakeries!" },
    ];
    achievementsToCheck.forEach(({ condition, text }) => {
      if (condition && !this.achievements.includes(text)) {
        this.achievements.push(text);
        this.updateAchievements();
      }
    });
  }

  updateAchievements() {
    this.achievementsList = document.getElementById("achievementsList");
    if (this.achievementsList) {
      this.achievementsList.innerHTML = this.achievements
        .map((ach) => `<li>${ach}</li>`)
        .join("");
    } else {
      this.log("ERROR: achievementsList element is undefined!");
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
    const savedGame = JSON.parse(localStorage.getItem("cookieGameSave"));
    if (!savedGame) {
      this.showToast("No saved game found!");
      return;
    }
    this.log("Saved game data loaded:", savedGame);

    this.state = savedGame.state || this.state;
    if (typeof savedGame.upgrades === "object") {
      this.upgrades = { ...this.upgrades, ...savedGame.upgrades };
    }
    if (typeof savedGame.shopUpgrades === "object") {
      this.shopUpgrades = { ...this.shopUpgrades, ...savedGame.shopUpgrades };
    }
    this.achievements = savedGame.achievements || [];
    this.soundOn = savedGame.soundOn !== undefined ? savedGame.soundOn : true;

    if (this.upgrades.grandma && typeof this.upgrades.grandma.extra === "string") {
      this.upgrades.grandma.extra = "updateGrandmasVisual";
    }
    if (typeof this.state.grandmas === "number" && this.state.grandmas > (this.upgrades.grandma.count || 0)) {
      this.upgrades.grandma.count = this.state.grandmas;
    }

    this.updateDisplay();
    this.updateAchievements();
    this.updateGrandmasVisual();
    this.log("Load complete. Upgrades:", this.upgrades);
    this.log("Load complete. ShopUpgrades:", this.shopUpgrades);
    this.showToast("Game loaded successfully!");
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
    };
    this.upgrades = {
      clickUpgrade: { cost: 10, multiplier: 3, action: "multiplyClickPower" },
      autoClicker: { cost: 50, count: 0, multiplier: 1.5, action: "increment" },
      grandma: { cost: 100, count: 0, multiplier: 1.5, action: "increment", extra: "updateGrandmasVisual" },
      farm: { cost: 500, count: 0, multiplier: 1.5, action: "increment" },
      luckyClick: { cost: 20, action: "lucky", multiplier: 1 },
    };
    this.shopUpgrades = {
      timeAccelerator: { cost: 300, multiplier: 2, baseCost: 300 },
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
