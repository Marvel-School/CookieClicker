import { UIComponent } from './UIComponent.js';

export class AchievementsPanel extends UIComponent {
  constructor(game, containerElement, toggleElement, listElement) {
    super(containerElement, toggleElement);
    this.game = game;
    this.listElement = listElement;
  }
  
  update(earnedAchievements) {
    if (!this.listElement) return;
    
    if (earnedAchievements.length === 0) {
      this.listElement.innerHTML = `
        <div class="no-achievements">
          <p>No achievements yet!</p>
          <p>Keep baking cookies to unlock achievements.</p>
        </div>
      `;
      return;
    }
    
    const rarityOrder = {
      'legendary': 0,
      'epic': 1,
      'rare': 2,
      'uncommon': 3,
      'common': 4
    };
    
    earnedAchievements.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
    
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
    
    this.listElement.innerHTML = achievementItems;
  }
}
