import Game from './Game.js';
import { initPersonalizationSystem } from './personalization.js';
import { PersonalizationPanel } from './components/PersonalizationPanel.js';


let gameInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log("Cookie Clicker initializing...");
    
    gameInstance = new Game();
    window.gameInstance = gameInstance;
    
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
    
    const goldenCookieContainer = document.createElement('div');
    goldenCookieContainer.id = 'goldenCookieContainer';
    goldenCookieContainer.style.position = 'fixed';
    goldenCookieContainer.style.top = '0';
    goldenCookieContainer.style.left = '0';
    goldenCookieContainer.style.width = '100%';
    goldenCookieContainer.style.height = '100%';
    goldenCookieContainer.style.zIndex = '999';
    goldenCookieContainer.style.pointerEvents = 'none';
    document.body.appendChild(goldenCookieContainer);
    gameInstance.goldenCookieContainer = goldenCookieContainer;
    
    try {
      initPersonalizationSystem(gameInstance);
      
      const personalizationBtn = document.getElementById('personalizationBtn');
      const personalizationContainer = document.getElementById('personalizationContainer');
      if (personalizationBtn && personalizationContainer) {
        const personalizationPanel = new PersonalizationPanel(
          gameInstance,
          personalizationContainer,
          personalizationBtn
        );     
        if (!personalizationBtn) {
          const settingsMenu = document.getElementById('settingsMenu');
          if (settingsMenu) {
            const newPersonalizationBtn = document.createElement('button');
            newPersonalizationBtn.id = 'personalizationBtn';
            newPersonalizationBtn.textContent = 'Personalization';
            settingsMenu.appendChild(newPersonalizationBtn);
            personalizationPanel.toggleElement = newPersonalizationBtn;
            personalizationPanel.setupEventListeners();
          }
        }
      }
      
      console.log("Personalization system initialized");
    } catch (e) {
      console.error("Error initializing personalization:", e);
    }
    const settingsMenu = document.getElementById('settingsMenu');
    const personalizationBtn = document.getElementById('personalizationBtn');
    const personalizationContainer = document.getElementById('personalizationContainer');
    
    if (settingsMenu && !personalizationBtn) {
      const newPersonalizationBtn = document.createElement('button');
      newPersonalizationBtn.id = 'personalizationBtn';
      newPersonalizationBtn.textContent = 'Personalization';
      settingsMenu.appendChild(newPersonalizationBtn);
    }
    const achieveWrapper = document.getElementById("achievementsWrapper");
    const dropdownContent = document.getElementById("achievementsContainer");

    if (achieveWrapper && dropdownContent) {
      achieveWrapper.addEventListener("click", function (event) {
        event.stopPropagation();
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
    document.addEventListener('keydown', function(event) {
      try {
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
          event.preventDefault();
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
function checkOverflow() {
  const leftContainer = document.querySelector('.left');
  const rightContainer = document.querySelector('.right');
  
  if (leftContainer) {
    if (leftContainer.scrollHeight > leftContainer.clientHeight) {
      leftContainer.classList.add('has-overflow');
    } else {
      leftContainer.classList.remove('has-overflow');
    }
  }
  
  if (rightContainer) {
    if (rightContainer.scrollHeight > rightContainer.clientHeight) {
      rightContainer.classList.add('has-overflow');
    } else {
      rightContainer.classList.remove('has-overflow');
    }
  }
}
window.addEventListener('load', checkOverflow);
window.addEventListener('resize', checkOverflow);
document.addEventListener('click', function(e) {
  if (e.target.closest('.upgrade') || e.target.closest('.shop-item')) {
    setTimeout(checkOverflow, 100);
  }
});
window.addEventListener('load', () => {
  document.querySelectorAll('.blur, .blurz').forEach(el => {
    el.classList.remove('blur', 'blurz');
  });
  const backdrop = document.getElementById('backdrop');
  if (backdrop) {
    backdrop.style.backdropFilter = 'none';
    backdrop.style.webkitBackdropFilter = 'none';
    backdrop.style.filter = 'none';
  }
  document.querySelectorAll('.backdrop').forEach(el => {
    el.style.backdropFilter = 'none';
    el.style.webkitBackdropFilter = 'none';
    el.style.filter = 'none';
  });
  window.addEventListener('resize', () => {
    document.querySelectorAll('.blur, .blurz').forEach(el => {
      el.classList.remove('blur', 'blurz');
    });
    document.body.classList.remove('blur', 'blurz');
    if (backdrop) {
      backdrop.style.backdropFilter = 'none';
      backdrop.style.webkitBackdropFilter = 'none';
      backdrop.style.filter = 'none';
    }
  });
  
  console.log("Anti-blur protection initialized");
});
class ToggleMenu {
  constructor(iconId, menuId) {
    this.icon = document.getElementById(iconId);
    this.menu = document.getElementById(menuId);
    this.backdrop = document.getElementById("backdrop");
    this.body = document.body;

    if (this.icon && this.menu) {
      this.init();
    } else {
      console.error(`❌ error: ${iconId} or ${menuId} not found`);
    }
  }

  init() {
    this.icon.addEventListener("click", () => this.toggleMenu());
    document.addEventListener("click", (event) => this.closeMenu(event));
  }

  toggleMenu() {
    this.menu.classList.toggle("show");
    if (this.backdrop) {
      console.log("menu");
      this.backdrop.classList.toggle("show"); 
      this.backdrop.style.backdropFilter = 'blur(5px)';
      this.backdrop.style.webkitBackdropFilter = 'blur(5px)';
      this.backdrop.style.filter = 'blur(5px)';
    }
    this.body.classList.toggle("blur");
    this.backdrop.classList.toggle("show");
  }
 

  closeMenu(event) {
    if (!this.menu.contains(event.target) && !this.icon.contains(event.target)) {
      this.menu.classList.remove("show");
      if (this.backdrop) {
        this.backdrop.classList.remove("show");
        this.backdrop.style.backdropFilter = 'none';
        this.backdrop.style.webkitBackdropFilter = 'none';
        this.backdrop.style.filter = 'none';
      }
    }
  }
}


document.addEventListener("DOMContentLoaded", function () {
  new ToggleMenu("settingsIcon", "settingsMenu");
  new ToggleMenu("achievementsIcon", "achievementsContainer");
  new ToggleMenu("shopIcon", "shopContainer");
});



