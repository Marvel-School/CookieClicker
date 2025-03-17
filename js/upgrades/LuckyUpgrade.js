import { Upgrade } from './Upgrade.js';

/**
 * Specialized upgrade for random/lucky bonuses
 */
export class LuckyUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix) {
    // Lower initial cost to 15 (down from 20) and slower cost increase (1.15 instead of standard 1.5)
    super(15, 1.15, displayPrefix);
  }
  
  executePurchase(game) {
    // Get production values
    const autoClickers = game.upgrades.autoClicker.count || 0;
    const grandmas = game.upgrades.grandma.count || 0;
    const farms = game.upgrades.farm.count || 0;
    
    // Calculate CPS (cookies per second)
    const baseCps = autoClickers * 1 + grandmas * 5 + farms * 10;
    
    // Apply multipliers if present
    const cps = baseCps * (game.state.cookieMultiplier || 1);
    
    // ENHANCEMENT 1: Much more generous base reward (30-90 seconds worth of production)
    // This is double what it was before (was 15-45 seconds)
    const productionSeconds = 30 + Math.floor(Math.random() * 60);
    
    // Minimum reward now 100 cookies (up from 50) for early game value
    const baseBonus = Math.max(100, cps * productionSeconds);
    
    // ENHANCEMENT 2: More generous adaptive cap based on game progression
    // Base cap increased from 500 to 1000, and scaling factor doubled
    const gameProgress = game.state.cookies / 500; // More aggressive scaling (was /1000)
    const adaptiveCap = Math.max(1000, 2000 + gameProgress * 2);
    const cappedBonus = Math.min(baseBonus, adaptiveCap);

    // ENHANCEMENT 3: Higher chance for critical hits (30% chance, up from 20%)
    // And better critical multipliers (2.5-3.5x, up from 2-3x)
    let bonus = 0;
    let effectMessage = "";
    let isCritical = false;
    
    if (Math.random() < 0.3) { // 30% chance of critical
      // Critical hit gives 2.5-3.5x the bonus
      const critMultiplier = 2.5 + Math.random();
      bonus = Math.floor(cappedBonus * critMultiplier);
      isCritical = true;
      effectMessage = "CRITICAL LUCKY HIT! 💥";
    } else {
      // Normal hit with increased randomness (80%-140%, up from 70%-130%)
      const randomFactor = 0.8 + (Math.random() * 0.6);
      bonus = Math.floor(cappedBonus * randomFactor);
    }
    
    // Add cookies and show floating number
    game.state.cookies += bonus;
    
    // ENHANCEMENT 4: Higher chance of special effects (15%, up from 10%)
    // And more powerful/varied effects
    if (!isCritical && Math.random() < 0.15) {
      // Pick a random bonus effect (now 4 effects, up from 3)
      const effect = Math.floor(Math.random() * 4);
      
      switch(effect) {
        case 0: // Temporary click power boost (now 3x for 40s, up from 2x for 30s)
          game.state.clickPowerBoostActive = true;
          game.state.clickPowerBoostMultiplier = 3;
          game.state.clickPowerBoostEndTime = Date.now() + 40000;
          effectMessage = "Click Power x3 for 40s! 👆";
          
          // Schedule the end of the boost
          setTimeout(() => {
            game.state.clickPowerBoostActive = false;
            game.state.clickPowerBoostMultiplier = 1;
          }, 40000);
          break;
          
        case 1: // Permanent CPS boost (now 8%, up from 5%)
          game.state.cookieMultiplier = (game.state.cookieMultiplier || 1) * 1.08;
          effectMessage = "Production +8% Permanently! 📈";
          break;
          
        case 2: // Free auto-clickers (now 2, up from 1)
          if (game.upgrades.autoClicker) {
            game.upgrades.autoClicker.count = (game.upgrades.autoClicker.count || 0) + 2;
            effectMessage = "Free 2 Auto-Clickers! 🤖🤖";
            // Update visuals
            game.updateDisplay();
          }
          break;
          
        case 3: // NEW: Temporary CPS multiplier boost
          const tempMultiplier = 2; // 2x production
          const duration = 60; // 60 seconds
          
          // Store the original multiplier to restore later
          const originalMultiplier = game.state.cookieMultiplier || 1;
          
          // Apply the temporary boost
          game.state.cookieMultiplier = originalMultiplier * tempMultiplier;
          game.state.cpsBoostActive = true;
          game.state.cpsBoostEndTime = Date.now() + (duration * 1000);
          
          effectMessage = "Cookie Production x2 for 60s! 🚀";
          
          // Schedule the end of the boost
          setTimeout(() => {
            // Only reset if the boost is still active (in case another one was applied)
            if (game.state.cpsBoostActive && game.state.cpsBoostEndTime <= Date.now()) {
              game.state.cookieMultiplier = originalMultiplier;
              game.state.cpsBoostActive = false;
              game.updateDisplay();
            }
          }, duration * 1000);
          break;
      }
    }
    
    // Show appropriate feedback
    if (game.effects) {
      game.effects.showFloatingNumber(game.cookie, bonus, true);
      
      // Show effect message if applicable
      if (effectMessage) {
        // Create a special effect message
        const message = document.createElement("div");
        message.className = "floating-effect";
        message.textContent = effectMessage;
        message.style.position = "absolute";
        message.style.fontSize = isCritical ? "24px" : "18px";
        message.style.color = isCritical ? "#ff4500" : "#1e90ff";
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
        
        // Animate and remove after animation
        message.animate(
          [
            { transform: "translateY(0) scale(1)", opacity: 1 },
            { transform: "translateY(-50px) scale(1.2)", opacity: 1 },
            { transform: "translateY(-100px) scale(1)", opacity: 0 }
          ],
          {
            duration: 2000,
            easing: "cubic-bezier(0.215, 0.61, 0.355, 1)"
          }
        );
        
        setTimeout(() => message.remove(), 2000);
      }
    } else {
      // Fallback to direct method
      game.showFloatingNumber(bonus, true);
    }
    
    // Track the lucky streak for related achievements
    game.state.luckyStreak = (game.state.luckyStreak || 0) + 1;
  }
}
