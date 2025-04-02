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
      game.log(`Not enough cookies for ${this.constructor.name}. Cost: ${this.cost}, have: ${game.state.cookies}`);
      game.showToast(`Not enough cookies for ${this.displayPrefix}`);
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
    // Remove the count from the button display text
    return `${this.displayPrefix} (Cost: ${this.cost})`;
  }
}

/**
 * Special lucky upgrade with random bonuses
 */
export class LuckyUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, description = 'Try your luck for a random bonus') {
    super(cost, multiplier, displayPrefix, description);
  }
  
  executePurchase(game) {
    // Random chance for different rewards
    const rand = Math.random();
    
    // 10% chance for jackpot (50-200x cost)
    if (rand < 0.1) {
      const multiplier = 50 + Math.floor(Math.random() * 151); // 50-200
      const bonus = this.cost * multiplier;
      game.state.cookies += bonus;
      game.showFloatingNumber(bonus, true);
      game.showToast(`JACKPOT! ${multiplier}x bonus!`);
      
      // Create a special message for jackpot
      const message = document.createElement("div");
      message.textContent = `💰 JACKPOT! ${multiplier}x BONUS! 💰`;
      message.style.position = "fixed";
      message.style.top = "50%";
      message.style.left = "50%";
      message.style.transform = "translate(-50%, -50%)";
      message.style.fontSize = "28px";
      message.style.color = "gold";
      message.style.fontWeight = "bold";
      message.style.textShadow = "2px 2px 4px #000";
      message.style.zIndex = "1000";
      message.style.textAlign = "center";
      message.style.pointerEvents = "none";
      document.body.appendChild(message);
      
      // Animation and cleanup
      setTimeout(() => message.remove(), 2000);
    } 
    // 20% chance for good reward (10-50x cost)
    else if (rand < 0.3) {
      const multiplier = 10 + Math.floor(Math.random() * 41); // 10-50
      const bonus = this.cost * multiplier;
      game.state.cookies += bonus;
      game.showFloatingNumber(bonus, true);
      game.showToast(`Lucky! ${multiplier}x bonus!`);
    } 
    // 30% chance for moderate reward (3-10x cost)
    else if (rand < 0.6) {
      const multiplier = 3 + Math.floor(Math.random() * 8); // 3-10
      const bonus = this.cost * multiplier;
      game.state.cookies += bonus;
      game.showFloatingNumber(bonus, true);
      game.showToast(`${multiplier}x bonus!`);
    } 
    // 20% chance for small reward (1-3x cost)
    else if (rand < 0.8) {
      const multiplier = 1 + Math.floor(Math.random() * 3); // 1-3
      const bonus = this.cost * multiplier;
      game.state.cookies += bonus;
      game.showFloatingNumber(bonus, true);
      game.showToast(`${multiplier}x bonus.`);
    } 
    // 20% chance to get nothing
    else {
      game.showToast("No luck this time.");
      game.showFloatingNumber(0, false);
    }
    
    // Track lucky streak
    game.state.luckyStreak = (game.state.luckyStreak || 0) + 1;
  }
}

/**
 * Shop upgrades with custom purchase behavior
 */
export class ShopUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, extra = null, baseCost = null) {
    super(cost, multiplier, displayPrefix, '', extra);
    this.baseCost = baseCost || cost;
  }

  purchase(game) {
    if (!this.canPurchase(game)) {
      game.log(`Not enough cookies for ${this.displayPrefix}. Cost: ${this.cost}, have: ${game.state.cookies}`);
      game.showToast(`Not enough cookies for ${this.displayPrefix}`);
      return false;
    }
    
    game.state.cookies -= this.cost;
    
    // Call the appropriate method on the game object
    if (this.extra && typeof game[this.extra] === 'function') {
      game[this.extra](this);
    }
    
    // Update cost after purchase
    this.updateCost();
    game.updateDisplay();
    
    return true;
  }
}
