/**
 * Mountain Formation
 * Creates distant mountains for the desert environment
 */

import * as THREE from "three";

export interface MountainOptions {
  // Base color of the mountains
  color?: THREE.Color | string;

  // Number of peaks in the formation
  peakCount?: number;

  // Distance from the center
  distance?: number;

  // Height range
  minHeight?: number;
  maxHeight?: number;
}

export class MountainFormation {
  private options: Required<MountainOptions>;
  private mountains: THREE.Group;

  // Default mountain options
  private static readonly DEFAULT_OPTIONS: Required<MountainOptions> = {
    color: "#8B4513", // Saddle brown
    peakCount: 20,
    distance: 8000,
    minHeight: 500,
    maxHeight: 1500,
  };

  constructor(options: MountainOptions = {}) {
    this.options = { ...MountainFormation.DEFAULT_OPTIONS, ...options };
    this.mountains = new THREE.Group();
    this.mountains.name = "MountainFormation";
  }

  /**
   * Create the mountain formation
   */
  public create(): THREE.Group {
    // Create mountains in a ring around the center
    this.createMountainRing();

    return this.mountains;
  }

  /**
   * Create a ring of mountains at the specified distance
   */
  private createMountainRing(): void {
    const { peakCount, distance, minHeight, maxHeight, color } = this.options;

    // Create mountain material
    const mountainMaterial = new THREE.MeshStandardMaterial({
      color,
      roughness: 1.0,
      metalness: 0.0,
      flatShading: true, // Use flat shading for a low-poly look
    });

    // Create mountains in a circle
    for (let i = 0; i < peakCount; i++) {
      const angle = (i / peakCount) * Math.PI * 2;

      // Position in a circle
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      // Randomize height
      const height = minHeight + Math.random() * (maxHeight - minHeight);

      // Create a simple cone for the mountain
      const mountainGeometry = new THREE.ConeGeometry(
        height / 2, // Radius at base
        height, // Height
        4 + Math.floor(Math.random() * 3), // Random sides for variety
        1, // Height segments
        false // Open ended?
      );

      // Create mountain mesh
      const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);

      // Position the mountain
      mountain.position.set(x, 0, z);

      // Random rotation for variety
      mountain.rotation.y = Math.random() * Math.PI * 2;

      // Add some random tilt
      mountain.rotation.x = (Math.random() - 0.5) * 0.2;
      mountain.rotation.z = (Math.random() - 0.5) * 0.2;

      // Add variation to the scale
      const scaleVariation = 0.7 + Math.random() * 0.6;
      mountain.scale.set(scaleVariation, 1, scaleVariation);

      this.mountains.add(mountain);
    }

    // Add some smaller mountains for more depth
    this.addBackgroundMountains();
  }

  /**
   * Add smaller background mountains for depth
   */
  private addBackgroundMountains(): void {
    const { distance, color } = this.options;

    // Create even more distant mountains
    const bgDistance = distance * 1.2;
    const bgPeakCount = this.options.peakCount * 1.5;

    // Darker color for distant mountains to create depth perception
    const bgColor = new THREE.Color(color);
    bgColor.multiplyScalar(0.7); // Darker for distance effect

    const bgMaterial = new THREE.MeshStandardMaterial({
      color: bgColor,
      roughness: 1.0,
      metalness: 0.0,
      flatShading: true,
    });

    // Create background mountains
    for (let i = 0; i < bgPeakCount; i++) {
      const angle = (i / bgPeakCount) * Math.PI * 2;

      // Position in a larger circle
      const x = Math.cos(angle) * bgDistance;
      const z = Math.sin(angle) * bgDistance;

      // Smaller height for background mountains
      const height =
        this.options.minHeight * 0.8 +
        Math.random() * (this.options.maxHeight - this.options.minHeight) * 0.6;

      // Create a simple cone
      const mountainGeometry = new THREE.ConeGeometry(
        height / 2, // Radius
        height, // Height
        4, // Fewer sides for distance
        1,
        false
      );

      // Create mountain mesh
      const mountain = new THREE.Mesh(mountainGeometry, bgMaterial);

      // Position
      mountain.position.set(x, 0, z);

      // Random rotation
      mountain.rotation.y = Math.random() * Math.PI * 2;

      // Add to mountains group
      this.mountains.add(mountain);
    }
  }
}
