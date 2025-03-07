/**
 * Desert Terrain
 * Creates a desert environment with sand, runway, and environmental objects
 */

import * as THREE from "three";

export interface DesertTerrainOptions {
  // Size of the terrain in world units
  width?: number;
  depth?: number;

  // Color options
  sandColor?: THREE.Color | string;
  runwayColor?: THREE.Color | string;
  runwayStripeColor?: THREE.Color | string;

  // Whether to include a runway
  includeRunway?: boolean;
}

export class DesertTerrain {
  private scene: THREE.Scene;
  private options: Required<DesertTerrainOptions>;
  private terrain: THREE.Group;

  private ground: THREE.Mesh | null = null;
  private runway: THREE.Mesh | null = null;

  // Default terrain options
  private static readonly DEFAULT_OPTIONS: Required<DesertTerrainOptions> = {
    width: 50000,
    depth: 50000,
    sandColor: "#c2b280", // Sand color
    runwayColor: "#555555", // Asphalt gray
    runwayStripeColor: "#ffffff", // White
    includeRunway: true,
  };

  constructor(scene: THREE.Scene, options: DesertTerrainOptions = {}) {
    this.scene = scene;
    this.options = { ...DesertTerrain.DEFAULT_OPTIONS, ...options };

    this.terrain = new THREE.Group();
    this.terrain.name = "DesertTerrain";
  }

  /**
   * Create and add the desert terrain to the scene
   */
  public create(): THREE.Group {
    // Create the sandy ground
    this.createGround();

    // Create runway if enabled
    if (this.options.includeRunway) {
      this.createRunway();
    }

    // Add small details like rocks or desert plants
    this.addTerrainDetails();

    return this.terrain;
  }

  /**
   * Create the sandy ground plane
   */
  private createGround(): void {
    // Create a large ground plane
    const groundGeometry = new THREE.PlaneGeometry(
      this.options.width,
      this.options.depth,
      64,
      64
    );

    // Create sand texture procedurally
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;

    const context = canvas.getContext("2d");
    if (!context) {
      console.error("Failed to get canvas context");
      return;
    }

    // Fill with base sand color
    context.fillStyle = this.options.sandColor.toString();
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise to create sand texture
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 2;
      const opacity = Math.random() * 0.2;

      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      context.fill();
    }

    // Create the ground texture
    const groundTexture = new THREE.CanvasTexture(canvas);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(32, 32);

    // Create material with the texture
    const groundMaterial = new THREE.MeshStandardMaterial({
      map: groundTexture,
      color: this.options.sandColor,
      roughness: 0.9,
      metalness: 0.0,
      bumpMap: groundTexture,
      bumpScale: 0.2,
    });

    // Create the mesh
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2; // Rotate to horizontal
    this.ground.position.y = 0; // At ground level
    this.ground.receiveShadow = true;

