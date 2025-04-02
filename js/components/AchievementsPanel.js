import { UIComponent } from './UIComponent.js';

export class AchievementsPanel extends UIComponent {
  constructor(game, containerElement, toggleElement, listElement = null) {
    super(game, containerElement, toggleElement);
    
    // Get the achievements list element
    if (typeof listElement === 'string') {
      this.listElement = document.getElementById(listElement);
    } else {
      this.listElement = listElement;
    }
    
    // Initialize after parent constructor is complete
    this.initialize();
  }

  initialize() {
    if (!this.element) {
      console.error('Achievements panel container not found');
      return;
    }
    
    super.initialize();
    
    // Initial update
    this.updateAchievements();
  }
  
  updateAchievements() {
    if (!this.listElement || !this.game.achievements) return;
    
    try {
      // Get earned achievements
      const earnedAchievements = this.game.achievements.filter(a => a.earned);
      
      if (earnedAchievements.length === 0) {
        this.listElement.innerHTML = `
          <div class="no-achievements">
            <p>No achievements yet!</p>
            <p>Keep baking cookies to unlock achievements.</p>
          </div>
        `;
        return;
      }
      
      // Generate HTML for each achievement
      const achievementItems = earnedAchievements.map(ach => {
        return `<li class="achievement-item ${ach.rarity || 'common'}" data-category="${ach.category || ''}">
          <div class="achievement-icon">${ach.icon || '🏆'}</div>
          <div class="achievement-content">
            <h3>${ach.name}</h3>
            <p>${ach.description}</p>
            <span class="achievement-rarity ${ach.rarity || 'common'}">${ach.rarity || 'common'}</span>
          </div>
        </li>`;
      }).join("");
      
      this.listElement.innerHTML = achievementItems;
    } catch (error) {
      console.error('Error updating achievements panel:', error);
    }
  }
}
