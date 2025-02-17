/**
 * Game class
 * ----------
 * This class handles all the core logic for Cookie Clicker in an OOP manner.
 * It tracks the player's cookies, upgrades, achievements, and includes
 * helper methods to update the UI, save/load game data, etc.
 */
class Game {
    constructor() {
        /** 
         * Game State Variables
         * ------------------------------------------------
         * cookies        : total number of cookies the player currently has
         * clickPower     : how many cookies each click produces
         * autoClickers   : number of auto-clicking devices
         * grandmas       : number of Grandma bakeries
         * farms          : number of Cookie Farms
         * ...
         */
        this.cookies = 0;
        this.clickPower = 1;
        this.autoClickers = 0;
        this.grandmas = 0;
        this.farms = 0;

        // Base costs for each upgrade
        this.clickUpgradeCost = 10;
        this.autoClickerCost = 50;
        this.grandmaCost = 100;
        this.farmCost = 500;
        this.luckyClickCost = 20;

        // Achievements array to store unlocked achievements
        this.achievements = [];

        // Sound toggle (on by default)
        this.soundOn = true;

        // Audio object for click sound (Adjust the src to an actual audio file in your project)
        this.clickSound = new Audio('click.mp3'); 
        this.clickSound.volume = 0.2;  // Adjust volume as desired

        // Initialize the game (set up DOM references, event listeners, etc.)
        this.init();
    }

    /**
     * init()
     * ------
     * Initializes references to DOM elements, sets up event listeners,
     * updates the display, and starts the auto-clicker interval.
     */
    init() {
        // DOM element references
        this.cookie = document.getElementById('cookie');
        this.cookieCount = document.getElementById('cookieCount');
        this.clickPowerDisplay = document.getElementById('clickPower');
        this.cpsDisplay = document.getElementById('cps');
        this.autoClickersDisplay = document.getElementById('autoClickers');
        this.grandmasDisplay = document.getElementById('grandmas');
        this.farmsDisplay = document.getElementById('farms');

        this.clickUpgradeButton = document.getElementById('clickUpgrade');
        this.autoClickerButton = document.getElementById('autoClicker');
        this.grandmaButton = document.getElementById('grandma');
        this.farmButton = document.getElementById('farm');
        this.luckyClickButton = document.getElementById('luckyClick');

        this.achievementsList = document.getElementById('achievementsList');
        this.saveGameButton = document.getElementById('saveGame');
        this.loadGameButton = document.getElementById('loadGame');
        this.resetGameButton = document.getElementById('resetGame');
        this.toggleSoundButton = document.getElementById('toggleSound');

        this.grandmaProgressBar = document.getElementById('grandmaProgressBar');
        this.grandmaCount = document.getElementById('grandmaCount');

        // Set up event listeners for buttons and cookie clicks
        this.setupEventListeners();

        // Initial UI update
        this.updateDisplay();

        // Update grandma UI visuals (progress bar, etc.)
        this.updateGrandmasVisual();

        // Begin auto-clicking once per second
        this.startAutoClicker();
    }

    /**
     * setupEventListeners()
     * ---------------------
     * Attaches all event listeners required for user interaction:
     * - Cookie clicks
     * - Upgrade purchases
     * - Lucky Click
     * - Save/Load/Reset
     * - Sound toggle
     */
    setupEventListeners() {
        // Clicking the cookie - pass the event to handleClick so we can get the mouse position.
        this.cookie.addEventListener('click', (e) => this.handleClick(e));

        // Upgrade Buttons
        this.clickUpgradeButton.addEventListener('click', () => this.upgradeClickPower());
        this.autoClickerButton.addEventListener('click', () => this.buyAutoClicker());
        this.grandmaButton.addEventListener('click', () => this.buyGrandma());
        this.farmButton.addEventListener('click', () => this.buyFarm());
        this.luckyClickButton.addEventListener('click', () => this.luckyClick());

        // Save/Load Game
        this.saveGameButton.addEventListener('click', () => this.saveGame());
        this.loadGameButton.addEventListener('click', () => this.loadGame());

        // Reset Game
        this.resetGameButton.addEventListener('click', () => this.resetGame());

        // Toggle Sound
        this.toggleSoundButton.addEventListener('click', () => {
            this.soundOn = !this.soundOn;
            alert(`Sound is now ${this.soundOn ? 'ON' : 'OFF'}.`);
        });
    }

