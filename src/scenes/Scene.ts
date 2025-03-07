import InputManager from "../core/input";
import TimeManager from "../core/time";

/**
 * Interface for all game scenes
 * Every scene should implement this interface
 */
export interface Scene {
  /**
   * Initialize the scene
   * Called when the scene is first created
   */
  init(): void | Promise<void>;

  /**
   * Update the scene
   * Called every frame
   * @param deltaTime The time elapsed since the last frame in seconds
   * @param inputManager The input manager instance for handling user input
   * @param timeManager The time manager instance
   */
  update(
    deltaTime: number,
    inputManager: InputManager,
    timeManager: TimeManager
  ): void;

  /**
   * Clean up the scene
   * Called when the scene is destroyed/removed
   */
  destroy(): void;
}
