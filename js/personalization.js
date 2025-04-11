import { createConfetti } from './animation.js';
import { showToast } from './utils.js';

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
    preview: 'image/cookie.png'
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

export const COOKIE_SKINS = {
  CLASSIC: {
    id: 'classic',
    name: 'Classic Cookie',
    description: 'The original chocolate chip cookie',
    image: 'image/cookie.png',
    preview: 'image/cookie.png'
  }
};

export const CURSOR_SKINS = {
  CLASSIC: {
    id: 'classic',
    name: 'Standard Cursor',
    description: 'The original clicking hand',
    image: 'image/hand.png',
    preview: 'image/hand.png'
  }
};

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
    
    this.settings = {
      theme: THEMES.CLASSIC.id,
      cookieSkin: COOKIE_SKINS.CLASSIC.id,
      cursorSkin: CURSOR_SKINS.CLASSIC.id,
      animations: ANIMATION_SETS.STANDARD.id,
      particleIntensity: 1.0
    };
  }
  
  applyTheme() {
    const theme = this.getCurrentTheme();
    document.documentElement.dataset.theme = theme.id;
    
    const root = document.documentElement;
    root.style.setProperty('--background', theme.colors.background);
    root.style.setProperty('--text-color', theme.colors.text);
    root.style.setProperty('--primary-color', theme.colors.primary);
    root.style.setProperty('--secondary-color', theme.colors.secondary);
    root.style.setProperty('--accent-color', theme.colors.accent);
    root.style.setProperty('--panel-color', theme.colors.panels);
    
    const background = document.querySelector('.background');
    if (background) {
      background.style.background = theme.colors.background;
    }
    
    this.updateButtonStyles(theme);
    
    if (this.game && this.game.state) {
      this.game.state.personalization = this.settings;
    }
    
    return theme;
  }
  
  applyCookieSkin() {
    const cookieSkin = this.getCurrentCookieSkin();
    const cookieElement = this.game.cookie;
    
    if (cookieElement) {
      cookieElement.src = cookieSkin.image;
      cookieElement.alt = cookieSkin.name;
    }
    
    return cookieSkin;
  }
  
  applyCursorSkin() {
    const cursorSkin = this.getCurrentCursorSkin();
    
    const autoClickerImages = document.querySelectorAll('.upgrade-image[alt="Auto Clicker"]');
    autoClickerImages.forEach(img => {
      img.src = cursorSkin.image;
    });
    
    return cursorSkin;
  }
  
  applyAnimationSettings() {
    const animationSet = this.getCurrentAnimationSet();
    document.documentElement.dataset.animations = animationSet.id;
    
    const intensity = this.settings.particleIntensity;
    document.documentElement.style.setProperty('--particle-intensity', intensity);
    
    return animationSet;
  }
  
  applyAllSettings() {
    this.applyTheme();
    this.applyCookieSkin();
    this.applyCursorSkin();
    this.applyAnimationSettings();
  }
  
  setTheme(themeId) {
    for (const key in THEMES) {
      if (THEMES[key].id === themeId) {
        this.settings.theme = themeId;
        this.applyTheme();
        return THEMES[key];
      }
    }
    
    this.settings.theme = THEMES.CLASSIC.id;
    this.applyTheme();
    return THEMES.CLASSIC;
  }
  
  setCookieSkin(skinId) {
    for (const key in COOKIE_SKINS) {
      if (COOKIE_SKINS[key].id === skinId) {
        this.settings.cookieSkin = skinId;
        this.applyCookieSkin();
        return COOKIE_SKINS[key];
      }
    }
    
    this.settings.cookieSkin = COOKIE_SKINS.CLASSIC.id;
    this.applyCookieSkin();
    return COOKIE_SKINS.CLASSIC;
  }
  
  setCursorSkin(skinId) {
    for (const key in CURSOR_SKINS) {
      if (CURSOR_SKINS[key].id === skinId) {
        this.settings.cursorSkin = skinId;
        this.applyCursorSkin();
        return CURSOR_SKINS[key];
      }
    }
    
    this.settings.cursorSkin = CURSOR_SKINS.CLASSIC.id;
    this.applyCursorSkin();
    return CURSOR_SKINS.CLASSIC;
  }
  
  setAnimationSet(animationSetId) {
    for (const key in ANIMATION_SETS) {
      if (ANIMATION_SETS[key].id === animationSetId) {
        this.settings.animations = animationSetId;
        this.applyAnimationSettings();
        return ANIMATION_SETS[key];
      }
    }
    
    this.settings.animations = ANIMATION_SETS.STANDARD.id;
    this.applyAnimationSettings();
    return ANIMATION_SETS.STANDARD;
  }
  
  setParticleIntensity(intensity) {
    this.settings.particleIntensity = Math.max(0, Math.min(2, intensity));
    this.applyAnimationSettings();
    return this.settings.particleIntensity;
  }
  
  getCurrentTheme() {
    for (const key in THEMES) {
      if (THEMES[key].id === this.settings.theme) {
        return THEMES[key];
      }
    }
    return THEMES.CLASSIC;
  }
  
  getCurrentCookieSkin() {
    for (const key in COOKIE_SKINS) {
      if (COOKIE_SKINS[key].id === this.settings.cookieSkin) {
        return COOKIE_SKINS[key];
      }
    }
    return COOKIE_SKINS.CLASSIC;
  }
  
  getCurrentCursorSkin() {
    for (const key in CURSOR_SKINS) {
      if (CURSOR_SKINS[key].id === this.settings.cursorSkin) {
        return CURSOR_SKINS[key];
      }
    }
    return CURSOR_SKINS.CLASSIC;
  }
  
  getCurrentAnimationSet() {
    for (const key in ANIMATION_SETS) {
      if (ANIMATION_SETS[key].id === this.settings.animations) {
        return ANIMATION_SETS[key];
      }
    }
    return ANIMATION_SETS.STANDARD;
  }
  
  updateButtonStyles(theme) {
    let styleEl = document.getElementById('theme-dynamic-styles');
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'theme-dynamic-styles';
      document.head.appendChild(styleEl);
    }
    
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
  
  loadFromGameState() {
    if (this.game && this.game.state && this.game.state.personalization) {
      this.settings = { ...this.settings, ...this.game.state.personalization };
    }
    this.applyAllSettings();
  }
}