    /**
     * handleClick(e)
     * -------------
     * Handles what happens when the main cookie image is clicked:
     * - Increases the cookie count by clickPower
     * - Plays a sound (if sound is ON)
     * - Shows a floating number
     * - Sprays confetti from the mouse cursor location
     * - Checks for achievements
     * - Updates the display
     *
     * @param {MouseEvent} e - The click event, used to get the mouse coordinates.
     */
    handleClick(e) {
        // Play sound effect if sound is enabled
        if (this.soundOn) {
            this.clickSound.currentTime = 0;  // Reset sound playback position
            this.clickSound.play();
        }

        // Increase cookie count by current clickPower
        this.cookies += this.clickPower;

        // Show a floating number near the cookie
        this.showFloatingNumber(this.clickPower);

        // Create confetti effect at the mouse cursor location
        this.createConfetti(e.clientX, e.clientY);

        // Check if any achievements are unlocked
        this.checkAchievements();

        // Update UI
        this.updateDisplay();
    }

    /**
     * upgradeClickPower()
     * -------------------
     * Attempts to purchase the "Click Power Upgrade."
     * If the player has enough cookies, it deducts cost, doubles the click power,
     * increases the upgrade cost, and updates the display.
     */
    upgradeClickPower() {
        if (this.cookies >= this.clickUpgradeCost) {
            this.cookies -= this.clickUpgradeCost;
            this.clickPower *= 2;
            // Increase upgrade cost, making it progressively more expensive
            this.clickUpgradeCost = Math.floor(this.clickUpgradeCost * 3);
            this.updateDisplay();
        }
    }

    /**
     * buyAutoClicker()
     * ----------------
     * Purchases an auto-clicker if the player has enough cookies.
     * Each auto-clicker adds 1 cookie per second.
     */
    buyAutoClicker() {
        if (this.cookies >= this.autoClickerCost) {
            this.cookies -= this.autoClickerCost;
            this.autoClickers++;
            // Increase cost for the next auto-clicker
            this.autoClickerCost = Math.floor(this.autoClickerCost * 1.5);
            this.updateDisplay();
        }
    }

    /**
     * buyGrandma()
     * ------------
     * Purchases a Grandma bakery if the player has enough cookies.
     * Each Grandma adds 5 cookies per second.
     */
    buyGrandma() {
        if (this.cookies >= this.grandmaCost) {
            this.cookies -= this.grandmaCost;
            this.grandmas++;
            this.grandmaCost = Math.floor(this.grandmaCost * 1.5);
            this.updateDisplay();
            this.updateGrandmasVisual();
        }
    }

    /**
     * buyFarm()
     * ---------
     * Purchases a Cookie Farm if the player has enough cookies.
     * Each Farm adds 10 cookies per second.
     */
    buyFarm() {
        if (this.cookies >= this.farmCost) {
            this.cookies -= this.farmCost;
            this.farms++;
            this.farmCost = Math.floor(this.farmCost * 1.5);
            this.updateDisplay();
        }
    }

    /**
     * luckyClick()
     * ------------
     * A "gambler" style purchase:
     * - Costs a certain amount of cookies
     * - Awards a random bonus between 1 and 10 cookies
     */
    luckyClick() {
        if (this.cookies >= this.luckyClickCost) {
            this.cookies -= this.luckyClickCost;
            const bonus = Math.floor(Math.random() * 10) + 1;
            this.cookies += bonus;
            // Show a special floating number in blue
            this.showFloatingNumber(bonus, true);
            this.updateDisplay();
        }
    }

    /**
     * startAutoClicker()
     * ------------------
     * Sets up a setInterval that adds cookies automatically based on:
     * - number of autoClickers (1 cookie/sec each)
     * - number of grandmas (5 cookies/sec each)
     * - number of farms (10 cookies/sec each)
     */
    startAutoClicker() {
        setInterval(() => {
            // Increase cookies based on passive production
            this.cookies += this.autoClickers;
            this.cookies += this.grandmas * 5;
            this.cookies += this.farms * 10;

            // Update the UI to reflect new totals
            this.updateDisplay();
        }, 1000);
    }

    /**
     * updateDisplay()
     * ---------------
     * Updates all displayed text in the UI, including cookie counts,
     * upgrade button costs, and enables/disables buttons based on affordability.
     * Also updates cookies per second (CPS) display.
     */
    updateDisplay() {
        this.cookieCount.textContent = Math.floor(this.cookies);
        this.clickPowerDisplay.textContent = this.clickPower;
        this.autoClickersDisplay.textContent = this.autoClickers;
        this.grandmasDisplay.textContent = this.grandmas;
        this.farmsDisplay.textContent = this.farms;

        // Show current costs on buttons
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

        // Calculate and display cookies per second (CPS)
        const cps = (this.autoClickers * 1) + (this.grandmas * 5) + (this.farms * 10);
        this.cpsDisplay.textContent = cps;
    }

