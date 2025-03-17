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
      // Rebuild shop items to ensure no duplicate event listeners
      const clone = item.cloneNode(true);
      item.parentNode.replaceChild(clone, item);
      
      // Add click handler to the entire shop item
      clone.addEventListener('click', (e) => {
        e.stopPropagation();
        const upgradeKey = clone.getAttribute("data-upgrade");
        
        if (upgradeKey && this.game.shopUpgrades[upgradeKey]) {
          this.game.purchaseShopUpgrade(upgradeKey);
        } else {
          console.error(`Shop upgrade not found: ${upgradeKey}`);
        }
      });
      
      // Set up tooltips using a single implementation
      this.setupTooltip(clone);
    });
  }
  
  setupTooltip(item) {
    // DISABLE TOOLTIP FUNCTIONALITY
    // Function is empty to prevent tooltips from being created
    return;
    
    /* Original tooltip code removed
    const tooltip = item.querySelector('.item-desc');
    if (!tooltip) return;
    
    // Store tooltip content
    const originalContent = tooltip.innerHTML;
    
    // Add mouse events
    item.addEventListener('mouseenter', (e) => {
      e.stopPropagation();
      
      // Remove existing tooltips
      document.querySelectorAll('.item-desc-tooltip').forEach(t => t.remove());
      
      // Create fresh tooltip
      const newTooltip = document.createElement('div');
      newTooltip.className = 'item-desc item-desc-tooltip';
      newTooltip.innerHTML = originalContent;
      document.body.appendChild(newTooltip);
      
      // Position tooltip
      const rect = item.getBoundingClientRect();
      const tooltipHeight = newTooltip.offsetHeight || 120;
      const tooltipWidth = newTooltip.offsetWidth || 220;
      
      // Handle vertical positioning
      if (rect.top - tooltipHeight - 15 < 10) {
        // Show below if not enough room above
        newTooltip.style.top = (rect.bottom + 15) + 'px';
      } else {
        // Show above (default)
        newTooltip.style.top = (rect.top - tooltipHeight - 15) + 'px';
      }
      
      // Handle horizontal positioning
      let leftPos = rect.left + (rect.width / 2) - (tooltipWidth / 2);
      leftPos = Math.max(10, Math.min(leftPos, window.innerWidth - tooltipWidth - 10));
      newTooltip.style.left = leftPos + 'px';
      
      newTooltip.style.zIndex = '999999';
    });
    
    item.addEventListener('mouseleave', () => {
      document.querySelectorAll('.item-desc-tooltip').forEach(t => t.remove());
    });
    */
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
