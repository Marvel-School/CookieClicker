export class Upgrade {
  constructor(cost, multiplier, displayPrefix, extra = null) {
    this.cost = cost;
    this.multiplier = multiplier;
    this.displayPrefix = displayPrefix;
    this.extra = extra;
  }

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

  executePurchase(game) {
  }
}

export class ClickMultiplierUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix) {
    super(cost, multiplier, displayPrefix);
  }

  executePurchase(game) {
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
      const randomFactor = 0.8 + Math.random() * 0.6;
      bonus = Math.floor(cappedBonus * randomFactor);
    }

    game.state.cookies += bonus;

    if (typeof game.showFloatingNumber === "function") {
      game.showFloatingNumber(bonus, true);

      if (effectMessage) {
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

    game.state.luckyStreak = (game.state.luckyStreak || 0) + 1;
  }
}

export class ShopUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, extra = null, baseCost) {
    super(cost, multiplier, displayPrefix, extra);
    this.baseCost = baseCost;
    this.key = "";
  }

  purchase(game) {
    if (isNaN(game.state.cookies)) {
      console.error("Cookie count is NaN, fixing...");
      game.state.cookies = 0;
    }

    if (!this.canPurchase(game)) {
      console.log(
        `Not enough cookies for ${this.displayPrefix}. Cost: ${this.cost}, have: ${game.state.cookies}`
      );

      try {
        if (typeof game.showToast === "function") {
          game.showToast(`Not enough cookies for ${this.displayPrefix}`);
        } else {
          const { showToast } = require("./utils.js");
          showToast(`Not enough cookies for ${this.displayPrefix}`);
        }
      } catch (e) {
        console.error("Could not show toast notification:", e);
        alert(`Not enough cookies for ${this.displayPrefix}`);
      }
      return;
    }

    game.state.cookies -= this.cost;

    if (typeof game[this.extra] === "function") {
      try {
        game[this.extra](this);
        console.log(`Successfully executed ${this.extra} method`);

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

    this.cost = Math.floor(this.cost * this.multiplier);

    let upgradeKey = "";
    for (const key in game.shopUpgrades) {
      if (game.shopUpgrades[key] === this) {
        upgradeKey = key;
        break;
      }
    }

    if (upgradeKey) {
      const upgradeElement = document.querySelector(
        `[data-upgrade="${upgradeKey}"] .item-cost span`
      );
      if (upgradeElement) {
        upgradeElement.textContent = this.cost;
      }
    }

    game.updateDisplay();

    try {
      if (typeof game.showToast === "function") {
        game.showToast(`${this.displayPrefix} purchased!`);
      } else {
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

