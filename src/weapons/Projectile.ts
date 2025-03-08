import * as THREE from "three";

/**
 * Configuration options for a projectile
 */
export interface ProjectileConfig {
  // Basic properties
  speed: number;
  damage: number;
  lifetime: number; // in milliseconds
  color?: THREE.Color;
  size?: number;
  hitRadius?: number;

  // Remove advanced properties that aren't in Java
  // gravity?: number;
  // acceleration?: number;
  // hitRadius?: number;

  // Remove trail properties that aren't in Java
  // trailLength?: number; // Length of the trail in segments
  // trailWidth?: number; // Width of the trail
  // trailColor?: THREE.Color; // Color of the trail (defaults to projectile color)
  // trailFadeTime?: number; // How quickly the trail fades (in milliseconds)
}

/**
 * Represents a projectile in the game world
 * Handles movement, collision detection, and visual representation
 */
export default class Projectile {
  // Core components
  private mesh: THREE.Object3D;

  // Physics
  private velocity: THREE.Vector3;
  private position: THREE.Vector3;
  private direction: THREE.Vector3;

  // Reusable static vectors for calculations
  private static readonly _tempVector = new THREE.Vector3();
  private static readonly _tempVector2 = new THREE.Vector3();

  // Properties
  private speed: number;
  private damage: number;
  private hitRadius: number;
  // Remove gravity and acceleration since Java doesn't have these
  // private gravity: number;
  // private acceleration: number;

  // Lifecycle
  private lifetime: number; // Total lifetime in milliseconds
  private age: number = 0; // Current age in milliseconds
  private active: boolean = true;

  // Remove trail effect since Java doesn't have this
  // private trail: THREE.Line | null = null;
  // private trailPoints: THREE.Vector3[] = [];
  // private trailMaxPoints: number;
  // private trailMaterial: THREE.Material | null = null;
  // private trailWidth: number;
  // private trailColor: THREE.Color;
  // private trailFadeTime: number;

  /**
   * Create a new projectile
   */
  constructor(
    position: THREE.Vector3,
    direction: THREE.Vector3,
    config: ProjectileConfig
  ) {
    // Store basic properties
    this.position = position.clone();
    this.direction = direction.normalize().clone();
    this.speed = config.speed;
    this.damage = config.damage;
    this.lifetime = config.lifetime;

    // Set hitRadius based on provided value or default from size
    this.hitRadius = config.hitRadius || (config.size || 1) * 2;

    // Calculate initial velocity
    this.velocity = this.direction.clone().multiplyScalar(this.speed);

    // Create visual mesh
    this.mesh = this.createVisualRepresentation(config);
    this.mesh.position.copy(this.position);

    // Remove trail effect initialization
    // Initialize trail effect if needed
    // if (config.trailLength && config.trailLength > 0) {
    //   this.trailMaxPoints = config.trailLength;
    //   this.trailWidth = config.trailWidth || 1;
    //   this.trailColor = config.trailColor || (config.color || new THREE.Color(1, 1, 1));
    //   this.trailFadeTime = config.trailFadeTime || 300;
    //   this.createTrailEffect();
    // }
  }

  /**
   * Create the visual representation of the projectile
   */
  private createVisualRepresentation(config: ProjectileConfig): THREE.Object3D {
    // Get size and color from config or use defaults
    const size = config.size || 1;
    const color = config.color || new THREE.Color(1, 1, 1);

    // Create a simple, cohesive laser shape
    const laserShape = new THREE.Group();

    // Create an elongated laser projectile shape
    const beamGeometry = new THREE.CylinderGeometry(
      size * 0.2, // Top radius (narrower at front)
      size * 0.5, // Bottom radius (wider at back)
      size * 8, // Length - longer for a better streak effect
      8 // Segments
    );

    // Rotate to align with forward direction (Z-axis)
    beamGeometry.rotateX(Math.PI / 2);

    // Create a glowing material
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.9,
    });

    // Create the main beam
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    laserShape.add(beam);

    return laserShape;
  }

  // Remove createTrailEffect method
  // private createTrailEffect(): void {
  //   ...
  // }

  /**
   * Update the projectile's position and lifecycle
   * @param deltaTime Time since last update in seconds
   * @returns Whether the projectile is still active
   */
  public update(deltaTime: number): boolean {
    if (!this.active) return false;

    // Update age and check if lifetime exceeded
    this.age += deltaTime * 1000; // Convert to milliseconds
    if (this.age >= this.lifetime) {
      this.deactivate();
      return false;
    }

    // Apply velocity to position - ensure projectiles move forward
    // Scale velocity by deltaTime to ensure consistent speed regardless of framerate
    this.position.add(
      Projectile._tempVector2.copy(this.velocity).multiplyScalar(deltaTime)
    );

    // Update mesh position
    this.mesh.position.copy(this.position);

    return true;
  }

  // Remove updateTrail method
  // private updateTrail(previousPosition: THREE.Vector3): void {
  //   ...
  // }

  /**
   * Check if this projectile collides with a target
   */
  public checkCollision(
    targetPosition: THREE.Vector3,
    targetRadius: number
  ): boolean {
    if (!this.active) return false;

    // Calculate distance squared (more efficient than using distance)
    const distanceSquared = this.position.distanceToSquared(targetPosition);

    // Check if the distance is less than the sum of radii
    const radiusSum = this.hitRadius + targetRadius;

    return distanceSquared < radiusSum * radiusSum;
  }

  /**
   * Get the damage this projectile deals
   */
  public getDamage(): number {
    return this.damage;
  }

  /**
   * Get the mesh for this projectile
   */
  public getMesh(): THREE.Object3D {
    return this.mesh;
  }

  /**
   * Get the current position of the projectile
   */
  public getPosition(): THREE.Vector3 {
    return this.position;
  }

  /**
   * Deactivate this projectile
   */
  public deactivate(): void {
    this.active = false;
  }

  /**
   * Check if the projectile is still active
   */
  public isActive(): boolean {
    return this.active;
  }

  /**
   * Clean up resources when this projectile is destroyed
   */
  public dispose(): void {
    // Clean up geometry and materials
    if (this.mesh instanceof THREE.Mesh) {
      const mesh = this.mesh as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => material.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    }

    // Remove trail effect cleanup
    // // Clean up trail if it exists
    // if (this.trail) {
    //   if (this.trail.geometry) this.trail.geometry.dispose();
    //   if (this.trailMaterial) this.trailMaterial.dispose();
    //   this.trail = null;
    //   this.trailMaterial = null;
    // }
  }
}
