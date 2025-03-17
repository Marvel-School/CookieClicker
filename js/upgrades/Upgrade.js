/**
 * Base class for all upgrades
 */
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
