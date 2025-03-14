import { ShopPanel } from './components/ShopPanel.js';
import { AchievementsPanel } from './components/AchievementsPanel.js';
import { SettingsPanel } from './components/SettingsPanel.js';

/**
 * Centralizes UI management for better organization
 */
export class UIManager {
  constructor(game) {
    this.game = game;
    this.panels = {};
    this.setupPanels();
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
}
