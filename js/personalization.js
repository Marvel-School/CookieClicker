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
    // First, completely reset any theme-specific styles
    this.resetThemeStyles();
    
    const theme = this.getCurrentTheme();
    
    // Store the previously active theme for cleanup
    const oldTheme = document.documentElement.dataset.theme;
    
    // Update theme attribute on root element
    document.documentElement.dataset.theme = theme.id;
    
    // Apply theme classes to both html and body for complete coverage
    document.documentElement.className = document.documentElement.className
      .replace(/theme-\w+/g, '')
      .trim();
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .trim();
      
    document.documentElement.classList.add(`theme-${theme.id}`);
    document.body.classList.add(`theme-${theme.id}`);
    
    // Apply color variables to the root element
    const root = document.documentElement;
    root.style.setProperty('--background', theme.colors.background);
    root.style.setProperty('--text-color', theme.colors.text);
    root.style.setProperty('--primary-color', theme.colors.primary);
    root.style.setProperty('--secondary-color', theme.colors.secondary);
    root.style.setProperty('--accent-color', theme.colors.accent);
    root.style.setProperty('--panel-color', theme.colors.panels);
    
    // Update background element with the new theme
    const background = document.querySelector('.background');
    if (background) {
      background.style.background = theme.colors.background;
    }
    
    // Force-update dynamic components
    this.updateButtonStyles(theme);
    this.updatePanelStyles(theme);
    this.forceDOMUpdate();
    
    // Dispatch theme change event for components to respond
    const themeChangeEvent = new CustomEvent('themechange', { 
      detail: { oldTheme, newTheme: theme.id } 
    });
    document.dispatchEvent(themeChangeEvent);
    
    // Save to game state
    if (this.game && this.game.state) {
      this.game.state.personalization = this.settings;
    }
    
    return theme;
  }
  
  // Reset all theme-related inline styles
  resetThemeStyles() {
    // Reset inline styles on critical elements
    const elementsToReset = [
      ...document.querySelectorAll('button'), 
      ...document.querySelectorAll('.stats *'),
      ...document.querySelectorAll('#shopContainer, #shopContainer *'),
      ...document.querySelectorAll('#achievementsContainer, #achievementsContainer *'),
      ...document.querySelectorAll('#settingsMenu, #settingsMenu *'),
      ...document.querySelectorAll('.panel-container, .panel-container *'),
      ...document.querySelectorAll('.shop-item, .shop-item *'),
    ];
    
    // Properties we need to reset to default/inherit
    const propsToReset = [
      'background', 'backgroundColor', 'color', 'borderColor', 
      'boxShadow', 'textShadow', 'fontWeight', 'fontSize'
    ];
    
    elementsToReset.forEach(el => {
      // Only reset elements with inline styles
      if (el.style.length) {
        propsToReset.forEach(prop => {
          // Convert camelCase to kebab-case for CSS properties
          const kebabProp = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
          el.style.removeProperty(kebabProp);
        });
      }
    });
    
    // Remove any dynamic style elements we may have created
    const dynamicStyle = document.getElementById('theme-dynamic-styles');
    if (dynamicStyle) {
      dynamicStyle.textContent = '';
    }
  }
  
  // Force browser to recalculate styles by triggering a reflow
  forceDOMUpdate() {
    // This forces a reflow by reading a layout property
    document.body.offsetHeight;
    
    // Force update on critical UI elements
    this.updateCriticalElements(document.body);
    
    // Schedule another update for elements that might be animated/transitioning
    setTimeout(() => this.updateCriticalElements(document.body), 50);
  }
  
  // Update critical UI elements with current theme
  updateCriticalElements(element) {
    // Apply current theme to all elements with overridable styles
    const themeElements = element.querySelectorAll('.stats, .shop-item, #achievementsContainer, #shopContainer, #settingsMenu, .panel-container, .button, button');
    
    const theme = this.getCurrentTheme();
    
    themeElements.forEach(el => {
      // Reapply critical styles based on element type
      if (el.classList.contains('stats')) {
        this.updateStatsStyle(el, theme);
      } else if (el.classList.contains('shop-item')) {
        this.updateShopItemStyle(el, theme);
      } else if (el.tagName.toLowerCase() === 'button') {
        this.updateButtonStyle(el, theme);
      } else if (el.classList.contains('panel-container')) {
        this.updatePanelStyle(el, theme);
      }
      
      // Force-update children recursively
      this.updateCriticalElements(el);
    });
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
    
    // Clear previous styles first
    styleEl.textContent = '';
    
    // Update button styles based on theme colors
    styleEl.textContent = `
      .left button, 
      #settingsMenu button,
      .setting-btn,
      .upgrade {
        background: linear-gradient(145deg, ${theme.colors.primary}, ${theme.colors.secondary}) !important;
      }
      
      .upgrade .button_top {
        color: ${theme.colors.primary} !important;
      }
      
      .upgrade-progress-bar {
        background-color: ${theme.colors.accent} !important;
      }
      
      #achievementsContainer .achievements-header,
      #shopContainer .shop-header {
        background: linear-gradient(145deg, ${theme.colors.primary}, ${theme.colors.secondary}) !important;
        color: white !important;
      }
      
      .panel-header,
      .personalization-header {
        background: linear-gradient(145deg, ${theme.colors.primary}, ${theme.colors.secondary}) !important;
        color: white !important;
      }
    `;
    
    // Update all buttons immediately
    document.querySelectorAll('button, .button').forEach(button => {
      this.updateButtonStyle(button, theme);
    });
  }
  
  // Update a single button's style
  updateButtonStyle(button, theme) {
    if (!button) return;
    
    // Only apply to standard buttons, not those with special styling
    if (!button.classList.contains('theme-exempt')) {
      button.style.background = `linear-gradient(145deg, ${theme.colors.primary}, ${theme.colors.secondary})`;
      button.style.color = 'white';
      
      // Update button top if it exists (for layered buttons)
      const buttonTop = button.querySelector('.button_top');
      if (buttonTop) {
        buttonTop.style.color = theme.colors.primary;
      }
    }
  }
  
  // Update all panels with theme styles
  updatePanelStyles(theme) {
    const panels = document.querySelectorAll('#achievementsContainer, #shopContainer, #settingsMenu, .panel-container');
    
    panels.forEach(panel => {
      this.updatePanelStyle(panel, theme);
    });
  }
  
  // Update single panel style
  updatePanelStyle(panel, theme) {
    if (!panel) return;
    
    // Apply theme-specific panel styling
    if (theme.id === 'dark') {
      panel.style.background = 'rgba(35, 35, 40, 0.95)';
      panel.style.color = 'white';
      panel.style.borderColor = '#444';
    } else if (theme.id === 'neon') {
      panel.style.background = 'rgba(20, 20, 40, 0.9)';
      panel.style.color = 'white';
      panel.style.borderColor = theme.colors.accent;
      panel.style.boxShadow = `0 0 15px ${theme.colors.accent}`;
    } else {
      // Classic/default
      panel.style.background = 'rgba(255, 255, 255, 0.95)';
      panel.style.color = '#333';
      panel.style.borderColor = 'rgba(210, 210, 210, 0.8)';
      panel.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
    }
    
    // Update panel headers
    const header = panel.querySelector('.panel-header, .achievements-header, .shop-header');
    if (header) {
      header.style.background = `linear-gradient(145deg, ${theme.colors.primary}, ${theme.colors.secondary})`;
      header.style.color = 'white';
    }
  }
  
  // Update stats panel style
  updateStatsStyle(statsEl, theme) {
    if (!statsEl) return;
    
    if (theme.id === 'dark') {
      statsEl.style.background = 'rgba(40, 40, 45, 0.92)';
      statsEl.style.color = 'white';
      statsEl.style.borderColor = '#444';
      
      // Update text colors for better visibility
      const textElements = statsEl.querySelectorAll('h1, .stats-metric .value, #cookieCount, #clickPower, #cps');
      textElements.forEach(el => {
        el.style.color = 'white';
        el.style.textShadow = '1px 1px 3px rgba(0, 0, 0, 0.8)';
      });
      
      const labels = statsEl.querySelectorAll('.stats-metric .label');
      labels.forEach(label => {
        label.style.color = '#aaa';
      });
    } else if (theme.id === 'neon') {
      statsEl.style.background = 'rgba(20, 20, 40, 0.9)';
      statsEl.style.color = 'white';
      statsEl.style.borderColor = theme.colors.accent;
      statsEl.style.boxShadow = `0 0 15px ${theme.colors.accent}`;
      
      const textElements = statsEl.querySelectorAll('h1, .stats-metric .value, #cookieCount, #clickPower, #cps');
      textElements.forEach(el => {
        el.style.color = 'white';
        el.style.textShadow = `0 0 5px ${theme.colors.accent}`;
      });
    } else {
      // Classic/default
      statsEl.style.background = 'rgba(255, 255, 255, 0.92)';
      statsEl.style.color = '#333';
      statsEl.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      
      const textElements = statsEl.querySelectorAll('h1, #cookieCount, #clickPower, #cps');
      textElements.forEach(el => {
        el.style.color = '';
        el.style.textShadow = '';
      });
      
      // Reset cookie count to brown
      const cookieCount = statsEl.querySelector('#cookieCount');
      if (cookieCount) {
        cookieCount.style.color = '#8b4513';
      }
    }
  }
  
  // Update shop item style
  updateShopItemStyle(item, theme) {
    if (!item) return;
    
    if (theme.id === 'dark') {
      item.style.borderBottomColor = '#444';
      
      const itemName = item.querySelector('.item-name');
      if (itemName) itemName.style.color = 'white';
      
      const itemCost = item.querySelector('.item-cost');
      if (itemCost) itemCost.style.color = '#aaa';
    } else if (theme.id === 'neon') {
      item.style.borderBottomColor = 'rgba(255, 255, 255, 0.2)';
      
      const itemName = item.querySelector('.item-name');
      if (itemName) {
        itemName.style.color = theme.colors.accent;
        itemName.style.textShadow = `0 0 5px ${theme.colors.accent}`;
      }
    } else {
      // Classic/default
      item.style.borderBottomColor = '#ddd';
      
      const itemName = item.querySelector('.item-name');
      if (itemName) {
        itemName.style.color = '';
        itemName.style.textShadow = '';
      }
      
      const itemCost = item.querySelector('.item-cost');
      if (itemCost) itemCost.style.color = '';
    }
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
        
        // Save to game state silently
        if (this.game && this.game.silentSave) {
          this.game.silentSave();
        } else if (this.game && this.game.saveGame) {
          this.game.saveGame(true); // Pass true for silent save
        }
        
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
        
        // Save to game state silently
        if (this.game && this.game.silentSave) {
          this.game.silentSave();
        } else if (this.game && this.game.saveGame) {
          this.game.saveGame(true); // Pass true for silent save
        }
        
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
        
        // Save to game state silently
        if (this.game && this.game.silentSave) {
          this.game.silentSave();
        } else if (this.game && this.game.saveGame) {
          this.game.saveGame(true); // Pass true for silent save
        }
        
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
        
        // Save to game state silently
        if (this.game && this.game.silentSave) {
          this.game.silentSave();
        } else if (this.game && this.game.saveGame) {
          this.game.saveGame(true); // Pass true for silent save
        }
        
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
    
    // Save to game state silently
    if (this.game && this.game.silentSave) {
      this.game.silentSave();
    } else if (this.game && this.game.saveGame) {
      this.game.saveGame(true); // Pass true for silent save
    }
    
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
  
  // Load personalization settings from game state
  loadFromGameState() {
    if (this.game && this.game.state && this.game.state.personalization) {
      this.settings = { ...this.settings, ...this.game.state.personalization };
    }
    
    // Reset any existing theme styles before applying new ones
    this.resetThemeStyles();
    
    // Apply all settings
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
  // Set default values if not present
  if (!game.state.personalization) {
    game.state.personalization = {
      theme: 'classic',
      cookieSkin: 'classic',
      cursorSkin: 'classic',
      animations: 'standard',
      particleIntensity: 1.0
    };
  }
  
  // Apply current personalization settings
  applyPersonalizationSettings(game.state.personalization);
  
  console.log("Personalization system initialized with settings:", game.state.personalization);
}

/**
 * Applies the personalization settings to the game
 */
function applyPersonalizationSettings(settings) {
  const root = document.documentElement;
  const body = document.body;
  
  // Reset any existing theme styles first
  resetInlineThemeStyles();
  
  // Set CSS variables for theming
  root.style.setProperty('--particle-intensity', settings.particleIntensity || 1.0);
  
  // Apply theme-specific styling by adding theme class to body
  const theme = settings.theme || 'classic';
  
  // Remove existing theme classes
  body.classList.remove('theme-classic', 'theme-dark', 'theme-neon');
  root.classList.remove('theme-classic', 'theme-dark', 'theme-neon');
  
  // Add selected theme class
  body.classList.add(`theme-${theme}`);
  root.classList.add(`theme-${theme}`);
  
  // Apply cookie skin
  applyCookieSkin(settings.cookieSkin || 'classic');
  
  // Set animation level
  setAnimationLevel(settings.animations || 'standard');
  
  // Update background if it exists
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
  
  console.log(`Applied theme: ${theme}, animations: ${settings.animations}`);
}

// Helper function to reset theme styles
function resetInlineThemeStyles() {
  const elementsWithStyles = document.querySelectorAll('[style]');
  const themeProps = ['background', 'background-color', 'color', 'border-color', 'box-shadow', 'text-shadow'];
  
  elementsWithStyles.forEach(el => {
    // Check if element has theme-related styles
    let style = el.getAttribute('style');
    if (themeProps.some(prop => style.includes(prop))) {
      // Only reset theme properties, leave other inline styles intact
      themeProps.forEach(prop => {
        el.style.removeProperty(prop);
      });
    }
  });
}

/**
 * Applies a theme to the game
 */
function applyTheme(theme) {
  const themeStylesheet = document.getElementById('theme-stylesheet');
  
  if (!themeStylesheet) {
    // Create theme stylesheet if it doesn't exist
    const newThemeStylesheet = document.createElement('link');
    newThemeStylesheet.id = 'theme-stylesheet';
    newThemeStylesheet.rel = 'stylesheet';
    newThemeStylesheet.href = `css/themes/${theme}.css`;
    document.head.appendChild(newThemeStylesheet);
  } else {
    // Update existing theme stylesheet
    themeStylesheet.href = `css/themes/${theme}.css`;
  }
  
  // Store theme preference
  localStorage.setItem('cookie-clicker-theme', theme);
}

/**
 * Applies a cookie skin to the game
 */
function applyCookieSkin(skin) {
  const cookieElement = document.getElementById('cookie');
  
  if (cookieElement) {
    // Fix path to use existing cookie image instead of looking in non-existent directory
    if (skin === 'classic' || !skin) {
      cookieElement.src = `image/cookie.png`; // Use the default cookie image
    } else {
      // For future skins, use this pattern
      cookieElement.src = `image/cookie-${skin}.png`;
    }
  }
  
  // Store skin preference
  localStorage.setItem('cookie-clicker-skin', skin);
}

/**
 * Sets the animation level for the game
 */
function setAnimationLevel(level) {
  const root = document.documentElement;
  
  // Define animation settings based on level
  switch (level) {
    case 'reduced':
      root.style.setProperty('--particle-intensity', '0.5');
      root.classList.add('reduced-animations');
      break;
    case 'minimal':
      root.style.setProperty('--particle-intensity', '0.1');
      root.classList.add('minimal-animations');
      break;
    case 'none':
      root.style.setProperty('--particle-intensity', '0');
      root.classList.add('no-animations');
      break;
    case 'standard':
    default:
      root.style.setProperty('--particle-intensity', '1.0');
      root.classList.remove('reduced-animations', 'minimal-animations', 'no-animations');
      break;
  }
  
  // Store animation preference
  localStorage.setItem('cookie-clicker-animations', level);
}

/**
 * Updates a specific personalization setting
 */
export function updatePersonalizationSetting(game, setting, value) {
  if (!game.state.personalization) {
    game.state.personalization = {};
  }
  
  game.state.personalization[setting] = value;
  
  // Apply the updated settings
  applyPersonalizationSettings(game.state.personalization);
  
  // Save settings to localStorage silently
  if (game.silentSave) {
    game.silentSave();
  } else if (game.saveGame) {
    game.saveGame(true); // Pass true for silent save
  }
  
  return game.state.personalization;
}
