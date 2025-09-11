/**
 * Event system for declarative UI interactions
 */

// Handler type for data-action elements
type Handler = (el: HTMLElement) => void;

// Registry of action handlers
const registry: Record<string, Handler> = {};

/**
 * Register an action handler
 */
export function register(action: string, handler: Handler): void {
  registry[action] = handler;
}

/**
 * Wire up all data-action elements in the DOM
 */
export function wire(root: Document | HTMLElement = document): void {
  root.querySelectorAll<HTMLElement>('[data-action]').forEach(el => {
    // Skip already wired elements
    if (el.dataset.wired) return;
    
    const action = el.dataset.action!;
    
    // Add click handler
    el.addEventListener('click', () => {
      if (registry[action]) {
        registry[action](el);
      } else {
        console.warn(`No handler registered for action: ${action}`);
      }
    });
    
    // Mark as wired
    el.dataset.wired = '1';
  });
}

/**
 * Unwire all data-action handlers
 */
export function unwire(root: Document | HTMLElement = document): void {
  root.querySelectorAll<HTMLElement>('[data-action][data-wired="1"]').forEach(el => {
    const action = el.dataset.action!;
    
    // Remove all click handlers
    el.replaceWith(el.cloneNode(true));
    
    // Remove wired marker
    delete el.dataset.wired;
  });
}