export function createPersonalizationUI(game, personalizer) {
  const container = document.createElement('div');
  container.id = 'personalizationContainer';
  container.className = 'personalization-container';
  container.style.display = 'none';
  
  const header = document.createElement('div');
  header.className = 'personalization-header';
  header.innerHTML = `
    <span class="personalization-icon">🎨</span>
    <h2>Personalization</h2>
  `;
  container.appendChild(header);
  
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

export function initPersonalizationSystem(game) {
  if (!game.state.personalization) {
    game.state.personalization = {
      theme: 'classic',
      cookieSkin: 'classic',
      cursorSkin: 'classic',
      animations: 'standard',
      particleIntensity: 1.0
    };
  }
  
  applyPersonalizationSettings(game.state.personalization);
  
  console.log("Personalization system initialized with settings:", game.state.personalization);
}

function applyPersonalizationSettings(settings) {
  const root = document.documentElement;
  const body = document.body;
  
  root.style.setProperty('--particle-intensity', settings.particleIntensity || 1.0);
  
  const theme = settings.theme || 'classic';
  
  body.classList.remove('theme-classic', 'theme-dark', 'theme-neon');
  
  body.classList.add(`theme-${theme}`);
  
  applyCookieSkin(settings.cookieSkin || 'classic');
  
  setAnimationLevel(settings.animations || 'standard');
  
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

function applyTheme(theme) {
  const themeStylesheet = document.getElementById('theme-stylesheet');
  
  if (!themeStylesheet) {
    const newThemeStylesheet = document.createElement('link');
    newThemeStylesheet.id = 'theme-stylesheet';
    newThemeStylesheet.rel = 'stylesheet';
    newThemeStylesheet.href = `css/themes/${theme}.css`;
    document.head.appendChild(newThemeStylesheet);
  } else {
    themeStylesheet.href = `css/themes/${theme}.css`;
  }
  
  localStorage.setItem('cookie-clicker-theme', theme);
}

function applyCookieSkin(skin) {
  const cookieElement = document.getElementById('cookie');
  
  if (cookieElement) {
    if (skin === 'classic' || !skin) {
      cookieElement.src = `image/cookie.png`;
    } else {
      cookieElement.src = `image/cookie-${skin}.png`;
    }
  }
  
  localStorage.setItem('cookie-clicker-skin', skin);
}

function setAnimationLevel(level) {
  const root = document.documentElement;
  
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
  
  localStorage.setItem('cookie-clicker-animations', level);
}

export function updatePersonalizationSetting(game, setting, value) {
  if (!game.state.personalization) {
    game.state.personalization = {};
  }
  
  game.state.personalization[setting] = value;
  
  applyPersonalizationSettings(game.state.personalization);
  
  game.saveGame();
  
  return game.state.personalization;
}
