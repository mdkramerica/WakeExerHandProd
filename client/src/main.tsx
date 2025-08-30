import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Function to remove development widgets
const removeDevelopmentWidgets = () => {
  // Remove any fixed positioned elements that could be development widgets
  const fixedElements = document.querySelectorAll('div[style*="position: fixed"], iframe[style*="position: fixed"], div[style*="position: absolute"]');
  fixedElements.forEach((element) => {
    const style = (element as HTMLElement).style;
    const computedStyle = window.getComputedStyle(element);
    
    // Check if it's likely a development widget (in corners, small size, blue color, etc.)
    const isInCorner = style.bottom || style.right || computedStyle.bottom !== 'auto' || computedStyle.right !== 'auto';
    const isSmall = element.clientWidth < 200 && element.clientHeight < 200;
    const hasBlueBackground = style.backgroundColor?.includes('rgb(59, 130, 246)') || 
                              style.backgroundColor?.includes('#3b82f6') ||
                              computedStyle.backgroundColor?.includes('rgb(59, 130, 246)');
    
    // Check for white background (potential white block)
    const hasWhiteBackground = style.backgroundColor?.includes('white') ||
                              style.backgroundColor?.includes('#fff') ||
                              style.backgroundColor?.includes('rgb(255, 255, 255)') ||
                              computedStyle.backgroundColor?.includes('rgb(255, 255, 255)');
    
    // Don't remove legitimate UI elements like toasts
    const isLegitimate = element.classList.contains('toast') || 
                        element.getAttribute('role') === 'alert' ||
                        element.getAttribute('aria-live') ||
                        element.id?.includes('toast') ||
                        element.closest('[data-radix-portal]') ||
                        element.closest('[data-radix-dialog]') ||
                        element.closest('[data-radix-dropdown]');
    
    // More aggressive removal on mobile and tablet for bottom-right elements
    const isMobileOrTablet = window.innerWidth < 1024;
    const isBottomRight = (style.bottom && style.right) || 
                         (computedStyle.bottom !== 'auto' && computedStyle.right !== 'auto');
    
    if (((isInCorner || isSmall || hasBlueBackground || (isMobileOrTablet && hasWhiteBackground && isBottomRight)) && !isLegitimate)) {
      console.log('Removing development widget:', element);
      element.remove();
    }
  });
  
  // Additional mobile and tablet-specific cleanup
  if (window.innerWidth < 1024) {
    // Remove any remaining bottom-right positioned elements with white backgrounds
    const bottomRightElements = document.querySelectorAll('*[style*="bottom"][style*="right"]');
    bottomRightElements.forEach((element) => {
      const computed = window.getComputedStyle(element);
      const isWhite = computed.backgroundColor.includes('rgb(255, 255, 255)') || 
                     computed.backgroundColor.includes('#fff') ||
                     computed.backgroundColor === 'white';
      const isFixed = computed.position === 'fixed' || computed.position === 'absolute';
      const isLegitimate = element.closest('[data-radix-portal]') || 
                          element.classList.contains('toast') ||
                          element.getAttribute('role') === 'alert';
      
      if (isWhite && isFixed && !isLegitimate) {
        console.log('Removing mobile white block:', element);
        element.remove();
      }
    });
  }
};

// Run immediately and set up observers
removeDevelopmentWidgets();

// Set up mutation observer to catch dynamically added widgets
const observer = new MutationObserver((mutations) => {
  let shouldRemoveWidgets = false;
  
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const style = element.style;
          const computed = window.getComputedStyle(element);
          
          // Check if this is a potential widget
          const isPositioned = style.position === 'fixed' || style.position === 'absolute' ||
                              computed.position === 'fixed' || computed.position === 'absolute';
          const isInCorner = (style.bottom && style.right) || 
                           (computed.bottom !== 'auto' && computed.right !== 'auto');
          
          if (isPositioned && isInCorner) {
            shouldRemoveWidgets = true;
          }
        }
      });
    }
  });
  
  if (shouldRemoveWidgets) {
    setTimeout(removeDevelopmentWidgets, 100); // Small delay to let the element fully render
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Also run periodically as a backup
setInterval(removeDevelopmentWidgets, 2000);

createRoot(document.getElementById("root")!).render(<App />);
