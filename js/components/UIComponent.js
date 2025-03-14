/**
 * Base class for UI panels like shop, achievements, settings
 * Handles common functionality like toggling visibility and click handling
 */
export class UIComponent {
  constructor(containerElement, toggleElement) {
    this.container = containerElement;
    this.toggleElement = toggleElement;
    this.visible = false;
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    if (this.toggleElement && this.container) {
      // Toggle visibility on toggle element click
      this.toggleElement.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggle();
      });
      
      // Prevent clicks inside from closing
      this.container.addEventListener("click", (e) => {
        e.stopPropagation();
      });
      
      // Close when clicking elsewhere
      document.addEventListener("click", () => {
        if (this.visible) this.hide();
      });
    }
  }
  
  show() {
    if (this.container) {
      this.container.style.display = "block";
      this.visible = true;
      this.onShow();
    }
  }
  
  hide() {
    if (this.container) {
      this.container.style.display = "none";
      this.visible = false;
      this.onHide();
    }
  }
  
  toggle() {
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
