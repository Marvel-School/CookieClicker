import { UIComponent } from './UIComponent.js';

export class SettingsPanel extends UIComponent {
  constructor(game, containerElement, toggleElement) {
    super(containerElement, toggleElement);
    this.game = game;
    this.setupButtons();
  }
  
  setupButtons() {
    const saveButton = this.container.querySelector('#saveGame');
    const loadButton = this.container.querySelector('#loadGame');
    const resetButton = this.container.querySelector('#resetGame');
    const soundButton = this.container.querySelector('#toggleSound');
    
    if (saveButton) {
      saveButton.addEventListener('click', () => this.game.saveGame());
      saveButton.addEventListener('mouseover', () => this.game.playHoverSound());
    }
    
    if (loadButton) {
      loadButton.addEventListener('click', () => this.game.loadGame());
      loadButton.addEventListener('mouseover', () => this.game.playHoverSound());
    }
    
    if (resetButton) {
      resetButton.addEventListener('click', () => this.game.resetGame());
      resetButton.addEventListener('mouseover', () => this.game.playHoverSound());
    }
    
    if (soundButton) {
      soundButton.addEventListener('click', () => {
        this.game.soundOn = !this.game.soundOn;
        alert(`Sound is now ${this.game.soundOn ? "ON" : "OFF"}.`);
      });
      soundButton.addEventListener('mouseover', () => this.game.playHoverSound());
    }
  }
}
