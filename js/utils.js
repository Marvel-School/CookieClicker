// Utility functions

// Create a container for all toast notifications
let toastContainer = null;
let activeToasts = [];

export function showToast(message) {
  // Create toast container if it doesn't exist
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  // Create the notification
  const notification = document.createElement("div");
  notification.className = "auto-save-notification";
  notification.textContent = message;
  
  // Add to container
  toastContainer.appendChild(notification);
  
  // Track this toast
  activeToasts.push(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode === toastContainer) {
      toastContainer.removeChild(notification);
      activeToasts = activeToasts.filter(toast => toast !== notification);
    }
  }, 3000);
}

export function log(debug, message, ...data) {
  if (debug) {
    console.log(message, ...data);
  }
}

export const AUTO_SAVE_INTERVAL = 60000; // 1 minute
