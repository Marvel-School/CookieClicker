import { Upgrade } from './Upgrade.js';

export class ClickMultiplierUpgrade extends Upgrade {
  constructor(cost, multiplier, displayPrefix, clickMultiplier = 1.5) {
    super(cost, multiplier, displayPrefix);
    this.clickMultiplier = clickMultiplier;
  }
  
  executePurchase(game) {
    game.state.clickPower = Math.floor(game.state.clickPower * this.clickMultiplier);
  }
}
