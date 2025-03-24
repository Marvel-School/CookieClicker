import { UIComponent } from './UIComponent.js';

/**
 * Personalization panel for theme and animation settings
 */
export class PersonalizationPanel extends UIComponent {
  constructor(game, containerElement, toggleElement) {
    super(containerElement, toggleElement);
    this.game = game;
    this.buttonsInitialized = false;
    this.toastDebounceTimer = null;
    
    // Ensure the container is properly hidden initially
    this.container.style.display = 'none';
    this.visible = false;
    
    this.setupPanel();
    
    // Add theme change listener
    document.addEventListener('themechange', (e) => {
      this.onThemeChange(e.detail.newTheme);
    });
    
    console.log('PersonalizationPanel initialized');
  }
  
  setupPanel() {
    // Add header content if missing
    if (this.container.querySelector('.panel-header').innerHTML.trim() === '') {
      this.container.querySelector('.panel-header').innerHTML = `
        <span class="panel-icon">🎨</span>
        <h2>Personalization</h2>
        <span class="close-btn" id="closePersonalization">×</span>
      `;
    }
    
    // Add panel content if missing
    if (this.container.querySelector('.panel-content').innerHTML.trim() === '') {
      this.container.querySelector('.panel-content').innerHTML = `
        <div class="section">
          <h3>Theme</h3>
          <div class="theme-options">
            <button id="theme-classic" class="theme-button">Classic</button>
            <button id="theme-dark" class="theme-button">Dark</button>
            <button id="theme-neon" class="theme-button">Neon</button>
          </div>
        </div>
        <div class="section">
          <h3>Animations</h3>
          <div class="animation-options">
            <button id="animations-standard" class="animation-button">Standard</button>
            <button id="animations-reduced" class="animation-button">Reduced</button>
            <button id="animations-minimal" class="animation-button">Minimal</button>
          </div>
        </div>
      `;
    }
    
    // Only set up buttons once
    if (!this.buttonsInitialized) {
      this.setupButtons();
      this.buttonsInitialized = true;
    } else {
      // Just update the active state if already initialized
      this.updateActiveButtonStates();
    }
    
    // Update close button handler
    const closeBtn = document.getElementById('closePersonalization');
    if (closeBtn) {
      // Remove any existing handlers
      const newCloseBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
      
      // Add new handler using the hide method
      newCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hide();
      });
    }
  }
  
  setupButtons() {
    // Theme buttons
    const themeButtons = {
      'classic': document.getElementById('theme-classic'),
      'dark': document.getElementById('theme-dark'),
      'neon': document.getElementById('theme-neon')
    };
    
    // Animation buttons
    const animationButtons = {
      'standard': document.getElementById('animations-standard'),
      'reduced': document.getElementById('animations-reduced'),
      'minimal': document.getElementById('animations-minimal')
    };
    
    // Close button
    const closeBtn = document.getElementById('closePersonalization');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    } else {
      // Try to find by selector if ID doesn't work
      const closeBtnByClass = this.container.querySelector('.close-btn');
      if (closeBtnByClass) {
        closeBtnByClass.addEventListener('click', () => this.hide());
      }
    }
    
    // Setup theme buttons
    for (const [theme, button] of Object.entries(themeButtons)) {
      if (button) {
        // Remove previous listeners by cloning and replacing
        const newButton = button.cloneNode(true);
        if (button.parentNode) {
          button.parentNode.replaceChild(newButton, button);
        }
        
        newButton.addEventListener('click', () => {
          this.updateTheme(theme);
          this.highlightActiveButton(themeButtons, theme);
        });
        
        // Update reference to point to the new button
        themeButtons[theme] = newButton;
      }
    }
    
    // Setup animation buttons
    for (const [animation, button] of Object.entries(animationButtons)) {
      if (button) {
        // Remove previous listeners by cloning and replacing
        const newButton = button.cloneNode(true);
        if (button.parentNode) {
          button.parentNode.replaceChild(newButton, button);
        }
        
        newButton.addEventListener('click', () => {
          this.updateAnimationLevel(animation);
          this.highlightActiveButton(animationButtons, animation);
        });
        
        // Update reference to point to the new button
        animationButtons[animation] = newButton;
      }
    }
    
    this.updateActiveButtonStates();
  }
  
  updateActiveButtonStates() {
    // Get current settings
    const currentTheme = this.game.state.personalization?.theme || 'classic';
    const currentAnimations = this.game.state.personalization?.animations || 'standard';
    
    // Theme buttons
    const themeButtons = {
      'classic': document.getElementById('theme-classic'),
      'dark': document.getElementById('theme-dark'),
      'neon': document.getElementById('theme-neon')
    };
    
    // Animation buttons
    const animationButtons = {
      'standard': document.getElementById('animations-standard'),
      'reduced': document.getElementById('animations-reduced'),
      'minimal': document.getElementById('animations-minimal')
    };
    
    // Set initial active states
    this.highlightActiveButton(themeButtons, currentTheme);
    this.highlightActiveButton(animationButtons, currentAnimations);
  }
  
  highlightActiveButton(buttons, activeId) {
    // Remove active class from all buttons
    Object.values(buttons).forEach(button => {
      if (button) button.classList.remove('active');
    });
    
    // Add active class to the selected button
    if (buttons[activeId]) {
      buttons[activeId].classList.add('active');
    }
  }
  
  // Debounced toast notification to prevent duplicates
  debouncedToast(message) {
    // Clear any pending toasts
    if (this.toastDebounceTimer) {
      clearTimeout(this.toastDebounceTimer);
    }
    
    this.toastDebounceTimer = setTimeout(() => {
      if (typeof this.game.showToast === 'function') {
        this.game.showToast(message);
      }
      this.toastDebounceTimer = null;
    }, 100);
  }
  
  updateTheme(themeId) {
    // Update theme in game state
    if (!this.game.state.personalization) {
      this.game.state.personalization = {};
    }
    
    // Call the game's personalization manager directly if available
    if (this.game.personalization && typeof this.game.personalization.setTheme === 'function') {
      this.game.personalization.setTheme(themeId);
      
      // Save settings silently (without notification)
      if (typeof this.game.saveGame === 'function') {
        // Use silentSave option if available, or pass true to saveGame
        if (typeof this.game.silentSave === 'function') {
          this.game.silentSave();
        } else {
          // Try with optional parameter for backward compatibility
          this.game.saveGame(true);
        }
      }
      return;
    }
    
    // Fallback to direct implementation
    this.game.state.personalization.theme = themeId;
    
    // Apply theme
    this.applyTheme(themeId);
    
    // Save settings silently
    if (typeof this.game.saveGame === 'function') {
      // Use silentSave option if available, or pass true to saveGame
      if (typeof this.game.silentSave === 'function') {
        this.game.silentSave();
      } else {
        // Try with optional parameter for backward compatibility
        this.game.saveGame(true);
      }
    }
  }
  
  updateAnimationLevel(level) {
    // Update animation level in game state
    if (!this.game.state.personalization) {
      this.game.state.personalization = {};
    }
    
    this.game.state.personalization.animations = level;
    
    // Set particle intensity based on animation level
    switch (level) {
      case 'reduced':
        this.game.state.personalization.particleIntensity = 0.5;
        break;
      case 'minimal':
        this.game.state.personalization.particleIntensity = 0.1;
        break;
      case 'standard':
      default:
        this.game.state.personalization.particleIntensity = 1.0;
        break;
    }
    
    // Apply settings
    this.applyAnimationLevel(level);
    
    // Save settings silently (without notification)
    if (typeof this.game.saveGame === 'function') {
      // Use silentSave option if available, or pass true to saveGame
      if (typeof this.game.silentSave === 'function') {
        this.game.silentSave();
      } else {
        // Try with optional parameter for backward compatibility
        this.game.saveGame(true);
      }
    }
    
    // Show feedback (using debounced method to prevent multiple notifications)
    this.debouncedToast(`${level.charAt(0).toUpperCase() + level.slice(1)} animations applied!`);
  }
  
  applyTheme(theme) {
    // Remove all existing theme classes first
    document.documentElement.className = document.documentElement.className
      .replace(/theme-\w+/g, '')
      .trim();
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .trim();
    
    // Add the appropriate theme class
    document.documentElement.classList.add(`theme-${theme}`);
    document.body.classList.add(`theme-${theme}`);
    
    // Reset any conflicting inline styles
    this.resetThemeInlineStyles();
    
    // Update background element directly for immediate visibility
    const background = document.querySelector('.background');
    if (background) {
      switch (theme) {
        case 'dark':
          background.style.background = 'radial-gradient(#111, #000)';
          break;
        case 'neon':
          background.style.background = 'radial-gradient(#111, #000)';
          break;
        case 'classic':
        default:
          background.style.background = 'radial-gradient(#333, #000)';
          break;
      }
    }
    
    // Force layout recalculation
    document.body.offsetHeight;
    
    // Immediately update personalization panel to match theme
    this.updatePanelForTheme(theme);
    
    // Show feedback (using debounced method to prevent multiple notifications)
    this.debouncedToast(`${theme.charAt(0).toUpperCase() + theme.slice(1)} theme applied!`);
    
    console.log(`Theme applied: ${theme}`);
  }
  
  // Helper function to reset inline styles that might interfere with theme
  resetThemeInlineStyles() {
    const elementsWithStyles = document.querySelectorAll('[style]');
    elementsWithStyles.forEach(el => {
      // Only for elements with style attribute
      if (el.style.length) {
        // Remove these specific properties that might conflict
        ['backgroundColor', 'background', 'color', 'borderColor', 'boxShadow'].forEach(prop => {
          el.style[prop] = '';
        });
      }
    });
  }
  
  // When theme changes externally
  onThemeChange(theme) {
    this.updatePanelForTheme(theme);
    this.updateActiveButtonStates();
  }
  
  // Update panel styling based on current theme
  updatePanelForTheme(theme) {
    if (!this.container) return;
    
    // Apply right styling immediately
    switch (theme) {
      case 'dark':
        this.container.style.background = 'rgba(35, 35, 40, 0.95)';
        this.container.style.color = 'white';
        this.container.style.borderColor = '#444';
        
        // Style headings and buttons
        this.container.querySelectorAll('.section h3').forEach(heading => {
          heading.style.color = 'white';
          heading.style.borderColor = '#444';
        });
        break;
        
      case 'neon':
        this.container.style.background = 'rgba(20, 20, 40, 0.9)';
        this.container.style.color = 'white';
        this.container.style.borderColor = 'var(--accent-color)';
        this.container.style.boxShadow = '0 0 15px var(--accent-color)';
        
        // Style headings and buttons
        this.container.querySelectorAll('.section h3').forEach(heading => {
          heading.style.color = 'white';
          heading.style.borderColor = 'var(--accent-color)';
        });
        break;
        
      default: // classic
        this.container.style.background = 'rgba(255, 255, 255, 0.95)';
        this.container.style.color = '#333';
        this.container.style.borderColor = 'rgba(210, 210, 210, 0.8)';
        
        // Style headings and buttons
        this.container.querySelectorAll('.section h3').forEach(heading => {
          heading.style.color = '#333';
          heading.style.borderColor = 'rgba(128, 128, 128, 0.3)';
        });
        break;
    }
    
    // Immediately update button styling
    this.updateThemeButtonStyles(theme);
  }
  
  updateThemeButtonStyles(theme) {
    // Theme buttons
    const themeButtons = {
      'classic': document.getElementById('theme-classic'),
      'dark': document.getElementById('theme-dark'),
      'neon': document.getElementById('theme-neon')
    };
    
    // Animation buttons
    const animationButtons = {
      'standard': document.getElementById('animations-standard'),
      'reduced': document.getElementById('animations-reduced'),
      'minimal': document.getElementById('animations-minimal')
    };
    
    // Update theme button styles
    if (theme === 'dark') {
      Object.values(themeButtons).forEach(button => {
        if (button) {
          button.style.background = 'linear-gradient(145deg, #555, #444)';
          button.style.color = 'white';
        }
      });
      
      // Style active theme button
      if (themeButtons[theme]) {
        themeButtons[theme].style.background = 'linear-gradient(145deg, #8e44ad, #9b59b6)';
        themeButtons[theme].style.border = '1px solid white';
      }
      
      // Update animation buttons
      Object.values(animationButtons).forEach(button => {
        if (button) {
          button.style.background = 'linear-gradient(145deg, #555, #444)';
          button.style.color = 'white';
        }
      });
      
      // Style active animation button
      const currentAnimation = this.game.state.personalization?.animations || 'standard';
      if (animationButtons[currentAnimation]) {
        animationButtons[currentAnimation].style.background = 'linear-gradient(145deg, #8e44ad, #9b59b6)';
        animationButtons[currentAnimation].style.border = '1px solid white';
      }
      
    } else if (theme === 'neon') {
      Object.values(themeButtons).forEach(button => {
        if (button) {
          button.style.background = 'linear-gradient(145deg, var(--primary-color), var(--secondary-color))';
          button.style.color = 'white';
          button.style.textShadow = '0 0 5px white';
        }
      });
      
      // Style active theme button
      if (themeButtons[theme]) {
        themeButtons[theme].style.boxShadow = '0 0 10px var(--accent-color)';
        themeButtons[theme].style.border = '1px solid var(--accent-color)';
      }
      
      // Update animation buttons
      Object.values(animationButtons).forEach(button => {
        if (button) {
          button.style.background = 'linear-gradient(145deg, var(--primary-color), var(--secondary-color))';
          button.style.color = 'white';
          button.style.textShadow = '0 0 5px white';
        }
      });
      
      // Style active animation button
      const currentAnimation = this.game.state.personalization?.animations || 'standard';
      if (animationButtons[currentAnimation]) {
        animationButtons[currentAnimation].style.boxShadow = '0 0 10px var(--accent-color)';
        animationButtons[currentAnimation].style.border = '1px solid var(--accent-color)';
      }
      
    } else { // classic or default
      Object.values(themeButtons).forEach(button => {
        if (button) {
          button.style.background = '';
          button.style.color = '';
          button.style.textShadow = '';
          button.style.border = '';
        }
      });
      
      // Update animation buttons
      Object.values(animationButtons).forEach(button => {
        if (button) {
          button.style.background = '';
          button.style.color = '';
          button.style.textShadow = '';
          button.style.border = '';
        }
      });
    }
    
    this.updateActiveButtonStates();
  }
  
  applyAnimationLevel(level) {
    const root = document.documentElement;
    const body = document.body;
    const intensity = this.game.state.personalization?.particleIntensity || 1.0;
    
    // Set particle intensity CSS variable
    root.style.setProperty('--particle-intensity', intensity);
    
    // Remove all animation classes from body (not just root)
    root.classList.remove('animations-standard', 'animations-reduced', 'animations-minimal', 'animations-none');
    body.classList.remove('animations-standard', 'animations-reduced', 'animations-minimal', 'animations-none');
    
    // Add the appropriate animation class to both root and body
    root.classList.add(`animations-${level}`);
    body.classList.add(`animations-${level}`);
    
    // Create a demonstration effect to show the animation level change
    this.showAnimationDemo(level);
    
    console.log(`Animation level applied: ${level} (intensity: ${intensity})`);
  }
  
  // Create a demonstration of the animation intensity
  showAnimationDemo(level) {
    // Create a demo effect at the center of the screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // First, clean up any existing demos
    document.querySelectorAll('.animation-demo-effect').forEach(el => el.remove());
    
    // Create multiple demo particles based on the level
    const container = document.createElement('div');
    container.className = 'animation-demo-effect';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    
    // Number of particles based on animation level
    let particleCount = 0;
    switch (level) {
      case 'standard': particleCount = 30; break;
      case 'reduced': particleCount = 15; break;
      case 'minimal': particleCount = 5; break;
      default: particleCount = 0;
    }
    
    // Create and animate particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.width = '10px';
      particle.style.height = '10px';
      particle.style.borderRadius = '50%';
      particle.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
      particle.style.top = `${centerY}px`;
      particle.style.left = `${centerX}px`;
      container.appendChild(particle);
      
      // Animate the particle
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      const distance = 100 + Math.random() * 200;
      
      // Use CSS animation for better performance
      particle.animate([
        { transform: 'scale(0.5) translate(0, 0)', opacity: 1 },
        { transform: `scale(1.5) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`, opacity: 0 }
      ], {
        duration: 1000 + Math.random() * 1000,
        easing: 'cubic-bezier(0.1, 0.7, 1.0, 0.1)',
      });
    }
    
    // Remove the demo after it's done
    setTimeout(() => {
      container.remove();
    }, 2000);
  }

  // Override show to ensure buttons are properly highlighted
  show() {
    if (this.container && !this.visible) {
      console.log('PersonalizationPanel show() called');
      
      // Setup panel content if needed
      if (!this.buttonsInitialized) {
        this.setupButtons();
        this.buttonsInitialized = true;
      } else {
        this.updateActiveButtonStates();
      }
      
      // Now make panel visible
      this.container.style.display = "block";
      this.visible = true;
      this.onShow();
      
      // Force reflow to ensure styles are applied
      this.container.offsetHeight;
    }
  }
}
