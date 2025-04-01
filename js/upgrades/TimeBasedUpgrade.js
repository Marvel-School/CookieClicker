import { Upgrade } from './Upgrade.js'; 

/**
 * Specialized upgrade for time-limited boosts
 */
export class TimeBasedUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, effectMethod, baseDuration = 30, baseMultiplier = 2) {
    super(cost, multiplier, displayPrefix, effectMethod);
    this.baseDuration = baseDuration;
    this.baseMultiplier = baseMultiplier;
    this.effectEndTime = 0;
  }
  
  calculateDuration(baseCost) {
    // Increase duration based on cost progression
    const costDiff = this.cost - baseCost;
    const durationBonus = costDiff > 0 ? (costDiff * 0.05) : 0;
    const maxDuration = this.baseDuration * 2;
    
    return Math.min(this.baseDuration + durationBonus, maxDuration);
  }
  
  calculateMultiplier() {
    // Can be extended to scale multiplier with cost
    return this.baseMultiplier;
  }
  
  isActive() {
    return this.effectEndTime > Date.now();
  }
  
  getRemainingTime() {
    if (!this.isActive()) return 0;
    return Math.max(0, Math.floor((this.effectEndTime - Date.now()) / 1000));
  }
  
  executePurchase(game) {
    // Calculate duration based on base cost
    const duration = this.calculateDuration(this.cost / this.multiplier);
    const multiplier = this.calculateMultiplier();
    
    // Set end time
    this.effectEndTime = Date.now() + (duration * 1000);
    
    // Apply the effect based on the effectMethod parameter
    if (typeof game[this.description] === 'function') {
      game[this.description](multiplier, duration, this);
    }
    
    return {
      duration,
      multiplier
    };
  }
  
  getDisplayText() {
    let text = `${this.displayPrefix} (Cost: ${this.cost})`;
    
    if (this.isActive()) {
      const remainingTime = this.getRemainingTime();
      text += ` - Active: ${remainingTime}s`;
    }
    
    return text;
  }
}
