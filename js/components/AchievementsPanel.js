import { UIComponent } from './UIComponent.js';

/**
 * Achievements Panel component to display player achievements
 */
export class AchievementsPanel extends UIComponent {
  /**
   * Initialize the Achievements Panel
   * @param {Game} game - Reference to the main game object
   * @param {HTMLElement} element - The achievements panel element
   * @param {HTMLElement} toggleButton - Button that toggles the panel
   * @param {HTMLElement} achievementsList - Element to contain achievement items
   */
  constructor(game, element, toggleButton, achievementsList) {
    super(game, element);
    this.toggleButton = toggleButton;
    this.achievementsList = achievementsList;
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for the achievements panel
   */
  setupEventListeners() {
    // Toggle panel when achievements icon is clicked
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent closing when clicking the icon
        this.toggle();
      });
    }
    
    // Prevent panel closing when clicking inside
    if (this.element) {
      this.element.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
    
    // Close panel when clicking elsewhere
    document.addEventListener('click', () => {
      if (this.isVisible) {
        this.hide();
      }
    });
  }

  /**
   * Show the achievements panel with updated content
   */
  onShow() {
    this.updateAchievements();
  }

  /**
   * Update the achievements list display
   */
  updateAchievements() {
    // Safety check for element
    if (!this.achievementsList) return;

    // Group achievements by category
    const earnedAchievements = this.game.achievements.filter(a => a.earned);
    
    // Show placeholder if no achievements
    if (earnedAchievements.length === 0) {
      this.achievementsList.innerHTML = `
        <div class="no-achievements">
          <p>No achievements yet!</p>
          <p>Keep baking cookies to unlock achievements.</p>
        </div>
      `;
      return;
    }
    
    // Sort by rarity (legendary first)
    const rarityOrder = {
      'legendary': 0,
      'epic': 1,
      'rare': 2,
      'uncommon': 3,
      'common': 4
    };
    
    earnedAchievements.sort((a, b) => 
      rarityOrder[a.rarity] - rarityOrder[b.rarity]
    );
    
    // Generate HTML for each achievement
    const achievementItems = earnedAchievements.map((ach) => {
      return `<li class="achievement-item ${ach.rarity}" data-category="${ach.category}">
        <div class="achievement-icon">${ach.icon}</div>
        <div class="achievement-content">
          <h3>${ach.name}</h3>
          <p>${ach.description}</p>
          <span class="achievement-rarity ${ach.rarity}">${ach.rarity}</span>
        </div>
      </li>`;
    }).join("");
    
    // Update the list content
    this.achievementsList.innerHTML = achievementItems;
  }
  
  /**
   * Update the panel's content
   */
  update() {
    if (this.isVisible) {
      this.updateAchievements();
    }
  }
}
