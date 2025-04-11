import { UIComponent } from './UIComponent.js';

export class PersonalizationPanel extends UIComponent {
  constructor(game, containerElement, toggleElement) {
    super(containerElement, toggleElement);
    this.game = game;
    this.buttonsInitialized = false;
    this.toastDebounceTimer = null;
    this.setupPanel();
  }
  
  setupPanel() {
    if (this.container.querySelector('.panel-header').innerHTML.trim() === '') {
      this.container.querySelector('.panel-header').innerHTML = `
        <span class="panel-icon">🎨</span>
        <h2>Personalization</h2>
        <span class="close-btn" id="closePersonalization">×</span>
      `;
    }
    
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
    
    if (!this.buttonsInitialized) {
      this.setupButtons();
      this.buttonsInitialized = true;
    } else {
      this.updateActiveButtonStates();
    }
  }
  
  setupButtons() {
    const themeButtons = {
      'classic': document.getElementById('theme-classic'),
      'dark': document.getElementById('theme-dark'),
      'neon': document.getElementById('theme-neon')
    };
    
    const animationButtons = {
      'standard': document.getElementById('animations-standard'),
      'reduced': document.getElementById('animations-reduced'),
      'minimal': document.getElementById('animations-minimal')
    };
    
    const closeBtn = document.getElementById('closePersonalization');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    } else {
      const closeBtnByClass = this.container.querySelector('.close-btn');
      if (closeBtnByClass) {
        closeBtnByClass.addEventListener('click', () => this.hide());
      }
    }
    
    for (const [theme, button] of Object.entries(themeButtons)) {
      if (button) {
        const newButton = button.cloneNode(true);
        if (button.parentNode) {
          button.parentNode.replaceChild(newButton, button);
        }
        
        newButton.addEventListener('click', () => {
          this.updateTheme(theme);
          this.highlightActiveButton(themeButtons, theme);
        });
        
        themeButtons[theme] = newButton;
      }
    }
    
    for (const [animation, button] of Object.entries(animationButtons)) {
      if (button) {
        const newButton = button.cloneNode(true);
        if (button.parentNode) {
          button.parentNode.replaceChild(newButton, button);
        }
        
        newButton.addEventListener('click', () => {
          this.updateAnimationLevel(animation);
          this.highlightActiveButton(animationButtons, animation);
        });
        
        animationButtons[animation] = newButton;
      }
    }
    
    this.updateActiveButtonStates();
  }
  
  updateActiveButtonStates() {
    const currentTheme = this.game.state.personalization?.theme || 'classic';
    const currentAnimations = this.game.state.personalization?.animations || 'standard';
    
    const themeButtons = {
      'classic': document.getElementById('theme-classic'),
      'dark': document.getElementById('theme-dark'),
      'neon': document.getElementById('theme-neon')
    };
    
    const animationButtons = {
      'standard': document.getElementById('animations-standard'),
      'reduced': document.getElementById('animations-reduced'),
      'minimal': document.getElementById('animations-minimal')
    };
    
    this.highlightActiveButton(themeButtons, currentTheme);
    this.highlightActiveButton(animationButtons, currentAnimations);
  }
  
  highlightActiveButton(buttons, activeId) {
    Object.values(buttons).forEach(button => {
      if (button) button.classList.remove('active');
    });
    
    if (buttons[activeId]) {
      buttons[activeId].classList.add('active');
    }
  }
  
  debouncedToast(message) {
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
    if (!this.game.state.personalization) {
      this.game.state.personalization = {};
    }
    
    this.game.state.personalization.theme = themeId;
    
    this.applyTheme(themeId);
    
    if (typeof this.game.silentSave === 'function') {
      this.game.silentSave();
    } else {
      this.game.doSaveGame();
    }
  }
  
  updateAnimationLevel(level) {
    if (!this.game.state.personalization) {
      this.game.state.personalization = {};
    }
    
    this.game.state.personalization.animations = level;
    
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
    
    this.applyAnimationLevel(level);
    
    if (typeof this.game.silentSave === 'function') {
      this.game.silentSave();
    } else {
      this.game.doSaveGame();
    }
    
    this.debouncedToast(`${level.charAt(0).toUpperCase() + level.slice(1)} animations applied!`);
  }
  
  applyTheme(theme) {
    const root = document.documentElement;
    const body = document.body;
    
    body.classList.remove('theme-classic', 'theme-dark', 'theme-neon');
    
    body.classList.add(`theme-${theme}`);
    
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
    
    if (this.container) {
      this.container.style.display = 'none';
      setTimeout(() => {
        if (this.visible) {
          this.container.style.display = 'block';
        }
      }, 50);
    }
    
    this.debouncedToast(`${theme.charAt(0).toUpperCase() + theme.slice(1)} theme applied!`);
    
    console.log(`Theme applied: ${theme}`);
  }
  
  applyAnimationLevel(level) {
    const root = document.documentElement;
    const body = document.body;
    const intensity = this.game.state.personalization?.particleIntensity || 1.0;
    
    root.style.setProperty('--particle-intensity', intensity);
    
    root.classList.remove('animations-standard', 'animations-reduced', 'animations-minimal', 'animations-none');
    body.classList.remove('animations-standard', 'animations-reduced', 'animations-minimal', 'animations-none');
    
    root.classList.add(`animations-${level}`);
    body.classList.add(`animations-${level}`);
    
    this.showAnimationDemo(level);
    
    console.log(`Animation level applied: ${level} (intensity: ${intensity})`);
  }
  
  showAnimationDemo(level) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    document.querySelectorAll('.animation-demo-effect').forEach(el => el.remove());
    
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
    
    let particleCount = 0;
    switch (level) {
      case 'standard': particleCount = 30; break;
      case 'reduced': particleCount = 15; break;
      case 'minimal': particleCount = 5; break;
      default: particleCount = 0;
    }
    
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
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      const distance = 100 + Math.random() * 200;
      
      particle.animate([
        { transform: 'scale(0.5) translate(0, 0)', opacity: 1 },
        { transform: `scale(1.5) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`, opacity: 0 }
      ], {
        duration: 1000 + Math.random() * 1000,
        easing: 'cubic-bezier(0.1, 0.7, 1.0, 0.1)',
      });
    }
    
    setTimeout(() => {
      container.remove();
    }, 2000);
  }

  show() {
    if (this.container) {
      this.container.style.display = "block";
      this.visible = true;
      this.onShow();
      
      this.updateActiveButtonStates();
    }
  }
  
  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      if (this.container) {
        this.container.style.display = "none";
      }
      setTimeout(() => this.show(), 0);
    }
  }
}
