/**
 * Game class
 * ----------
 * Handles core logic for Cookie Clicker using an OOP approach.
 * This version centralizes state & upgrade data, plays hover sounds,
 * uses a smooth game loop, and organizes settings into a compact panel
 * toggled by a custom settings button.
 *
 * A logging system has been added to help trace load/update issues.
 */
class Game {
  constructor() {
    // Enable debug logging
    this.debug = true;
    this.log("Initializing game...");

    // Centralized game state
    this.state = {
      cookies: 0,
      clickPower: 1,
      // Fallback for older saves that stored grandma count in state
      grandmas: 0
    };

    // Upgrades configuration and state
    this.upgrades = {
      clickUpgrade: { cost: 10, multiplier: 3, action: 'multiplyClickPower' },
      autoClicker: { cost: 50, count: 0, multiplier: 1.5, action: 'increment' },
      grandma: { cost: 100, count: 0, multiplier: 1.5, action: 'increment', extra: 'updateGrandmasVisual' },
      farm: { cost: 500, count: 0, multiplier: 1.5, action: 'increment' },
      luckyClick: { cost: 20, action: 'lucky', multiplier: 1 }
    };

    // Achievements array
    this.achievements = [];

    // Sound settings
    this.soundOn = true;
    this.clickSound = new Audio('sounds/click.mp3');
    this.clickSound.volume = 0.2;

    this.init();
  }

