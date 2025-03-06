const PARTICLE_SIZE = 20;
const PARTICLE_LIFETIME = 2000;
const AUTO_SAVE_INTERVAL = 60000; // 1 minutes

// NEW: Base Upgrade Class
class Upgrade {
  constructor(cost, multiplier, action) {
    this.cost = cost;
    this.multiplier = multiplier;
    this.action = action;
  }
}

// NEW: StandardUpgrade extends Upgrade
class StandardUpgrade extends Upgrade {
  constructor(cost, multiplier, action, count = 0, extra = null) {
    super(cost, multiplier, action);
    this.count = count;
    this.extra = extra;
  }
  purchase(game) {
    if (game.state.cookies >= this.cost) {
      game.state.cookies -= this.cost;
      switch (this.action) {
        case "multiplyClickPower":
          game.state.clickPower *= 2;
          break;
        case "increment":
          this.count++;
          break;
        case "lucky":
          const bonus = Math.floor(Math.random() * 10) + 1;
          game.state.cookies += bonus;
          game.showFloatingNumber(bonus, true);
          break;
        default:
          break;
      }
      this.cost = Math.floor(this.cost * this.multiplier);
      if (this.extra && typeof game[this.extra] === "function") {
        game[this.extra]();
      }
      game.updateDisplay();
    } else {
      game.log(
        `Not enough cookies for ${this.action}. Cost: ${this.cost}, have: ${game.state.cookies}`
      );
    }
  }
}

// NEW: ShopUpgrade extends Upgrade
class ShopUpgrade extends Upgrade {
  constructor(cost, multiplier, extra = null, baseCost) {
    super(cost, multiplier, null);
    this.baseCost = baseCost;
    this.extra = extra;
  }
  purchase(game) {
    if (game.state.cookies >= this.cost) {
      game.state.cookies -= this.cost;
      if (this.extra === "timeAccelerator") {
        game.activateTimeAccelerator(this);
      }
      this.cost = Math.floor(this.cost * 1.2);
      const costSpan = document.querySelector(
        `[data-upgrade="timeAccelerator"] .item-cost span`
      );
      if (costSpan) costSpan.textContent = this.cost;
      game.updateDisplay();
      game.showToast("timeAccelerator purchased!");
    } else {
      game.log(
        `Not enough cookies for timeAccelerator. Need: ${this.cost}, have: ${game.state.cookies}`
      );
      game.showToast(`Not enough cookies for timeAccelerator`);
    }
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

    // NEW: Define upgrades using inheritance
    this.upgrades = {
      clickUpgrade: new StandardUpgrade(10, 3, "multiplyClickPower"),
      autoClicker: new StandardUpgrade(50, 1.5, "increment"),
      grandma: new StandardUpgrade(
        100,
        1.5,
        "increment",
        0,
        "updateGrandmasVisual"
      ),
      farm: new StandardUpgrade(500, 1.5, "increment"),
      luckyClick: new StandardUpgrade(20, 1, "lucky"),
    };

    this.shopUpgrades = {
      timeAccelerator: new ShopUpgrade(300, 2, "timeAccelerator", 300),
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
    const leftSection = document.querySelector(".left");
    leftSection.addEventListener("click", (e) => {
      if (e.target.matches("button.upgrade")) {
        this.log("Upgrade button clicked:", e.target.id);
        this.purchaseStandardUpgrade(e.target.id);
      }
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

    // Settings Panel: Toggle display on settings icon click
    this.settingsIcon.addEventListener("click", () => {
      this.settingsMenu.style.display =
        this.settingsMenu.style.display === "block" ? "none" : "block";
      this.log(
        `Settings menu ${
          this.settingsMenu.style.display === "block" ? "shown" : "hidden"
        }`
      );
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

    // Achievements Icon: Toggle achievements container
    const achievementsIcon = document.getElementById("achievementsIcon");
    if (achievementsIcon) {
      achievementsIcon.style.zIndex = "9999"; // ensure icon is on top
      achievementsIcon.addEventListener("click", () => {
        this.achievementsContainer.style.display =
          this.achievementsContainer.style.display === "block"
            ? "none"
            : "block";
        this.log(
          `Achievements menu ${
            this.achievementsContainer.style.display === "block"
              ? "shown"
              : "hidden"
          }`
        );
      });
    } else {
      this.log("ERROR: achievementsIcon not found!");
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
      this.updateDisplay();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  updateDisplay() {
    this.cookieCount.textContent = Math.floor(this.state.cookies);
    this.clickPowerDisplay.textContent = this.state.clickPower;
    this.count.textContent = Math.floor(this.state.cookies) + " cookies";
    this.clickUpgradeButton.textContent = `Upgrade Click Power (Cost: ${this.upgrades.clickUpgrade.cost})`;
    this.autoClickerButton.textContent = `Buy Auto Clicker (Cost: ${this.upgrades.autoClicker.cost})`;
    this.grandmaButton.textContent = `Buy Grandma's Bakery (Cost: ${this.upgrades.grandma.cost})`;
    this.farmButton.textContent = `Buy Cookie Farm (Cost: ${this.upgrades.farm.cost})`;
    this.luckyClickButton.textContent = `Lucky Click (Cost: ${this.upgrades.luckyClick.cost})`;

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
          clickUpgrade: new StandardUpgrade(10, 3, "multiplyClickPower"),
          autoClicker: new StandardUpgrade(50, 1.5, "increment"),
          grandma: new StandardUpgrade(100, 1.5, "increment", 0, "updateGrandmasVisual"),
          farm: new StandardUpgrade(500, 1.5, "increment"),
          luckyClick: new StandardUpgrade(20, 1, "lucky")
        };
        Object.keys(savedGame.upgrades).forEach(key => {
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
          timeAccelerator: new ShopUpgrade(300, 2, "timeAccelerator", 300)
        };
        Object.keys(savedGame.shopUpgrades).forEach(key => {
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
      clickUpgrade: new StandardUpgrade(10, 3, "multiplyClickPower"),
      autoClicker: new StandardUpgrade(50, 1.5, "increment"),
      grandma: new StandardUpgrade(
        100,
        1.5,
        "increment",
        0,
        "updateGrandmasVisual"
      ),
      farm: new StandardUpgrade(500, 1.5, "increment"),
      luckyClick: new StandardUpgrade(20, 1, "lucky"),
    };
    this.shopUpgrades = {
      timeAccelerator: new ShopUpgrade(300, 2, "timeAccelerator", 300),
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

  // if (!achieveWrapper || !dropdownContent) {
  //   return;
  // }
  

  let dropdownContentDisplay = window.getComputedStyle(document.getElementById("achievementsContainer"),null).getPropertyValue('display')
   
  

  achieveWrapper.addEventListener("click", function (event) {
    // event.stopPropagation(); 
    // prompt(dropdownContentDisplay)
    if (dropdownContentDisplay == "none") {
      dropdownContent.style.display = "block";
      return
    }
    console.log("first")
    dropdownContent.style.display = "none";
    
    // dropdownContent.classList.toggle("show");
    // console.error("goede gezien!");

  });

  // document.addEventListener("click", function (event) {
  //   if (!achieveWrapper.contains(event.target)) {
  //     dropdownContent.classList.remove("show");
  //     console.error("error!");
     
  //   }
  // });
  achieveWrapper.addEventListener("blur", function (event) {
    dropdownContent.style.display = "none";
  });
});


