import { UIComponent } from './UIComponent.js';

export class SettingsPanel extends UIComponent {
  constructor(game, containerElement, toggleElement) {
    super(game, containerElement, toggleElement);
    
    // Initialize after parent constructor is complete
    this.initialize();
  }

  initialize() {
    if (!this.element) {
      console.error('Settings panel container not found');
      return;
    }
    
    // Call parent but don't let it set up toggle handlers
    super.initialize();
    
    // Setup button actions without setting up toggle functionality
    this.setupButtons();
    
    console.log('Settings panel initialized (buttons only, not toggle)');
  }
  
  // Keep the button setup but don't add handlers for the toggle element
  setupButtons() {
    try {
      // Log what we're finding
      console.log('Setting up settings panel buttons', {
        saveButton: this.element.querySelector('#saveGame')?.id || 'not found',
        loadButton: this.element.querySelector('#loadGame')?.id || 'not found',
        resetButton: this.element.querySelector('#resetGame')?.id || 'not found',
        soundButton: this.element.querySelector('#toggleSound')?.id || 'not found'
      });
      
      // We'll leave the button setup to direct handlers in main.js
    } catch (error) {
      console.error('Error setting up settings panel buttons:', error);
    }
  }
  
  // Override toggle method for better debugging
  toggle() {
    console.log('Toggle called on settings panel');
    if (this.element) {
      const newDisplay = this.element.style.display === 'block' ? 'none' : 'block';
      console.log(`Setting settings menu display to: ${newDisplay}`);
      this.element.style.display = newDisplay;
    }
  }
}
