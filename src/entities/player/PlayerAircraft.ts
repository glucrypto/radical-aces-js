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
  private isInBankedTurn: boolean = false; // New flag to track banked turn state

  constructor(config: PlayerAircraftConfig) {
    // Initialize physics properties
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0, "YXZ");
    this.rotationVelocity = new THREE.Vector3(0, 0, 0);

    // Set characteristics for arcade-style flight
    // High values make controls more responsive
    this.maxSpeed = config.maxSpeed || 200;
    this.accelerationRate = config.acceleration || 0.2;
    this.decelerationRate = config.deceleration || 0.2;
    this.turnRate = config.turnRate || 0.2;
    this.pitchRate = config.pitchRate || 0.2;
    this.rollRate = config.rollRate || 0.2;
    this.modelType = config.modelType || 1;

    // Start with zero throttle for no immediate movement
    this.throttle = 0.0;
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
    // Process user input FIRST - this should set our exact rotation values
    this.handleInput(inputManager);

    // Then apply physics which should NEVER modify rotation values
    this.updatePhysics(deltaTime);

    // Finally update aircraft position and rotation based on velocity
    // This should directly apply our rotation to the mesh without any other changes
    this.updateTransform();
  }

  private handleInput(inputManager: InputManager): void {
    // Reset banked turn flag
    this.isInBankedTurn = false;

    // Get key states
    const up =
      inputManager.isKeyPressed(InputKey.UP) ||
      inputManager.isKeyPressed(InputKey.W);
    const down =
      inputManager.isKeyPressed(InputKey.DOWN) ||
      inputManager.isKeyPressed(InputKey.S);
    const left =
      inputManager.isKeyPressed(InputKey.LEFT) ||
      inputManager.isKeyPressed(InputKey.A);
    const right =
      inputManager.isKeyPressed(InputKey.RIGHT) ||
      inputManager.isKeyPressed(InputKey.D);

    // EXTREME SPEED CONTROLS
    // SHIFT = Rocket boost (extreme acceleration)
    this.isAccelerating = inputManager.isKeyPressed(InputKey.SHIFT);

    // Z KEY FOR DECELERATION - reliable brake key
    this.isDecelerating = inputManager.isKeyPressed(InputKey.Z);

    // SIMPLE BUT FLUID CONTROLS
    // Use a consistent turn rate
    const turnRate = 0.025; // Increased significantly for faster turns

    // Target values for smoother transitions
    let targetPitch = 0;
    let targetRoll = 0;

    // LEFT+UP = EXTREME BANK LEFT AND CLIMB
    if (left && up) {
      // Set target values for EXTREME banking
      targetRoll = -1.4; // Almost vertical bank for extreme fighter jet turns (-80 degrees)
      targetPitch = -0.3; // Nose up

      // Turn based on bank angle - much faster turn rate
      this.rotation.y += turnRate * 3.0;

      this.isInBankedTurn = true;
    }
    // RIGHT+UP = EXTREME BANK RIGHT AND CLIMB
    else if (right && up) {
      // Set target values for EXTREME banking
      targetRoll = 1.4; // Almost vertical bank for fighter jet turns (80 degrees)
      targetPitch = -0.3; // Nose up

      // Turn based on bank angle - much faster turn rate
      this.rotation.y -= turnRate * 3.0;

      this.isInBankedTurn = true;
    }
    // Individual controls
    else {
      // Process UP/DOWN controls
      if (up) {
        targetPitch = -0.3; // Pitch up
      } else if (down) {
        targetPitch = 0.3; // Pitch down
      }

      // Process LEFT/RIGHT controls - EXTREME BANKING
      if (left) {
        targetRoll = -1.2; // EXTREME roll for fighter jet (about 70 degrees bank)
        this.rotation.y += turnRate * 2.5; // Much faster turn rate
      } else if (right) {
        targetRoll = 1.2; // EXTREME roll for fighter jet (about 70 degrees bank)
        this.rotation.y -= turnRate * 2.5; // Much faster turn rate
      }
    }

    // MUCH FASTER RESPONSE - fighter jets respond extremely quickly
    // Transition rate - MUCH higher for instant fighter jet response
    const transitionRate = 0.3; // Doubled from 0.15 for very fast response

    // Smooth transition for pitch (up/down)
    if (Math.abs(this.rotation.x - targetPitch) < 0.01) {
      this.rotation.x = targetPitch; // Snap when very close
    } else {
      // Gradual interpolation but much faster
      this.rotation.x += (targetPitch - this.rotation.x) * transitionRate;
    }

    // Fast transition for roll (left/right) - fighter jets roll EXTREMELY quickly
    if (Math.abs(this.rotation.z - targetRoll) < 0.01) {
      this.rotation.z = targetRoll; // Snap when very close
    } else {
      // Fast interpolation for immediate fighter jet response
      this.rotation.z += (targetRoll - this.rotation.z) * transitionRate;
    }
  }

  private updatePhysics(deltaTime: number): void {
    // Faster throttle transitions
    if (this.isAccelerating) {
      this.throttle = Math.min(this.throttle + 0.05, 1); // Maintained at 0.05 for good acceleration
    } else if (this.isDecelerating) {
      this.throttle = Math.max(this.throttle - 0.08, 0); // Maintained at 0.08 for good deceleration
    }

    // Base speed calculation - directly proportional to throttle with no minimum
    const baseSpeed = this.maxSpeed * this.throttle;

    // Calculate velocity based on aircraft direction
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyEuler(this.rotation);

    // Apply higher movement scaling based on aircraft orientation and throttle
    // Further increased the speed multiplier for higher maximum speed
    const speedMultiplier = 3.0; // Increased from 1.8 to 3.0 for much higher speeds
    this.velocity.x = direction.x * baseSpeed * deltaTime * speedMultiplier;
    this.velocity.y = direction.y * baseSpeed * deltaTime * speedMultiplier;
    this.velocity.z = direction.z * baseSpeed * deltaTime * speedMultiplier;

    // Simple lift and gravity
    if (this.throttle > 0.3) {
      // Apply lift proportional to throttle
      this.velocity.y += 0.005 * this.throttle * deltaTime * 60; // Maintained good lift
    }

    // Apply gravity (constant regardless of throttle)
    this.velocity.y -= 0.003 * deltaTime * 60; // Maintained balanced gravity
  }

  private updateTransform(): void {
    // Velocities are already scaled by deltaTime in updatePhysics,
    // so we apply them directly to the position
    this.mesh.position.x += this.velocity.x;
    this.mesh.position.y += this.velocity.y;
    this.mesh.position.z += this.velocity.z;

    // Apply exact rotation values from our controlled variables
    // This should overwrite any previous rotation
    this.mesh.rotation.copy(this.rotation);

    // Visual control surface movements for turns - simulates aileron deflection
    // Get the current roll angle to determine intensity of turn
    const rollAngle = this.rotation.z;

    // Apply visual deflection based on roll angle (without waiting for threshold)
    // Important: For roll, positive is right roll, negative is left roll

    // The deflection direction should match real aircraft control surfaces:
    // When rolling left (negative roll): Right aileron up, left aileron down
    // When rolling right (positive roll): Left aileron up, right aileron down

    // Apply control surface deflection
    if (Math.abs(rollAngle) > 0.02) {
      // Small threshold to avoid tiny movements
      // Apply deflection to control surfaces based on roll direction
      this.applyControlSurfaceDeflection(rollAngle);
    } else {
      // Reset deflection when not turning
      this.resetControlSurfaces();
    }

    // Ground safety
    if (this.mesh.position.y < 5) {
      this.mesh.position.y = 5;
      this.velocity.y = 0;
    }
  }

  /**
   * Apply aileron and control surface deflection during turns
   */
  private applyControlSurfaceDeflection(rollAngle: number): void {
    // Get roll direction and intensity
    const rollDirection = Math.sign(rollAngle);
    const rollIntensity = Math.min(Math.abs(rollAngle) / 0.45, 1);

    // Find control surfaces or wings if they exist in the model
    this.mesh.traverse((child) => {
      // Convert name to lowercase for case-insensitive matching
      const childName = child.name.toLowerCase();

      // Identify wing parts
      const isLeftWing =
        childName.includes("leftwing") ||
        childName.includes("wing_l") ||
        childName.includes("left_wing") ||
        childName.includes("lwing");
      const isRightWing =
        childName.includes("rightwing") ||
        childName.includes("wing_r") ||
        childName.includes("right_wing") ||
        childName.includes("rwing");

      // Identify specific control surfaces if available
      const isLeftAileron =
        childName.includes("leftail") || childName.includes("l_aileron");
      const isRightAileron =
        childName.includes("rightail") || childName.includes("r_aileron");

      // Get the child as a mesh if possible
      const mesh = child as THREE.Mesh;

      if (mesh && mesh.rotation) {
        // CORRECT AILERON DEFLECTION:

        // LEFT ROLL (negative rollAngle):
        // - Right aileron goes UP (negative Z rotation)
        // - Left aileron goes DOWN (positive Z rotation)

        // RIGHT ROLL (positive rollAngle):
        // - Left aileron goes UP (negative Z rotation)
        // - Right aileron goes DOWN (positive Z rotation)

        if (isLeftAileron || isLeftWing) {
          // Left wing/aileron - for LEFT roll goes DOWN, for RIGHT roll goes UP
          // So deflection is opposite of roll direction
          mesh.rotation.z = rollDirection * 0.3 * rollIntensity;
        } else if (isRightAileron || isRightWing) {
          // Right wing/aileron - for LEFT roll goes UP, for RIGHT roll goes DOWN
          // So deflection is same as roll direction but negative
          mesh.rotation.z = -rollDirection * 0.3 * rollIntensity;
        }

        // Handle elevator (pitch control)
        if (childName.includes("elevator") || childName.includes("horz_stab")) {
          // Elevator deflects based on pitch (positive pitch = nose down = positive elevator)
          mesh.rotation.x = this.rotation.x * 0.5;
        }

        // Handle rudder (yaw control)
        if (childName.includes("rudder") || childName.includes("vert_stab")) {
          // Rudder deflects in the direction of turn
          // In a roll, we often use some rudder in the same direction
          mesh.rotation.y = -rollDirection * 0.2 * rollIntensity;
        }
      }
    });
  }

  /**
   * Reset all control surface deflections back to neutral
   */
  private resetControlSurfaces(): void {
    this.mesh.traverse((child) => {
      const childName = child.name.toLowerCase();

      // Check if this is any type of control surface
      const isControlSurface =
        childName.includes("wing") ||
        childName.includes("aileron") ||
        childName.includes("rudder") ||
        childName.includes("stab") ||
        childName.includes("elevator");

      if (isControlSurface) {
        const mesh = child as THREE.Mesh;
        if (mesh && mesh.rotation) {
          // Gradually reset rotations back to zero with smooth damping
          mesh.rotation.z *= 0.8;
          mesh.rotation.x *= 0.8;
          mesh.rotation.y *= 0.8;

          // Snap to zero when very close to avoid tiny values
          if (Math.abs(mesh.rotation.z) < 0.01) mesh.rotation.z = 0;
          if (Math.abs(mesh.rotation.x) < 0.01) mesh.rotation.x = 0;
          if (Math.abs(mesh.rotation.y) < 0.01) mesh.rotation.y = 0;
        }
      }
    });
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
    // Return the actual speed for UI display
    return Math.round(this.maxSpeed * this.throttle);
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