    this.terrain.add(this.ground);
  }

  /**
   * Create a runway on the desert
   * Based on the original asfalt.rad model from Java implementation
   */
  private createRunway(): void {
    // Runway dimensions adjusted to match the reference image exactly
    // Looking at the image, the runway width is about 3-4x the plane's wingspan
    const runwayWidth = 40; // Narrower to match reference image proportion
    const runwayLength = 800; // Length of runway segment

    // Create multiple runway segments to match the siters/base.txt configuration
    const totalRunwayLength = runwayLength * 10; // 10 segments like in original

    // Create runway geometry
    const runwayGeometry = new THREE.PlaneGeometry(
      runwayWidth,
      totalRunwayLength,
      1,
      16
    );

    // Create runway material with darker color to match reference image
    const runwayMaterial = new THREE.MeshStandardMaterial({
      color: "#3a3a3a", // Darker asphalt gray to match reference image
      roughness: 0.8,
      metalness: 0.1,
    });

    // Create runway mesh
    this.runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
    this.runway.rotation.x = -Math.PI / 2; // Horizontal
    this.runway.position.y = 0.1; // Slightly above ground to prevent z-fighting
    this.runway.receiveShadow = true;

    // Add runway stripes
    this.addRunwayStripes(runwayWidth, totalRunwayLength);

    // Add buildings/structures along the runway
    this.addRunwayStructures(runwayWidth, totalRunwayLength);

    // Add runway to terrain
    this.terrain.add(this.runway);
  }

  /**
   * Add white stripes to the runway
   */
  private addRunwayStripes(runwayWidth: number, runwayLength: number): void {
    if (!this.runway) return;

    // Create continuous center line as seen in the reference image
    const centerLineWidth = 0.8; // Very thin center line as seen in image
    const centerLineGeometry = new THREE.PlaneGeometry(
      centerLineWidth,
      runwayLength * 0.95 // Slightly shorter than the runway for visual effect
    );

    // Create white material for the center line
    const centerLineMaterial = new THREE.MeshBasicMaterial({
      color: "#ffffff", // Bright white
    });

    // Create the center line
    const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
    centerLine.rotation.x = -Math.PI / 2; // Horizontal
    centerLine.position.y = 0.15; // Slightly above runway to prevent z-fighting
    centerLine.position.z = 0; // Centered on the runway length
    this.terrain.add(centerLine);

    // Add perpendicular short stripes at regular intervals (like in the reference image)
    const markerWidth = 1; // Very thin markers like in image
    const markerLength = 6; // Short markers as seen in image
    const markerGeometry = new THREE.PlaneGeometry(markerWidth, markerLength);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: "#ff0000", // Red as seen in image
    });

    // Place markers at regular intervals down the runway
    const markerSpacing = 70; // Closer spacing to match image
    const markerCount = Math.floor(runwayLength / markerSpacing) - 1;
    const startOffset = -runwayLength / 3; // Start from the near third of the runway

    // Place markers along the runway
    for (let i = 0; i < markerCount; i++) {
      // Place markers only near the plane's position for better visibility
      if (i < 6) {
        // Left side marker
        const leftMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        leftMarker.rotation.x = -Math.PI / 2; // Horizontal
        leftMarker.rotation.z = Math.PI / 2; // Rotate to be perpendicular to center line
        leftMarker.position.set(
          -runwayWidth / 4, // Offset from center line
          0.15, // Slightly above runway
          startOffset + i * markerSpacing
        );
        this.terrain.add(leftMarker);

        // Right side marker
        const rightMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        rightMarker.rotation.x = -Math.PI / 2; // Horizontal
        rightMarker.rotation.z = Math.PI / 2; // Rotate to be perpendicular to center line
        rightMarker.position.set(
          runwayWidth / 4, // Offset from center line
          0.15, // Slightly above runway
          startOffset + i * markerSpacing
        );
        this.terrain.add(rightMarker);
      }
    }
  }

  /**
   * Add buildings and structures alongside the runway
   */
  private addRunwayStructures(runwayWidth: number, runwayLength: number): void {
    // Create a simple dark box material like in the reference image
    const buildingMaterial = new THREE.MeshStandardMaterial({
      color: "#222222", // Very dark gray/black as seen in image
      roughness: 0.9,
      metalness: 0.1,
    });

    // Simple block buildings as seen in the reference image
    const buildingWidth = 15;
    const buildingHeight = 10;
    const buildingDepth = 20;

    // Add buildings on the right side of the runway as seen in image
    const rightSideOffset = runwayWidth + 15; // Positioned well away from runway edge

    // Create a group of closely packed buildings on the right (like in the image)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        const building = new THREE.Mesh(
          new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth),
          buildingMaterial
        );

        // Position in a grid pattern
        building.position.set(
          rightSideOffset + j * (buildingWidth + 2),
          buildingHeight / 2,
          -runwayLength / 8 + i * (buildingDepth + 2)
        );
        this.terrain.add(building);
      }
    }

    // Add a simple tower on the left as seen in the image
    const towerBase = new THREE.Mesh(
      new THREE.BoxGeometry(10, 25, 10),
      buildingMaterial
    );

    const leftSideOffset = -(runwayWidth + 10);
    towerBase.position.set(leftSideOffset, 12.5, -runwayLength / 10);
    this.terrain.add(towerBase);

    // Add simple tower top
    const towerTop = new THREE.Mesh(
      new THREE.BoxGeometry(15, 5, 15),
      buildingMaterial
    );

    towerTop.position.set(leftSideOffset, 25, -runwayLength / 10);
    this.terrain.add(towerTop);
  }

  /**
   * Add small terrain details like rocks and desert plants
   */
  private addTerrainDetails(): void {
    // Add small rocks scattered around
    this.addRocks();
  }

  /**
   * Add decorative rocks to the terrain
   */
  private addRocks(): void {
    // Create a few rock models with different sizes
    const rockGeometries = [
      new THREE.TetrahedronGeometry(20, 0),
      new THREE.DodecahedronGeometry(15, 0),
      new THREE.TetrahedronGeometry(25, 1),
    ];

    // Create rock material
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: "#8B7765", // Brown rock color
      roughness: 0.9,
      metalness: 0.1,
    });

    // Add rocks around the terrain but not on the runway
    const rockCount = 50;
    const minDist = (runwayWidth: number) => runwayWidth / 2 + 100; // Minimum distance from runway center

    for (let i = 0; i < rockCount; i++) {
      // Choose a random rock geometry
      const geometryIndex = Math.floor(Math.random() * rockGeometries.length);
      const rockGeometry = rockGeometries[geometryIndex];

      // Create rock mesh
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);

      // Position rock randomly, but not on the runway
      let x, z;
      const runwayWidth = this.options.includeRunway ? 500 : 0;
      const minDistance = minDist(runwayWidth);

      do {
        x = (Math.random() - 0.5) * this.options.width;
        z = (Math.random() - 0.5) * this.options.depth;
      } while (Math.abs(x) < minDistance && this.options.includeRunway);

      rock.position.set(x, 0, z);

      // Random rotation
      rock.rotation.x = Math.random() * Math.PI;
      rock.rotation.y = Math.random() * Math.PI * 2;
      rock.rotation.z = Math.random() * Math.PI;

      // Random scale
      const scale = 0.5 + Math.random() * 2;
      rock.scale.set(scale, scale, scale);

      // Add shadow
      rock.castShadow = true;
      rock.receiveShadow = true;

      this.terrain.add(rock);
    }
  }
}
