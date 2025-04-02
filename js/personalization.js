// Personalization system for themes and skins

import { createConfetti } from './animation.js';
import { showToast } from './utils.js';

// Define available themes
export const THEMES = {
  CLASSIC: {
    id: 'classic',
    name: 'Classic',
    description: 'The original cookie clicker look',
    colors: {
      background: 'radial-gradient(#333, #000)',
      text: '#333',
      primary: '#2980b9',
      secondary: '#3498db',
      accent: '#ff8c42',
      panels: 'rgba(255, 255, 255, 0.95)'
    },
    preview: 'image/cookie.png' // Use existing image as fallback
  },
  DARK: {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Easy on the eyes, great for night time',
    colors: {
      background: 'radial-gradient(#111, #000)',
      text: '#eee',
      primary: '#444',
      secondary: '#555',
      accent: '#8e44ad',
      panels: 'rgba(40, 40, 40, 0.95)'
    },
    preview: 'image/cookie.png'
  },
  NEON: {
    id: 'neon',
    name: 'Neon Fever',
    description: 'Bright, vibrant, and electrifying',
    colors: {
      background: 'radial-gradient(#111, #000)',
      text: '#fff',
      primary: '#ff00ff',
      secondary: '#00ffff',
      accent: '#ffff00',
      panels: 'rgba(20, 20, 40, 0.9)'
    },
    preview: 'image/cookie.png'
  }
};

// Define available cookie skins
export const COOKIE_SKINS = {
  CLASSIC: {
    id: 'classic',
    name: 'Classic Cookie',
    description: 'The original chocolate chip cookie',
    image: 'image/cookie.png',
    preview: 'image/cookie.png'
  }
};

// Cursor skins
export const CURSOR_SKINS = {
  CLASSIC: {
    id: 'classic',
    name: 'Standard Cursor',
    description: 'The original clicking hand',
    image: 'image/hand.png',
    preview: 'image/hand.png'
  }
};

// Animation sets
export const ANIMATION_SETS = {
  STANDARD: {
    id: 'standard',
    name: 'Standard',
    description: 'Classic cookie animations'
  },
  INTENSE: {
    id: 'intense',
    name: 'Intense',
    description: 'More particles, more effects'
  },
  MINIMAL: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Reduced animations for better performance'
  }
};

export class PersonalizationManager {
  constructor(game) {
    this.game = game;
    this.initialized = false;
  }

  init() {
    // Apply saved personalization settings from game state
    this.initialized = true;

    if (this.game.state.personalization) {
      // Apply saved theme if available
      const theme = this.game.state.personalization.theme || 'classic';
      this.setTheme(theme, false);

      // Apply saved animation setting if available
      const animations = this.game.state.personalization.animations || 'standard';
      this.setAnimations(animations, false);

      // Apply saved particle intensity if available
      const intensity = this.game.state.personalization.particleIntensity || 1.0;
      this.setParticleIntensity(intensity, false);
    }

    console.log('Personalization system initialized with:', this.game.state.personalization);
  }

  setTheme(theme, showNotification = true) {
    if (!this.initialized) {
      console.warn('Personalization manager not initialized');
      return;
    }

    // Store current theme for the event
    const oldTheme = this.game.state.personalization.theme;
    
    // Update game state
    this.game.state.personalization.theme = theme;

    // Remove any existing theme classes from body
    document.body.classList.remove('theme-classic', 'theme-dark', 'theme-neon');
    
    // Add new theme class to body
    document.body.classList.add(`theme-${theme}`);

    // Also set data attribute for more specific CSS selectors
    document.body.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);

    if (showNotification) {
      this.showThemeChangedNotification(theme);
    }

    // Dispatch a theme change event for other components to react
    const themeChangeEvent = new CustomEvent('themechange', {
      detail: {
        oldTheme,
        newTheme: theme
      }
    });
    document.dispatchEvent(themeChangeEvent);

    console.log(`Theme changed to: ${theme}`);
  }

  // Add the missing setAnimations function
  setAnimations(animationLevel, showNotification = true) {
    if (!this.initialized) {
      console.warn('Personalization manager not initialized');
      return;
    }

    // Store current animation level for the event
    const oldAnimationLevel = this.game.state.personalization.animations;
    
    // Update game state
    this.game.state.personalization.animations = animationLevel;

    // Remove any existing animation classes from body
    document.body.classList.remove('animations-standard', 'animations-reduced', 'animations-minimal');
    
    // Add new animation class to body
    document.body.classList.add(`animations-${animationLevel}`);

    // Also set data attribute for more specific CSS selectors
    document.body.setAttribute('data-animations', animationLevel);
    document.documentElement.setAttribute('data-animations', animationLevel);

    if (showNotification) {
      this.showNotification(`Animations set to ${animationLevel} mode`);
    }

    // Dispatch an animation change event for other components to react
    const animationChangeEvent = new CustomEvent('animationchange', {
      detail: {
        oldLevel: oldAnimationLevel,
        newLevel: animationLevel
      }
    });
    document.dispatchEvent(animationChangeEvent);

    console.log(`Animation level changed to: ${animationLevel}`);
  }

  setParticleIntensity(intensity, showNotification = true) {
    if (!this.initialized) {
      console.warn('Personalization manager not initialized');
      return;
    }

    // Update game state
    this.game.state.personalization.particleIntensity = intensity;

    // Set CSS variable for particle intensity
    document.documentElement.style.setProperty('--particle-intensity', intensity);

    if (showNotification) {
      this.showNotification(`Particle intensity set to ${intensity}`);
    }

    console.log(`Particle intensity changed to: ${intensity}`);
  }

  showThemeChangedNotification(theme) {
    const themeNames = {
      'classic': 'Classic',
      'dark': 'Dark Mode',
      'neon': 'Neon'
    };

    this.showNotification(`Theme changed to ${themeNames[theme] || theme}`);
  }

  showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'theme-switch-notification';
    notification.textContent = message;

    // Add to page
    document.body.appendChild(notification);

    // Remove after animation
    setTimeout(() => {
      if (notification.parentNode === document.body) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }
}

// Initialize the personalization system
export function initPersonalizationSystem(game) {
  // Create the personalization manager if it doesn't exist
  if (!game.personalizationManager) {
    game.personalizationManager = new PersonalizationManager(game);
  }

  // Initialize it
  game.personalizationManager.init();

  return game.personalizationManager;
}
