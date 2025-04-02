import { UIComponent } from './UIComponent.js';

export class PersonalizationPanel extends UIComponent {
  constructor(game, containerElement, toggleElement) {
    super(game, containerElement, toggleElement);
    
    // Initialize after parent constructor is complete
    this.initialize();
  }

  initialize() {
    if (!this.element) {
      console.error('Personalization panel container not found');
      return;
    }
    
    super.initialize();
    
    // Setup close button
    const closeBtn = this.element.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hide();
      });
    }
    
    // Setup theme buttons
    const themeButtons = this.element.querySelectorAll('.theme-button');
    themeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const theme = button.id.replace('theme-', '');
        if (this.game.personalizationManager) {
          // Update active button state
          themeButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          
          this.game.personalizationManager.setTheme(theme);
        }
      });
    });
    
    // Setup animation buttons
    const animButtons = this.element.querySelectorAll('.animation-button');
    animButtons.forEach(button => {
      button.addEventListener('click', () => {
        const animations = button.id.replace('animations-', '');
        if (this.game.personalizationManager) {
          // Update active button state
          animButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          
          this.game.personalizationManager.setAnimations(animations);
        }
      });
    });
    
    // Setup particle intensity slider
    const intensitySlider = this.element.querySelector('#particle-intensity');
    const intensityValue = this.element.querySelector('#intensity-value');
    
    if (intensitySlider && intensityValue) {
      intensitySlider.addEventListener('input', () => {
        const value = intensitySlider.value;
        intensityValue.textContent = value;
        if (this.game.personalizationManager) {
          this.game.personalizationManager.setParticleIntensity(parseFloat(value));
        }
      });
    }
    
    // Mark current settings as active on open
    this.element.addEventListener('show', () => this.updateActiveSettings());
    
    // Initialize active settings
    this.updateActiveSettings();
  }
  
  // New method to update active states based on current settings
  updateActiveSettings() {
    if (!this.game.personalizationManager || !this.game.state.personalization) return;
    
    // Set active theme
    const currentTheme = this.game.state.personalization.theme;
    const themeButtons = this.element.querySelectorAll('.theme-button');
    themeButtons.forEach(button => {
      const theme = button.id.replace('theme-', '');
      button.classList.toggle('active', theme === currentTheme);
    });
    
    // Set active animation level
    const currentAnimations = this.game.state.personalization.animations;
    const animButtons = this.element.querySelectorAll('.animation-button');
    animButtons.forEach(button => {
      const animations = button.id.replace('animations-', '');
      button.classList.toggle('active', animations === currentAnimations);
    });
    
    // Set particle intensity slider
    const intensitySlider = this.element.querySelector('#particle-intensity');
    const intensityValue = this.element.querySelector('#intensity-value');
    if (intensitySlider && intensityValue) {
      const currentIntensity = this.game.state.personalization.particleIntensity;
      intensitySlider.value = currentIntensity;
      intensityValue.textContent = currentIntensity;
    }
  }
  
  show() {
    super.show();
    this.updateActiveSettings();
    
    // Dispatch a custom event that we can listen to
    const event = new Event('show');
    this.element.dispatchEvent(event);
  }
}
