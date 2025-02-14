class Game {
    constructor() {
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
        this.init();
    }

    init() {
        this.cookie = document.getElementById('cookie');
        this.cookieCount = document.getElementById('cookieCount');
        this.clickPowerDisplay = document.getElementById('clickPower');
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
        this.grandmaProgressBar = document.getElementById('grandmaProgressBar');
        this.grandmaCount = document.getElementById('grandmaCount');

        this.setupEventListeners();
        this.updateDisplay();
        this.updateGrandmasVisual();
        this.startAutoClicker();
    }

    setupEventListeners() {
        this.cookie.addEventListener('click', () => this.handleClick());
        this.clickUpgradeButton.addEventListener('click', () => this.upgradeClickPower());
        this.autoClickerButton.addEventListener('click', () => this.buyAutoClicker());
        this.grandmaButton.addEventListener('click', () => this.buyGrandma());
        this.farmButton.addEventListener('click', () => this.buyFarm());
        this.luckyClickButton.addEventListener('click', () => this.luckyClick());
        this.saveGameButton.addEventListener('click', () => this.saveGame());
        this.loadGameButton.addEventListener('click', () => this.loadGame());
    }

    handleClick() {
        this.cookies += this.clickPower;
        this.showFloatingNumber(this.clickPower);
        this.checkAchievements();
        this.updateDisplay();
    }

    upgradeClickPower() {
        if (this.cookies >= this.clickUpgradeCost) {
            this.cookies -= this.clickUpgradeCost;
            this.clickPower *= 2;
            this.clickUpgradeCost *= 3;
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

    startAutoClicker() {
        setInterval(() => {
            this.cookies += this.autoClickers + this.grandmas * 5 + this.farms * 10;
            this.updateDisplay();
        }, 1000);
    }

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
        };
        localStorage.setItem('cookieGameSave', JSON.stringify(gameState));
        alert('Game saved!');
    }

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
            this.updateDisplay();
            this.updateAchievements();
            this.updateGrandmasVisual();
            alert('Game loaded!');
        } else {
            alert('No saved game found!');
        }
    }

    updateDisplay() {
        this.cookieCount.textContent = Math.floor(this.cookies);
        this.clickPowerDisplay.textContent = this.clickPower;
        this.autoClickersDisplay.textContent = this.autoClickers;
        this.grandmasDisplay.textContent = this.grandmas;
        this.farmsDisplay.textContent = this.farms;
        
        this.clickUpgradeButton.textContent = `Upgrade Click Power (Cost: ${this.clickUpgradeCost})`;
        this.autoClickerButton.textContent = `Buy Auto Clicker (Cost: ${this.autoClickerCost})`;
        this.grandmaButton.textContent = `Buy Grandma's Bakery (Cost: ${this.grandmaCost})`;
        this.farmButton.textContent = `Buy Cookie Farm (Cost: ${this.farmCost})`;
        this.luckyClickButton.textContent = `Lucky Click (Cost: ${this.luckyClickCost})`;
        
        this.clickUpgradeButton.disabled = this.cookies < this.clickUpgradeCost;
        this.autoClickerButton.disabled = this.cookies < this.autoClickerCost;
        this.grandmaButton.disabled = this.cookies < this.grandmaCost;
        this.farmButton.disabled = this.cookies < this.farmCost;
        this.luckyClickButton.disabled = this.cookies < this.luckyClickCost;
    }

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

    checkAchievements() {
        const newAchievements = [
            { condition: this.cookies >= 100, text: '100 Cookies!' },
            { condition: this.cookies >= 1000, text: '1000 Cookies!' },
            { condition: this.autoClickers >= 5, text: '5 Auto Clickers!' },
            { condition: this.grandmas >= 3, text: '3 Grandma\'s Bakeries!' },
        ];

        newAchievements.forEach(achievement => {
            if (achievement.condition && !this.achievements.includes(achievement.text)) {
                this.achievements.push(achievement.text);
                this.updateAchievements();
            }
        });
    }

    updateAchievements() {
        this.achievementsList.innerHTML = this.achievements.map(achievement => `<li>${achievement}</li>`).join('');
    }

    updateGrandmasVisual() {
        const maxGrandmas = 20;
        const progressWidth = (this.grandmas / maxGrandmas) * 100;
        this.grandmaProgressBar.style.width = `${progressWidth}%`;
        this.grandmaCount.textContent = this.grandmas;
    }
}

// Initialize the game
const game = new Game();