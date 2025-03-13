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
    
    // Set default personalization settings
    this.settings = {
      theme: THEMES.CLASSIC.id,
      cookieSkin: COOKIE_SKINS.CLASSIC.id,
      cursorSkin: CURSOR_SKINS.CLASSIC.id,
      animations: ANIMATION_SETS.STANDARD.id,
      particleIntensity: 1.0
    };
  }
  
  // Apply current theme to the page
  applyTheme() {
    const theme = this.getCurrentTheme();
    document.documentElement.dataset.theme = theme.id;
    
    // Apply color variables to the root element
    const root = document.documentElement;
    root.style.setProperty('--background', theme.colors.background);
    root.style.setProperty('--text-color', theme.colors.text);
    root.style.setProperty('--primary-color', theme.colors.primary);
    root.style.setProperty('--secondary-color', theme.colors.secondary);
    root.style.setProperty('--accent-color', theme.colors.accent);
    root.style.setProperty('--panel-color', theme.colors.panels);
    
    // Update background element
    const background = document.querySelector('.background');
    if (background) {
      background.style.background = theme.colors.background;
    }
    
    // Apply button styling
    this.updateButtonStyles(theme);
    
    // Save to game state
    if (this.game && this.game.state) {
      this.game.state.personalization = this.settings;
    }
    
    return theme;
  }
  
  // Update cookie skin
  applyCookieSkin() {
    const cookieSkin = this.getCurrentCookieSkin();
    const cookieElement = this.game.cookie;
    
    if (cookieElement) {
      cookieElement.src = cookieSkin.image;
      cookieElement.alt = cookieSkin.name;
    }
    
    return cookieSkin;
  }
  
  // Update cursor skin
  applyCursorSkin() {
    const cursorSkin = this.getCurrentCursorSkin();
    
    // Update auto clicker images
    const autoClickerImages = document.querySelectorAll('.upgrade-image[alt="Auto Clicker"]');
    autoClickerImages.forEach(img => {
      img.src = cursorSkin.image;
    });
    
    return cursorSkin;
  }
  
  // Update animation settings
  applyAnimationSettings() {
    const animationSet = this.getCurrentAnimationSet();
    document.documentElement.dataset.animations = animationSet.id;
    
    // Adjust particle settings based on intensity
    const intensity = this.settings.particleIntensity;
    document.documentElement.style.setProperty('--particle-intensity', intensity);
    
    return animationSet;
  }
  
  // Apply all personalization settings
  applyAllSettings() {
    this.applyTheme();
    this.applyCookieSkin();
    this.applyCursorSkin();
    this.applyAnimationSettings();
  }
  
  // Set theme by ID
  setTheme(themeId) {
    // Only set valid theme IDs
    for (const key in THEMES) {
      if (THEMES[key].id === themeId) {
        this.settings.theme = themeId;
        this.applyTheme();
        return THEMES[key];
      }
    }
    
    // If theme doesn't exist, use classic theme
    this.settings.theme = THEMES.CLASSIC.id;
    this.applyTheme();
    return THEMES.CLASSIC;
  }
  
  // Set cookie skin by ID
  setCookieSkin(skinId) {
    // Only set valid skin IDs
    for (const key in COOKIE_SKINS) {
      if (COOKIE_SKINS[key].id === skinId) {
        this.settings.cookieSkin = skinId;
        this.applyCookieSkin();
        return COOKIE_SKINS[key];
      }
    }
    
    // If skin doesn't exist, use classic skin
    this.settings.cookieSkin = COOKIE_SKINS.CLASSIC.id;
    this.applyCookieSkin();
    return COOKIE_SKINS.CLASSIC;
  }
  
  // Set cursor skin by ID
  setCursorSkin(skinId) {
    // Only set valid skin IDs
    for (const key in CURSOR_SKINS) {
      if (CURSOR_SKINS[key].id === skinId) {
        this.settings.cursorSkin = skinId;
        this.applyCursorSkin();
        return CURSOR_SKINS[key];
      }
    }
    
    // If skin doesn't exist, use classic skin
    this.settings.cursorSkin = CURSOR_SKINS.CLASSIC.id;
    this.applyCursorSkin();
    return CURSOR_SKINS.CLASSIC;
  }
  
  // Set animation set by ID
  setAnimationSet(animationSetId) {
    // Only set valid animation set IDs
    for (const key in ANIMATION_SETS) {
      if (ANIMATION_SETS[key].id === animationSetId) {
        this.settings.animations = animationSetId;
        this.applyAnimationSettings();
        return ANIMATION_SETS[key];
      }
    }
    
    // If animation set doesn't exist, use standard set
    this.settings.animations = ANIMATION_SETS.STANDARD.id;
    this.applyAnimationSettings();
    return ANIMATION_SETS.STANDARD;
  }
  
  // Set particle intensity (0.0 to 2.0)
  setParticleIntensity(intensity) {
    // Clamp intensity between 0 and 2
    this.settings.particleIntensity = Math.max(0, Math.min(2, intensity));
    this.applyAnimationSettings();
    return this.settings.particleIntensity;
  }
  
  // Get current theme object
  getCurrentTheme() {
    for (const key in THEMES) {
      if (THEMES[key].id === this.settings.theme) {
        return THEMES[key];
      }
    }
    return THEMES.CLASSIC;
  }
  
  // Get current cookie skin object
  getCurrentCookieSkin() {
    for (const key in COOKIE_SKINS) {
      if (COOKIE_SKINS[key].id === this.settings.cookieSkin) {
        return COOKIE_SKINS[key];
      }
    }
    return COOKIE_SKINS.CLASSIC;
  }
  
  // Get current cursor skin object
  getCurrentCursorSkin() {
    for (const key in CURSOR_SKINS) {
      if (CURSOR_SKINS[key].id === this.settings.cursorSkin) {
        return CURSOR_SKINS[key];
      }
    }
    return CURSOR_SKINS.CLASSIC;
  }
  
  // Get current animation set object
  getCurrentAnimationSet() {
    for (const key in ANIMATION_SETS) {
      if (ANIMATION_SETS[key].id === this.settings.animations) {
        return ANIMATION_SETS[key];
      }
    }
    return ANIMATION_SETS.STANDARD;
  }
  
  // Update button styles based on theme
  updateButtonStyles(theme) {
    // Create a style element for dynamic styles
    let styleEl = document.getElementById('theme-dynamic-styles');
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'theme-dynamic-styles';
      document.head.appendChild(styleEl);
    }
    
    // Update button styles based on theme colors
    styleEl.textContent = `
      .left button, 
      #settingsMenu button,
      .setting-btn,
      .upgrade {
        background: linear-gradient(145deg, ${theme.colors.primary}, ${theme.colors.secondary});
      }
      
      .upgrade .button_top {
        color: ${theme.colors.primary};
      }
      
      .upgrade-progress-bar {
        background-color: ${theme.colors.accent};
      }
      
      #achievementsContainer .achievements-header,
      #shopContainer .shop-header {
        background: linear-gradient(145deg, ${theme.colors.primary}, ${theme.colors.secondary});
      }
    `;
  }
  
  // Load personalization settings from game state
  loadFromGameState() {
    if (this.game && this.game.state && this.game.state.personalization) {
      this.settings = { ...this.settings, ...this.game.state.personalization };
    }
    this.applyAllSettings();
  }
}

