// Main entry point for the Cookie Clicker game

import Game from './Game.js';
import { initPersonalizationSystem } from './personalization.js';
import { PersonalizationPanel } from './components/PersonalizationPanel.js';

// Make sure we have a single instance of the game
let gameInstance = null;

// Initialize the game when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log("Cookie Clicker initializing...");
    
    // Create a new game instance
    gameInstance = new Game();
    window.gameInstance = gameInstance; // Make accessible for debugging
    
    // Ensure the cookie is visible with proper dimensions
    const cookieElement = document.getElementById('cookie');
    if (cookieElement) {
      cookieElement.style.display = 'block';
      cookieElement.style.width = '250px';
      cookieElement.style.height = '250px';
      cookieElement.style.cursor = 'pointer';
      console.log("Cookie element configured:", cookieElement);
    } else {
      console.error("Cookie element not found!");
    }
    
    // Initialize golden cookie container
    const goldenCookieContainer = document.createElement('div');
    goldenCookieContainer.id = 'goldenCookieContainer';
    goldenCookieContainer.style.position = 'fixed';
    goldenCookieContainer.style.top = '0';
    goldenCookieContainer.style.left = '0';
    goldenCookieContainer.style.width = '100%';
    goldenCookieContainer.style.height = '100%';
    goldenCookieContainer.style.zIndex = '999';
    goldenCookieContainer.style.pointerEvents = 'none'; // This makes children able to receive events
    document.body.appendChild(goldenCookieContainer);
    gameInstance.goldenCookieContainer = goldenCookieContainer;
    
    // Initialize personalization system after game is loaded
    try {
      initPersonalizationSystem(gameInstance);
      
      // Setup personalization panel
      const personalizationBtn = document.getElementById('personalizationBtn');
      const personalizationContainer = document.getElementById('personalizationContainer');
      if (personalizationBtn && personalizationContainer) {
        const personalizationPanel = new PersonalizationPanel(
          gameInstance,
          personalizationContainer,
          personalizationBtn
        );
        
        // Add personalization button to settings menu if it doesn't exist
        if (!personalizationBtn) {
          const settingsMenu = document.getElementById('settingsMenu');
          if (settingsMenu) {
            const newPersonalizationBtn = document.createElement('button');
            newPersonalizationBtn.id = 'personalizationBtn';
            newPersonalizationBtn.textContent = 'Personalization';
            settingsMenu.appendChild(newPersonalizationBtn);
            
            // Setup panel with the new button
            personalizationPanel.toggleElement = newPersonalizationBtn;
            personalizationPanel.setupEventListeners();
          }
        }
      }
      
      console.log("Personalization system initialized");
    } catch (e) {
      console.error("Error initializing personalization:", e);
    }
    
    // Set up personalization button in settings menu
    const settingsMenu = document.getElementById('settingsMenu');
    const personalizationBtn = document.getElementById('personalizationBtn');
    const personalizationContainer = document.getElementById('personalizationContainer');
    
    if (settingsMenu && !personalizationBtn) {
      // Create personalization button if it doesn't exist
      const newPersonalizationBtn = document.createElement('button');
      newPersonalizationBtn.id = 'personalizationBtn';
      newPersonalizationBtn.textContent = 'Personalization';
      settingsMenu.appendChild(newPersonalizationBtn);
    }
    
    // Set up personalization panel toggle
    if (personalizationBtn && personalizationContainer) {
      personalizationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        personalizationContainer.style.display = 
          personalizationContainer.style.display === 'block' ? 'none' : 'block';
      });
      
      // Close button
      const closeBtn = document.getElementById('closePersonalization');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          personalizationContainer.style.display = 'none';
        });
      }
      
      // Close panel when clicking outside
      document.addEventListener('click', () => {
        if (personalizationContainer.style.display === 'block') {
          personalizationContainer.style.display = 'none';
        }
      });
      
      // Prevent clicks inside from closing
      personalizationContainer.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
    
    // Legacy support for achievements dropdown
    const achieveWrapper = document.getElementById("achievementsWrapper");
    const dropdownContent = document.getElementById("achievementsContainer");

    if (achieveWrapper && dropdownContent) {
      achieveWrapper.addEventListener("click", function (event) {
        event.stopPropagation();
        // Compute display dynamically on click
        const dropdownContentDisplay = window.getComputedStyle(dropdownContent, null).getPropertyValue("display");
        dropdownContent.style.display = dropdownContentDisplay === "none" ? "block" : "none";
      });
      
      document.addEventListener("click", function() {
        dropdownContent.style.display = "none";
      });
      
      dropdownContent.addEventListener("click", function(event) {
        event.stopPropagation();
      });
    }
    
    // Add keyboard shortcut for saving (Ctrl+S)
    document.addEventListener('keydown', function(event) {
      try {
        // Check if Ctrl+S or Cmd+S (for Mac) was pressed
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
          // Prevent the default browser save dialog
          event.preventDefault();
          
          // Save the game
          if (gameInstance && typeof gameInstance.saveGame === 'function') {
            gameInstance.saveGame();
            console.log('Game saved with keyboard shortcut (Ctrl+S)');
          }
        }
      } catch (e) {
        console.error("Error in keyboard handler:", e);
      }
    });
    
    console.log("Cookie Clicker initialization complete");
  } catch (e) {
    console.error("CRITICAL ERROR initializing Cookie Clicker:", e);
    
    // Emergency recovery - show error to user
    const errorMsg = document.createElement('div');
    errorMsg.style.position = 'fixed';
    errorMsg.style.top = '10px';
    errorMsg.style.left = '50%';
    errorMsg.style.transform = 'translateX(-50%)';
    errorMsg.style.padding = '20px';
    errorMsg.style.background = 'rgba(255,0,0,0.8)';
    errorMsg.style.color = 'white';
    errorMsg.style.borderRadius = '5px';
    errorMsg.style.zIndex = '999999';
    errorMsg.innerHTML = `
      <h3>Error Loading Game</h3>
      <p>There was a problem initializing the game. Try refreshing the page.</p>
      <p>Error details: ${e.message}</p>
      <button onclick="location.reload()" style="padding: 5px 10px; margin-top: 10px;">Reload Page</button>
    `;
    document.body.appendChild(errorMsg);
  }
});

// body blur
class ToggleMenu {
  constructor(iconId, menuId) {
    this.icon = document.getElementById(iconId);
    this.menu = document.getElementById(menuId);
    this.backdrop = document.getElementById("backdrop");
    this.body = document.body;

    if (this.icon && this.menu) {
      this.init();
    } else {
      console.error(`❌ error  : ${iconId} أو ${menuId}`);
    }
  }

  init() {
    this.icon.addEventListener("click", () => this.toggleMenu());
    document.addEventListener("click", (event) => this.closeMenu(event));
  }

  toggleMenu() {
    this.menu.classList.toggle("show");
    this.body.classList.toggle("blur");
    this.backdrop.classList.toggle("show");
  }

  closeMenu(event) {
    if (!this.menu.contains(event.target) && !this.icon.contains(event.target)) {
      this.menu.classList.remove("show");
      this.body.classList.remove("blur");
      this.backdrop.classList.remove("show");
    }
  }
}


document.addEventListener("DOMContentLoaded", function () {
  new ToggleMenu("settingsIcon", "settingsMenu");
  new ToggleMenu("achievementsIcon", "achievementsContainer");
  new ToggleMenu("shopIcon", "shopContainer");
});



