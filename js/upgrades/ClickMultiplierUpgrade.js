import { Upgrade } from './Upgrade.js';

/**
 * Specialized upgrade for increasing click power
 */
export class ClickMultiplierUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, clickMultiplier = 2, description = '') {
    super(cost, multiplier, displayPrefix, description);
    this.clickMultiplier = clickMultiplier; // Multiplier for click power (2 = 2x)
  }
  
  executePurchase(game) {
    // Apply a multiplier to the click power
    game.state.clickPower = Math.floor(game.state.clickPower * this.clickMultiplier);
    
    // Apply visual feedback
    if (game.visualEffects && typeof game.visualEffects.applyClickPowerBoostVisuals === 'function') {
      // Temporarily show click power boost visuals
      game.visualEffects.applyClickPowerBoostVisuals(true);
      setTimeout(() => game.visualEffects.applyClickPowerBoostVisuals(false), 3000);
    }
  }
  
  getDisplayText() {
    return `${this.displayPrefix} (Cost: ${this.cost}) - ${this.clickMultiplier}x Click Power`;
  }
}
