import * as THREE from "three";
import Projectile, { ProjectileConfig } from "./Projectile";

/**
 * Manager class for handling multiple projectiles in the game
 * Responsible for creating, updating, and disposing of projectiles
 */
export default class ProjectileManager {
  private scene: THREE.Scene;
  private projectiles: Projectile[] = [];
  private defaultProjectileConfig: ProjectileConfig;
  private maxProjectiles: number = 20; // Match Java's limit of 20 projectiles

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Set up default projectile configuration based on Java implementation
    this.defaultProjectileConfig = {
      speed: 350, // Increased from 200 to make projectiles more visible and match Java feel
      damage: 3, // Match Java's default damage
      lifetime: 1500, // Reduced from 2000ms to 1500ms to prevent too many projectiles existing at once
      color: new THREE.Color(1.0, 0.8, 0.0), // Bright gold laser
      size: 1.2, // Reduced size for a sleeker look
      hitRadius: 2.4, // Match Java's collision radius (2x size)
    };
  }

  /**
   * Create a new projectile and add it to the scene
   */
  public createProjectile(
    position: THREE.Vector3,
    direction: THREE.Vector3,
    config?: Partial<ProjectileConfig>
  ): Projectile {
    // Enforce a hard limit on projectiles to prevent performance issues
    if (this.projectiles.length >= this.maxProjectiles) {
      // Remove the oldest projectile
      const oldestProjectile = this.projectiles.shift();
      if (oldestProjectile) {
        this.removeProjectile(oldestProjectile);
      }
    }

    // Merge the provided config with the default config
    const fullConfig: ProjectileConfig = {
      ...this.defaultProjectileConfig,
      ...config,
    };

    // Create the projectile
    const projectile = new Projectile(position, direction, fullConfig);

    // Add the projectile to the scene
    this.scene.add(projectile.getMesh());

    // Add the projectile to our array
    this.projectiles.push(projectile);

    return projectile;
  }

  /**
   * Update all projectiles
   */
  public update(deltaTime: number): void {
    // Use a single loop with direct array manipulation for better performance
    let i = this.projectiles.length;

    // Going backwards through the array allows for removing elements safely
    while (i--) {
      const projectile = this.projectiles[i];

      // Update the projectile and check if it's still active
      const isActive = projectile.update(deltaTime);

      // If the projectile is no longer active, remove it
      if (!isActive) {
        // Remove from our array with efficient splice
        this.projectiles.splice(i, 1);

        // Remove from scene and dispose of resources
        this.scene.remove(projectile.getMesh());
        projectile.dispose();
      }
    }
  }

  /**
   * Check for collisions with a target
   */
  public checkCollisions(
    targetPosition: THREE.Vector3,
    targetRadius: number
  ): Projectile[] {
    const collisions: Projectile[] = [];

    // Check each projectile for collision
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];

      // Check if the projectile collides with the target
      if (projectile.checkCollision(targetPosition, targetRadius)) {
        collisions.push(projectile);

        // Deactivate the projectile
        projectile.deactivate();

        // Remove the projectile
        this.projectiles.splice(i, 1);
        this.scene.remove(projectile.getMesh());
        projectile.dispose();
      }
    }

    return collisions;
  }

  /**
   * Remove a projectile from the scene and dispose of its resources
   */
  public removeProjectile(projectile: Projectile): void {
    // Find the projectile in our array
    const index = this.projectiles.indexOf(projectile);

    // If found, remove it
    if (index !== -1) {
      this.projectiles.splice(index, 1);
    }

    // Remove from scene
    this.scene.remove(projectile.getMesh());

    // Dispose of resources
    projectile.dispose();
  }

  /**
   * Clear all projectiles
   */
  public clearAllProjectiles(): void {
    // Remove all projectiles from the scene and dispose of them
    for (const projectile of this.projectiles) {
      this.scene.remove(projectile.getMesh());
      projectile.dispose();
    }

    // Clear the array
    this.projectiles = [];
  }

  /**
   * Get the current number of active projectiles
   */
  public getProjectileCount(): number {
    return this.projectiles.length;
  }
}
