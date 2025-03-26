// Base class for UI components
export class UIComponent {
  /**
   * Create a new UI component
   * @param {Object} game - The game instance
   * @param {HTMLElement} element - The DOM element for this component
   */
  constructor(game, element) {
    this.game = game;
    this.element = element;
    this.visible = false;
    this.initialized = false;
    
    // Initialize if element exists
    if (this.element) {
      this.initialize();
    }
  }
  
  /**
   * Initialize the component
   */
  initialize() {
    if (this.initialized) return;
    this.initialized = true;
    
    // Add click outside listener to document
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }
  
  /**
   * Handle document click to close panel when clicking outside
   * @param {Event} event - Click event
   */
  handleDocumentClick(event) {
    if (!this.visible) return;
    
    // Check if click is outside the component
    if (this.element && !this.element.contains(event.target)) {
      // Don't close if clicking a toggle button
      if (this.toggleButton && this.toggleButton.contains(event.target)) {
        return;
      }
      
      this.hide();
    }
  }
  
  /**
   * Add a toggle button to show/hide the component
   * @param {HTMLElement} button - The button element
   */
  setToggleButton(button) {
    this.toggleButton = button;
    
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent document click
        this.toggle();
      });
    }
  }
  
  /**
   * Show the component
   */
  show() {
    if (this.element) {
      this.element.style.display = 'block';
      this.visible = true;
      
      // Add active class to toggle button if exists
      if (this.toggleButton) {
        this.toggleButton.classList.add('active');
      }
      
      this.onShow();
    }
  }
  
  /**
   * Hide the component
   */
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
      this.visible = false;
      
      // Remove active class from toggle button if exists
      if (this.toggleButton) {
        this.toggleButton.classList.remove('active');
      }
      
      this.onHide();
    }
  }
  
  /**
   * Toggle component visibility
   */
  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  /**
   * Called when component is shown
   * Override in child classes
   */
  onShow() {
    // Override in child classes
  }
  
  /**
   * Called when component is hidden
   * Override in child classes
   */
  onHide() {
    // Override in child classes
  }
  
  /**
   * Update the component
   * Override in child classes
   */
  update() {
    // Override in child classes
  }
}
