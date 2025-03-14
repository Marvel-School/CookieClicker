// Contains all upgrade-related classes

export class Upgrade {
  constructor(cost, multiplier, displayPrefix, extra = null) {
    this.cost = cost;
    this.multiplier = multiplier;
    this.displayPrefix = displayPrefix;
    this.extra = extra;
  }
  
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
  
  // To be defined in subclasses
  executePurchase(game) {
    // ...override in subclass...
  }
}

export class ClickMultiplierUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix) {
    super(cost, multiplier, displayPrefix);
  }
  
  executePurchase(game) {
    // Change from 2x to 1.5x for better balance
    game.state.clickPower *= 1.5;
  }
}

export class IncrementUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, extra = null) {
    super(cost, multiplier, displayPrefix, extra);
    this.count = 0;
  }
  
  executePurchase(game) {
    this.count++;
  }
}

export class LuckyUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix) {
    super(cost, multiplier, displayPrefix);
  }
  
  executePurchase(game) {
    // Improved Lucky Click - scales with current CPS but has limits
    const autoClickers = game.upgrades.autoClicker.count || 0;
    const grandmas = game.upgrades.grandma.count || 0;
    const farms = game.upgrades.farm.count || 0;
    
    // Base on 5 seconds of production with minimum and maximum
    const cps = autoClickers * 1 + grandmas * 3 + farms * 6;
    const baseBonus = Math.max(5, cps * 5);
    const cappedBonus = Math.min(baseBonus, 500); // Cap at 500 cookies
    
    // Add randomness between 80%-120% of the calculated value
    const randomFactor = 0.8 + (Math.random() * 0.4); // Between 0.8 and 1.2
    const bonus = Math.floor(cappedBonus * randomFactor);
    
    game.state.cookies += bonus;
    game.showFloatingNumber(bonus, true);
  }
}

export class ShopUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, extra = null, baseCost) {
    super(cost, multiplier, displayPrefix, extra);
    this.baseCost = baseCost;
    // Store the name that will be used in data-upgrade attributes
    this.key = '';
  }
  
  // Override purchase entirely (different cost update)
  purchase(game) {
    // Ensure cookies is a number and not NaN
    if (isNaN(game.state.cookies)) {
      console.error("Cookie count is NaN, fixing...");
      game.state.cookies = 0;
    }
    
    if (!this.canPurchase(game)) {
      console.log(`Not enough cookies for ${this.displayPrefix}. Cost: ${this.cost}, have: ${game.state.cookies}`);
      
      try {
        // Use direct import function if game.showToast fails
        if (typeof game.showToast === 'function') {
          game.showToast(`Not enough cookies for ${this.displayPrefix}`);
        } else {
          const { showToast } = require('./utils.js');
          showToast(`Not enough cookies for ${this.displayPrefix}`);
        }
      } catch (e) {
        console.error("Could not show toast notification:", e);
        // Fallback to alert for critical errors
        alert(`Not enough cookies for ${this.displayPrefix}`);
      }
      return;
    }
    
    // Deduct cookies from player's total
    game.state.cookies -= this.cost;
    
    // Call the appropriate method based on the upgrade type
    if (typeof game[this.extra] === 'function') {
      try {
        game[this.extra](this);
        console.log(`Successfully executed ${this.extra} method`);
        
        // If this is the timeAccelerator method, rebalance it
        if (this.extra === 'timeAccelerator') {
          // Rebalance within the method instead of in the method definition
        }
        
        // If this is the goldenCookieChance upgrade, log the new chance
        if (this.extra === 'increaseGoldenCookieChance') {
          console.log(`New golden cookie chance: ${game.state.goldenCookieChance}`);
        }
      } catch (e) {
        console.error(`Error executing method ${this.extra}:`, e);
      }
    } else {
      console.error(`Method ${this.extra} not found in game object`);
    }
    
    // Update the cost for next purchase
    this.cost = Math.floor(this.cost * this.multiplier);
    
    // Find the key of this upgrade in the shopUpgrades object
    let upgradeKey = '';
    for (const key in game.shopUpgrades) {
      if (game.shopUpgrades[key] === this) {
        upgradeKey = key;
        break;
      }
    }
    
    // Update the cost display in the UI using the upgrade key
    if (upgradeKey) {
      const upgradeElement = document.querySelector(`[data-upgrade="${upgradeKey}"] .item-cost span`);
      if (upgradeElement) {
        upgradeElement.textContent = this.cost;
      }
    }
    
    // Update game display
    game.updateDisplay();
    
    try {
      // Use direct import function if game.showToast fails
      if (typeof game.showToast === 'function') {
        game.showToast(`${this.displayPrefix} purchased!`);
      } else {
        // Try to import it directly
        import('./utils.js').then(utils => {
          utils.showToast(`${this.displayPrefix} purchased!`);
        }).catch(e => {
          console.error("Could not import showToast:", e);
        });
      }
    } catch (e) {
      console.error("Could not show toast notification:", e);
    }
  }
}
