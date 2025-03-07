import * as THREE from "three";

interface RadModelPolygon {
  color: THREE.Color;
  vertices: THREE.Vector3[];
}

/**
 * Loader for converting .rad file model data to Three.js meshes
 */
export class AircraftModelLoader {
  /**
   * Parse a .rad file content and convert it to a Three.js model
   * @param content The content of the .rad file
   * @returns A THREE.Group containing the model
   */
  public static loadFromRadContent(content: string): THREE.Group {
    console.log("[AircraftModelLoader] Parsing RAD content...");

    try {
      const lines = content.split("\n");
      console.log(
        `[AircraftModelLoader] Parsing ${lines.length} lines of RAD data`
      );

      const polygons: RadModelPolygon[] = [];
      let currentPolygon: RadModelPolygon | null = null;
      let currentColor: THREE.Color | null = null;
      let inPolygon = false;

      // Parse the .rad file content
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines and comments
        if (!line || line.startsWith("//")) {
          continue;
        }

        // Start of a polygon definition
        if (line === "<p>") {
          inPolygon = true;
          currentPolygon = {
            color: new THREE.Color(0xcccccc), // Default color
            vertices: [],
          };
          currentColor = null;
          continue;
        }

        // End of a polygon definition
        if (line === "</p>") {
          inPolygon = false;
          if (currentPolygon && currentPolygon.vertices.length >= 3) {
            polygons.push(currentPolygon);
          } else if (currentPolygon) {
            console.warn(
              `[AircraftModelLoader] Skipping polygon with insufficient vertices (${
                currentPolygon?.vertices.length || 0
              })`
            );
          }
          currentPolygon = null;
          continue;
        }

        // Parse color
        if (inPolygon && line.startsWith("c(")) {
          try {
            const colorMatch = line.match(/c\((\d+),(\d+),(\d+)\)/);
            if (colorMatch && currentPolygon) {
              const r = parseInt(colorMatch[1]) / 255;
              const g = parseInt(colorMatch[2]) / 255;
              const b = parseInt(colorMatch[3]) / 255;
              currentPolygon.color = new THREE.Color(r, g, b);
            }
          } catch (err) {
            console.warn(
              `[AircraftModelLoader] Error parsing color at line ${i}: ${line}`
            );
          }
          continue;
        }

        // Parse vertex
        if (inPolygon && line.startsWith("p(") && currentPolygon) {
          try {
            const vertexMatch = line.match(/p\((-?\d+),(-?\d+),(-?\d+)\)/);
            if (vertexMatch) {
              // Coordinate conversion from RAD format to Three.js
              const x = parseInt(vertexMatch[1]) / 10;
              // Invert Y coordinate to fix the upside-down model issue
              // RAD format has Y pointing down, Three.js has Y pointing up
              const y = -parseInt(vertexMatch[2]) / 10;
              const z = parseInt(vertexMatch[3]) / 10;

              // Negate Z to convert between coordinate systems
              // RAD has Z pointing into screen, Three.js has Z pointing out of screen
              currentPolygon.vertices.push(new THREE.Vector3(x, y, -z));
            }
          } catch (err) {
            console.warn(
              `[AircraftModelLoader] Error parsing vertex at line ${i}: ${line}`
            );
          }
          continue;
        }
      }

      console.log(
        `[AircraftModelLoader] Parsed ${polygons.length} valid polygons`
      );

      // Create meshes for each polygon
      const group = new THREE.Group();
      let meshesCreated = 0;

      // Create meshes for each polygon
      polygons.forEach((polygon, index) => {
        if (polygon.vertices.length < 3) {
          console.warn(
            `[AircraftModelLoader] Skipping polygon #${index} with only ${polygon.vertices.length} vertices`
          );
          return; // Skip polygons with fewer than 3 vertices
        }

        try {
          // Create a geometry for this polygon
          const geometry = new THREE.BufferGeometry();

          // Convert vertices to array for BufferGeometry
          const positions: number[] = [];
          polygon.vertices.forEach((v) => {
            positions.push(v.x, v.y, v.z);
          });

          // Set vertex positions
          geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(positions, 3)
          );

          // Handle polygon triangulation - fan triangulation for convex shapes
          if (polygon.vertices.length > 3) {
            const indices: number[] = [];
            for (let i = 1; i < polygon.vertices.length - 1; i++) {
              indices.push(0, i, i + 1);
            }
            geometry.setIndex(indices);
          }

          // Calculate normals
          geometry.computeVertexNormals();

          // Create a material with the polygon's color
          const material = new THREE.MeshPhongMaterial({
            color: polygon.color,
            side: THREE.DoubleSide, // Ensure both sides are visible
            shininess: 30,
          });

          // Create a mesh from the geometry and material
          const mesh = new THREE.Mesh(geometry, material);
          group.add(mesh);
          meshesCreated++;
        } catch (err) {
          console.warn(
            `[AircraftModelLoader] Error creating mesh for polygon #${index}:`,
            err
          );
        }
      });

