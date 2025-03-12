// Utility functions

export function showToast(message) {
  const notification = document.createElement("div");
  notification.className = "auto-save-notification";
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

export function log(debug, message, ...data) {
  if (debug) {
    console.log(message, ...data);
  }
}

export const AUTO_SAVE_INTERVAL = 60000; // 1 minute
