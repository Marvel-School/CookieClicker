import { UIComponent } from './UIComponent.js';

/**
 * Settings Panel component for game settings
 */
export class SettingsPanel extends UIComponent {
  /**
   * Initialize the Settings Panel
   * @param {Game} game - Reference to the main game object
   * @param {HTMLElement} element - The settings panel element
   * @param {HTMLElement} toggleButton - Button that toggles the panel
   */
  constructor(game, element, toggleButton) {
    super(game, element);
    this.toggleButton = toggleButton;
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for the settings panel
   */
  setupEventListeners() {
    // Toggle panel when settings icon is clicked
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent closing when clicking the icon
        this.toggle();
      });
    }
    
    // Prevent panel closing when clicking inside
    if (this.element) {
      this.element.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
    
    // Close panel when clicking elsewhere
    document.addEventListener('click', () => {
      if (this.isVisible) {
        this.hide();
      }
    });
    
    // Set up action buttons
    this.setupActionButtons();
  }

  /**
   * Set up handlers for setting action buttons
   */
  setupActionButtons() {
    // Save game button
    const saveButton = document.getElementById('saveGame');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        this.game.saveGame();
      });
    }
    
    // Load game button
    const loadButton = document.getElementById('loadGame');
    if (loadButton) {
      loadButton.addEventListener('click', () => {
        this.game.loadGame();
      });
    }
    
    // Reset game button
    const resetButton = document.getElementById('resetGame');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        this.game.resetGame();
      });
    }
    
    // Toggle sound button
    const soundButton = document.getElementById('toggleSound');
    if (soundButton) {
      soundButton.addEventListener('click', () => {
        this.game.soundOn = !this.game.soundOn;
        this.game.showToast(`Sound is now ${this.game.soundOn ? 'ON' : 'OFF'}.`);
      });
    }
    
    // Personalization button
    const personalizationButton = document.getElementById('personalizationBtn');
    const personalizationContainer = document.getElementById('personalizationContainer');
    if (personalizationButton && personalizationContainer) {
      personalizationButton.addEventListener('click', () => {
        personalizationContainer.style.display = 'block';
        this.hide(); // Hide settings panel
      });
      
      // Close button for personalization panel
      const closePersonalization = document.getElementById('closePersonalization');
      if (closePersonalization) {
        closePersonalization.addEventListener('click', () => {
          personalizationContainer.style.display = 'none';
        });
      }
      
      // Setup theme buttons
      this.setupPersonalizationOptions();
    }
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
    
    // Load saved settings
    this.loadPersonalizationSettings();
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
    
    // Save to game state
    this.game.state.theme = theme;
    
    // Save to local storage
    this.savePersonalizationSettings();
    
    // Show notification
    this.game.showToast(`Theme changed to ${theme}`, 'success');
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
    
    // Save to game state
    this.game.state.animation = animation;
    
    // Save to local storage
    this.savePersonalizationSettings();
    
    // Show notification
    this.game.showToast(`Animations set to ${animation}`, 'success');
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
