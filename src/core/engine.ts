/**
 * Main game engine for Radical Aces
 * Handles initialization, game loop, and core systems
 */

import * as THREE from "three";
import { GameScene } from "../scenes/GameScene";
import { LoadingScreen } from "../ui/loading-screen";
import StartScreen from "../ui/start-screen";
import DebugTools from "../utils/debug";
import { AssetManager } from "./assets/asset-manager";
import { AssetManifest } from "./assets/asset-types";
import InputManager from "./input";
import SceneManager, { SceneType } from "./scene-manager";
import TimeManager from "./time";

export default class GameEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private debugTools: DebugTools;
  private assetManager: AssetManager;
  private loadingScreen: LoadingScreen;
  private sceneManager: SceneManager;
  private startScreen: StartScreen;
  private debugMode: boolean = false;

  // Debug objects
  private debugCube: THREE.Mesh | null = null;

  // Environment objects
  private sky: THREE.Mesh | null = null;
  private ground: THREE.Mesh | null = null;

  // Game scene
  private gameScene: GameScene | null = null;

  // Core systems
  private inputManager: InputManager;
  private timeManager: TimeManager;

  constructor() {
    // Initialize Three.js components
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      200000
    );
    this.camera.position.set(0, 3, 10);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x87ceeb);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Initialize debug tools
    this.debugTools = new DebugTools();

    // Listen for debug events
    window.addEventListener("debug:skipToMainMenu", ((event: CustomEvent) => {
      this.setDebugMode(event.detail.enabled);

      // If we're already showing the start screen, update it immediately
      if (
        this.sceneManager &&
        this.sceneManager.getCurrentScene() === SceneType.START
      ) {
        if (event.detail.enabled) {
          this.skipToMainMenu();
        } else {
          // Restart the start screen flow from the beginning
          this.startScreen.show();
        }
      }
    }) as EventListener);

    // Initialize asset manager
    this.assetManager = new AssetManager();

    // Initialize loading screen
    this.loadingScreen = new LoadingScreen({
      backgroundColor: "#000000",
      progressBarColor: "#ff4444",
      textColor: "#ffffff",
    });

    // Initialize scene manager
    this.sceneManager = new SceneManager(this);

    // Initialize start screen with debug mode setting
    this.startScreen = new StartScreen({
      onStart: () => this.startGame(),
      onSettings: () => this.openSettings(),
      onCredits: () => this.openCredits(),
      onExit: () => this.exitGame(),
      onResume: () => this.resumeGame(),
      hasSavedGame: false,
      backgroundUrl: "assets/graphics/main.gif",
      debug: this.debugMode,
    });

    // Setup window resize handler
    window.addEventListener("resize", this.onWindowResize.bind(this));

    // Setup scene manager event listeners
    this.sceneManager.onSceneChanged((scene, previous) => {
      this.handleSceneChange(scene, previous);
    });

    // Initialize core systems
    this.inputManager = new InputManager();
    this.timeManager = new TimeManager();
  }

  /**
   * Enable or disable debug mode
   * @param enabled Whether debug mode should be enabled
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;

    // If we already have a start screen, update its debug setting
    if (this.startScreen) {
      // Create a new start screen with updated settings
      this.startScreen = new StartScreen({
        onStart: () => this.startGame(),
        onSettings: () => this.openSettings(),
        onCredits: () => this.openCredits(),
        onExit: () => this.exitGame(),
        onResume: () => this.resumeGame(),
        hasSavedGame: false,
        backgroundUrl: "assets/graphics/main.gif",
        debug: this.debugMode,
      });
    }
  }

  /**
   * Check if debug mode is enabled
   */
  public isDebugMode(): boolean {
    return this.debugMode;
  }

  /**
   * Initialize the game engine
   */
  public async init(): Promise<void> {
    console.log("Game engine initializing...");

    // Show loading screen
    this.loadingScreen.show();
    this.loadingScreen.updateStatus("Loading assets...");

    try {
      // Load essential assets
      await this.loadAssets();

      // Set up the scene
      this.setupScene();

      // Setup debug monitoring for the scene
      this.debugTools.monitorScene(this.scene, this.renderer);

      // Hide loading screen when done
      this.loadingScreen.updateStatus("Ready!");
      await this.loadingScreen.hide();

      // Show start screen
      this.sceneManager.changeScene(SceneType.START);

      return Promise.resolve();
    } catch (error: unknown) {
      console.error("Failed to initialize game engine:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.loadingScreen.updateStatus(`Error: ${errorMessage}`);
      return Promise.reject(error);
    }
  }

  /**
   * Load all required assets
   */
  private async loadAssets(): Promise<void> {
    // Define the asset manifest
    const manifest: AssetManifest = [
      // Add assets here as we need them
      // Example:
      // { id: 'player-ship', url: 'assets/models/ship.glb', type: 'model', priority: 1 }
    ];

    // Set up progress tracking
    this.assetManager.addEventListener("progress", (event) => {
      // Update loading screen progress
      if (event.overallProgress !== undefined) {
        this.loadingScreen.updateProgress(event.overallProgress);
      }

      // Update loading screen status with current asset
      if (event.assetId) {
        this.loadingScreen.updateStatus(`Loading: ${event.assetId}`);
      }
    });

    // Handle errors
    this.assetManager.addEventListener("error", (event) => {
      console.error(`Error loading asset: ${event.assetId}`, event.error);
      this.loadingScreen.updateStatus(`Error loading: ${event.assetId}`);
    });

    // Load all assets
    await this.assetManager.preload(manifest);
  }

  /**
   * Set up the scene with all required elements
   */
  private setupScene(): void {
    // Set up lighting
    this.setupLighting();

    // Create sky backdrop
    this.createSkyBackdrop();

    // Create ground plane
    this.createGroundPlane();

    // Add a debug cube to the scene
    this.createDebugCube();
  }

  /**
   * Set up lighting for the scene
   */
  private setupLighting(): void {
    // Ambient light for overall illumination - warmer tone
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.4);
    this.scene.add(ambientLight);

    // Main directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffcc, 1.2);
    sunLight.position.set(250, 300, -300);
    sunLight.castShadow = true;

    // Configure shadow properties
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 700;

    // Set up shadow camera frustum
    const shadowSize = 300;
    sunLight.shadow.camera.left = -shadowSize;
    sunLight.shadow.camera.right = shadowSize;
    sunLight.shadow.camera.top = shadowSize;
    sunLight.shadow.camera.bottom = -shadowSize;

    this.scene.add(sunLight);

    // Add a secondary light to fill in shadows - slight blue tint
    const fillLight = new THREE.DirectionalLight(0xaaccff, 0.3);
    fillLight.position.set(-150, 50, 100);
    this.scene.add(fillLight);
  }

  /**
   * Create a sky backdrop for the scene
   */
  private createSkyBackdrop(): void {
    // Create sky dome with optimized parameters
    const skyGeometry = new THREE.SphereGeometry(150000, 32, 16);

    // Create a better gradient texture for the sky with more color stops
    const canvas = document.createElement("canvas");
    canvas.width = 1024; // Higher resolution texture
    canvas.height = 1024;
    const context = canvas.getContext("2d");

    if (context) {
      // Create a more detailed sky gradient
      const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#0a1a40"); // Deep blue at the zenith
      gradient.addColorStop(0.2, "#1e3c72"); // Deep blue
      gradient.addColorStop(0.4, "#2a5298"); // Mid-blue
      gradient.addColorStop(0.6, "#4d71b7"); // Lighter blue
      gradient.addColorStop(0.8, "#7aa0d2"); // Pale blue
      gradient.addColorStop(1, "#a7c8ff"); // Light blue at the horizon

      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Add some noise/texture to the sky to make it less flat
      for (let i = 0; i < 10000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.5; // More noise in upper half
        const radius = Math.random() * 1.5 + 0.5;
        const opacity = Math.random() * 0.03;

        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        context.fill();
      }
    }

    // Create the texture and material with better settings
    const skyTexture = new THREE.CanvasTexture(canvas);
    skyTexture.wrapS = THREE.ClampToEdgeWrapping;
    skyTexture.wrapT = THREE.ClampToEdgeWrapping;
    skyTexture.minFilter = THREE.LinearFilter;

    const skyMaterial = new THREE.MeshBasicMaterial({
      map: skyTexture,
      side: THREE.BackSide, // Render on inside of sphere
      fog: false, // Sky shouldn't be affected by fog
      depthWrite: false, // Don't write to depth buffer
    });

    // Create the sky dome and position it to follow the camera
    this.sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(this.sky);

    // Add a distant sun with glow
    const sunGeometry = new THREE.SphereGeometry(3000, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffdd,
      fog: false,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(50000, 40000, -80000);
    this.scene.add(sun);

    // Add a subtle sun glow
    const sunGlowGeometry = new THREE.SphereGeometry(4500, 32, 32);
    const sunGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffaa,
      transparent: true,
      opacity: 0.3,
      fog: false,
    });
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    sunGlow.position.copy(sun.position);
    this.scene.add(sunGlow);

    // Add fog with appropriate settings for our large scale desert
    // Use a color that matches the horizon color from the sky gradient
    this.scene.fog = new THREE.FogExp2("#a7c8ff", 0.000008);
  }

  /**
   * Create a ground plane for the scene
   */
  private createGroundPlane(): void {
    // Create a large ground plane
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);

    // Create a checker pattern for the ground texture
    const textureSize = 2048;
    const gridSize = 40;
    const squareSize = textureSize / gridSize;

    const canvas = document.createElement("canvas");
    canvas.width = textureSize;
    canvas.height = textureSize;
    const context = canvas.getContext("2d");

    if (context) {
      // Use a color scheme inspired by the original game
      const primaryColor = "#8eb14e"; // Green base
      const secondaryColor = "#749440"; // Darker green for alternating squares
      const gridLineColor = "#617a35"; // Even darker for grid lines

      // Fill with primary color
      context.fillStyle = primaryColor;
      context.fillRect(0, 0, textureSize, textureSize);

      // Draw alternating pattern
      context.fillStyle = secondaryColor;

      for (let i = 0; i < gridSize; i += 2) {
        for (let j = 0; j < gridSize; j += 2) {
          // Draw checkerboard pattern (every other square)
          context.fillRect(
            i * squareSize,
            j * squareSize,
            squareSize,
            squareSize
          );
          context.fillRect(
            (i + 1) * squareSize,
            (j + 1) * squareSize,
            squareSize,
            squareSize
          );
        }
      }

      // Draw grid lines
      context.strokeStyle = gridLineColor;
      context.lineWidth = 2;

      for (let i = 0; i <= gridSize; i++) {
        const pos = i * squareSize;

        // Draw horizontal line
        context.beginPath();
        context.moveTo(0, pos);
        context.lineTo(textureSize, pos);
        context.stroke();

        // Draw vertical line
        context.beginPath();
        context.moveTo(pos, 0);
        context.lineTo(pos, textureSize);
        context.stroke();
      }
    }

    // Create the ground material with the texture
    const groundTexture = new THREE.CanvasTexture(canvas);

    // Repeat the texture for a larger ground
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(4, 4);

    const groundMaterial = new THREE.MeshStandardMaterial({
      map: groundTexture,
      roughness: 0.9,
      metalness: 0.1,
    });

    // Create the ground mesh
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.ground.position.y = 0; // At ground level
    this.ground.receiveShadow = true;

    this.scene.add(this.ground);
  }

  /**
   * Create a simple debug cube
   */
  private createDebugCube(): void {
    // Create a cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      roughness: 0.5,
      metalness: 0.2,
    });
    this.debugCube = new THREE.Mesh(geometry, material);
    this.debugCube.position.set(0, 0, 0);
    this.debugCube.castShadow = true;
    this.debugCube.receiveShadow = true;
    this.scene.add(this.debugCube);
  }

  /**
   * Handle scene changes
   * @param scene New scene
   * @param previous Previous scene
   */
  public async handleSceneChange(
    scene: SceneType,
    previous: SceneType | null
  ): Promise<void> {
    console.log(`Scene changed from ${previous} to ${scene}`);

    // Handle scene-specific setup
    switch (scene) {
      case SceneType.START:
        this.showStartScreen();
        break;
      case SceneType.GAME:
        await this.showGameScene();
        break;
      case SceneType.PAUSE:
        this.showPauseScreen();
        break;
      case SceneType.SETTINGS:
        this.showSettingsScreen();
        break;
      case SceneType.CREDITS:
        this.showCreditsScreen();
        break;
      case SceneType.GAME_OVER:
        this.showGameOverScreen();
        break;
    }
  }

  /**
   * Show start screen
   */
  private showStartScreen(): void {
    this.startScreen.show();
  }

  /**
   * Show game scene
   */
  private async showGameScene(): Promise<void> {
    // Hide any UI elements that shouldn't be visible during gameplay
    if (this.startScreen) {
      this.startScreen.hide();
    }

    // Create and initialize game scene if it doesn't exist
    if (!this.gameScene) {
      // Reset camera position to avoid any jarring transitions
      this.camera.position.set(0, 25, -2985); // Starting position - aircraft will be at 0,20,-3000
      this.camera.lookAt(0, 20, -3000); // Look at where the aircraft will be

      this.gameScene = new GameScene(
        this.scene,
        this.camera,
        this.assetManager
      );
      await this.gameScene.init();
    }
  }

  /**
   * Show pause screen
   */
  private showPauseScreen(): void {
    // Implementation needed
  }

  /**
   * Show settings screen
   */
  private showSettingsScreen(): void {
    // Implementation needed
  }

  /**
   * Show credits screen
   */
  private showCreditsScreen(): void {
    // Implementation needed
  }

  /**
   * Show game over screen
   */
  private showGameOverScreen(): void {
    // Implementation needed
  }

  /**
   * Start the game
   */
  private startGame(): void {
    console.log("Starting game...");

    // Change to the game scene
    this.sceneManager.changeScene(SceneType.GAME);
  }

  /**
   * Skip to main menu (for testing)
   */
  public skipToMainMenu(): void {
    if (this.startScreen) {
      this.startScreen.skipToMainMenu();
    }
  }

  /**
   * Open settings
   */
  private openSettings(): void {
    console.log("Opening settings...");
    this.sceneManager.changeScene(SceneType.SETTINGS);
  }

  /**
   * Open credits
   */
  private openCredits(): void {
    console.log("Opening credits...");
    this.sceneManager.changeScene(SceneType.CREDITS);
  }

  /**
   * Exit the game
   */
  private exitGame(): void {
    console.log("Exiting game...");
    // In a web context, we might want to show a confirmation dialog
    // or redirect to another page
    if (confirm("Are you sure you want to exit?")) {
      window.close(); // This may not work in all browsers due to security restrictions
    }
  }

  /**
   * Resume a saved game
   */
  private resumeGame(): void {
    console.log("Resuming saved game...");
    // For now, this is the same as starting a new game since we don't have save functionality yet
    this.sceneManager.changeScene(SceneType.GAME);
  }

  /**
   * Start the game loop
   */
  public start(): void {
    // Only start if not already running
    if (this.animationFrameId === null) {
      console.log("Game engine starting...");
      this.lastTime = performance.now();
      this.animate();
    }
  }

  /**
   * Stop the game loop
   */
  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Get the DOM element for the renderer
   */
  public getDomElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  /**
   * Handle window resize
   */
  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Animation loop
   */
  private animate(): void {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Update game state here
    this.update(deltaTime);

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Update game state
   * @param deltaTime Time since last frame in seconds
   */
  private update(deltaTime: number): void {
    // Update based on the current scene type
    if (
      this.sceneManager.getCurrentScene() === SceneType.GAME &&
      this.gameScene
    ) {
      this.gameScene.update(deltaTime, this.inputManager, this.timeManager);
    }

    // Make sure the sky dome follows the camera
    if (this.sky) {
      this.sky.position.copy(this.camera.position);
    }

    // Update debug tools
    if (this.debugMode) {
      this.updateDebugTools(deltaTime);
    }
  }

  /**
   * Update debug tools
   * @param deltaTime Time since last frame in seconds
   */
  private updateDebugTools(deltaTime: number): void {
    // Rotate the debug cube
    if (this.debugCube) {
      this.debugCube.rotation.x += 0.5 * deltaTime;
      this.debugCube.rotation.y += 0.8 * deltaTime;
    }
  }

  /**
   * Skip directly to the game scene for testing
   */
  public skipToGame(): void {
    this.startGame();
  }
}