  log(message, data) {
    if (this.debug) {
      if (data !== undefined) {
        console.log(message, data);
      } else {
        console.log(message);
      }
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
    this.cookie = document.getElementById('cookie');
    this.cookieCount = document.getElementById('cookieCount');
    this.clickPowerDisplay = document.getElementById('clickPower');
    this.cpsDisplay = document.getElementById('cps');

    // Stats elements
    this.autoClickersDisplay = document.getElementById('autoClickers');
    this.grandmasDisplay = document.getElementById('grandmas');
    this.farmsDisplay = document.getElementById('farms');

    // Upgrade buttons
    this.clickUpgradeButton = document.getElementById('clickUpgrade');
    this.autoClickerButton = document.getElementById('autoClicker');
    this.grandmaButton = document.getElementById('grandma');
    this.farmButton = document.getElementById('farm');
    this.luckyClickButton = document.getElementById('luckyClick');

    // Settings panel elements
    this.saveGameButton = document.getElementById('saveGame');
    this.loadGameButton = document.getElementById('loadGame');
    this.resetGameButton = document.getElementById('resetGame');
    this.toggleSoundButton = document.getElementById('toggleSound');
    this.settingsIcon = document.getElementById('settingsIcon');
    this.settingsMenu = document.getElementById('settingsMenu');

    // Visualization elements (using a progress bar for grandma)
    this.grandmaProgressBar = document.getElementById('grandmaProgressBar');
    this.grandmaCountDisplay = document.getElementById('grandmaCount');
    this.autoClickersProgressBar = document.getElementById('autoClickersProgressBar');
    this.autoClickersCountVisual = document.getElementById('autoClickersCountVisual');
    this.farmsProgressBar = document.getElementById('farmsProgressBar');
    this.farmsCountVisual = document.getElementById('farmsCountVisual');

    // Log DOM element check
    if (!document.getElementById('achievementsList')) {
      this.log("ERROR: achievementsList element not found!");
    } else {
      this.log("achievementsList element loaded.");
    }

    this.setupEventListeners();
    this.updateDisplay();
    this.updateGrandmasVisual();
    this.startGameLoop();
  }

  setupEventListeners() {
    const leftSection = document.querySelector('.left');
    leftSection.addEventListener('click', (e) => {
      if (e.target.matches('button.upgrade')) {
        this.log("Upgrade button clicked:", e.target.id);
        this.performPurchase(e.target.id);
      }
    });
    [this.clickUpgradeButton, this.autoClickerButton, this.grandmaButton, this.farmButton, this.luckyClickButton]
      .forEach(btn => btn.addEventListener('mouseover', () => this.playHoverSound()));

    this.settingsIcon.addEventListener('click', () => {
      if (!this.settingsMenu.style.display || this.settingsMenu.style.display === 'none') {
        this.settingsMenu.style.display = 'block';
        this.log("Settings menu shown");
      } else {
        this.settingsMenu.style.display = 'none';
        this.log("Settings menu hidden");
      }
    });

    [this.saveGameButton, this.loadGameButton, this.resetGameButton, this.toggleSoundButton]
      .forEach(btn => btn.addEventListener('mouseover', () => this.playHoverSound()));

    this.saveGameButton.addEventListener('click', () => this.saveGame());
    this.loadGameButton.addEventListener('click', () => this.loadGame());
    this.resetGameButton.addEventListener('click', () => this.resetGame());
    this.toggleSoundButton.addEventListener('click', () => {
      this.soundOn = !this.soundOn;
      alert(`Sound is now ${this.soundOn ? 'ON' : 'OFF'}.`);
      this.log("Sound toggled:", this.soundOn);
    });

    this.cookie.addEventListener('click', (e) => this.handleClick(e));
  }

  handleClick(e) {
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

  performPurchase(upgradeType) {
    const config = this.upgrades[upgradeType];
    if (this.state.cookies >= config.cost) {
      this.state.cookies -= config.cost;
      this.log(`Purchased ${upgradeType}. Old count: ${config.count}`);
      switch (config.action) {
        case 'multiplyClickPower':
          this.state.clickPower *= 2;
          break;
        case 'increment':
          config.count = (config.count || 0) + 1;
          break;
        case 'lucky':
          const bonus = Math.floor(Math.random() * 10) + 1;
          this.state.cookies += bonus;
          this.showFloatingNumber(bonus, true);
          break;
        default:
          break;
      }
      config.cost = Math.floor(config.cost * config.multiplier);
      this.log(`${upgradeType} new count: ${config.count}, new cost: ${config.cost}`);
      this.updateDisplay();
      if (config.extra && typeof this[config.extra] === 'function') {
        this[config.extra]();
      }
    } else {
      this.log(`Not enough cookies for ${upgradeType}. Needed: ${config.cost}, have: ${this.state.cookies}`);
    }
  }

  startGameLoop() {
    let lastTime = performance.now();
    const loop = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      const cps =
        ((this.upgrades.autoClicker.count || 0) * 1) +
        ((this.upgrades.grandma.count || 0) * 5) +
        ((this.upgrades.farm.count || 0) * 10);
      this.state.cookies += cps * delta;
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
    this.clickUpgradeButton.disabled = this.state.cookies < this.upgrades.clickUpgrade.cost;
    this.autoClickerButton.disabled = this.state.cookies < this.upgrades.autoClicker.cost;
    this.grandmaButton.disabled = this.state.cookies < this.upgrades.grandma.cost;
    this.farmButton.disabled = this.state.cookies < this.upgrades.farm.cost;
    this.luckyClickButton.disabled = this.state.cookies < this.upgrades.luckyClick.cost;
    const cps =
      ((this.upgrades.autoClicker.count || 0) * 1) +
      ((this.upgrades.grandma.count || 0) * 5) +
      ((this.upgrades.farm.count || 0) * 10);
    this.cpsDisplay.textContent = Math.floor(cps);
    this.updateAutoClickersVisual();
    this.updateFarmsVisual();
  }

  showFloatingNumber(amount, isBonus = false) {
    const floatingNumber = document.createElement('div');
    floatingNumber.className = 'floating-number';
    floatingNumber.textContent = `+${amount}`;
    floatingNumber.style.color = isBonus ? 'blue' : 'red';
    const { left, top, width } = this.cookie.getBoundingClientRect();
    floatingNumber.style.left = `${left + width / 2 - 15}px`;
    floatingNumber.style.top = `${top - 10}px`;
    document.body.appendChild(floatingNumber);
    setTimeout(() => floatingNumber.remove(), 1000);
  }

  createConfetti(x, y) {
    const colors = ['#FFC107', '#FF5722', '#4CAF50', '#2196F3', '#9C27B0'];
    const numConfetti = 20;
    for (let i = 0; i < numConfetti; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = `${x}px`;
      confetti.style.top = `${y}px`;
      const offsetX = `${(Math.random() * 200 - 100).toFixed(0)}px`;
      const offsetY = `${(Math.random() * 200 - 100).toFixed(0)}px`;
      confetti.style.setProperty('--x', offsetX);
      confetti.style.setProperty('--y', offsetY);
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 1000);
    }
  }

  updateGrandmasVisual() {
    const maxGrandmas = 20;
    const count = this.upgrades.grandma.count || 0;
    const progressWidth = (count / maxGrandmas) * 100;
    this.grandmaProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
    this.grandmaCountDisplay.textContent = count;
    this.log("updateGrandmasVisual: count =", count, "progressWidth =", progressWidth);
  }

  updateAutoClickersVisual() {
    const maxAutoClickers = 10;
    const count = this.upgrades.autoClicker.count || 0;
    const progressWidth = (count / maxAutoClickers) * 100;
    this.autoClickersProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
    this.autoClickersCountVisual.textContent = count;
  }

  updateFarmsVisual() {
    const maxFarms = 10;
    const count = this.upgrades.farm.count || 0;
    const progressWidth = (count / maxFarms) * 100;
    this.farmsProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
    this.farmsCountVisual.textContent = count;
  }

  checkAchievements() {
    const achievementsToCheck = [
      { condition: this.state.cookies >= 100, text: '100 Cookies!' },
      { condition: this.state.cookies >= 1000, text: '1000 Cookies!' },
      { condition: (this.upgrades.autoClicker.count || 0) >= 5, text: '5 Auto Clickers!' },
      { condition: (this.upgrades.grandma.count || 0) >= 3, text: "3 Grandma's Bakeries!" }
    ];
    achievementsToCheck.forEach(({ condition, text }) => {
      if (condition && !this.achievements.includes(text)) {
        this.achievements.push(text);
        this.updateAchievements();
      }
    });
  }

  updateAchievements() {
    if (this.achievementsList) {
      this.achievementsList.innerHTML = this.achievements.map(ach => `<li>${ach}</li>`).join('');
    } else {
      this.log("ERROR: achievementsList element is undefined!");
    }
  }

  saveGame() {
    const gameState = {
      state: this.state,
      upgrades: this.upgrades,
      achievements: this.achievements,
      soundOn: this.soundOn
    };
    localStorage.setItem('cookieGameSave', JSON.stringify(gameState));
    this.log("Game saved", gameState);
    alert('Game saved!');
  }

  loadGame() {
    const confirmLoad = confirm("Do you want to load the saved game?");
    if (!confirmLoad) {
      alert("Game load canceled.");
      return;
    }
    const savedGame = JSON.parse(localStorage.getItem('cookieGameSave'));
    if (!savedGame) {
      alert("No saved game found!");
      return;
    }
    this.log("Saved game data loaded:", savedGame);
    // Load main state
    this.state = savedGame.state || this.state;
    // Merge upgrades from saved data into defaults
    if (typeof savedGame.upgrades === 'object') {
      this.upgrades = {
        ...this.upgrades,
        ...savedGame.upgrades
      };
      if (!this.upgrades.grandma || typeof this.upgrades.grandma !== 'object') {
        this.upgrades.grandma = { cost: 100, count: 0, multiplier: 1.5, action: 'increment', extra: 'updateGrandmasVisual' };
      }
      this.upgrades.grandma.count = parseInt(this.upgrades.grandma.count, 10) || 0;
      this.log("After merge, grandma count =", this.upgrades.grandma.count);
    }
    // Fallback for older saves that stored grandmas in state.grandmas
    if (typeof this.state.grandmas === 'number' && this.state.grandmas > this.upgrades.grandma.count) {
      this.upgrades.grandma.count = this.state.grandmas;
      this.log("Fallback: using state.grandmas =", this.state.grandmas);
    }
    this.achievements = savedGame.achievements || [];
    this.soundOn = (savedGame.soundOn !== undefined) ? savedGame.soundOn : true;
    // Now fully update UI
    this.updateDisplay();
    this.updateAchievements();
    this.updateGrandmasVisual();
    this.log("Load complete. Upgrades:", this.upgrades);
    alert("Game loaded successfully!");
  }

  resetGame() {
    if (!confirm("Are you sure you want to reset your game? This action cannot be undone.")) return;
    localStorage.removeItem('cookieGameSave');
    this.state = { cookies: 0, clickPower: 1 };
    this.upgrades = {
      clickUpgrade: { cost: 10, multiplier: 3, action: 'multiplyClickPower' },
      autoClicker: { cost: 50, count: 0, multiplier: 1.5, action: 'increment' },
      grandma: { cost: 100, count: 0, multiplier: 1.5, action: 'increment', extra: 'updateGrandmasVisual' },
      farm: { cost: 500, count: 0, multiplier: 1.5, action: 'increment' },
      luckyClick: { cost: 20, action: 'lucky', multiplier: 1 }
    };
    this.achievements = [];
    this.soundOn = true;
    this.updateDisplay();
    this.updateAchievements();
    this.updateGrandmasVisual();
    this.log("Game reset.");
    alert('Game has been reset.');
  }
}

const game = new Game();
