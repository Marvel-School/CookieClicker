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
    this.setupPanel();
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
    
    this.game.state.personalization.theme = themeId;
    
    // Apply theme
    this.applyTheme(themeId);
    
    // Save settings
    if (typeof this.game.saveGame === 'function') {
      this.game.saveGame();
    }
    
    // Show feedback - let applyTheme handle this
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
    
    // Save settings
    if (typeof this.game.saveGame === 'function') {
      this.game.saveGame();
    }
    
    // Show feedback (using debounced method to prevent multiple notifications)
    this.debouncedToast(`${level.charAt(0).toUpperCase() + level.slice(1)} animations applied!`);
  }
  
  applyTheme(theme) {
    const root = document.documentElement;
    const body = document.body;
    
    // Remove all existing theme classes
    body.classList.remove('theme-classic', 'theme-dark', 'theme-neon');
    
    // Add the appropriate theme class
    body.classList.add(`theme-${theme}`);
    
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
    
    // Make sure the personalization panel is updated to reflect the new theme
    if (this.container) {
      // Force refresh the panel styles
      this.container.style.display = 'none';
      setTimeout(() => {
        if (this.visible) {
          this.container.style.display = 'block';
        }
      }, 50);
    }
    
    // Show feedback (using debounced method to prevent multiple notifications)
    this.debouncedToast(`${theme.charAt(0).toUpperCase() + theme.slice(1)} theme applied!`);
    
    console.log(`Theme applied: ${theme}`);
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
    super.show();
    // Just update active states but don't re-initialize buttons
    this.updateActiveButtonStates();
  }
}
