import { Upgrade } from './Upgrade.js';

/**
 * Specialized upgrade for increasing click power
 */
export class ClickMultiplierUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, clickMultiplier = 1.5) {
    super(cost, multiplier, displayPrefix);
    this.clickMultiplier = clickMultiplier; // Multiplier for click power (1.5 = +50%)
  }
  
  executePurchase(game) {
    // Apply a multiplier to the click power
    game.state.clickPower = Math.floor(game.state.clickPower * this.clickMultiplier);
  }
}
