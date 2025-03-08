import * as THREE from "three";
import { AssetManager } from "../core/assets/asset-manager";
import InputManager, { InputKey } from "../core/input";
import { Level } from "../core/levels/level";
import { LevelLoader } from "../core/levels/level-loader";
import TimeManager from "../core/time";
import PlayerAircraft from "../entities/player/PlayerAircraft";
import { Scene } from "../scenes/Scene";
import { SimpleHUD } from "../ui/simple-hud";

export class GameScene implements Scene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private playerAircraft: PlayerAircraft;
  private followCamOffset: THREE.Vector3 = new THREE.Vector3(0, 3, 1);
  private hud: SimpleHUD;
  private levelLoader: LevelLoader;
  private currentLevel: Level | null = null;
  private assetManager: AssetManager;
  private currentLevelId: number = 0;
  private currentLookTarget: THREE.Vector3 | null = null;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    assetManager: AssetManager
  ) {
    this.scene = scene;
    this.camera = camera;

    // Ensure camera can see the distant sky dome
    camera.far = 200000;
    // Set a narrower field of view to make the aircraft appear larger
    camera.fov = 45; // Default is typically 60 or 75
    camera.updateProjectionMatrix();

    this.assetManager = assetManager;

    // Initialize the level loader
    this.levelLoader = new LevelLoader(this.assetManager);

    // Initialize the player aircraft
    this.playerAircraft = new PlayerAircraft({
      maxSpeed: 100,
      acceleration: 0.05,
      deceleration: 0.02,
      turnRate: 0.02,
      pitchRate: 0.02,
      rollRate: 0.03,
      modelType: 1, // E-7 Sky Bullet
    });

    // Add the player aircraft to the scene
    this.scene.add(this.playerAircraft.getObject());

    // Position aircraft directly on the runway (Y value of 2 instead of 20)
    // This prevents the "dropping" effect when the game starts
    this.playerAircraft.setPosition(new THREE.Vector3(0, 2, -3000));

    // Pre-position the camera to match where it will be in gameplay
    // This prevents an initial "zoom" effect when the game starts
    const aircraftPos = this.playerAircraft.getPosition();
    this.camera.position.set(
      aircraftPos.x,
      aircraftPos.y + this.followCamOffset.y,
      aircraftPos.z + this.followCamOffset.z
    );
    this.camera.lookAt(aircraftPos);

    // Initialize HUD
    this.hud = new SimpleHUD();
  }

  public async init(): Promise<void> {
    console.log("Game scene initialized");

    // Load the initial level (level 0)
    await this.loadLevel(this.currentLevelId);
  }

  /**
   * Load a level
   * @param levelId Level ID to load
   */
  private async loadLevel(levelId: number): Promise<void> {
    console.log(`Loading level ${levelId}`);

    // Clean up current level if exists
    if (this.currentLevel) {
      this.currentLevel.destroy();
      this.currentLevel = null;
    }

    // Load the new level
    this.currentLevel = await this.levelLoader.loadLevel(levelId, this.scene);

    // Position player aircraft directly on the runway (Y value of 2 instead of 20)
    // This prevents the "dropping" effect when the game starts
    this.playerAircraft.setPosition(new THREE.Vector3(0, 2, -3000));

    // Reset player aircraft state
    this.playerAircraft.resetState();

    // Position camera perfectly at the start - no lerping
    // This prevents any zoom-in effect when the level starts
    const aircraftPos = this.playerAircraft.getPosition().clone();
    const aircraftRotation = this.playerAircraft.getRotation();

    // Use the followCamOffset values for consistency
    const followDistance = this.followCamOffset.z;
    const heightOffset = this.followCamOffset.y;

    // Position camera directly behind aircraft immediately
    this.camera.position.set(
      aircraftPos.x - Math.sin(aircraftRotation.y) * followDistance,
      aircraftPos.y + heightOffset,
      aircraftPos.z - Math.cos(aircraftRotation.y) * followDistance
    );

    // Make camera look at aircraft immediately
    this.camera.lookAt(aircraftPos);
  }

  public update(
    deltaTime: number,
    inputManager: InputManager,
    timeManager: TimeManager
  ): void {
    // Check for aircraft model switching
    this.handleAircraftModelSwitching(inputManager);

    // Update player aircraft
    this.playerAircraft.update(deltaTime, inputManager);

    // Update camera position to follow the player aircraft
    this.updateCamera();

    // Update current level
    if (this.currentLevel) {
      this.currentLevel.update(deltaTime);
    }

    // Update HUD with position and throttle information
    const position = this.playerAircraft.getPosition();
    this.hud.update(
      this.playerAircraft.getModelType(),
      this.playerAircraft.getCurrentSpeed(),
      position.y,
      this.playerAircraft.getThrottle()
    );
  }

  /**
   * Update camera to follow the player aircraft
   */
  private updateCamera(): void {
    // Get the aircraft position and rotation
    const aircraftPos = this.playerAircraft.getPosition().clone();
    const aircraftRotation = this.playerAircraft.getRotation();

    // Use the follow camera offset values
    const followDistance = this.followCamOffset.z;
    const heightOffset = this.followCamOffset.y;

    // Calculate the ideal camera position - this will be behind the aircraft
    const targetX =
      aircraftPos.x - Math.sin(aircraftRotation.y) * followDistance;
    const targetY = aircraftPos.y + heightOffset;
    const targetZ =
      aircraftPos.z - Math.cos(aircraftRotation.y) * followDistance;

    // Smoothing factor for camera position - creates follow delay
    const positionSmoothingFactor = 0.1; // Increased from 0.05 to 0.1 for tighter following

    // Interpolate current camera position with target position
    this.camera.position.x +=
      (targetX - this.camera.position.x) * positionSmoothingFactor;
    this.camera.position.y +=
      (targetY - this.camera.position.y) * positionSmoothingFactor;
    this.camera.position.z +=
      (targetZ - this.camera.position.z) * positionSmoothingFactor;

    // Create a base look position directly at the aircraft
    // This is where we want to look when flying straight
    const baseLookTarget = new THREE.Vector3(
      aircraftPos.x,
      aircraftPos.y - 1.5, // Look down to see more of the aircraft top
      aircraftPos.z + 3 // Look ahead of the aircraft slightly
    );

    // Calculate roll-based offset (for dynamic movement during turns)
    // First, create a vector from camera to aircraft
    const cameraToAircraft = new THREE.Vector3();
    cameraToAircraft.subVectors(aircraftPos, this.camera.position);

    // Cross product of up vector and aircraft-to-camera gives us the "side" direction
    const upVector = new THREE.Vector3(0, 1, 0);
    const turnDirection = new THREE.Vector3();
    turnDirection.crossVectors(cameraToAircraft, upVector).normalize();

    // Scale the turn offset based on the aircraft's roll angle
    const rollOffset = aircraftRotation.z * 10; // Controls how much aircraft shifts in frame during turns

    // Apply the roll offset to create a target look position
    const lookAtPosition = baseLookTarget.clone();
    lookAtPosition.x += turnDirection.x * rollOffset;
    lookAtPosition.z += turnDirection.z * rollOffset;

    // Smoothing factor for camera look target - creates view lag
    // Higher = faster centering when aircraft levels out
    const lookSmoothingFactor = 0.15;

    // Create a current look target property if it doesn't exist
    if (!this.currentLookTarget) {
      this.currentLookTarget = baseLookTarget.clone();
    }

    // Smoothly transition the look target
    this.currentLookTarget.x +=
      (lookAtPosition.x - this.currentLookTarget.x) * lookSmoothingFactor;
    this.currentLookTarget.y +=
      (lookAtPosition.y - this.currentLookTarget.y) * lookSmoothingFactor;
    this.currentLookTarget.z +=
      (lookAtPosition.z - this.currentLookTarget.z) * lookSmoothingFactor;

    // Point the camera at the smoothed look target
    this.camera.lookAt(this.currentLookTarget);
  }

  /**
   * Handle aircraft model switching with number keys
   */
  private handleAircraftModelSwitching(inputManager: InputManager): void {
    // Switch aircraft models with number keys 1-5
    if (inputManager.isKeyPressed(InputKey.ONE)) {
      this.playerAircraft.setModelType(1);
    } else if (inputManager.isKeyPressed(InputKey.TWO)) {
      this.playerAircraft.setModelType(2);
    } else if (inputManager.isKeyPressed(InputKey.THREE)) {
      this.playerAircraft.setModelType(3);
    } else if (inputManager.isKeyPressed(InputKey.FOUR)) {
      this.playerAircraft.setModelType(4);
    } else if (inputManager.isKeyPressed(InputKey.FIVE)) {
      this.playerAircraft.setModelType(5);
    }
  }

  public destroy(): void {
    // Clean up
    this.scene.remove(this.playerAircraft.getObject());

    // Destroy current level if exists
    if (this.currentLevel) {
      this.currentLevel.destroy();
      this.currentLevel = null;
    }

    // Destroy HUD
    this.hud.destroy();
  }
}
