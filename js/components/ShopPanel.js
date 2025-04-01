import { UIComponent } from './UIComponent.js';

export class ShopPanel extends UIComponent {
  /**
   * Create a new ShopPanel
   * @param {Object} game - Game instance 
   * @param {HTMLElement} element - Panel container element
   * @param {HTMLElement} toggleButton - Button to toggle panel visibility
   */
  constructor(game, element, toggleButton) {
    super(game, element);
    this.setToggleButton(toggleButton);
    this.initialize();
  }
  
  /**
   * Initialize panel and event handlers
   */
  initialize() {
    if (this.initialized) return;
    super.initialize();
    
    // Add event listeners to shop items
    if (this.element) {
      this.element.querySelectorAll('.shop-item').forEach(item => {
        const upgradeKey = item.getAttribute('data-upgrade');
        if (!upgradeKey) return;
        
        // Add click handler to the image
        const itemImage = item.querySelector('img.shop-item-image');
        if (itemImage) {
          itemImage.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent bubbling
            if (this.game.shopUpgrades[upgradeKey]) {
              this.game.purchaseShopUpgrade(upgradeKey);
            }
          });
        }
        
        // Remove any existing tooltips to prevent issues
        const tooltip = item.querySelector('.item-desc');
        if (tooltip) {
          // Store tooltip content
          const originalContent = tooltip.innerHTML;
          
          // Add mouse events for tooltip display
          item.addEventListener('mouseenter', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            
            // Remove any existing tooltips
            document.querySelectorAll('.item-desc-tooltip').forEach(t => t.remove());
            
            // Create new tooltip with proper positioning
            this.createTooltip(item, originalContent);
          });
          
          item.addEventListener('mouseleave', () => {
            // Clean up any tooltips when mouse leaves
            document.querySelectorAll('.item-desc-tooltip').forEach(t => t.remove());
          });
        }
      });
    }
  }
  
  /**
   * Create a properly positioned tooltip
   * @param {HTMLElement} item - The shop item element
   * @param {string} content - Tooltip content HTML
   */
  createTooltip(item, content) {
    // Create fresh tooltip element with special class for identification
    const newTooltip = document.createElement('div');
    newTooltip.className = 'item-desc item-desc-tooltip';
    newTooltip.innerHTML = `<div class="text-container">${content}</div>`;
    document.body.appendChild(newTooltip);
    
    // Get positioning information
    const rect = item.getBoundingClientRect();
    const tooltipHeight = newTooltip.offsetHeight || 120;
    const tooltipWidth = newTooltip.offsetWidth || 220;
    const minPadding = 10;
    
    // Check if tooltip would be cut off at top
    const positionAbove = rect.top - tooltipHeight - 15;
    if (positionAbove < minPadding) {
      // Position below instead
      newTooltip.style.top = (rect.bottom + 15) + 'px';
      newTooltip.classList.add('position-below');
    } else {
      // Position above (standard)
      newTooltip.style.top = positionAbove + 'px';
    }
    
    // Handle horizontal positioning
    let leftPos = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    if (leftPos < minPadding) {
      leftPos = minPadding;
    } else if (leftPos + tooltipWidth > window.innerWidth - minPadding) {
      leftPos = window.innerWidth - tooltipWidth - minPadding;
    }
    newTooltip.style.left = leftPos + 'px';
    
    // Ensure visibility
    newTooltip.style.zIndex = '100000';
  }
  
  /**
   * Update shop item prices and availability
   */
  updatePrices() {
    if (!this.element) return;
    
    const cookies = this.game.state.cookies;
    
    // Update each shop item
    this.element.querySelectorAll('.shop-item').forEach(item => {
      const upgradeKey = item.getAttribute('data-upgrade');
      if (!upgradeKey || !this.game.shopUpgrades[upgradeKey]) return;
      
      const upgrade = this.game.shopUpgrades[upgradeKey];
      const costSpan = item.querySelector('.item-cost span');
      
      if (costSpan) {
        costSpan.textContent = this.formatNumber(upgrade.cost);
      }
      
      // Update visual state based on affordability
      if (cookies >= upgrade.cost) {
        item.classList.add('can-afford');
        item.classList.remove('cannot-afford');
      } else {
        item.classList.remove('can-afford');
        item.classList.add('cannot-afford');
      }
    });
    
    // Update time accelerator timer if active
    this.updateTimeAcceleratorStatus();
  }
  
  /**
   * Update time accelerator status display
   */
  updateTimeAcceleratorStatus() {
    const itemEl = this.element.querySelector('[data-upgrade="timeAccelerator"]');
    if (!itemEl) return;
    
    const timerSpan = itemEl.querySelector('.time-accelerator-timer');
    if (!timerSpan) return;
    
    if (this.game.state.timeAcceleratorActive && this.game.state.timeAcceleratorEndTime) {
      // Make active
      itemEl.classList.add('active');
      
      // Update timer text
      const secondsLeft = Math.floor((this.game.state.timeAcceleratorEndTime - Date.now()) / 1000);
      if (secondsLeft > 0) {
        timerSpan.textContent = `⚡ 4x ACTIVE: ${secondsLeft}s ⚡`;
      } else {
        timerSpan.textContent = '';
      }
    } else {
      // Not active
      itemEl.classList.remove('active');
      timerSpan.textContent = '';
    }
  }
  
  /**
   * Format large numbers with suffix
   * @param {number} num - Number to format
   * @returns {string} Formatted number
   */
  formatNumber(num) {
    if (num < 1000) return Math.floor(num);
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
    return `${(num / 1000000000).toFixed(1)}B`;
  }
  
  /**
   * Called when panel is shown
   */
  onShow() {
    // Update prices when panel is shown
    this.updatePrices();
  }
}
