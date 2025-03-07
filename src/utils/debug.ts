/**
 * Debug Utilities for Radical Aces
 * Provides performance monitoring and debug controls
 */

import { GUI } from "lil-gui";
import * as THREE from "three";

export class DebugTools {
  private gui: GUI;
  public isVisible: boolean = true;
  private perfMonitor: { [key: string]: number } = {};
  private perfContainer: HTMLDivElement;
  private lastTime: number = performance.now();
  private frameCount: number = 0;
  private fpsUpdateInterval: number = 500; // ms
  private lastFpsUpdate: number = 0;
  public skipToMainMenu: boolean = true;

  constructor() {
    // Initialize GUI
    this.gui = new GUI();
    this.gui.title("Radical Aces Debug");

    // Create Performance Monitor Container
    this.perfContainer = document.createElement("div");
    this.perfContainer.style.position = "absolute";
    this.perfContainer.style.top = "10px";
    this.perfContainer.style.left = "10px";
    this.perfContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    this.perfContainer.style.color = "white";
    this.perfContainer.style.fontFamily = "monospace";
    this.perfContainer.style.padding = "10px";
    this.perfContainer.style.borderRadius = "5px";
    this.perfContainer.style.zIndex = "1000";
    document.body.appendChild(this.perfContainer);

    // Add visibility toggle to GUI
    const debugFolder = this.gui.addFolder("Debug Options");
    debugFolder
      .add(this, "isVisible")
      .name("Show Debug Info")
      .onChange((value: boolean) => {
        this.perfContainer.style.display = value ? "block" : "none";
      });

    // Add skip to main menu option (for faster development/testing)
    this.skipToMainMenu = true;
    debugFolder
      .add(this, "skipToMainMenu")
      .name("Start with Main Menu")
      .onChange((value: boolean) => {
        // Dispatch a custom event so that other components can react to this change
        window.dispatchEvent(
          new CustomEvent("debug:skipToMainMenu", {
            detail: { enabled: value },
          })
        );
      });

    // Initialize debug options - dispatch initial event
    window.dispatchEvent(
      new CustomEvent("debug:skipToMainMenu", {
        detail: { enabled: this.skipToMainMenu },
      })
    );

    debugFolder.open();

    // Initialize performance monitor with default values
    this.setPerfValue("FPS", 0);
    this.setPerfValue("Delta", 0);
    this.setPerfValue("Time", 0);
  }

  /**
   * Update performance metrics each frame
   * @param deltaTime Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    const now = performance.now();

    // Update frame counter
    this.frameCount++;

    // Update FPS counter every interval
    if (now - this.lastFpsUpdate > this.fpsUpdateInterval) {
      const fps = (this.frameCount / (now - this.lastFpsUpdate)) * 1000;
      this.setPerfValue("FPS", fps);
      this.lastFpsUpdate = now;
      this.frameCount = 0;
    }

    // Update other performance metrics
    this.setPerfValue("Delta", deltaTime * 1000); // Convert to ms for display
    this.setPerfValue("Time", now / 1000); // Convert to seconds for display
  }

  /**
   * Set a performance monitoring value
   * @param name Name of the value to track
   * @param value Value to track
   */
  public setPerfValue(name: string, value: number): void {
    this.perfMonitor[name] = value;
    this.updatePerfDisplay();
  }

  /**
   * Add a debug control folder
   * @param name Name of the folder
   * @returns GUI folder
   */
  public addFolder(name: string): GUI {
    return this.gui.addFolder(name);
  }

  /**
   * Monitor a scene object or the entire scene
   * @param scene Three.js scene to monitor
   * @param renderer Three.js renderer to monitor
   */
  public monitorScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
    // Create a scene folder
    const sceneFolder = this.addFolder("Scene");

    // Add info about objects in scene
    const sceneInfo = {
      objectCount: 0,
      meshCount: 0,
      lightCount: 0,
      triangleCount: 0,
      calls: 0,
      toggleWireframe: () => this.toggleWireframe(scene),
      toggleAxesHelper: () => this.toggleAxesHelper(scene),
    };

    // Add controls to the scene folder
    sceneFolder.add(sceneInfo, "toggleWireframe").name("Toggle Wireframe");
    sceneFolder.add(sceneInfo, "toggleAxesHelper").name("Toggle Axes Helper");

    // Update function for scene info
    const updateSceneInfo = () => {
      sceneInfo.objectCount = scene.children.length;
      sceneInfo.meshCount = scene.children.filter(
        (child) => child instanceof THREE.Mesh
      ).length;
      sceneInfo.lightCount = scene.children.filter(
        (child) => child instanceof THREE.Light
      ).length;
      sceneInfo.triangleCount = renderer.info.render.triangles;
      sceneInfo.calls = renderer.info.render.calls;

      this.setPerfValue("Objects", sceneInfo.objectCount);
      this.setPerfValue("Meshes", sceneInfo.meshCount);
      this.setPerfValue("Lights", sceneInfo.lightCount);
      this.setPerfValue("Triangles", sceneInfo.triangleCount);
      this.setPerfValue("Draw Calls", sceneInfo.calls);
    };

    // Create a function to update scene info (call this in your game loop)
    this.monitorSceneInfo = updateSceneInfo;
  }

  /**
   * Toggle wireframe mode for all meshes in the scene
   */
  private toggleWireframe(scene: THREE.Scene): void {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.material instanceof THREE.Material) {
          const material = object.material as THREE.MeshBasicMaterial;
          material.wireframe = !material.wireframe;
        } else if (Array.isArray(object.material)) {
          object.material.forEach((material) => {
            const mat = material as THREE.MeshBasicMaterial;
            mat.wireframe = !mat.wireframe;
          });
        }
      }
    });
  }

  /**
   * Toggle axes helper visibility
   */
  private toggleAxesHelper(scene: THREE.Scene): void {
    // Look for existing axes helper
    const existingHelper = scene.children.find(
      (child) => child instanceof THREE.AxesHelper
    );

    if (existingHelper) {
      scene.remove(existingHelper);
    } else {
      const axesHelper = new THREE.AxesHelper(5);
      scene.add(axesHelper);
    }
  }

  /**
   * Scene monitoring function (assigned when monitorScene is called)
   */
  public monitorSceneInfo: () => void = () => {};

  /**
   * Update the performance display
   */
  private updatePerfDisplay(): void {
    // Clear the container
    this.perfContainer.innerHTML = "";

    // Add each performance metric
    Object.entries(this.perfMonitor).forEach(([key, value]) => {
      const metricDiv = document.createElement("div");
      metricDiv.style.margin = "2px 0";

      // Format the value
      let formattedValue = value.toString();
      if (key === "FPS" || key === "Delta") {
        formattedValue = value.toFixed(1);
      } else if (typeof value === "number") {
        if (value % 1 !== 0) {
          formattedValue = value.toFixed(2);
        }
      }

      metricDiv.textContent = `${key}: ${formattedValue}`;
      this.perfContainer.appendChild(metricDiv);
    });
  }

  /**
   * Show the debug UI
   */
  public show(): void {
    this.isVisible = true;
    this.perfContainer.style.display = "block";
    this.gui.show();
  }

  /**
   * Hide the debug UI
   */
  public hide(): void {
    this.isVisible = false;
    this.perfContainer.style.display = "none";
    this.gui.hide();
  }

  /**
   * Toggle the debug UI visibility
   */
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}

export default DebugTools;
