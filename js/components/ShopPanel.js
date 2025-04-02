import { UIComponent } from './UIComponent.js';

export class ShopPanel extends UIComponent {
  constructor(game, containerElement, toggleElement) {
    super(game, containerElement, toggleElement);
    
    // Custom properties
    this.items = [];
    
    // Initialize after parent constructor is complete
    this.initialize();
  }

  initialize() {
    // Make sure the element exists before trying to use it
    if (!this.element) {
      console.error('Shop panel container not found');
      return;
    }
    
    super.initialize();
    
    try {
      // Get all shop items
      const itemElements = this.element.querySelectorAll('.shop-item');
      
      // Setup each shop item
      itemElements.forEach(item => {
        const upgradeKey = item.dataset.upgrade;
        if (!upgradeKey) return;
        
        // Store references to shop items
        this.items.push({
          element: item,
          key: upgradeKey
        });
        
        // Make the whole item clickable
        item.style.cursor = 'pointer';
        
        // Add click event
        item.addEventListener('click', () => {
          this.game.purchaseShopUpgrade(upgradeKey);
        });
        
        // Add hover sound effect
        item.addEventListener('mouseover', () => {
          this.game.playHoverSound();
        });
      });
      
      console.log(`Shop panel initialized with ${this.items.length} items`);
    } catch (error) {
      console.error('Error initializing shop panel:', error);
    }
  }
  
  updatePrices() {
    try {
      this.items.forEach(item => {
        const costElement = item.element.querySelector('.item-cost span');
        const shopUpgrade = this.game.shopUpgrades[item.key];
        
        if (costElement && shopUpgrade) {
          costElement.textContent = this.game.uiManager.formatNumber(shopUpgrade.cost);
        }
      });
    } catch (error) {
      console.error('Error updating shop prices:', error);
    }
  }
}
