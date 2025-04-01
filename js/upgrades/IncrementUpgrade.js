import { Upgrade } from './Upgrade.js';

/**
 * Upgrade that increments a counter (like buildings or resources)
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
    let text = `${this.displayPrefix} (Cost: ${this.cost}, Count: ${this.count})`;
    
    // Add description if available
    if (this.description) {
      text += ` - ${this.description}`;
    }
    
    return text;
  }
}
