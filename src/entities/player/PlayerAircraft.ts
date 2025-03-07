import * as THREE from "three";
import { AircraftModelLoader } from "../../core/assets/aircraft-model-loader";
import InputManager, { InputKey } from "../../core/input";

export interface PlayerAircraftConfig {
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  turnRate: number;
  pitchRate: number;
  rollRate: number;
  model?: THREE.Group;
  modelType?: number; // 1-5 for the 5 aircraft types
}

export default class PlayerAircraft {
  private mesh!: THREE.Group;
  private velocity: THREE.Vector3;
  private acceleration: THREE.Vector3;
  private rotation: THREE.Euler;
  private rotationVelocity: THREE.Vector3;

  // Aircraft characteristics
  private maxSpeed: number;
  private accelerationRate: number;
  private decelerationRate: number;
  private turnRate: number;
  private pitchRate: number;
  private rollRate: number;

  // State
  private throttle: number;
  private isAccelerating: boolean;
  private isDecelerating: boolean;
  private modelType: number;

  constructor(config: PlayerAircraftConfig) {
    // Initialize physics properties
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0, "YXZ");
    this.rotationVelocity = new THREE.Vector3(0, 0, 0);

    // Set aircraft characteristics from config
    this.maxSpeed = config.maxSpeed || 100;
    this.accelerationRate = config.acceleration || 0.05;
    this.decelerationRate = config.deceleration || 0.02;
    this.turnRate = config.turnRate || 0.02;
    this.pitchRate = config.pitchRate || 0.02;
    this.rollRate = config.rollRate || 0.03;
    this.modelType = config.modelType || 1;

    // Initialize state
    this.throttle = 0;
    this.isAccelerating = false;
    this.isDecelerating = false;

    // Create a new group for the aircraft
    this.mesh = new THREE.Group();

    console.log(
      `[PlayerAircraft] Creating aircraft with model type: ${this.modelType}`
    );

    // Position the aircraft at a starting height and with proper orientation
    this.mesh.position.set(0, 100, 0); // Start at appropriate height above the ground
    this.mesh.rotation.set(0, 0, 0); // Face forward

