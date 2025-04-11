import { Upgrade } from './Upgrade.js'; 


export class TimeBasedUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, effectMethod, baseDuration = 30, baseMultiplier = 2) {
    super(cost, multiplier, displayPrefix, effectMethod);
    this.baseDuration = baseDuration;
    this.baseMultiplier = baseMultiplier;
    this.effectEndTime = 0;
  }
  
  calculateDuration(baseCost) {
    const costDiff = this.cost - baseCost;
    const durationBonus = costDiff > 0 ? (costDiff * 0.05) : 0;
    const maxDuration = this.baseDuration * 2;
    
    return Math.min(this.baseDuration + durationBonus, maxDuration);
  }
  
  calculateMultiplier() {
    return this.baseMultiplier;
  }
  
  isActive() {
    return this.effectEndTime > Date.now();
  }
  
  getRemainingTime() {
    if (!this.isActive()) return 0;
    return Math.max(0, Math.floor((this.effectEndTime - Date.now()) / 1000));
  }
}
