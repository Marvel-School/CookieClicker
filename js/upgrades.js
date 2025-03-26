// Contains all upgrade class definitions

/**
 * Base class for all upgrades
 */
export class Upgrade {
  constructor(cost, multiplier, displayPrefix, description = '', extra = null) {
    this.cost = cost;
    this.multiplier = multiplier;
    this.displayPrefix = displayPrefix;
    this.description = description;
    this.extra = extra;
  }
  
  getDisplayText() {
    return `${this.displayPrefix} (Cost: ${this.cost}) - ${this.description}`;
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
      return false;
    }
    
    game.state.cookies -= this.cost;
    this.executePurchase(game);
    this.updateCost();
    
    if (this.extra && typeof game[this.extra] === "function") {
      game[this.extra]();
    }
    
    game.updateDisplay();
    return true;
  }
  
  // To be overridden in subclasses
  executePurchase(game) {
    // Default implementation does nothing
  }
}

/**
 * Upgrade that multiplies click power by 2
 */
export class ClickMultiplierUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, description = 'Doubles your click power') {
    super(cost, multiplier, displayPrefix, description);
  }
  
  executePurchase(game) {
    game.state.clickPower *= 2;
  }
}

/**
 * Upgrade that increments a counter (buildings)
 */
export class IncrementUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, description = '', extra = null) {
    super(cost, multiplier, displayPrefix, description, extra);
    this.count = 0;
  }
  
  executePurchase(game) {
    this.count++;
  }
  
  getDisplayText() {
    return `${this.displayPrefix} (Cost: ${this.cost})${this.count > 0 ? ' - ' + this.count : ''}`;
  }
}

/**
 * Special lucky upgrade with random bonuses
 */
export class LuckyUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, description = 'Try your luck for bonuses!') {
    super(cost, multiplier, displayPrefix, description);
  }
  
  executePurchase(game) {
    // Get production values
    const autoClickers = game.upgrades.autoClicker.count || 0;
    const grandmas = game.upgrades.grandma.count || 0;
    const farms = game.upgrades.farm.count || 0;
    
    // Calculate CPS (cookies per second)
    const baseCps = autoClickers * 1 + grandmas * 3 + farms * 6; // Using rebalanced production values
    
    // Apply multipliers if present
    const cps = baseCps * (game.state.cookieMultiplier || 1);
    
    // Base reward is 30-90 seconds of production
    const productionSeconds = 30 + Math.floor(Math.random() * 60);
    
    // Minimum reward is 100 cookies
    const baseBonus = Math.max(100, cps * productionSeconds);
    
    // Cap the bonus relative to game progress
    const gameProgress = game.state.cookies / 500;
    const adaptiveCap = Math.max(1000, 2000 + gameProgress * 2);
    const cappedBonus = Math.min(baseBonus, adaptiveCap);

    // Determine if this is a critical hit (30% chance)
    let bonus = 0;
    let effectMessage = "";
    let isCritical = false;
    
    if (Math.random() < 0.3) {
      // Critical hit: 2.5-3.5x bonus
      const critMultiplier = 2.5 + Math.random();
      bonus = Math.floor(cappedBonus * critMultiplier);
      isCritical = true;
      effectMessage = "CRITICAL LUCKY HIT! 💥";
    } else {
      // Regular hit: 80-140% of base bonus
      const randomFactor = 0.8 + (Math.random() * 0.6);
      bonus = Math.floor(cappedBonus * randomFactor);
    }
    
    // Add cookies to player's total
    game.state.cookies += bonus;
    
    // Show floating number animation
    if (typeof game.showFloatingNumber === 'function') {
      game.showFloatingNumber(bonus, true);
    }
    
    // Random special effects (15% chance if not critical)
    if (!isCritical && Math.random() < 0.15) {
      const effect = Math.floor(Math.random() * 4);
      
      switch(effect) {
        case 0: // Temporary click power boost
          game.state.clickPowerBoostActive = true;
          game.state.clickPowerBoostMultiplier = 3;
          game.state.clickPowerBoostEndTime = Date.now() + 40000;
          effectMessage = "Click Power x3 for 40s! 👆";
          
          setTimeout(() => {
            game.state.clickPowerBoostActive = false;
            game.state.clickPowerBoostMultiplier = 1;
          }, 40000);
          break;
          
        case 1: // Permanent CPS boost
          game.state.cookieMultiplier = (game.state.cookieMultiplier || 1) * 1.08;
          effectMessage = "Production +8% Permanently! 📈";
          break;
          
        case 2: // Free auto-clickers
          if (game.upgrades.autoClicker) {
            game.upgrades.autoClicker.count = (game.upgrades.autoClicker.count || 0) + 2;
            effectMessage = "Free 2 Auto-Clickers! 🤖🤖";
            game.updateDisplay();
          }
          break;
          
        case 3: // Temporary CPS boost
          const tempMultiplier = 2;
          const duration = 60; // seconds
          
          const originalMultiplier = game.state.cookieMultiplier || 1;
          game.state.cookieMultiplier *= tempMultiplier;
          game.state.cpsBoostActive = true;
          game.state.cpsBoostEndTime = Date.now() + (duration * 1000);
          
          effectMessage = "Cookie Production x2 for 60s! 🚀";
          
          setTimeout(() => {
            if (game.state.cpsBoostActive && game.state.cpsBoostEndTime <= Date.now()) {
              game.state.cookieMultiplier = originalMultiplier;
              game.state.cpsBoostActive = false;
              game.updateDisplay();
            }
          }, duration * 1000);
          break;
      }
    }
    
    // Show effect message if there is one
    if (effectMessage && typeof game.showToast === 'function') {
      game.showToast(effectMessage);
    }
    
    // Track lucky streak for achievements
    game.state.luckyStreak = (game.state.luckyStreak || 0) + 1;
  }
}

/**
 * Shop upgrades with custom purchase behavior
 */
export class ShopUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, extra = null, baseCost) {
    super(cost, multiplier, displayPrefix, '', extra);
    this.baseCost = baseCost || cost;
  }
  
  purchase(game) {
    if (!this.canPurchase(game)) {
      game.log(
        `Not enough cookies for ${this.extra || this.displayPrefix}. Cost: ${this.cost}, have: ${game.state.cookies}`
      );
      if (typeof game.showToast === 'function') {
        game.showToast(`Not enough cookies for ${this.extra || this.displayPrefix}`);
      }
      return false;
    }
    
    game.state.cookies -= this.cost;
    
    if (this.extra && typeof game[this.extra] === 'function') {
      game[this.extra](this);
    }
    
    this.cost = Math.floor(this.cost * this.multiplier);
    game.updateDisplay();
    
    if (typeof game.showToast === 'function') {
      game.showToast(`${this.extra || this.displayPrefix} purchased!`);
    }
    
    return true;
  }
}
