import { Upgrade } from './Upgrade.js';

/**
 * Specialized upgrade for random/lucky bonuses
 */
export class LuckyUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix) {
    super(cost, multiplier, displayPrefix);
  }
  
  executePurchase(game) {
    // Improved Lucky Click - scales with current CPS but has limits
    const autoClickers = game.upgrades.autoClicker.count || 0;
    const grandmas = game.upgrades.grandma.count || 0;
    const farms = game.upgrades.farm.count || 0;
    
    // Base on 5 seconds of production with minimum and maximum
    const cps = autoClickers * 1 + grandmas * 3 + farms * 6;
    const baseBonus = Math.max(5, cps * 5);
    const cappedBonus = Math.min(baseBonus, 500); // Cap at 500 cookies
    
    // Add randomness between 80%-120% of the calculated value
    const randomFactor = 0.8 + (Math.random() * 0.4); // Between 0.8 and 1.2
    const bonus = Math.floor(cappedBonus * randomFactor);
    
    // Add cookies and show floating number
    game.state.cookies += bonus;
    
    // Use the visual effects manager if available
    if (game.effects) {
      game.effects.showFloatingNumber(game.cookie, bonus, true);
    } else {
      // Fallback to direct method
      game.showFloatingNumber(bonus, true);
    }
    
    // Track the lucky streak for related achievements
    game.state.luckyStreak = (game.state.luckyStreak || 0) + 1;
  }
}