    // Then try to load the real model if specified
    if (this.modelType > 0) {
      console.log(`[PlayerAircraft] Loading model type: ${this.modelType}`);
      this.loadAircraftModel();
    }
  }

  /**
   * Load the aircraft model based on modelType
   */
  private async loadAircraftModel(): Promise<void> {
    try {
      console.log(`[PlayerAircraft] Loading model ${this.modelType}`);

      // Load the aircraft model
      const modelGroup = await AircraftModelLoader.loadAircraftModel(
        this.modelType.toString()
      );

      console.log(
        `[PlayerAircraft] Model loaded, children count: ${modelGroup.children.length}`
      );

      // Keep the fallback model until we fully load the new one
      const fallbackMeshes = [...this.mesh.children];

      // Add the loaded model to our mesh group
      this.mesh.add(modelGroup);

      // Set scale and orientation
      console.log(`[PlayerAircraft] Adjusting model scale and rotation`);

      // Make model face forward - ensure it's oriented right-side up
      // This corrects the model orientation to face forward, not upside-down
      modelGroup.rotation.set(0, Math.PI, 0);

      // Scale to appropriate size relative to runway
      // Increasing from 0.3 to 1.5 to match runway proportions
      modelGroup.scale.set(1.5, 1.5, 1.5);

      // Move it to proper position within the group
      modelGroup.position.set(0, 0, 0);

      // Debug the model - make sure all meshes are visible
      modelGroup.traverse((object: any) => {
        if (object instanceof THREE.Mesh) {
          const mesh = object as THREE.Mesh;
          console.log(
            `[PlayerAircraft] Found mesh: ${mesh.uuid.substring(0, 8)}`,
            `material: ${
              mesh.material instanceof THREE.Material
                ? mesh.material.constructor.name
                : "unknown"
            }`,
            `vertices: ${
              (mesh.geometry as THREE.BufferGeometry).attributes.position
                ?.count || 0
            }`
          );

          // Make sure materials are visible
          if (mesh.material instanceof THREE.Material) {
            mesh.material.transparent = false;
            mesh.material.opacity = 1.0;
            mesh.material.side = THREE.DoubleSide;
            mesh.material.needsUpdate = true;
            mesh.visible = true;
          }
        }
      });

      // Remove any fallback meshes now that we've loaded the real model
      fallbackMeshes.forEach((mesh) => {
        this.mesh.remove(mesh);
      });

      // Ensure the main mesh is visible
      this.mesh.visible = true;
      modelGroup.visible = true;

      console.log(`[PlayerAircraft] Model loading completed`);
    } catch (error) {
      console.error("[PlayerAircraft] Error loading model:", error);
      console.log(`[PlayerAircraft] Creating fallback model`);
    }
  }

  public update(deltaTime: number, inputManager: InputManager): void {
    // Process input to control the aircraft
    this.handleInput(inputManager);

    // Apply physics
    this.updatePhysics(deltaTime);

    // Update the aircraft mesh position and rotation
    this.updateTransform();
  }

  private handleInput(inputManager: InputManager): void {
    // Reset acceleration and rotation flags
    this.isAccelerating = false;
    this.isDecelerating = false;
    this.rotationVelocity.set(0, 0, 0);

    // Handle throttle control - make more responsive
    if (
      inputManager.isKeyPressed(InputKey.UP) ||
      inputManager.isKeyPressed(InputKey.W)
    ) {
      this.isAccelerating = true;
    }

    if (
      inputManager.isKeyPressed(InputKey.DOWN) ||
      inputManager.isKeyPressed(InputKey.S)
    ) {
      this.isDecelerating = true;
    }

    // Handle turning (yaw) control - more arcade-like snappy controls
    if (
      inputManager.isKeyPressed(InputKey.LEFT) ||
      inputManager.isKeyPressed(InputKey.A)
    ) {
      this.rotationVelocity.y = this.turnRate * 1.5; // Increased turning rate
      // Roll the aircraft when turning - more pronounced roll
      this.rotationVelocity.z = this.rollRate * 1.5;
    }

    if (
      inputManager.isKeyPressed(InputKey.RIGHT) ||
      inputManager.isKeyPressed(InputKey.D)
    ) {
      this.rotationVelocity.y = -this.turnRate * 1.5; // Increased turning rate
      // Roll the aircraft in the opposite direction when turning right
      this.rotationVelocity.z = -this.rollRate * 1.5;
    }

    // Handle pitch control - more responsive
    if (inputManager.isKeyPressed(InputKey.Q)) {
      this.rotationVelocity.x = -this.pitchRate * 1.5; // Pitch up - more responsive
    }

    if (inputManager.isKeyPressed(InputKey.E)) {
      this.rotationVelocity.x = this.pitchRate * 1.5; // Pitch down - more responsive
    }

    // Reset roll to level when not turning - quicker auto-leveling
    if (
      !inputManager.isKeyPressed(InputKey.LEFT) &&
      !inputManager.isKeyPressed(InputKey.RIGHT) &&
      !inputManager.isKeyPressed(InputKey.A) &&
      !inputManager.isKeyPressed(InputKey.D)
    ) {
      // Auto-level roll - more quickly return to level flight
      if (this.mesh.rotation.z > 0.01) {
        this.rotationVelocity.z = -this.rollRate * 1.2;
      } else if (this.mesh.rotation.z < -0.01) {
        this.rotationVelocity.z = this.rollRate * 1.2;
      }
    }
  }

  private updatePhysics(deltaTime: number): void {
    // Normalize deltaTime to ensure consistent behavior at different frame rates
    // This is crucial for eliminating jitter
    const normalizedDelta = Math.min(deltaTime, 0.03) * 60; // Cap delta at 30fps equivalent

    // Apply throttle changes with constant rate
    if (this.isAccelerating) {
      // Apply even smoother acceleration from a standstill
      const accelerationFactor = this.throttle < 0.1 ? 0.5 : 1.0;
      this.throttle = Math.min(
        this.throttle +
          this.accelerationRate * accelerationFactor * normalizedDelta,
        1
      );
    } else if (this.isDecelerating) {
      this.throttle = Math.max(
        this.throttle - this.decelerationRate * normalizedDelta,
        0
      );
    }

    // Calculate forward vector based on aircraft's current rotation
    const forwardDirection = new THREE.Vector3(0, 0, 1);
    forwardDirection.applyEuler(this.mesh.rotation);

    // Apply consistent speed calculation
    const currentSpeed = this.maxSpeed * this.throttle;

    // Set velocity with no additional scaling for consistency
    this.velocity.x = forwardDirection.x * currentSpeed * normalizedDelta;
    this.velocity.y = forwardDirection.y * currentSpeed * normalizedDelta;
    this.velocity.z = forwardDirection.z * currentSpeed * normalizedDelta;

    // Apply gravity with constant scaling, but only if we're not on the ground
    // This prevents the "dropping" effect when starting on the runway
    const minGroundHeight = 2.5; // Just slightly above the ground level
    if (this.throttle < 0.3 && this.mesh.position.y > minGroundHeight) {
      const gravityEffect = (0.3 - this.throttle) * 0.15;
      this.velocity.y -= gravityEffect * normalizedDelta;
    }

    // Update rotation with constant rate
    this.rotation.x += this.rotationVelocity.x * normalizedDelta;
    this.rotation.y += this.rotationVelocity.y * normalizedDelta;
    this.rotation.z += this.rotationVelocity.z * normalizedDelta;

    // Apply constraints to prevent extreme rotations
    this.rotation.x = Math.max(
      Math.min(this.rotation.x, Math.PI / 3),
      -Math.PI / 3
    );
  }

  private updateTransform(): void {
    // Apply rotation directly
    this.mesh.rotation.x = this.rotation.x;
    this.mesh.rotation.y = this.rotation.y;
    this.mesh.rotation.z = this.rotation.z;

    // Apply velocity directly to position
    this.mesh.position.add(this.velocity);

    // Simple ground collision detection with constant
    if (this.mesh.position.y < 2) {
      this.mesh.position.y = 2;
      this.velocity.y = 0;
    }
  }

  public getObject(): THREE.Group {
    return this.mesh;
  }

  public getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  public getRotation(): THREE.Euler {
    return this.mesh.rotation.clone();
  }

  public getCurrentSpeed(): number {
    return this.maxSpeed * this.throttle;
  }

  /**
   * Change to a different aircraft model
   * @param modelType The model type (1-5) to change to
   */
  public async changeAircraftModel(modelType: number): Promise<void> {
    if (modelType < 1 || modelType > 5) {
      console.error(`Invalid model type: ${modelType}. Must be between 1-5.`);
      return;
    }

    this.modelType = modelType;
    await this.loadAircraftModel();

    // Aircraft types and their characteristics from the original game
    const models = [
      { name: "E-7 Sky Bullet", speed: 120 },
      { name: "BP-6 Hammer Head", speed: 100 },
      { name: "E-9 Dragon Bird", speed: 90 },
      { name: "EXA-1 Destroyer", speed: 80 },
      { name: "Silver F-51 Legend", speed: 76 },
    ];

    // Set the max speed based on the aircraft type
    this.maxSpeed = models[modelType - 1].speed;

    console.log(`Switched to aircraft: ${models[modelType - 1].name}`);
  }

  public getModelType(): number {
    return this.modelType;
  }

  /**
   * Set the aircraft position
   * @param position The new position
   */
  public setPosition(position: THREE.Vector3): void {
    this.mesh.position.copy(position);
  }

  /**
   * Reset the aircraft to default state
   */
  public resetState(): void {
    // Set velocity to exactly zero
    this.velocity.set(0, 0, 0);
    this.acceleration.set(0, 0, 0);

    // Set perfectly level flight orientation
    this.rotation.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);

    // Start with zero throttle
    this.throttle = 0.0;

    // Reset all rotation velocities to zero
    this.rotationVelocity.set(0, 0, 0);

    // Don't modify the aircraft height here - use the position set explicitly
    // by the GameScene to stay on the runway
  }

  /**
   * Set the aircraft model type
   * @param modelType The model type (1-5)
   */
  public setModelType(modelType: number): void {
    if (modelType === this.modelType) return;

    this.changeAircraftModel(modelType);
  }

  /**
   * Get the current throttle level
   * @returns Current throttle value (0-1)
   */
  public getThrottle(): number {
    return this.throttle;
  }
}
