export class UIComponent {
  constructor(containerElement, toggleElement) {
    this.container = containerElement;
    this.toggleElement = toggleElement;
    this.visible = false;
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    if (this.toggleElement && this.container) {
      this.toggleElement.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggle();
      });
      
      this.container.addEventListener("click", (e) => {
        e.stopPropagation();
      });
      
      document.addEventListener("click", () => {
        if (this.visible) this.hide();
      });
    }
  }
  
  show() {
    if (this.container) {
      this.container.style.display = "block";
      this.visible = true;
      this.onShow();
    }
  }
  
  hide() {
    if (this.container) {
      this.container.style.display = "none";
      this.visible = false;
      this.onHide();
    }
  }
  
  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  onShow() {}
  onHide() {}
}
