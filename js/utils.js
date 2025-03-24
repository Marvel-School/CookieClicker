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
  
  // Add to container (at the beginning for proper stacking)
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

/**
 * Debug function to diagnose UI component visibility issues
 * @param {UIComponent} component - The component to diagnose
 */
export function diagnoseUIComponent(component) {
  if (!component) return;
  
  console.group('UI Component Diagnosis');
  console.log('Component:', component.constructor.name);
  console.log('Internal visible state:', component.visible);
  
  if (component.container) {
    const computedStyle = window.getComputedStyle(component.container);
    console.log('Container display style:', component.container.style.display);
    console.log('Container computed style:', computedStyle.display);
    console.log('Container dimensions:', {
      width: computedStyle.width,
      height: computedStyle.height,
      offsetWidth: component.container.offsetWidth,
      offsetHeight: component.container.offsetHeight
    });
    
    // Check visibility issues
    const isVisible = computedStyle.display !== 'none' && 
                     computedStyle.visibility !== 'hidden' &&
                     parseFloat(computedStyle.opacity) > 0;
    console.log('Effective visibility:', isVisible);
    
    // Check positioning issues
    const rect = component.container.getBoundingClientRect();
    const isInViewport = !(rect.bottom < 0 || 
                          rect.top > window.innerHeight ||
                          rect.right < 0 || 
                          rect.left > window.innerWidth);
    console.log('In viewport:', isInViewport);
    console.log('Position:', rect);
  } else {
    console.error('Container element is missing!');
  }
  
  if (component.toggleElement) {
    console.log('Toggle element exists:', !!component.toggleElement);
    console.log('Toggle element click listeners:', component.toggleElement.onclick ? 'Yes (legacy)' : 'No (legacy)', 
                getEventListeners(component.toggleElement).click ? 'Yes (addEventListener)' : 'No (addEventListener)');
  } else {
    console.error('Toggle element is missing!');
  }
  
  console.groupEnd();
}

// Helper for debugging
function getEventListeners(element) {
  // This is a placeholder - Chrome DevTools has this function but it's not standard
  return { click: element.__events?.click };
}
