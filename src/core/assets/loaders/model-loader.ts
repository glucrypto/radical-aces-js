/**
 * Model Loader
 * Loads and manages 3D model assets
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { AssetLoader } from "../asset-loader";
import {
  AssetDescriptor,
  AssetTypeOf,
  ModelAssetDescriptor,
} from "../asset-types";

// Define a loading event for GLTFLoader
interface LoadingEvent {
  lengthComputable: boolean;
  loaded: number;
  total: number;
}

/**
 * Model asset loader
 */
export class ModelLoader extends AssetLoader<"model"> {
  private loader: GLTFLoader;

  constructor() {
    super();
    this.loader = new GLTFLoader();
  }

  /**
   * Load a model asset
   * @param descriptor Model asset descriptor
   * @returns Promise resolving to the loaded model
   */
  protected loadAsset(
    descriptor: AssetDescriptor
  ): Promise<AssetTypeOf<"model">> {
    const { id, url } = descriptor;
    const modelDescriptor = descriptor as ModelAssetDescriptor;
    const options = modelDescriptor.options || {};

    return new Promise((resolve, reject) => {
      // Load the model
      this.loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;

          // Apply model options
          if (options.scale !== undefined) {
            model.scale.set(options.scale, options.scale, options.scale);
          }

          if (options.position) {
            model.position.set(
              options.position.x,
              options.position.y,
              options.position.z
            );
          }

          // Apply shadows to all meshes
          if (
            options.castShadow !== undefined ||
            options.receiveShadow !== undefined
          ) {
            model.traverse((node) => {
              if (node instanceof THREE.Mesh) {
                if (options.castShadow !== undefined) {
                  node.castShadow = options.castShadow;
                }
                if (options.receiveShadow !== undefined) {
                  node.receiveShadow = options.receiveShadow;
                }
              }
            });
          }

          resolve(model);
        },
        // Progress callback
        (event: LoadingEvent) => {
          if (event.lengthComputable) {
            const progressEvent = this.createProgressEvent(
              id,
              event.loaded,
              event.total,
              event.loaded / event.total
            );

            // Dispatch progress
            this.dispatchProgressEvent(progressEvent);
          }
        },
        // Error callback
        (error) => {
          // Convert unknown error to a proper Error object
          const errorMessage =
            error instanceof Error
              ? error.message
              : typeof error === "string"
              ? error
              : "Unknown error loading model";

          reject(new Error(`Failed to load model (${id}): ${errorMessage}`));
        }
      );
    });
  }
}
