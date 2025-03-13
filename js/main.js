// Main entry point for the Cookie Clicker game

import Game from './Game.js';

// Initialize the game when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create a new game instance
  const game = new Game();
  
  // Legacy support for achievements dropdown
  const achieveWrapper = document.getElementById("achievementsWrapper");
  const dropdownContent = document.getElementById("achievementsContainer");

  if (achieveWrapper && dropdownContent) {
    achieveWrapper.addEventListener("click", function (event) {
      // Compute display dynamically on click
      const dropdownContentDisplay = window.getComputedStyle(dropdownContent, null).getPropertyValue("display");
      dropdownContent.style.display = dropdownContentDisplay === "none" ? "block" : "none";
    });

    achieveWrapper.addEventListener("blur", function (event) {
      dropdownContent.style.display = "none";
    });
  }
  
  console.log("Cookie Clicker initialized with modular structure");
});
