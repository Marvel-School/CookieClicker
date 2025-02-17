/**
 * Game class
 * ----------
 * Handles core logic for Cookie Clicker using an OOP approach.
 */
class Game {
    constructor() {
        // Game state variables
        this.cookies = 0;
        this.clickPower = 1;
        this.autoClickers = 0;
        this.grandmas = 0;
        this.farms = 0;

        // Base costs for upgrades
        this.clickUpgradeCost = 10;
        this.autoClickerCost = 50;
        this.grandmaCost = 100;
        this.farmCost = 500;
        this.luckyClickCost = 20;

        // Array for unlocked achievements
        this.achievements = [];

        // Sound toggle (enabled by default)
        this.soundOn = true;
        this.clickSound = new Audio('sounds/click.mp3');
        this.clickSound.volume = 0.2;

        // Initialize the game
        this.init();
    }

    /**
     * init()
     * Initializes DOM element references, event listeners, UI display, and auto-click intervals.
     */
    init() {
        // DOM references for main game UI
        this.cookie = document.getElementById('cookie');
        this.cookieCount = document.getElementById('cookieCount');
        this.clickPowerDisplay = document.getElementById('clickPower');
        this.cpsDisplay = document.getElementById('cps');

        // Additional stats (autoClickers, grandmas, farms) if you want to display them in HTML
        this.autoClickersDisplay = document.getElementById('autoClickers');
        this.grandmasDisplay = document.getElementById('grandmas');
        this.farmsDisplay = document.getElementById('farms');

        // Upgrade buttons
        this.clickUpgradeButton = document.getElementById('clickUpgrade');
        this.autoClickerButton = document.getElementById('autoClicker');
        this.grandmaButton = document.getElementById('grandma');
        this.farmButton = document.getElementById('farm');
        this.luckyClickButton = document.getElementById('luckyClick');

        // Achievements & Save/Load/Reset
        this.achievementsList = document.getElementById('achievementsList');
        this.saveGameButton = document.getElementById('saveGame');
        this.loadGameButton = document.getElementById('loadGame');
        this.resetGameButton = document.getElementById('resetGame');
        this.toggleSoundButton = document.getElementById('toggleSound');

        // Grandma's Visualization
        this.grandmaProgressBar = document.getElementById('grandmaProgressBar');
        this.grandmaCount = document.getElementById('grandmaCount');

        // Auto Clickers Visualization
        this.autoClickersProgressBar = document.getElementById('autoClickersProgressBar');
        this.autoClickersCountVisual = document.getElementById('autoClickersCountVisual');

        // Farms Visualization
        this.farmsProgressBar = document.getElementById('farmsProgressBar');
        this.farmsCountVisual = document.getElementById('farmsCountVisual');

        // Set up event listeners
        this.setupEventListeners();

        // Initial UI update
        this.updateDisplay();
        this.updateGrandmasVisual();

        // Start auto-click production
        this.startAutoClicker();
    }

    /**
     * setupEventListeners()
     * Attaches event listeners to buttons, cookie image, etc.
     */
    setupEventListeners() {
        // Cookie click => handle cookie increment and confetti
        this.cookie.addEventListener('click', (e) => this.handleClick(e));

        // Upgrade buttons
        this.clickUpgradeButton.addEventListener('click', () => this.upgradeClickPower());
        this.autoClickerButton.addEventListener('click', () => this.buyAutoClicker());
        this.grandmaButton.addEventListener('click', () => this.buyGrandma());
        this.farmButton.addEventListener('click', () => this.buyFarm());
        this.luckyClickButton.addEventListener('click', () => this.luckyClick());

        // Save, Load, Reset
        this.saveGameButton.addEventListener('click', () => this.saveGame());
        this.loadGameButton.addEventListener('click', () => this.loadGame());
        this.resetGameButton.addEventListener('click', () => this.resetGame());

        // Toggle Sound
        this.toggleSoundButton.addEventListener('click', () => {
            this.soundOn = !this.soundOn;
            alert(`Sound is now ${this.soundOn ? 'ON' : 'OFF'}.`);
        });
    }

    /**
     * handleClick(e)
     * Increments cookies, plays sound (if on), shows floating number, confetti, achievements, etc.
     */
    handleClick(e) {
        if (this.soundOn) {
            this.clickSound.currentTime = 0;
            this.clickSound.play();
        }

        // Add cookies
        this.cookies += this.clickPower;

        // Show floating number and confetti
        this.showFloatingNumber(this.clickPower);
        this.createConfetti(e.clientX, e.clientY);

        // Check achievements & refresh display
        this.checkAchievements();
        this.updateDisplay();
    }

