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
