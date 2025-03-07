/**
 * Level Loader
 * Loads and parses level data from JSON files
 */

import * as THREE from "three";
import { EnemyType } from "../../entities/enemies/enemy-types";
import { AssetManager } from "../assets/asset-manager";
import { EnemyUnit, Level, LevelData, MissionPrompt } from "./level";

export class LevelLoader {
  private assetManager: AssetManager;

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager;
  }

  /**
   * Load a level by ID
   * @param levelId Level ID to load
   * @param scene THREE.Scene to add level objects to
   */
  public async loadLevel(levelId: number, scene: THREE.Scene): Promise<Level> {
    // In a full implementation, we would load the JSON data for this level
    // For now, we'll hardcode the level data for level 0

    const levelData = await this.getLevelData(levelId);
    const level = new Level(scene, levelData);

    await level.load();

    return level;
  }

  /**
   * Parse level data from original text format
   * @param levelId Level ID
   */
  private async getLevelData(levelId: number): Promise<LevelData> {
    // In a full implementation, we would load the data from a file
    // For now, we'll return hardcoded data for level 0

    if (levelId === 0) {
      return this.createLevel0Data();
    }

    throw new Error(`Level ${levelId} not implemented yet`);
  }

  /**
   * Create hardcoded data for level 0
   * Based on the original level0.txt content
   */
  private createLevel0Data(): LevelData {
    // Level 0 data from the original level0.txt
    const enemyUnits: EnemyUnit[] = [
      {
        type: EnemyType.ZONICH_TANK,
        id: 5,
        position: new THREE.Vector3(-7000, -10, 40000), // Convert to our coordinate system
        name: "Zonich Tank 1",
        stats: [50, 5],
        isGround: true,
      },
      {
        type: EnemyType.ZONICH_TANK,
        id: 6,
        position: new THREE.Vector3(-6000, -10, 40000),
        name: "Zonich Tank 2",
        stats: [50, 5],
        isGround: true,
      },
      {
        type: EnemyType.ZONICH_TANK,
        id: 7,
        position: new THREE.Vector3(-7000, -10, -40000),
        name: "Zonich Tank 3",
        stats: [50, 5],
        isGround: true,
      },
      {
        type: EnemyType.ZONICH_TANK,
        id: 8,
        position: new THREE.Vector3(-6000, -10, -40000),
        name: "Zonich Tank 4",
        stats: [50, 5],
        isGround: true,
      },
      {
        type: EnemyType.ZONICH_TANK,
        id: 9,
        position: new THREE.Vector3(-6500, -10, -39500),
        name: "Zonich Tank 5",
        stats: [50, 5],
        isGround: true,
      },
    ];

    const missionPrompts: MissionPrompt[] = [
      {
        unitType: "tank",
        unitId: 5,
        message: "5 - Zonich tanks 11 and 7 o'clock",
      },
    ];

    return {
      id: 0,
      name: "Training Mission",
      terrainType: "desert",
      enemyUnits,
      missionPrompts,
      environmentFile: "aces", // The siters file to use for environmental objects
    };
  }
}
