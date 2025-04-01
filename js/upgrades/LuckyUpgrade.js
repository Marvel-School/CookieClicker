import { Upgrade } from './Upgrade.js';

/**
 * Special upgrade that provides random bonuses on purchase
 */
export class LuckyUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, description = '', extra = null) {
    super(cost, multiplier, displayPrefix, description, extra);
    this.criticalChance = 0.3; // 30% chance for critical bonus
    this.minProductionSecondsBonus = 30;
    this.maxProductionSecondsBonus = 90;
  }
  
  executePurchase(game) {
    // Calculate production values using proper CPS
    let cps = 0;
    
    // Calculate total CPS from all production upgrades
    Object.keys(game.upgrades || {}).forEach(key => {
      const upgrade = game.upgrades[key];
      if (upgrade.getCPS && typeof upgrade.getCPS === 'function') {
        cps += upgrade.getCPS(game.state.cookieMultiplier || 1);
      }
    });
    
    // Ensure minimum value for early game
    cps = Math.max(1, cps);
    
    // Calculate bonus based on production seconds
    const productionSeconds = this.minProductionSecondsBonus + 
      Math.floor(Math.random() * (this.maxProductionSecondsBonus - this.minProductionSecondsBonus));
    
    const baseBonus = Math.max(100, cps * productionSeconds);
    
    // Cap based on game progression
    const gameProgress = game.state.cookies / 500;
    const adaptiveCap = Math.max(1000, 2000 + gameProgress * 2);
    const cappedBonus = Math.min(baseBonus, adaptiveCap);

    // Determine if critical hit
    let bonus = 0;
    let isCritical = Math.random() < this.criticalChance;
    
    if (isCritical) {
      // Critical hit gives 2.5-3.5x the bonus
      const critMultiplier = 2.5 + Math.random();
      bonus = Math.floor(cappedBonus * critMultiplier);
    } else {
      // Normal hit with increased randomness (80%-140%)
      const randomFactor = 0.8 + (Math.random() * 0.6);
      bonus = Math.floor(cappedBonus * randomFactor);
    }
    
    // Add cookies
    game.state.cookies += bonus;
    
    // Track lucky streak for achievements
    game.state.luckyStreak = (game.state.luckyStreak || 0) + 1;
    
    // Display visual effects
    if (game.showFloatingNumber) {
      game.showFloatingNumber(bonus, true);
    }
    
    if (isCritical && game.visualEffects) {
      game.createConfetti(window.innerWidth / 2, window.innerHeight / 2);
      
      // Show critical message
      const message = document.createElement("div");
      message.className = "floating-effect";
      message.textContent = "CRITICAL LUCKY HIT! 💥";
      message.style.position = "absolute";
      message.style.fontSize = "24px";
      message.style.color = "#ff4500";
      message.style.fontWeight = "bold";
      message.style.textShadow = "0px 0px 5px white";
      message.style.zIndex = "9999";
      
      const { left, top, width } = game.cookie.getBoundingClientRect();
      message.style.left = `${left + width / 2 - 120}px`;
      message.style.top = `${top - 50}px`;
      message.style.width = "240px";
      message.style.textAlign = "center";
      message.style.pointerEvents = "none";
      document.body.appendChild(message);
      
      // Animation and cleanup
      setTimeout(() => message.remove(), 2000);
    }
    
    return {
      bonus,
      isCritical
    };
  }
  
  getDisplayText() {
    return `${this.displayPrefix} (Cost: ${this.cost})`;
  }
}
