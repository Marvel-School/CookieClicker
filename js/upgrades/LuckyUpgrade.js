import { Upgrade } from './Upgrade.js';

export class LuckyUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix) {
    super(15, 1.15, displayPrefix);
  }
  
  executePurchase(game) {
    const autoClickers = game.upgrades.autoClicker.count || 0;
    const grandmas = game.upgrades.grandma.count || 0;
    const farms = game.upgrades.farm.count || 0;
    
    const baseCps = autoClickers * 1 + grandmas * 5 + farms * 10;
    
    const cps = baseCps * (game.state.cookieMultiplier || 1);
    
    const productionSeconds = 30 + Math.floor(Math.random() * 60);
    
    const baseBonus = Math.max(100, cps * productionSeconds);
    
    const gameProgress = game.state.cookies / 500;
    const adaptiveCap = Math.max(1000, 2000 + gameProgress * 2);
    const cappedBonus = Math.min(baseBonus, adaptiveCap);

    let bonus = 0;
    let effectMessage = "";
    let isCritical = false;
    
    if (Math.random() < 0.3) {
      const critMultiplier = 2.5 + Math.random();
      bonus = Math.floor(cappedBonus * critMultiplier);
      isCritical = true;
      effectMessage = "CRITICAL LUCKY HIT! 💥";
    } else {
      const randomFactor = 0.8 + (Math.random() * 0.6);
      bonus = Math.floor(cappedBonus * randomFactor);
    }
    
    game.state.cookies += bonus;
    
    if (!isCritical && Math.random() < 0.15) {
      const effect = Math.floor(Math.random() * 4);
      
      switch(effect) {
        case 0:
          game.state.clickPowerBoostActive = true;
          game.state.clickPowerBoostMultiplier = 3;
          game.state.clickPowerBoostEndTime = Date.now() + 40000;
          effectMessage = "Click Power x3 for 40s! 👆";
          
          setTimeout(() => {
            game.state.clickPowerBoostActive = false;
            game.state.clickPowerBoostMultiplier = 1;
          }, 40000);
          break;
          
        case 1:
          game.state.cookieMultiplier = (game.state.cookieMultiplier || 1) * 1.08;
          effectMessage = "Production +8% Permanently! 📈";
          break;
          
        case 2:
          if (game.upgrades.autoClicker) {
            game.upgrades.autoClicker.count = (game.upgrades.autoClicker.count || 0) + 2;
            effectMessage = "Free 2 Auto-Clickers! 🤖🤖";
            game.updateDisplay();
          }
          break;
          
        case 3:
          const tempMultiplier = 2;
          const duration = 60;
          
          const originalMultiplier = game.state.cookieMultiplier || 1;
          
          game.state.cookieMultiplier = originalMultiplier * tempMultiplier;
          game.state.cpsBoostActive = true;
          game.state.cpsBoostEndTime = Date.now() + (duration * 1000);
          
          effectMessage = "Cookie Production x2 for 60s! 🚀";
          
          setTimeout(() => {
            if (game.state.cpsBoostActive && game.state.cpsBoostEndTime <= Date.now()) {
              game.state.cookieMultiplier = originalMultiplier;
              game.state.cpsBoostActive = false;
              game.updateDisplay();
            }
          }, duration * 1000);
          break;
      }
    }
    
    if (game.effects) {
      game.effects.showFloatingNumber(game.cookie, bonus, true);
      
      if (effectMessage) {
        const message = document.createElement("div");
        message.className = isCritical ? "floating-effect critical" : "floating-effect";
        message.textContent = effectMessage;
        
        const { left, top, width } = game.cookie.getBoundingClientRect();
        message.style.left = `${left + width / 2 - 120}px`;
        message.style.top = `${top - 50}px`;
        document.body.appendChild(message);
        
        setTimeout(() => message.remove(), 2000);
      }
    } else {
      game.showFloatingNumber(bonus, true);
    }
    
    game.state.luckyStreak = (game.state.luckyStreak || 0) + 1;
  }
}
