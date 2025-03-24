/**
 * Base class for UI panels like shop, achievements, settings
 * Handles common functionality like toggling visibility and click handling
 */
export class UIComponent {
  constructor(containerElement, toggleElement) {
    this.container = containerElement;
    this.toggleElement = toggleElement;
    
    // Initialize visible state based on actual DOM state
    if (this.container) {
      // Check actual display state instead of assuming it's hidden
      const computedStyle = window.getComputedStyle(this.container);
      this.visible = computedStyle.display !== 'none';
      
      // Ensure DOM matches our initial state for consistency
      this.container.style.display = this.visible ? 'block' : 'none';
    } else {
      this.visible = false;
    }
    
    this.setupEventListeners();
    
    // Debug log for initialization
    console.log(`UIComponent initialized: ${this.constructor.name}, visible: ${this.visible}`);
  }
  
  setupEventListeners() {
    if (this.toggleElement && this.container) {
      // Remove any existing click handlers to prevent duplicates
      const newToggle = this.toggleElement.cloneNode(true);
      if (this.toggleElement.parentNode) {
        this.toggleElement.parentNode.replaceChild(newToggle, this.toggleElement);
      }
      this.toggleElement = newToggle;
      
      // Toggle visibility on toggle element click
      this.toggleElement.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault(); // Prevent any default behavior
        this.toggle();
        console.log(`${this.constructor.name} toggled, now ${this.visible ? 'visible' : 'hidden'}`);
      });
      
      // Prevent clicks inside from closing
      this.container.addEventListener("click", (e) => {
        e.stopPropagation();
      });
      
      // Close when clicking elsewhere (using capture phase for earlier interception)
      document.addEventListener("click", () => {
        if (this.visible) {
          this.hide();
          console.log(`${this.constructor.name} hidden by document click`);
        }
      }, true);
    }
  }
  
  show() {
    if (this.container && !this.visible) {
      // Set display before updating state
      this.container.style.display = "block";
      this.visible = true;
      this.onShow();
      console.log(`${this.constructor.name} shown`);
    }
  }
  
  hide() {
    if (this.container && this.visible) {
      // Set display before updating state
      this.container.style.display = "none";
      this.visible = false;
      this.onHide();
      console.log(`${this.constructor.name} hidden`);
    }
  }
  
  toggle() {
    // Log before state changes
    console.log(`${this.constructor.name} toggling from ${this.visible ? 'visible' : 'hidden'}`);
    
    // Simple toggle based on current state
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  // Hook methods for derived classes to override
  onShow() {}
  onHide() {}
}
