import { UIComponent } from './UIComponent.js';

/**
 * Shop panel component that handles shop item display and interactions
 */
export class ShopPanel extends UIComponent {
  constructor(game, containerElement, toggleElement) {
    super(containerElement, toggleElement);
    this.game = game;
    this.setupShopItems();
  }
  
  setupShopItems() {
    const shopItems = this.container.querySelectorAll('.shop-item');
    
    shopItems.forEach((item, index) => {
      // Generate clean version of the item without any tooltips
      const cleanItem = this.createCleanShopItem(item);
      
      // Replace original item with clean version
      item.parentNode.replaceChild(cleanItem, item);
      
      // Add click handler to the entire shop item
      cleanItem.addEventListener('click', (e) => {
        e.stopPropagation();
        const upgradeKey = cleanItem.getAttribute("data-upgrade");
        
        if (upgradeKey && this.game.shopUpgrades[upgradeKey]) {
          this.game.purchaseShopUpgrade(upgradeKey);
        } else {
          console.error(`Shop upgrade not found: ${upgradeKey}`);
        }
      });
    });
  }
  
  /**
   * Creates a clean version of a shop item with all tooltip elements removed
   */
  createCleanShopItem(originalItem) {
    // Create a fresh item div
    const cleanItem = document.createElement('div');
    cleanItem.className = originalItem.className;
    cleanItem.setAttribute('data-upgrade', originalItem.getAttribute('data-upgrade'));
    
    // Copy data attributes
    Array.from(originalItem.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .forEach(attr => {
        cleanItem.setAttribute(attr.name, attr.value);
      });
    
    // Only copy essential content (image and cost), skip tooltip elements
    const image = originalItem.querySelector('img.shop-item-image');
    if (image) {
      const newImage = image.cloneNode(true);
      cleanItem.appendChild(newImage);
    }
    
    const itemName = originalItem.querySelector('.item-name');
    if (itemName) {
      const newName = itemName.cloneNode(true);
      cleanItem.appendChild(newName);
    }
    
    const itemCost = originalItem.querySelector('.item-cost');
    if (itemCost) {
      const newCost = itemCost.cloneNode(true);
      cleanItem.appendChild(newCost);
    }
    
    // Copy timer element if it exists (for time accelerator)
    const timer = originalItem.querySelector('.time-accelerator-timer');
    if (timer) {
      const newTimer = timer.cloneNode(true);
      cleanItem.appendChild(newTimer);
    }
    
    return cleanItem;
  }
  
  updatePrices() {
    // Update all shop item prices
    if (!this.game.shopUpgrades) return;
    
    Object.keys(this.game.shopUpgrades).forEach(key => {
      const costElement = this.container.querySelector(`[data-upgrade="${key}"] .item-cost span`);
      if (costElement && this.game.shopUpgrades[key]) {
        costElement.textContent = this.game.shopUpgrades[key].cost;
      }
    });
  }
}
