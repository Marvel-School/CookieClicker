import { IncrementUpgrade } from './IncrementUpgrade.js';

/**
 * Specialized upgrade that contributes to CPS (cookies per second)
 * Extends IncrementUpgrade with CPS calculation
 */
export class ProductionUpgrade extends IncrementUpgrade {
  constructor(cost, multiplier, displayPrefix, cpsValue, extra = null) {
    super(cost, multiplier, displayPrefix, extra);
    this.cpsValue = cpsValue; // Base CPS contribution per unit
  }
  
  getCPS(multiplier = 1) {
    return (this.count || 0) * this.cpsValue * multiplier;
  }
}