// Create a simplified personalization UI for now
export function createPersonalizationUI(game, personalizer) {
  const container = document.createElement('div');
  container.id = 'personalizationContainer';
  container.className = 'personalization-container';
  container.style.display = 'none';
  
  // Create header
  const header = document.createElement('div');
  header.className = 'personalization-header';
  header.innerHTML = `
    <span class="personalization-icon">🎨</span>
    <h2>Personalization</h2>
  `;
  container.appendChild(header);
  
  // Create simplified content for now
  const content = document.createElement('div');
  content.className = 'personalization-content';
  content.style.padding = '20px';
  content.innerHTML = `
    <p style="text-align: center; font-size: 18px;">
      Choose a theme below to change the game's appearance:
    </p>
    <div style="display: flex; justify-content: center; gap: 20px; margin: 30px 0;">
      <button id="theme-classic" class="theme-button">Classic Theme</button>
      <button id="theme-dark" class="theme-button">Dark Theme</button>
      <button id="theme-neon" class="theme-button">Neon Theme</button>
    </div>
    <p style="text-align: center; margin-top: 30px;">
      More personalization options will be available in a future update!
    </p>
  `;
  
  // Add button styling
  const style = document.createElement('style');
  style.textContent = `
    .theme-button {
      padding: 10px 20px;
      background: linear-gradient(145deg, #2980b9, #3498db);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    .theme-button:hover {
      transform: scale(1.05);
    }
  `;
  document.head.appendChild(style);
  
  container.appendChild(content);
  
  // Add event listeners to theme buttons
  setTimeout(() => {
    document.getElementById('theme-classic')?.addEventListener('click', () => {
      personalizer.setTheme('classic');
      showToast('Classic theme applied!');
      container.style.display = 'none';
    });
    
    document.getElementById('theme-dark')?.addEventListener('click', () => {
      personalizer.setTheme('dark');
      showToast('Dark theme applied!');
      container.style.display = 'none';
    });
    
    document.getElementById('theme-neon')?.addEventListener('click', () => {
      personalizer.setTheme('neon');
      showToast('Neon theme applied!');
      container.style.display = 'none';
    });
  }, 100);
  
  // Add footer with close button
  const footer = document.createElement('div');
  footer.className = 'personalization-footer';
  footer.style.padding = '15px';
  footer.style.textAlign = 'right';
  footer.style.borderTop = '1px solid #ddd';
  
  const closeButton = document.createElement('button');
  closeButton.className = 'close-button';
  closeButton.textContent = 'Close';
  closeButton.style.background = '#e74c3c';
  closeButton.style.color = 'white';
  closeButton.style.border = 'none';
  closeButton.style.borderRadius = '5px';
  closeButton.style.padding = '8px 15px';
  closeButton.style.cursor = 'pointer';
  
  closeButton.addEventListener('click', () => {
    container.style.display = 'none';
  });
  
  footer.appendChild(closeButton);
  container.appendChild(footer);
  
  return container;
}

// Helper to initialize the personalization system
export function initPersonalizationSystem(game) {
  // Create personalization manager
  const personalizer = new PersonalizationManager(game);
  game.personalizer = personalizer;
  
  // Load settings from game state
  personalizer.loadFromGameState();
  
  // Create UI
  const ui = createPersonalizationUI(game, personalizer);
  document.body.appendChild(ui);
  
  // Add personalization button to settings
  const settingsMenu = document.getElementById('settingsMenu');
  if (settingsMenu) {
    const personalizationButton = document.createElement('button');
    personalizationButton.id = 'personalizationButton';
    personalizationButton.textContent = 'Personalization';
    
    personalizationButton.addEventListener('click', () => {
      // Hide settings menu
      settingsMenu.style.display = 'none';
      
      // Show personalization menu
      ui.style.display = 'block';
    });
    
    settingsMenu.appendChild(personalizationButton);
  }
  
  return personalizer;
}
