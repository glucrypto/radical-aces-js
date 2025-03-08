import * as THREE from "three";
import InputManager, { InputKey } from "../core/input";
import PlayerAircraft from "../entities/player/PlayerAircraft";
import ProjectileManager from "./ProjectileManager";

/**
 * Configuration for a weapon
 */
export interface WeaponConfig {
  name: string;
  fireRate: number; // Rounds per second
  damage: number;
  projectileSpeed: number;
  projectileLifetime: number; // In milliseconds
  projectileColor?: THREE.Color;
  projectileSize?: number;
}

/**
 * Manages weapons for the player aircraft
 */
export default class WeaponSystem {
  private player: PlayerAircraft;
  private projectileManager: ProjectileManager;
  private weapons: WeaponConfig[] = [];
  private currentWeaponIndex: number = 0;
  private lastFireTime: number = 0;
  private isFiring: boolean = false;

  // Single firing position at the front of the aircraft
  private firePosition: THREE.Vector3 = new THREE.Vector3(0, 0, -8);

  constructor(player: PlayerAircraft, projectileManager: ProjectileManager) {
    this.player = player;
    this.projectileManager = projectileManager;
    this.setupDefaultWeapons();
  }

  private setupDefaultWeapons(): void {
    this.weapons = [
      {
        name: "Standard Laser",
        fireRate: 8,
        damage: 3,
        projectileSpeed: 350,
        projectileLifetime: 2000,
        projectileColor: new THREE.Color(1.0, 0.8, 0.0), // Bright gold laser
        projectileSize: 1.2, // Reduced size for a sleeker look
      },
      {
        name: "Fast Laser",
        fireRate: 10,
        damage: 2,
        projectileSpeed: 450,
        projectileLifetime: 2000,
        projectileColor: new THREE.Color(0.0, 0.9, 1.0), // Bright blue laser
        projectileSize: 1.0, // Smaller size
      },
    ];
  }

  public handleInput(inputManager: InputManager, timeManager: number): void {
    this.isFiring = inputManager.isKeyPressed(InputKey.SPACE);
  }

  public update(deltaTime: number, timeManager: number): void {
    if (this.isFiring) {
      this.tryFireWeapon(timeManager);
    }
  }

  private tryFireWeapon(currentTime: number): void {
    const currentWeapon = this.weapons[this.currentWeaponIndex];
    const now = Date.now();

    // Increased the minimum fire interval to prevent performance issues
    // This is necessary to avoid creating too many projectiles when space is held
    const minFireInterval = 200; // Increased from 150ms to 200ms

    if (now - this.lastFireTime < minFireInterval) {
      return;
    }

    // Only create one projectile at a time to prevent overwhelming the system
    this.fireWeapon(currentTime);
    this.lastFireTime = now;
  }

  private fireWeapon(currentTime: number): void {
    const currentWeapon = this.weapons[this.currentWeaponIndex];

    // Get the player's position and rotation
    const playerPosition = this.player.getPosition();
    const playerRotation = this.player.getRotation();

    // Create direction from rotation
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyEuler(playerRotation);

    // Calculate projectile starting position using the single fire position
    const position = new THREE.Vector3();
    position.copy(playerPosition);
    position.add(this.firePosition.clone().applyEuler(playerRotation));

    // Create projectile with all the necessary parameters
    this.projectileManager.createProjectile(position, direction, {
      speed: currentWeapon.projectileSpeed,
      damage: currentWeapon.damage,
      lifetime: currentWeapon.projectileLifetime,
      color: currentWeapon.projectileColor,
      size: currentWeapon.projectileSize,
      hitRadius: (currentWeapon.projectileSize || 1) * 2, // Set hitRadius based on size
    });
  }

  public getCurrentWeaponName(): string {
    return this.weapons[this.currentWeaponIndex].name;
  }

  public dispose(): void {
    this.weapons = [];
  }
}