    upgradeClickPower() {
        if (this.cookies >= this.clickUpgradeCost) {
            this.cookies -= this.clickUpgradeCost;
            this.clickPower *= 2;
            this.clickUpgradeCost = Math.floor(this.clickUpgradeCost * 3);
            this.updateDisplay();
        }
    }

    buyAutoClicker() {
        if (this.cookies >= this.autoClickerCost) {
            this.cookies -= this.autoClickerCost;
            this.autoClickers++;
            this.autoClickerCost = Math.floor(this.autoClickerCost * 1.5);
            this.updateDisplay();
        }
    }

    buyGrandma() {
        if (this.cookies >= this.grandmaCost) {
            this.cookies -= this.grandmaCost;
            this.grandmas++;
            this.grandmaCost = Math.floor(this.grandmaCost * 1.5);
            this.updateDisplay();
            this.updateGrandmasVisual();
        }
    }

    buyFarm() {
        if (this.cookies >= this.farmCost) {
            this.cookies -= this.farmCost;
            this.farms++;
            this.farmCost = Math.floor(this.farmCost * 1.5);
            this.updateDisplay();
        }
    }

    luckyClick() {
        if (this.cookies >= this.luckyClickCost) {
            this.cookies -= this.luckyClickCost;
            const bonus = Math.floor(Math.random() * 10) + 1;
            this.cookies += bonus;
            this.showFloatingNumber(bonus, true);
            this.updateDisplay();
        }
    }

    /**
     * startAutoClicker()
     * Automates cookie production based on number of auto-clickers, grandmas, and farms.
     */
    startAutoClicker() {
        setInterval(() => {
            this.cookies += this.autoClickers;      // 1 cookie/sec each
            this.cookies += this.grandmas * 5;      // 5 cookies/sec each
            this.cookies += this.farms * 10;        // 10 cookies/sec each
            this.updateDisplay();
        }, 1000);
    }

    /**
     * updateDisplay()
     * Refreshes cookie counters, costs, and calls to update visual progress bars.
     */
    updateDisplay() {
        this.cookieCount.textContent = Math.floor(this.cookies);
        this.clickPowerDisplay.textContent = this.clickPower;

        // If you have <p>Auto Clickers: <span id="autoClickers">0</span></p> in HTML
        if (this.autoClickersDisplay) {
            this.autoClickersDisplay.textContent = this.autoClickers;
        }
        if (this.grandmasDisplay) {
            this.grandmasDisplay.textContent = this.grandmas;
        }
        if (this.farmsDisplay) {
            this.farmsDisplay.textContent = this.farms;
        }

        this.clickUpgradeButton.textContent = `Upgrade Click Power (Cost: ${this.clickUpgradeCost})`;
        this.autoClickerButton.textContent = `Buy Auto Clicker (Cost: ${this.autoClickerCost})`;
        this.grandmaButton.textContent = `Buy Grandma's Bakery (Cost: ${this.grandmaCost})`;
        this.farmButton.textContent = `Buy Cookie Farm (Cost: ${this.farmCost})`;
        this.luckyClickButton.textContent = `Lucky Click (Cost: ${this.luckyClickCost})`;

        // Enable/disable buttons based on cookie count
        this.clickUpgradeButton.disabled = this.cookies < this.clickUpgradeCost;
        this.autoClickerButton.disabled = this.cookies < this.autoClickerCost;
        this.grandmaButton.disabled = this.cookies < this.grandmaCost;
        this.farmButton.disabled = this.cookies < this.farmCost;
        this.luckyClickButton.disabled = this.cookies < this.luckyClickCost;

        // Calculate and display overall cookies/second
        const cps = (this.autoClickers * 1) + (this.grandmas * 5) + (this.farms * 10);
        this.cpsDisplay.textContent = cps;

        // Update visuals for auto clickers, farms, etc.
        this.updateAutoClickersVisual();
        this.updateFarmsVisual();
    }

    /**
     * showFloatingNumber(amount, isBonus)
     * Creates a floating text element over the cookie to show click or bonus amounts.
     */
    showFloatingNumber(amount, isBonus = false) {
        const floatingNumber = document.createElement('div');
        floatingNumber.className = 'floating-number';
        floatingNumber.textContent = `+${amount}`;
        floatingNumber.style.color = isBonus ? 'blue' : 'red';

        const cookieRect = this.cookie.getBoundingClientRect();
        floatingNumber.style.left = `${cookieRect.left + cookieRect.width / 2 - 15}px`;
        floatingNumber.style.top = `${cookieRect.top - 10}px`;

        document.body.appendChild(floatingNumber);
        setTimeout(() => floatingNumber.remove(), 1000);
    }

