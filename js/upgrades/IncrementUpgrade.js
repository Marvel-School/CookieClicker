import { Upgrade } from './Upgrade.js';

/**
 * Upgrade that increments a counter (like buildings or resources)
 */
export class IncrementUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, extra = null) {
    super(cost, multiplier, displayPrefix, extra);
    this.count = 0;
  }
  
  executePurchase(game) {
    this.count++;
  }
  
  getDisplayText() {
    return `${this.displayPrefix} (Cost: ${this.cost}, Count: ${this.count})`;
  }
}
