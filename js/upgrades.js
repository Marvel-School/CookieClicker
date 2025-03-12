// Contains all upgrade-related classes

export class Upgrade {
  constructor(cost, multiplier, displayPrefix, extra = null) {
    this.cost = cost;
    this.multiplier = multiplier;
    this.displayPrefix = displayPrefix;
    this.extra = extra;
  }
  
  getDisplayText() {
    return `${this.displayPrefix} (Cost: ${this.cost})`;
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
    game.state.clickPower *= 2;
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
    super(cost, multiplier, displayPrefix);
  }
  
  executePurchase(game) {
    const bonus = Math.floor(Math.random() * 10) + 1;
    game.state.cookies += bonus;
    game.showFloatingNumber(bonus, true);
  }
}

export class ShopUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, extra = null, baseCost) {
    super(cost, multiplier, displayPrefix, extra);
    this.baseCost = baseCost;
  }
  
  // Override purchase entirely (different cost update)
  purchase(game) {
    if (!this.canPurchase(game)) {
      game.log(
        `Not enough cookies for ${this.extra}. Cost: ${this.cost}, have: ${game.state.cookies}`
      );
      game.showToast(`Not enough cookies for ${this.extra}`);
      return;
    }
    game.state.cookies -= this.cost;
    if (this.extra === "timeAccelerator") {
      game.activateTimeAccelerator(this);
    }
    this.cost = Math.floor(this.cost * this.multiplier);
    const costSpan = document.querySelector(
      `[data-upgrade="timeAccelerator"] .item-cost span`
    );
    if (costSpan) costSpan.textContent = this.cost;
    game.updateDisplay();
    game.showToast(`${this.extra} purchased!`);
  }
}