    /**
     * createConfetti(x, y)
     * Spawns small colored particles that radiate out from the mouse click position.
     */
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

    /**
     * updateGrandmasVisual()
     * Updates the Grandma Bakery progress bar and count.
     */
    updateGrandmasVisual() {
        const maxGrandmas = 20;
        const progressWidth = (this.grandmas / maxGrandmas) * 100;
        this.grandmaProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
        this.grandmaCount.textContent = this.grandmas;
    }

    /**
     * updateAutoClickersVisual()
     * Updates the Auto Clickers progress bar and count.
     */
    updateAutoClickersVisual() {
        const maxAutoClickers = 10; // maximum for full progress
        const progressWidth = (this.autoClickers / maxAutoClickers) * 100;
        this.autoClickersProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
        this.autoClickersCountVisual.textContent = this.autoClickers;
    }

    /**
     * updateFarmsVisual()
     * Updates the Farms progress bar and count.
     */
    updateFarmsVisual() {
        const maxFarms = 10;
        const progressWidth = (this.farms / maxFarms) * 100;
        this.farmsProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
        this.farmsCountVisual.textContent = this.farms;
    }

    /**
     * checkAchievements()
     * Verifies if new achievements have been unlocked, then updates the list.
     */
    checkAchievements() {
        const newAchievements = [
            { condition: this.cookies >= 100,  text: '100 Cookies!' },
            { condition: this.cookies >= 1000, text: '1000 Cookies!' },
            { condition: this.autoClickers >= 5, text: '5 Auto Clickers!' },
            { condition: this.grandmas >= 3,   text: '3 Grandma\'s Bakeries!' },
        ];

        newAchievements.forEach(achievement => {
            if (achievement.condition && !this.achievements.includes(achievement.text)) {
                this.achievements.push(achievement.text);
                this.updateAchievements();
            }
        });
    }

    /**
     * updateAchievements()
     * Renders the achievements list in the sidebar.
     */
    updateAchievements() {
        this.achievementsList.innerHTML = this.achievements
            .map(ach => `<li>${ach}</li>`)
            .join('');
    }

    /**
     * saveGame()
     * Saves the current game state to local storage.
     */
    saveGame() {
        const gameState = {
            cookies: this.cookies,
            clickPower: this.clickPower,
            autoClickers: this.autoClickers,
            grandmas: this.grandmas,
            farms: this.farms,
            clickUpgradeCost: this.clickUpgradeCost,
            autoClickerCost: this.autoClickerCost,
            grandmaCost: this.grandmaCost,
            farmCost: this.farmCost,
            achievements: this.achievements,
            soundOn: this.soundOn,
        };
        localStorage.setItem('cookieGameSave', JSON.stringify(gameState));
        alert('Game saved!');
    }

    /**
     * loadGame()
     * Loads saved game data from local storage, if available.
     */
    loadGame() {
        const savedGame = JSON.parse(localStorage.getItem('cookieGameSave'));
        if (savedGame) {
            this.cookies = savedGame.cookies;
            this.clickPower = savedGame.clickPower;
            this.autoClickers = savedGame.autoClickers;
            this.grandmas = savedGame.grandmas;
            this.farms = savedGame.farms;
            this.clickUpgradeCost = savedGame.clickUpgradeCost;
            this.autoClickerCost = savedGame.autoClickerCost;
            this.grandmaCost = savedGame.grandmaCost;
            this.farmCost = savedGame.farmCost;
            this.achievements = savedGame.achievements;
            this.soundOn = savedGame.soundOn !== undefined ? savedGame.soundOn : true;

            this.updateDisplay();
            this.updateAchievements();
            this.updateGrandmasVisual();
            alert('Game loaded!');
        } else {
            alert('No saved game found!');
        }
    }

    /**
     * resetGame()
     * Resets all game state and clears local storage.
     */
    resetGame() {
        const confirmReset = confirm("Are you sure you want to reset your game? This action cannot be undone.");
        if (!confirmReset) return;

        localStorage.removeItem('cookieGameSave');

        // Reset all game data
        this.cookies = 0;
        this.clickPower = 1;
        this.autoClickers = 0;
        this.grandmas = 0;
        this.farms = 0;
        this.clickUpgradeCost = 10;
        this.autoClickerCost = 50;
        this.grandmaCost = 100;
        this.farmCost = 500;
        this.luckyClickCost = 20;
        this.achievements = [];
        this.soundOn = true;

        this.updateDisplay();
        this.updateAchievements();
        this.updateGrandmasVisual();
        alert('Game has been reset.');
    }
}

// Initialize the game instance
const game = new Game();