    /**
     * showFloatingNumber(amount, isBonus)
     * -----------------------------------
     * Displays a temporary floating number animation over the cookie image
     * whenever the player gains cookies by clicking or with a Lucky Click bonus.
     *
     * @param {number} amount  - The amount of cookies to display (e.g. +1, +10)
     * @param {boolean} isBonus - If true, text appears in a different color (blue)
     */
    showFloatingNumber(amount, isBonus = false) {
        const floatingNumber = document.createElement('div');
        floatingNumber.className = 'floating-number';
        floatingNumber.textContent = `+${amount}`;
        floatingNumber.style.color = isBonus ? 'blue' : 'red';

        // Position the floating number near the cookie
        const cookieRect = this.cookie.getBoundingClientRect();
        floatingNumber.style.left = `${cookieRect.left + cookieRect.width / 2 - 15}px`;
        floatingNumber.style.top = `${cookieRect.top - 10}px`;

        // Add to DOM, then remove after animation
        document.body.appendChild(floatingNumber);
        setTimeout(() => floatingNumber.remove(), 1000);
    }

    /**
     * createConfetti(x, y)
     * ---------------------
     * Creates multiple confetti particles that spray outward from the given (x, y)
     * coordinates (usually the mouse cursor position). Each particle is a small div
     * that animates using a CSS keyframe animation.
     *
     * @param {number} x - The x-coordinate of the mouse click.
     * @param {number} y - The y-coordinate of the mouse click.
     */
    createConfetti(x, y) {
        // Array of possible colors for the confetti
        const colors = ['#FFC107', '#FF5722', '#4CAF50', '#2196F3', '#9C27B0'];
        // Number of confetti pieces to create
        const numConfetti = 20;

        for (let i = 0; i < numConfetti; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            // Random color selection
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

            // Set the starting position at the click coordinates
            confetti.style.left = `${x}px`;
            confetti.style.top = `${y}px`;

            // Set random offsets for the animation using CSS variables
            // Random offset between -100px and 100px for x and y
            const offsetX = (Math.random() * 200 - 100).toFixed(0) + 'px';
            const offsetY = (Math.random() * 200 - 100).toFixed(0) + 'px';
            confetti.style.setProperty('--x', offsetX);
            confetti.style.setProperty('--y', offsetY);

            // Append the confetti to the body
            document.body.appendChild(confetti);

            // Remove the confetti element after 1 second (matching animation duration)
            setTimeout(() => {
                confetti.remove();
            }, 1000);
        }
    }

    /**
     * checkAchievements()
     * -------------------
     * Checks if the player meets certain conditions to unlock achievements.
     * If an achievement is unlocked, it is added to the achievements list,
     * and the display is updated.
     */
    checkAchievements() {
        // Simple array of potential achievements
        // Expand this as needed for more achievements
        const newAchievements = [
            { condition: this.cookies >= 100, text: '100 Cookies!' },
            { condition: this.cookies >= 1000, text: '1000 Cookies!' },
            { condition: this.autoClickers >= 5, text: '5 Auto Clickers!' },
            { condition: this.grandmas >= 3, text: '3 Grandma\'s Bakeries!' },
        ];

        // Add achievements that are unlocked and not yet stored
        newAchievements.forEach(achievement => {
            if (achievement.condition && !this.achievements.includes(achievement.text)) {
                this.achievements.push(achievement.text);
                this.updateAchievements();
            }
        });
    }

    /**
     * updateAchievements()
     * --------------------
     * Updates the Achievements panel in the UI to reflect the
     * current achievements array.
     */
    updateAchievements() {
        this.achievementsList.innerHTML = this.achievements
            .map(achievement => `<li>${achievement}</li>`)
            .join('');
    }

    /**
     * updateGrandmasVisual()
     * ----------------------
     * A small cosmetic function that updates the grandma progress bar
     * and the displayed grandma count.
     */
    updateGrandmasVisual() {
        const maxGrandmas = 20; 
        const progressWidth = (this.grandmas / maxGrandmas) * 100;
        this.grandmaProgressBar.style.width = `${Math.min(progressWidth, 100)}%`;
        this.grandmaCount.textContent = this.grandmas;
    }

    /**
     * saveGame()
     * ----------
     * Saves the current game state to localStorage so the player
     * can resume later.
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
            soundOn: this.soundOn
        };
        localStorage.setItem('cookieGameSave', JSON.stringify(gameState));
        alert('Game saved!');
    }

    /**
     * loadGame()
     * ----------
     * Loads a previously saved game from localStorage,
     * if it exists, and updates the UI accordingly.
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
     * -----------
     * Completely resets the game to its initial state and
     * clears any saved data in localStorage.
     */
    resetGame() {
        const confirmReset = confirm("Are you sure you want to reset your game? This action cannot be undone.");
        if (!confirmReset) return;

        // Clear local storage
        localStorage.removeItem('cookieGameSave');

        // Reset all values to their initial states
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

        // Update the UI
        this.updateDisplay();
        this.updateAchievements();
        this.updateGrandmasVisual();

        alert('Game has been reset.');
    }
}

// Initialize the game when the script loads
const game = new Game();
