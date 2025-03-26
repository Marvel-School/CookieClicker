import { UIComponent } from './UIComponent.js';

/**
 * Personalization Panel component for game appearance customization
 */
export class PersonalizationPanel extends UIComponent {
  /**
   * Initialize the PersonalizationPanel
   * @param {Game} game - Reference to the main game object
   * @param {HTMLElement} element - The personalization panel element
   */
  constructor(game, element) {
    super(game, element);
    
    // Find the close button
    this.closeButton = this.element.querySelector('#closePersonalization');
    
    // Initialize with hidden state
    this.hide();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Set up personalization options
    this.setupPersonalizationOptions();
    
    // Load saved settings
    this.loadPersonalizationSettings();
  }

  /**
   * Set up event listeners for the personalization panel
   */
  setupEventListeners() {
    // Close button
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => {
        this.hide();
      });
    }
    
    // Prevent panel closing when clicking inside
    this.element.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Close panel when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (this.isVisible && !this.element.contains(e.target)) {
        this.hide();
      }
    });
  }
  
  /**
   * Set up personalization options
   */
  setupPersonalizationOptions() {
    // Theme buttons
    const themes = ['classic', 'dark', 'neon'];
    themes.forEach(theme => {
      const button = document.getElementById(`theme-${theme}`);
      if (button) {
        button.addEventListener('click', () => {
          this.setTheme(theme);
          this.updateActiveButtons('theme', theme);
        });
      }
    });
    
    // Animation buttons
    const animations = ['standard', 'reduced', 'minimal'];
    animations.forEach(animation => {
      const button = document.getElementById(`animations-${animation}`);
      if (button) {
        button.addEventListener('click', () => {
          this.setAnimation(animation);
          this.updateActiveButtons('animation', animation);
        });
      }
    });
    
    // Particle intensity slider
    const intensitySlider = document.getElementById('particle-intensity');
    const intensityValue = document.getElementById('intensity-value');
    if (intensitySlider && intensityValue) {
      intensitySlider.addEventListener('input', () => {
        const value = intensitySlider.value;
        intensityValue.textContent = value;
        document.documentElement.style.setProperty('--particle-intensity', value);
        this.game.state.particleIntensity = value;
        this.savePersonalizationSettings();
      });
    }
  }
  
  /**
   * Set the active theme
   * @param {string} theme - The theme name to activate
   */
  setTheme(theme) {
    // Remove all theme classes
    document.body.classList.remove('theme-classic', 'theme-dark', 'theme-neon');
    document.documentElement.classList.remove('theme-classic', 'theme-dark', 'theme-neon');
    
    // Add selected theme class
    document.body.classList.add(`theme-${theme}`);
    document.documentElement.classList.add(`theme-${theme}`);
    
    // Store theme in game state
    this.game.state.theme = theme;
    
    // Save settings
    this.savePersonalizationSettings();
    
    // Show notification
    this.game.uiManager.showToast(`Theme changed to ${theme.charAt(0).toUpperCase() + theme.slice(1)}`, 'success');
  }
  
  /**
   * Set the animation level
   * @param {string} animation - The animation level to set
   */
  setAnimation(animation) {
    // Remove all animation classes
    document.body.classList.remove('animations-standard', 'animations-reduced', 'animations-minimal', 'animations-none');
    
    // Add selected animation class
    document.body.classList.add(`animations-${animation}`);
    
    // Store in game state
    this.game.state.animation = animation;
    
    // Save settings
    this.savePersonalizationSettings();
    
    // Show notification
    this.game.uiManager.showToast(`Animations set to ${animation.charAt(0).toUpperCase() + animation.slice(1)}`, 'success');
  }
  
  /**
   * Save personalization settings to local storage
   */
  savePersonalizationSettings() {
    const settings = {
      theme: this.game.state.theme || 'classic',
      animation: this.game.state.animation || 'standard',
      particleIntensity: this.game.state.particleIntensity || 1
    };
    
    localStorage.setItem('cookiePersonalization', JSON.stringify(settings));
  }
  
  /**
   * Load personalization settings from local storage
   */
  loadPersonalizationSettings() {
    try {
      const savedSettings = localStorage.getItem('cookiePersonalization');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // Apply theme
        if (settings.theme) {
          this.setTheme(settings.theme);
          this.updateActiveButtons('theme', settings.theme);
        }
        
        // Apply animation
        if (settings.animation) {
          this.setAnimation(settings.animation);
          this.updateActiveButtons('animation', settings.animation);
        }
        
        // Apply particle intensity
        if (settings.particleIntensity !== undefined) {
          const intensitySlider = document.getElementById('particle-intensity');
          const intensityValue = document.getElementById('intensity-value');
          if (intensitySlider && intensityValue) {
            intensitySlider.value = settings.particleIntensity;
            intensityValue.textContent = settings.particleIntensity;
            document.documentElement.style.setProperty('--particle-intensity', settings.particleIntensity);
            this.game.state.particleIntensity = settings.particleIntensity;
          }
        }
      }
    } catch (e) {
      console.error('Error loading personalization settings:', e);
    }
  }
  
  /**
   * Update active status of buttons
   * @param {string} type - The button type (theme or animation)
   * @param {string} active - The active button value
   */
  updateActiveButtons(type, active) {
    // Remove active class from all buttons of this type
    document.querySelectorAll(`.${type}-button`).forEach(button => {
      button.classList.remove('active');
    });
    
    // Add active class to the selected button
    const activeButton = document.getElementById(`${type}-${active}`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }
}
