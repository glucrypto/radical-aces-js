/**
 * Scene Manager
 * Manages game scenes and transitions between them
 */

import GameEngine from "./engine";

// Types of scenes in the game
export enum SceneType {
  START = "start",
  GAME = "game",
  PAUSE = "pause",
  SETTINGS = "settings",
  CREDITS = "credits",
  GAME_OVER = "game_over",
}

// Scene management events
export enum SceneEvent {
  SCENE_CHANGED = "scene_changed",
  SCENE_LOADED = "scene_loaded",
}

export default class SceneManager {
  private engine: GameEngine;
  private currentScene: SceneType | null = null;
  private previousScene: SceneType | null = null;
  private sceneLoadListeners: ((scene: SceneType) => void)[] = [];
  private sceneChangeListeners: ((
    scene: SceneType,
    previous: SceneType | null
  ) => void)[] = [];

  /**
   * Create a new scene manager
   * @param engine Game engine reference
   */
  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  /**
   * Change to a new scene
   * @param scene Scene to change to
   */
  public async changeScene(scene: SceneType): Promise<void> {
    if (scene === this.currentScene) {
      return;
    }

    this.previousScene = this.currentScene;
    this.currentScene = scene;

    // Notify listeners
    this.notifySceneChanged();

    // Handle scene-specific setup
    await this.loadScene(scene);
  }

  /**
   * Load resources for a scene
   * @param scene Scene to load
   */
  private async loadScene(scene: SceneType): Promise<void> {
    // Get the engine to handle scene-specific setup
    if (this.engine.handleSceneChange) {
      await this.engine.handleSceneChange(scene, this.previousScene);
    }

    // Notify that the scene has loaded
    this.notifySceneLoaded();
  }

  /**
   * Add a listener for scene load events
   * @param listener Function to call when a scene is loaded
   */
  public onSceneLoaded(listener: (scene: SceneType) => void): void {
    this.sceneLoadListeners.push(listener);
  }

  /**
   * Add a listener for scene change events
   * @param listener Function to call when a scene is changed
   */
  public onSceneChanged(
    listener: (scene: SceneType, previous: SceneType | null) => void
  ): void {
    this.sceneChangeListeners.push(listener);
  }

  /**
   * Remove a scene load listener
   * @param listener Listener to remove
   */
  public removeSceneLoadedListener(listener: (scene: SceneType) => void): void {
    this.sceneLoadListeners = this.sceneLoadListeners.filter(
      (l) => l !== listener
    );
  }

  /**
   * Remove a scene change listener
   * @param listener Listener to remove
   */
  public removeSceneChangedListener(
    listener: (scene: SceneType, previous: SceneType | null) => void
  ): void {
    this.sceneChangeListeners = this.sceneChangeListeners.filter(
      (l) => l !== listener
    );
  }

  /**
   * Notify all scene load listeners
   */
  private notifySceneLoaded(): void {
    if (this.currentScene) {
      this.sceneLoadListeners.forEach((listener) => {
        listener(this.currentScene as SceneType);
      });
    }
  }

  /**
   * Notify all scene change listeners
   */
  private notifySceneChanged(): void {
    if (this.currentScene) {
      this.sceneChangeListeners.forEach((listener) => {
        listener(this.currentScene as SceneType, this.previousScene);
      });
    }
  }

  /**
   * Get the current scene
   */
  public getCurrentScene(): SceneType | null {
    return this.currentScene;
  }

  /**
   * Get the previous scene
   */
  public getPreviousScene(): SceneType | null {
    return this.previousScene;
  }

  /**
   * Return to the previous scene
   */
  public async returnToPreviousScene(): Promise<void> {
    if (this.previousScene) {
      await this.changeScene(this.previousScene);
    }
  }
}
