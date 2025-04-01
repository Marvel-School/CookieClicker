import { IncrementUpgrade } from './IncrementUpgrade.js';

/**
 * Specialized upgrade that contributes to CPS (cookies per second)
 * Extends IncrementUpgrade with CPS calculation
 */
export class ProductionUpgrade extends IncrementUpgrade {
  constructor(cost, multiplier, displayPrefix, cpsValue, description = '', extra = null) {
    super(cost, multiplier, displayPrefix, description, extra);
    this.cpsValue = cpsValue; // Base CPS contribution per unit
  }
  
  getCPS(multiplier = 1) {
    return (this.count || 0) * this.cpsValue * multiplier;
  }
  
  getDisplayText() {
    return `${this.displayPrefix} (Cost: ${this.cost}, Count: ${this.count}) - ${this.cpsValue} CPS each`;
  }
  
  executePurchase(game) {
    super.executePurchase(game);
    
    // Recalculate CPS after purchase
    if (game.state.totalCPS !== undefined) {
      game.state.totalCPS = this.calculateTotalCPS(game);
    }
  }
  
  calculateTotalCPS(game) {
    let totalCPS = 0;
    
    // Sum up CPS from all production upgrades
    Object.keys(game.upgrades || {}).forEach(key => {
      const upgrade = game.upgrades[key];
      if (upgrade.getCPS && typeof upgrade.getCPS === 'function') {
        totalCPS += upgrade.getCPS(game.state.cookieMultiplier || 1);
      }
    });
    
    return totalCPS;
  }
}
