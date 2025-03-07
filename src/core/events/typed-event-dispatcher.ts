/**
 * Typed Event Dispatcher
 * Provides a type-safe wrapper around Three.js's EventDispatcher
 */

import { EventDispatcher } from "three";

/**
 * Type-safe event dispatcher that wraps Three.js EventDispatcher
 */
export class TypedEventDispatcher extends EventDispatcher {
  /**
   * Dispatch an event with the given type and optional properties
   * @param type The event type
   * @param properties Additional event properties
   */
  dispatch(type: string, properties: Record<string, any> = {}): void {
    // Create event object with type and all properties
    const event = { type, ...properties };

    // Use the base EventDispatcher to dispatch the event
    super.dispatchEvent(event);
  }
}
