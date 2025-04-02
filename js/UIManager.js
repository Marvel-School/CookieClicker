import { ShopPanel } from './components/ShopPanel.js';
import { AchievementsPanel } from './components/AchievementsPanel.js';
import { SettingsPanel } from './components/SettingsPanel.js';

/**
 * UI Manager - Handles UI-related functionality for the Cookie Clicker game
 * Centralizes UI updates, animations, and display logic
 */
export class UIManager {
  /**
   * Initialize the UI manager with a reference to the game
   * @param {Game} game - Reference to the main game object
   */
  constructor(game) {
    this.game = game;
    this.tooltipsEnabled = false;
    this.activeToasts = [];
    this.maxToasts = 5;
    this.activeTooltip = null;
    this.goldenCookies = [];
    
    // Create a toast container if it doesn't exist
    this.initToastContainer();
    this.panels = {};
    this.setupPanels();
  }

  /**
   * Create a container for toast notifications
   */
  initToastContainer() {
    if (!document.querySelector('.toast-container')) {
      const container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
  }

  setupPanels() {
    // Shop panel
    if (this.game.shopContainer && this.game.shopIcon) {
      this.panels.shop = new ShopPanel(
        this.game,
        this.game.shopContainer,
        this.game.shopIcon
      );
    }
    
    // Achievements panel
    if (this.game.achievementsContainer && this.game.achievementsIcon) {
      this.panels.achievements = new AchievementsPanel(
        this.game,
        this.game.achievementsContainer,
        this.game.achievementsIcon,
        this.game.achievementsList
      );
    }
    
    // Settings panel
    if (this.game.settingsMenu && this.game.settingsIcon) {
      this.panels.settings = new SettingsPanel(
        this.game,
        this.game.settingsMenu,
        this.game.settingsIcon
      );
    }
  }

  /**
   * Update all the button descriptions for upgrades
   */
  updateUpgradeDescriptions() {
    // Update standard upgrade buttons text and cost
    for (const [key, upgrade] of Object.entries(this.game.upgrades)) {
      const buttons = document.querySelectorAll(`button#${key}`);
      const text = upgrade.getDisplayText();
      
      buttons.forEach((btn) => {
        // Update data-content for accessibility
        btn.setAttribute('data-content', text);
        
        // Update the visible text
        const btnTop = btn.querySelector(".button_top");
        if (btnTop) {
          btnTop.textContent = text;
        }

        // Add description text if available
        const descElement = btn.querySelector(".description");
        if (descElement) {
          const description = this.getUpgradeDescription(key, upgrade);
          descElement.textContent = description;
        }
      });
    }

    // Update shop item costs
    for (const [key, upgrade] of Object.entries(this.game.shopUpgrades)) {
      const costSpan = document.querySelector(`[data-upgrade="${key}"] .item-cost span`);
      if (costSpan) {
        costSpan.textContent = upgrade.cost.toLocaleString();
      }
    }
  }

  /**
   * Get descriptive text for an upgrade
   * @param {string} key - The upgrade key
   * @param {Upgrade} upgrade - The upgrade object
   * @returns {string} - Description text
   */
  getUpgradeDescription(key, upgrade) {
    switch(key) {
      case 'clickUpgrade':
        return 'Doubles your click power';
      case 'autoClicker':
        return '+1 cookie per second';
      case 'grandma':
        return '+5 cookies per second';
      case 'farm':
        return '+10 cookies per second';
      case 'luckyClick':
        return 'Random cookie bonus!';
      default:
        return '';
    }
  }

  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {string} type - The type of notification (success, error, info)
   * @param {number} duration - How long to show the toast (ms)
   */
  showToast(message, type = 'info', duration = 3000) {
    const container = document.querySelector('.toast-container');
    if (!container) return;
    
    // Limit maximum toasts
    if (this.activeToasts.length >= this.maxToasts) {
      const oldestToast = this.activeToasts.shift();
      if (oldestToast && oldestToast.parentNode) {
        oldestToast.parentNode.removeChild(oldestToast);
      }
    }
    
    const toast = document.createElement('div');
    toast.className = `auto-save-notification toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    // Add to active toasts
    this.activeToasts.push(toast);
    
    // Remove after duration
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
        this.activeToasts = this.activeToasts.filter(t => t !== toast);
      }
    }, duration);
  }

  /**
   * Show golden cookie on screen
   * @param {number} x - X position (0-100% of screen width)
   * @param {number} y - Y position (0-100% of screen height)
   * @returns {HTMLElement} - The golden cookie element
   */
  spawnGoldenCookie(x, y) {
    // Create container if it doesn't exist
    let container = document.getElementById('goldenCookieContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'goldenCookieContainer';
      document.body.appendChild(container);
    }
    
    // Create golden cookie element
    const goldenCookie = document.createElement('div');
    goldenCookie.className = 'golden-cookie';
    
    // Position randomly if not specified
    goldenCookie.style.left = x ? `${x}%` : `${5 + Math.random() * 90}%`;
    goldenCookie.style.top = y ? `${y}%` : `${5 + Math.random() * 90}%`;
    
    // Add click handler
    goldenCookie.addEventListener('click', () => this.handleGoldenCookieClick(goldenCookie));
    
    // Add to container
    container.appendChild(goldenCookie);
    
    // Return for further manipulation
    return goldenCookie;
  }

  /**
   * Handle golden cookie click
   * @param {HTMLElement} cookieElement - The golden cookie element that was clicked
   */
  handleGoldenCookieClick(cookieElement) {
    // Add clicked animation
    cookieElement.classList.add('golden-cookie-clicked');
    
    // Apply random bonus
    this.applyRandomGoldenCookieBonus();
    
    // Remove after animation
    setTimeout(() => {
      if (cookieElement.parentNode) {
        cookieElement.parentNode.removeChild(cookieElement);
      }
    }, 500);
  }

  /**
   * Apply a random bonus when golden cookie is clicked
   */
  applyRandomGoldenCookieBonus() {
    const bonusType = Math.floor(Math.random() * 4);
    
    switch(bonusType) {
      case 0: // Click power boost
        this.applyClickBoost(2, 30);
        break;
      case 1: // Production boost
        this.applyProductionBoost(2, 30);
        break;
      case 2: // Instant cookies (30-60 seconds worth of production)
        this.applyInstantCookies();
        break;
      case 3: // Clicking frenzy
        this.applyClickingFrenzy(30);
        break;
    }
  }

  /**
   * Apply click power boost for a duration
   * @param {number} multiplier - How much to multiply click power
   * @param {number} durationSeconds - How long the boost lasts
   */
  applyClickBoost(multiplier, durationSeconds) {
    // Store original click power
    const originalClickPower = this.game.state.clickPower;
    
    // Apply boost
    this.game.state.clickPower *= multiplier;
    
    // Add visual indicator
    this.game.cookie.classList.add('click-boosted');
    
    // Show toast
    this.showToast(`👆 Click power x${multiplier} for ${durationSeconds}s!`, 'success');
    
    // Add bonus indicator
    this.addBonusIndicator('click-boost', `👆 Click x${multiplier}`, durationSeconds);
    
    // Reset after duration
    setTimeout(() => {
      this.game.state.clickPower = originalClickPower;
      this.game.cookie.classList.remove('click-boosted');
      this.showToast('Click power boost expired', 'info');
    }, durationSeconds * 1000);
  }

  /**
   * Apply production boost for a duration
   * @param {number} multiplier - How much to multiply production
   * @param {number} durationSeconds - How long the boost lasts
   */
  applyProductionBoost(multiplier, durationSeconds) {
    // Store original state
    this.game.state.productionBoostActive = true;
    this.game.state.productionBoostMultiplier = multiplier;
    this.game.state.productionBoostEndTime = Date.now() + (durationSeconds * 1000);
    
    // Show toast
    this.showToast(`🚀 Production x${multiplier} for ${durationSeconds}s!`, 'success');
    
    // Add bonus indicator
    this.addBonusIndicator('production-boost', `🚀 Production x${multiplier}`, durationSeconds);
    
    // Reset after duration
    setTimeout(() => {
      this.game.state.productionBoostActive = false;
      this.game.state.productionBoostMultiplier = 1;
      this.showToast('Production boost expired', 'info');
    }, durationSeconds * 1000);
  }

  /**
   * Apply instant cookies bonus - get 30-60 seconds worth of production instantly
   */
  applyInstantCookies() {
    // Calculate CPS
    const autoClickers = this.game.upgrades.autoClicker.count || 0;
    const grandmas = this.game.upgrades.grandma.count || 0;
    const farms = this.game.upgrades.farm.count || 0;
    const cps = autoClickers * 1 + grandmas * 5 + farms * 10;
    
    // Calculate seconds bonus (30-60 seconds)
    const seconds = 30 + Math.floor(Math.random() * 30);
    
    // Calculate cookie bonus
    const cookieBonus = Math.max(100, Math.floor(cps * seconds));
    
    // Add cookies
    this.game.state.cookies += cookieBonus;
    
    // Show floating number and toast
    this.game.showFloatingNumber(cookieBonus, true);
    this.showToast(`✨ ${cookieBonus} instant cookies!`, 'success');
  }

  /**
   * Apply clicking frenzy - each click earns much more for a duration
   * @param {number} durationSeconds - How long the frenzy lasts
   */
  applyClickingFrenzy(durationSeconds) {
    // Store original click power
    const originalClickPower = this.game.state.clickPower;
    
    // Apply massive boost (7x)
    this.game.state.clickPower *= 7;
    
    // Add visual indicator
    this.game.cookie.classList.add('frenzy-boosted');
    
    // Show toast
    this.showToast(`🔥 CLICKING FRENZY! 7x clicks for ${durationSeconds}s! 🔥`, 'success');
    
    // Add bonus indicator
    this.addBonusIndicator('frenzy', `🔥 FRENZY x7!`, durationSeconds);
    
    // Reset after duration
    setTimeout(() => {
      this.game.state.clickPower = originalClickPower;
      this.game.cookie.classList.remove('frenzy-boosted');
      this.showToast('Clicking frenzy expired', 'info');
    }, durationSeconds * 1000);
  }

  /**
   * Add a bonus indicator to the active bonuses section
   * @param {string} type - Type of bonus
   * @param {string} text - Display text
   * @param {number} durationSeconds - Duration in seconds
   */
  addBonusIndicator(type, text, durationSeconds) {
    const container = document.getElementById('activeBonuses');
    if (!container) return;
    
    // Create indicator element
    const indicator = document.createElement('div');
    indicator.className = `bonus-indicator ${type}`;
    
    // Create timer span
    const timerSpan = document.createElement('span');
    timerSpan.className = 'bonus-timer';
    
    // Add to indicator
    indicator.innerHTML = text;
    indicator.appendChild(timerSpan);
    
    // Add to container
    container.appendChild(indicator);
    
    // Start countdown
    let secondsLeft = durationSeconds;
    const updateTimer = () => {
      timerSpan.textContent = ` ${secondsLeft}s`;
      secondsLeft--;
      
      if (secondsLeft >= 0) {
        setTimeout(updateTimer, 1000);
      } else {
        indicator.remove();
      }
    };
    
    updateTimer();
  }

  /**
   * Update the game display with current state
   */
  updateGameDisplay() {
    // Update cookie count
    const cookies = Math.floor(this.game.state.cookies);
    document.getElementById('cookieCount').textContent = cookies.toLocaleString();
    document.getElementById('count').textContent = cookies.toLocaleString() + " cookies";
    
    // Update click power
    document.getElementById('clickPower').textContent = this.game.state.clickPower;
    
    // Calculate and update CPS
    const autoClickers = this.game.upgrades.autoClicker.count || 0;
    const grandmas = this.game.upgrades.grandma.count || 0;
    const farms = this.game.upgrades.farm.count || 0;
    let cps = autoClickers * 1 + grandmas * 5 + farms * 10;
    
    // Apply modifiers
    if (this.game.state.productionBoostActive) {
      cps *= this.game.state.productionBoostMultiplier;
    }
    if (this.game.state.timeAcceleratorActive) {
      cps *= this.game.state.timeAcceleratorMultiplier;
    }
    
    document.getElementById('cps').textContent = Math.floor(cps);
    
    // Update upgrade button states
    this.updateUpgradeButtons();
    
    // Update time accelerator countdown if active
    this.updateTimeAcceleratorDisplay();
  }

  /**
   * Update the enabled/disabled state of upgrade buttons
   */
  updateUpgradeButtons() {
    const cookies = this.game.state.cookies;
    
    // Update standard upgrades
    for (const [key, upgrade] of Object.entries(this.game.upgrades)) {
      const button = document.getElementById(key);
      if (button) {
        button.disabled = cookies < upgrade.cost;
      }
    }
    
    // Update shop items (not currently visible as buttons)
  }

  /**
   * Update time accelerator display and countdown
   */
  updateTimeAcceleratorDisplay() {
    const itemEl = document.querySelector(`[data-upgrade="timeAccelerator"]`);
    const timerSpan = itemEl ? itemEl.querySelector(".time-accelerator-timer") : null;
    
    if (this.game.state.timeAcceleratorActive && this.game.state.timeAcceleratorEndTime) {
      if (itemEl) itemEl.classList.add("active");
      
      const secondsLeft = Math.floor((this.game.state.timeAcceleratorEndTime - Date.now()) / 1000);
      
      if (secondsLeft > 0 && timerSpan) {
        timerSpan.textContent = `⚡ ${this.game.state.timeAcceleratorMultiplier}x ACTIVE: ${secondsLeft}s ⚡`;
      } else if (timerSpan) {
        timerSpan.textContent = "";
      }
    } else {
      if (itemEl) itemEl.classList.remove("active");
      if (timerSpan) timerSpan.textContent = "";
    }
  }

  updateDisplay() {
    // Update cookie count and related displays
    if (this.game.cookieCount) {
      this.game.cookieCount.textContent = this.formatNumber(this.game.state.cookies);
    }
    
    if (this.game.clickPowerDisplay) {
      this.game.clickPowerDisplay.textContent = this.formatNumber(this.game.state.clickPower);
    }
    
    // Update button states
    this.updateButtonStates();
    
    // Update shop prices
    if (this.panels.shop) {
      this.panels.shop.updatePrices();
    }
  }
  
  formatNumber(num) {
    if (num < 1000) return Math.floor(num);
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    return (num / 1000000000).toFixed(1) + 'B';
  }
  
  updateButtonStates() {
    const cookies = Math.floor(this.game.state.cookies);
    
    // Cache & update button states in batch
    const hasCookies = {};
    Object.keys(this.game.upgrades).forEach(key => {
      hasCookies[key] = cookies >= this.game.upgrades[key].cost;
    });
    
    // Update button texts and disabled states
    Object.keys(this.game.upgrades).forEach((key) => {
      const buttons = document.querySelectorAll(`button#${key}`);
      
      if (!buttons.length) return;
      
      const text = this.game.upgrades[key].getDisplayText();
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
  }

  /**
   * Updates tooltip content for an element
   */
  updateTooltip(element, content) {
    if (!element) return;
    
    // Update data-content attribute if it exists
    if (element.dataset) {
      element.dataset.content = content;
    }
    
    // If there's a tooltip element associated, update it directly
    const tooltip = document.querySelector(`[data-for="${element.id}"]`);
    if (tooltip) {
      tooltip.textContent = content;
    }
  }
}
