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

    // CRITICAL FIX: Call the init method to set up DOM elements and event listeners
    gameInstance.init();
    
    // CRITICAL FIX: Auto-load saved game if it exists
    if (localStorage.getItem("cookieGameSave")) {
      gameInstance.loadGame();
      console.log("Auto-loaded saved game");
    }
    
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
    
    // Set up personalization panel
    if (personalizationBtn && personalizationContainer) {
      // Create a global reference to the personalization panel
      const personalizationPanel = new PersonalizationPanel(
        gameInstance,
        personalizationContainer,
        personalizationBtn
      );
      
      // Store in window for debugging
      window.personalizationPanel = personalizationPanel;
      
      // Make sure it's hidden initially for consistency
      personalizationContainer.style.display = 'none';
      
      // Direct close button to use hide method
      const closeBtn = document.getElementById('closePersonalization');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          personalizationPanel.hide();
        });
      }
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
    
    // Listen for theme changes to ensure UI updates completely
    document.addEventListener('themechange', (e) => {
      console.log(`Theme changed from ${e.detail.oldTheme} to ${e.detail.newTheme}`);
      
      // Force a complete style recalculation after theme change
      const forceReflow = () => {
        // Access a layout property to force reflow
        document.body.offsetHeight;
        
        // Update UI components that might need refreshing
        if (gameInstance) {
          // Force display update for game stats and panels
          gameInstance.updateDisplay();
          
          // Make sure panels reflect the new theme
          const panels = document.querySelectorAll('.panel-container, #shopContainer, #achievementsContainer, #settingsMenu');
          panels.forEach(panel => {
            // Force repaint by toggling display slightly
            const currentDisplay = panel.style.display;
            panel.style.display = 'none';
            setTimeout(() => {
              panel.style.display = currentDisplay;
            }, 10);
          });
        }
      };
      
      // Apply immediately and then again after a short delay to catch transitions
      forceReflow();
      setTimeout(forceReflow, 50);
      setTimeout(forceReflow, 200);
    });
    
    // Add this after the existing themechange event listener to force a full refresh
    document.addEventListener('themechange', (e) => {
      // Force a complete CSS recalculation on theme change
      const styleSheets = Array.from(document.styleSheets);
      for (const sheet of styleSheets) {
        try {
          // This forces the browser to reparse the stylesheet
          const rules = sheet.cssRules;
          for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            // Access a property to force rule revalidation
            if (rule.style) {
              const temp = rule.style.cssText;
            }
          }
        } catch (err) {
          // Some stylesheets may not be accessible due to CORS
          console.log("Could not refresh stylesheet:", sheet.href);
        }
      }
      
      console.log(`Theme completely refreshed from ${e.detail.oldTheme} to ${e.detail.newTheme}`);
      
      // Add a debug helper for theme variables
      console.log("Current theme variables:", {
        background: getComputedStyle(document.documentElement).getPropertyValue('--background'),
        textColor: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
        primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
        secondaryColor: getComputedStyle(document.documentElement).getPropertyValue('--secondary-color'),
        accentColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-color'),
        panelColor: getComputedStyle(document.documentElement).getPropertyValue('--panel-color')
      });
    });
    
    // ===== DIRECT PANEL BUTTONS FIX =====
    // These handlers will work regardless of component initialization
    
    // 1. SHOP BUTTON - Direct handler
    const shopIcon = document.getElementById('shopIcon');
    const shopContainer = document.getElementById('shopContainer');
    
    if (shopIcon && shopContainer) {
      console.log("Setting up direct shop button handler");
      
      shopIcon.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        shopContainer.style.display = shopContainer.style.display === 'block' ? 'none' : 'block';
        console.log("Shop button clicked, display:", shopContainer.style.display);
      });
      
      // Prevent clicks inside the panel from closing it
      shopContainer.addEventListener('click', function(e) {
        e.stopPropagation();
      });
    }
    
    // 2. ACHIEVEMENTS BUTTON - Direct handler
    const achievementsIcon = document.getElementById('achievementsIcon');
    const achievementsContainer = document.getElementById('achievementsContainer');
    
    if (achievementsIcon && achievementsContainer) {
      console.log("Setting up direct achievements button handler");
      
      achievementsIcon.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        achievementsContainer.style.display = achievementsContainer.style.display === 'block' ? 'none' : 'block';
        console.log("Achievements button clicked, display:", achievementsContainer.style.display);
      });
      
      // Prevent clicks inside the panel from closing it
      achievementsContainer.addEventListener('click', function(e) {
        e.stopPropagation();
      });
    }
    
    // 3. SETTINGS BUTTON - Direct handler
    const settingsIcon = document.getElementById('settingsIcon');
    
    if (settingsIcon && settingsMenu) {
      console.log("Setting up direct settings button handler");
      
      // Remove existing listeners to avoid conflicts
      settingsIcon.replaceWith(settingsIcon.cloneNode(true));
      const newSettingsIcon = document.getElementById('settingsIcon');
      
      // Add fresh event listener
      newSettingsIcon.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
        console.log("Settings button clicked, display:", settingsMenu.style.display);
      });
      
      // Prevent clicks inside the menu from closing it
      settingsMenu.addEventListener('click', function(e) {
        e.stopPropagation();
      });
      
      // Setup the settings buttons directly
      const saveBtn = document.getElementById('saveGame');
      const loadBtn = document.getElementById('loadGame');
      const resetBtn = document.getElementById('resetGame');
      const soundBtn = document.getElementById('toggleSound');
      
      if (saveBtn) saveBtn.addEventListener('click', () => gameInstance.saveGame());
      if (loadBtn) loadBtn.addEventListener('click', () => gameInstance.loadGame());
      if (resetBtn) resetBtn.addEventListener('click', () => gameInstance.resetGame());
      if (soundBtn) soundBtn.addEventListener('click', () => {
        gameInstance.soundOn = !gameInstance.soundOn;
        alert(`Sound is now ${gameInstance.soundOn ? "ON" : "OFF"}.`);
      });
    }
    
    // Global document click to close any open panel
    document.addEventListener('click', function() {
      if (shopContainer) shopContainer.style.display = 'none';
      if (achievementsContainer) achievementsContainer.style.display = 'none';
      if (settingsMenu) settingsMenu.style.display = 'none';
      if (personalizationContainer) personalizationContainer.style.display = 'none';
    });

    // ADD THIS: Direct handler for personalization button
    if (personalizationBtn && personalizationContainer) {
      console.log("Setting up direct personalization button handler");
      
      personalizationBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        personalizationContainer.style.display = personalizationContainer.style.display === 'block' ? 'none' : 'block';
        console.log("Personalization button clicked, display:", personalizationContainer.style.display);
      });
      
      // Prevent clicks inside the panel from closing it
      personalizationContainer.addEventListener('click', function(e) {
        e.stopPropagation();
      });
      
      // Setup close button explicitly
      const closeBtn = document.getElementById('closePersonalization');
      if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          personalizationContainer.style.display = 'none';
          console.log("Personalization panel closed");
        });
      }
    }

    // ===== END DIRECT PANEL BUTTONS FIX =====

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