      console.log(
        `[AircraftModelLoader] Created ${meshesCreated} meshes from polygons`
      );
      return group;
    } catch (error) {
      console.error("[AircraftModelLoader] Error parsing RAD content:", error);
      // Return an empty group so the calling code doesn't fail
      return new THREE.Group();
    }
  }

  /**
   * Load a specific aircraft model by name
   * @param name Name of the aircraft (1-5 for the 5 different models)
   * @returns A Promise that resolves to a THREE.Group
   */
  public static async loadAircraftModel(name: string): Promise<THREE.Group> {
    try {
      console.log(`[AircraftModelLoader] Loading aircraft model: ${name}`);

      // Get the RAD model data based on the requested model
      const modelData = this.getModelData(name);

      // Convert it to a Three.js model
      const model = this.loadFromRadContent(modelData);

      // Make sure the model has some content
      if (model.children.length === 0) {
        console.warn(
          "[AircraftModelLoader] Model has no children, adding a placeholder"
        );

        // Create a simple triangle as a placeholder
        const geometry = new THREE.ConeGeometry(1, 2, 3);
        const material = new THREE.MeshPhongMaterial({ color: 0xcccccc });
        const cone = new THREE.Mesh(geometry, material);
        cone.rotation.x = -Math.PI / 2; // Point the cone forward
        model.add(cone);
      }

      console.log(
        `[AircraftModelLoader] Model children count: ${model.children.length}`
      );

      // Ensure proper scale - make the aircraft reasonably sized
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      // Scale to make it a reasonable size (around 20 units long)
      if (maxDim > 0) {
        const scale = 10 / maxDim;
        model.scale.set(scale, scale, scale);
        console.log(`[AircraftModelLoader] Scaled model by factor ${scale}`);
      } else {
        console.warn("[AircraftModelLoader] Could not determine model size");
      }

      return model;
    } catch (error) {
      console.error(
        "[AircraftModelLoader] Failed to load aircraft model:",
        error
      );

      // Return a placeholder model that's clearly visible
      const group = new THREE.Group();

      // Create a simple triangle as a placeholder
      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        0,
        0,
        5, // nose
        -3,
        0,
        -3, // left wing
        3,
        0,
        -3, // right wing
      ]);

      geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
      geometry.computeVertexNormals();

      const material = new THREE.MeshPhongMaterial({
        color: 0xff0000, // Bright red so we know it's a fallback
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);

      // Add a clear marker so we know it's a fallback
      const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
      const boxMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
      const box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.set(0, 1, 0);
      group.add(box);

      console.log("[AircraftModelLoader] Created fallback model");

      return group;
    }
  }

  /**
   * Get the RAD model data for a specific aircraft model
   * @param modelName The model name to load
   * @returns The RAD model data as a string
   */
  private static getModelData(modelName: string): string {
    // Choose the model based on the requested model ID
    switch (modelName) {
      case "1":
        return this.getHamerModel();
      case "2":
        return this.getSykosModel();
      case "3":
        return this.getAir1Model();
      case "4":
        return this.getAir4Model();
      case "5":
        return this.getSpitModel();
      default:
        return this.getHamerModel(); // Default to hamer model
    }
  }

  /**
   * Get the hamer.rad model data
   */
  private static getHamerModel(): string {
    // This is the hamer.rad file content
    return `
MaxRadius(100)
div(15)
shadow()
colid(0,10)
hits(250)
out()

<p>
c(70,80,80)

p(-29,0,63)
p(-9,0,67)
p(-10,0,57)
p(-25,0,54)
</p>

<p>
c(70,80,80)

p(-9,0,67)
p(-10,0,57)
p(0,-7,50)
</p>

<p>
c(70,80,80)

p(-9,0,67)
p(0,0,72)
p(0,-7,50)
</p>

<p>
c(70,80,80)

p(-7,0,50)
p(-10,0,57)
p(0,-7,50)
</p>

<p>
c(70,80,80)

p(-7,0,50)
p(-8,0,39)
p(0,-7,50)
</p>

<p>
c(70,80,80)

p(0,-5,39)
p(-8,0,39)
p(0,-7,50)
</p>

<p>
c(70,80,80)

p(0,-5,39)
p(-8,0,39)
p(-8,0,-29)
p(0,-5,-29)
</p>

<p>
c(70,80,80)

p(-8,0,-29)
p(0,-5,-29)
p(-5,0,-55)
</p>

<p>
c(70,80,80)

p(0,0,-58)
p(0,-5,-29)
p(-5,0,-55)
</p>

// flip side

<p>
c(70,80,80)

p(29,0,63)
p(9,0,67)
p(10,0,57)
p(25,0,54)
</p>

<p>
c(70,80,80)

p(9,0,67)
p(10,0,57)
p(0,-7,50)
</p>

<p>
c(70,80,80)

p(9,0,67)
p(0,0,72)
p(0,-7,50)
</p>

<p>
c(70,80,80)

p(7,0,50)
p(10,0,57)
p(0,-7,50)
</p>

<p>
c(70,80,80)

p(7,0,50)
p(8,0,39)
p(0,-7,50)
</p>

<p>
c(70,80,80)

p(0,-5,39)
p(8,0,39)
p(0,-7,50)
</p>

<p>
c(70,80,80)

p(0,-5,39)
p(8,0,39)
p(8,0,-29)
p(0,-5,-29)
</p>

<p>
c(70,80,80)

p(8,0,-29)
p(0,-5,-29)
p(5,0,-55)
</p>

<p>
c(70,80,80)

p(0,0,-58)
p(0,-5,-29)
p(5,0,-55)
</p>

// down side

<p>
c(70,80,80)

p(-29,0,63)
p(-9,0,67)
p(-10,0,57)
p(-25,0,54)
</p>

<p>
c(70,80,80)

p(-9,0,67)
p(-10,0,57)
p(0,3,50)
</p>

<p>
c(70,80,80)

p(-9,0,67)
p(0,0,72)
p(0,3,50)
</p>

<p>
c(70,80,80)

p(-7,0,50)
p(-10,0,57)
p(0,3,50)
</p>

<p>
c(70,80,80)

p(-7,0,50)
p(-8,0,39)
p(0,3,50)
</p>

<p>
c(70,80,80)

p(0,5,39)
p(-8,0,39)
p(0,3,50)
</p>

<p>
c(70,80,80)

p(0,5,39)
p(-8,0,39)
p(-8,0,-29)
p(0,5,-29)
</p>

<p>
c(70,80,80)

p(-8,0,-29)
p(0,5,-29)
p(-5,0,-55)
</p>

<p>
c(70,80,80)

p(0,0,-58)
p(0,5,-29)
p(-5,0,-55)
</p>

// flip side

<p>
c(70,80,80)

p(29,0,63)
p(9,0,67)
p(10,0,57)
p(25,0,54)
</p>

<p>
c(70,80,80)

p(9,0,67)
p(10,0,57)
p(0,3,50)
</p>

<p>
c(70,80,80)

p(9,0,67)
p(0,0,72)
p(0,3,50)
</p>

<p>
c(70,80,80)

p(7,0,50)
p(10,0,57)
p(0,3,50)
</p>

<p>
c(70,80,80)

p(7,0,50)
p(8,0,39)
p(0,3,50)
</p>

<p>
c(70,80,80)

p(0,5,39)
p(8,0,39)
p(0,3,50)
</p>

<p>
c(70,80,80)

p(0,5,39)
p(8,0,39)
p(8,0,-29)
p(0,5,-29)
</p>

<p>
c(70,80,80)

p(8,0,-29)
p(0,5,-29)
p(5,0,-55)
</p>

<p>
c(70,80,80)

p(0,0,-58)
p(0,5,-29)
p(5,0,-55)
</p>

// cock pit

<p>
c(150,200,200)

p(0,-5,22)
p(-5,-3,5)
p(0,-9,0)
</p>

<p>
c(150,200,200)

p(0,-5,-12)
p(-5,-3,5)
p(0,-9,0)
</p>

<p>
c(150,200,200)

p(0,-5,22)
p(5,-3,5)
p(0,-9,0)
</p>

<p>
c(150,200,200)

p(0,-5,-12)
p(5,-3,5)
p(0,-9,0)
</p>

// winga ding

<p>
c(70,80,80)

p(-8,0,39)
p(-8,0,-29)
p(-44,10,-40)
p(-44,10,-28)
</p>

<p>
c(70,80,80)

p(8,0,39)
p(8,0,-29)
p(44,10,-40)
p(44,10,-28)
</p>


<p>
c(70,80,80)

p(0,-5,-29)
p(0,-12,-45)
p(0,-12,-58)
p(0,0,-55)
</p>

<p>
c(70,80,80)

p(0,-12,-45)
p(0,-12,-58)
p(-15,-12,-62)
p(-15,-12,-57)
</p>

<p>
c(70,80,80)

p(0,-12,-45)
p(0,-12,-58)
p(15,-12,-62)
p(15,-12,-57)
</p>
`;
  }

  /**
   * Get the sykos.rad model data
   */
  private static getSykosModel(): string {
    // We can add other models later as needed
    return this.getHamerModel(); // Use hamer model as placeholder
  }

  /**
   * Get the air1.rad model data
   */
  private static getAir1Model(): string {
    return this.getHamerModel(); // Use hamer model as placeholder
  }

  /**
   * Get the air4.rad model data
   */
  private static getAir4Model(): string {
    return this.getHamerModel(); // Use hamer model as placeholder
  }

  /**
   * Get the spit.rad model data
   */
  private static getSpitModel(): string {
    return this.getHamerModel(); // Use hamer model as placeholder
  }
}
