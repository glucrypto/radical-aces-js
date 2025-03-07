/**
 * Level class to represent a game level
 * Includes terrain, environmental objects, and enemies
 */

import * as THREE from "three";
import { EnemyType } from "../../entities/enemies/enemy-types";
import { DesertTerrain } from "../../entities/environment/desert-terrain";
import { MountainFormation } from "../../entities/environment/mountain-formation";

// Interface for enemy unit data from level files
export interface EnemyUnit {
  type: EnemyType;
  id: number;
  position: THREE.Vector3;
  name: string;
  stats: number[]; // [health, power, speed, maneuverability, etc]
  isGround: boolean;
}

// Interface for mission prompt data
export interface MissionPrompt {
  unitType: "craft" | "tank";
  unitId: number;
  message: string;
}

export interface LevelData {
  id: number;
  name: string;
  terrainType: "desert" | "snow" | "ocean" | "city";
  enemyUnits: EnemyUnit[];
  missionPrompts: MissionPrompt[];
  environmentFile: string; // Reference to the environment file (siters file)
}

export class Level {
  private scene: THREE.Scene;
  private data: LevelData;
  private terrain: THREE.Group;
  private environmentObjects: THREE.Group;
  private enemyUnits: THREE.Group;

  // Environment components
  private desertTerrain: DesertTerrain | null = null;
  private mountains: MountainFormation | null = null;

  constructor(scene: THREE.Scene, levelData: LevelData) {
    this.scene = scene;
    this.data = levelData;

    // Create container groups for organization
    this.terrain = new THREE.Group();
    this.terrain.name = "Terrain";

    this.environmentObjects = new THREE.Group();
    this.environmentObjects.name = "Environment";

    this.enemyUnits = new THREE.Group();
    this.enemyUnits.name = "EnemyUnits";

    // Add groups to scene
    this.scene.add(this.terrain);
    this.scene.add(this.environmentObjects);
    this.scene.add(this.enemyUnits);
  }

  public async load(): Promise<void> {
    console.log(`Loading level ${this.data.id}: ${this.data.name}`);

    // Load terrain based on terrain type
    await this.loadTerrain();

    // Load environment objects (rocks, mountains, etc.)
    await this.loadEnvironmentObjects();

    // Load enemy units
    await this.loadEnemyUnits();
  }

  private async loadTerrain(): Promise<void> {
    // Terrain loading logic will be implemented based on terrain type
    console.log(`Loading ${this.data.terrainType} terrain`);

    // In the future, we'll have different terrain types
    switch (this.data.terrainType) {
      case "desert":
        // Create desert terrain
        this.desertTerrain = new DesertTerrain(this.scene);
        const desertTerrainGroup = this.desertTerrain.create();
        this.terrain.add(desertTerrainGroup);

        // Add mountain formations in the distance
        this.mountains = new MountainFormation({
          color: "#A0522D", // Sienna - desert mountains
          distance: 9000, // Far enough to be visible but not interfere with gameplay
          peakCount: 30, // Enough peaks to create a horizon
        });
        const mountainGroup = this.mountains.create();
        this.terrain.add(mountainGroup);
        break;
      default:
        console.warn(`Unknown terrain type: ${this.data.terrainType}`);
        break;
    }

    // Remove fog implementation here - fog is now handled in the Engine class
    // to avoid conflicts between multiple fog implementations
  }

  private async loadEnvironmentObjects(): Promise<void> {
    // Load environment objects from the siters file
    console.log(
      `Loading environment objects from ${this.data.environmentFile}`
    );

    // For now, we'll just add some basic objects
    // In the future, this will load from siters files
    this.addBasicEnvironmentObjects();
  }

  /**
   * Add some basic environment objects for testing
   */
  private addBasicEnvironmentObjects(): void {
    // Add a few large boulders around the level for visual interest
    const boulderGeometry = new THREE.DodecahedronGeometry(80, 1);
    const boulderMaterial = new THREE.MeshStandardMaterial({
      color: "#8B4513", // Saddle brown
      roughness: 0.9,
      metalness: 0.1,
    });

    // Add boulders in specific locations
    const boulderPositions = [
      new THREE.Vector3(300, 0, 500),
      new THREE.Vector3(-500, 0, 300),
      new THREE.Vector3(800, 0, -400),
      new THREE.Vector3(-800, 0, -700),
    ];

    boulderPositions.forEach((position, index) => {
      const boulder = new THREE.Mesh(boulderGeometry, boulderMaterial);
      boulder.position.copy(position);

      // Random rotation
      boulder.rotation.y = Math.random() * Math.PI * 2;

      // Random scale for variety
      const scale = 0.8 + Math.random() * 0.5;
      boulder.scale.set(scale, scale, scale);

      // Add shadow
      boulder.castShadow = true;
      boulder.receiveShadow = true;

      this.environmentObjects.add(boulder);
    });
  }

  private async loadEnemyUnits(): Promise<void> {
    // Load enemy units from level data
    console.log(`Loading ${this.data.enemyUnits.length} enemy units`);

    // In a full implementation, we would create actual enemy models
    // For now, we'll just add placeholder objects

    // Create and position enemy units based on level data
    for (const unit of this.data.enemyUnits) {
      // Create simple placeholder geometry based on unit type
      let enemyGeometry: THREE.BufferGeometry;
      let enemyMaterial: THREE.Material;

      if (unit.isGround) {
        // Tank unit
        enemyGeometry = new THREE.BoxGeometry(50, 20, 70);
        enemyMaterial = new THREE.MeshStandardMaterial({ color: "#5A5A5A" });
      } else {
        // Aircraft unit
        enemyGeometry = new THREE.ConeGeometry(20, 60, 4);
        enemyMaterial = new THREE.MeshStandardMaterial({ color: "#4682B4" });
      }

      // Create the enemy mesh
      const enemyMesh = new THREE.Mesh(enemyGeometry, enemyMaterial);

      // Position the enemy
      enemyMesh.position.copy(unit.position);

      // For aircraft, add some height
      if (!unit.isGround) {
        enemyMesh.position.y += 500; // Start in the air

        // Rotate to point forward
        enemyMesh.rotation.x = -Math.PI / 2;
      }

      // Add name label
      enemyMesh.name = unit.name;

      // Add shadow
      enemyMesh.castShadow = true;
      enemyMesh.receiveShadow = true;

      // Add to enemy units group
      this.enemyUnits.add(enemyMesh);

      console.log(
        `Loaded enemy unit: ${unit.name} at position ${unit.position.x}, ${unit.position.y}, ${unit.position.z}`
      );
    }
  }

  public update(deltaTime: number): void {
    // Update level components
    // This will update animations, enemy behaviors, etc.
  }

  public destroy(): void {
    // Clean up resources when level is unloaded
    this.scene.remove(this.terrain);
    this.scene.remove(this.environmentObjects);
    this.scene.remove(this.enemyUnits);

    // Remove fog
    this.scene.fog = null;
  }
}
