// Base class for UI components
export class UIComponent {
  constructor(game, element, toggleElement) {
    this.game = game;
    
    // Convert string IDs to DOM elements if needed
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (typeof toggleElement === 'string') {
      toggleElement = document.getElementById(toggleElement);
    }
    
    this.element = element;
    this.toggleElement = toggleElement;
    
    // Log component creation for debugging
    console.log(`UIComponent created with element: ${element?.id || 'unknown'} and toggle: ${toggleElement?.id || 'unknown'}`);
    
    // Don't auto-initialize - let derived classes handle it
  }
  
  initialize() {
    if (!this.element) {
      console.error(`UI Component Error: Element not found`);
      return false;
    }
    
    // We won't set up toggle functionality here - direct handlers in main.js will handle this
    console.log(`UIComponent ${this.element.id} initialized (not setting up toggle handlers)`);
    
    return true;
  }
  
  show() {
    if (this.element) {
      console.log(`Showing ${this.element.id}`);
      this.element.style.display = 'block';
    }
  }
  
  hide() {
    if (this.element) {
      console.log(`Hiding ${this.element.id}`);
      this.element.style.display = 'none';
    }
  }
  
  toggle() {
    if (!this.element) return;
    
    const currentDisplay = this.element.style.display;
    if (currentDisplay === 'block') {
      this.hide();
    } else {
      this.show();
    }
    console.log(`Toggled ${this.element.id} to ${this.element.style.display}`);
  }
  
  // Additional helper function to detect if visible
  isVisible() {
    return this.element && this.element.style.display === 'block';
  }
}
