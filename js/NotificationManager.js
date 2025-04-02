/**
 * Manages toast notifications with a centralized system
 */
export class NotificationManager {
  constructor() {
    this.container = null;
    this.activeToasts = [];
    this.createContainer();
  }
  
  createContainer() {
    this.container = document.createElement("div");
    this.container.className = "toast-container";
    document.body.appendChild(this.container);
  }
  
  show(message) {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = "auto-save-notification";
    notification.textContent = message;
    
    // Add to container
    this.container.appendChild(notification);
    this.activeToasts.push(notification);
    
    // Remove after delay
    setTimeout(() => {
      if (notification.parentNode === this.container) {
        this.container.removeChild(notification);
        this.activeToasts = this.activeToasts.filter(toast => toast !== notification);
      }
    }, 3000);
  }
}
