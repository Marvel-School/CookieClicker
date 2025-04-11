import { IncrementUpgrade } from './IncrementUpgrade.js';

export class ProductionUpgrade extends IncrementUpgrade {
  constructor(cost, multiplier, displayPrefix, cpsValue, extra = null) {
    super(cost, multiplier, displayPrefix, extra);
    this.cpsValue = cpsValue;
  }
  
  getCPS(multiplier = 1) {
    return (this.count || 0) * this.cpsValue * multiplier;
  }
}
