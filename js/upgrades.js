// Contains all upgrade-related classes

export class Upgrade {
  constructor(cost, multiplier, displayPrefix, extra = null) {
    this.cost = cost;
    this.multiplier = multiplier;
    this.displayPrefix = displayPrefix;
    this.extra = extra;
  }

  // getDisplayText() {
  //   return `${this.displayPrefix} (Cost: ${this.cost})`;
  // }

  getDisplayText() {
    if (window.innerWidth > 932) {
      return ` ${this.displayPrefix} (Cost: ${this.cost})`;
    } else {
      return `(Cost: ${this.cost})`;
    }
  }

  canPurchase(game) {
    return game.state.cookies >= this.cost;
  }

  updateCost() {
    this.cost = Math.floor(this.cost * this.multiplier);
  }

  purchase(game) {
    if (!this.canPurchase(game)) {
      game.log(
        `Not enough cookies for ${this.constructor.name}. Cost: ${this.cost}, have: ${game.state.cookies}`
      );
      return;
    }
    game.state.cookies -= this.cost;
    this.executePurchase(game);
    this.updateCost();
    if (this.extra && typeof game[this.extra] === "function") {
      game[this.extra]();
    }
    game.updateDisplay();
  }

  // To be defined in subclasses
  executePurchase(game) {
    // ...override in subclass...
  }
}

export class ClickMultiplierUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix) {
    super(cost, multiplier, displayPrefix);
  }

  executePurchase(game) {
    // Change from 2x to 1.5x for better balance
    game.state.clickPower *= 1.5;
  }
}

export class IncrementUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, extra = null) {
    super(cost, multiplier, displayPrefix, extra);
    this.count = 0;
  }

  executePurchase(game) {
    this.count++;
  }
}

export class LuckyUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix) {
    // Lower initial cost to 15 (down from 20) and slower cost increase (1.15 instead of 1.5)
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

    if (Math.random() < 0.3) {
      // 30% chance of critical
      // Critical hit gives 2.5-3.5x the bonus
      const critMultiplier = 2.5 + Math.random();
      bonus = Math.floor(cappedBonus * critMultiplier);
      isCritical = true;
      effectMessage = "CRITICAL LUCKY HIT! 💥";
    } else {
      // Normal hit with increased randomness (80%-140%, up from 70%-130%)
      const randomFactor = 0.8 + Math.random() * 0.6;
      bonus = Math.floor(cappedBonus * randomFactor);
    }

    // Add cookies and show floating number
    game.state.cookies += bonus;

    // Show effects (compatibility with both systems)
    if (typeof game.showFloatingNumber === "function") {
      game.showFloatingNumber(bonus, true);

      // Also show effect message if applicable
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
            { transform: "translateY(-100px) scale(1)", opacity: 0 },
          ],
          {
            duration: 2000,
            easing: "cubic-bezier(0.215, 0.61, 0.355, 1)",
          }
        );

        setTimeout(() => message.remove(), 2000);
      }
    }

    // Special effect chances (higher 15% chance)
    if (Math.random() < 0.15) {
      // Similar special effects as in LuckyUpgrade.js
      // Implementation...
    }

    // Track the lucky streak for related achievements
    game.state.luckyStreak = (game.state.luckyStreak || 0) + 1;
  }
}

export class ShopUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, extra = null, baseCost) {
    super(cost, multiplier, displayPrefix, extra);
    this.baseCost = baseCost;
    // Store the name that will be used in data-upgrade attributes
    this.key = "";
  }

  // Override purchase entirely (different cost update)
  purchase(game) {
    // Ensure cookies is a number and not NaN
    if (isNaN(game.state.cookies)) {
      console.error("Cookie count is NaN, fixing...");
      game.state.cookies = 0;
    }

    if (!this.canPurchase(game)) {
      console.log(
        `Not enough cookies for ${this.displayPrefix}. Cost: ${this.cost}, have: ${game.state.cookies}`
      );

      try {
        // Use direct import function if game.showToast fails
        if (typeof game.showToast === "function") {
          game.showToast(`Not enough cookies for ${this.displayPrefix}`);
        } else {
          const { showToast } = require("./utils.js");
          showToast(`Not enough cookies for ${this.displayPrefix}`);
        }
      } catch (e) {
        console.error("Could not show toast notification:", e);
        // Fallback to alert for critical errors
        alert(`Not enough cookies for ${this.displayPrefix}`);
      }
      return;
    }

    // Deduct cookies from player's total
    game.state.cookies -= this.cost;

    // Call the appropriate method based on the upgrade type
    if (typeof game[this.extra] === "function") {
      try {
        game[this.extra](this);
        console.log(`Successfully executed ${this.extra} method`);

        // If this is the timeAccelerator method, rebalance it
        if (this.extra === "timeAccelerator") {
          // Rebalance within the method instead of in the method definition
        }

        // If this is the goldenCookieChance upgrade, log the new chance
        if (this.extra === "increaseGoldenCookieChance") {
          console.log(
            `New golden cookie chance: ${game.state.goldenCookieChance}`
          );
        }
      } catch (e) {
        console.error(`Error executing method ${this.extra}:`, e);
      }
    } else {
      console.error(`Method ${this.extra} not found in game object`);
    }

    // Update the cost for next purchase
    this.cost = Math.floor(this.cost * this.multiplier);

    // Find the key of this upgrade in the shopUpgrades object
    let upgradeKey = "";
    for (const key in game.shopUpgrades) {
      if (game.shopUpgrades[key] === this) {
        upgradeKey = key;
        break;
      }
    }

    // Update the cost display in the UI using the upgrade key
    if (upgradeKey) {
      const upgradeElement = document.querySelector(
        `[data-upgrade="${upgradeKey}"] .item-cost span`
      );
      if (upgradeElement) {
        upgradeElement.textContent = this.cost;
      }
    }

    // Update game display
    game.updateDisplay();

    try {
      // Use direct import function if game.showToast fails
      if (typeof game.showToast === "function") {
        game.showToast(`${this.displayPrefix} purchased!`);
      } else {
        // Try to import it directly
        import("./utils.js")
          .then((utils) => {
            utils.showToast(`${this.displayPrefix} purchased!`);
          })
          .catch((e) => {
            console.error("Could not import showToast:", e);
          });
      }
    } catch (e) {
      console.error("Could not show toast notification:", e);
    }
  }
}
