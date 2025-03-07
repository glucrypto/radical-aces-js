/**
 * Additional type declarations for Three.js
 * These augment the built-in Three.js typings to allow for more flexible event handling
 */

import "three";

// Augment the Event interface in Three.js to allow for any event type
declare module "three" {
  interface Event {
    [key: string]: any;
  }

  // Modify EventDispatcher to accept any event object
  interface EventDispatcher {
    dispatchEvent(event: { type: string; [key: string]: any }): void;
  }
}
