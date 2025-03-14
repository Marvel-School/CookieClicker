// Main entry point for the Cookie Clicker game

import Game from './Game.js';
import { initPersonalizationSystem } from './personalization.js';

// Make sure we have a single instance of the game
let gameInstance = null;

// Initialize the game when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log("Cookie Clicker initializing...");
    
    // Create a new game instance
    gameInstance = new Game();
    window.gameInstance = gameInstance; // Make accessible for debugging
    
    // Initialize personalization system after game is loaded
    try {
      initPersonalizationSystem(gameInstance);
      console.log("Personalization system initialized");
    } catch (e) {
      console.error("Error initializing personalization:", e);
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
    
    console.log("Cookie Clicker initialization complete");
  } catch (e) {
    console.error("Error initializing Cookie Clicker:", e);
  }
});
