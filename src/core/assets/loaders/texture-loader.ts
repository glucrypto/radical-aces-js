/**
 * Texture Loader
 * Loads and manages texture assets
 */

import * as THREE from "three";
import { AssetLoader } from "../asset-loader";
import {
  AssetDescriptor,
  AssetTypeOf,
  TextureAssetDescriptor,
} from "../asset-types";

// Define a loading event for THREE.TextureLoader
interface LoadingEvent {
  lengthComputable: boolean;
  loaded: number;
  total: number;
}

/**
 * Texture asset loader
 */
export class TextureLoader extends AssetLoader<"texture"> {
  private loader: THREE.TextureLoader;

  constructor() {
    super();
    this.loader = new THREE.TextureLoader();
    this.loader.setCrossOrigin("anonymous");
  }

  /**
   * Load a texture asset
   * @param descriptor Texture asset descriptor
   * @returns Promise resolving to the loaded texture
   */
  protected loadAsset(
    descriptor: AssetDescriptor
  ): Promise<AssetTypeOf<"texture">> {
    const { id, url } = descriptor;
    const textureDescriptor = descriptor as TextureAssetDescriptor;
    const options = textureDescriptor.options || {};

    return new Promise((resolve, reject) => {
      // Load the texture
      this.loader.load(
        url,
        (texture) => {
          // Apply texture options
          if (options.flipY !== undefined) texture.flipY = options.flipY;
          if (options.anisotropy !== undefined)
            texture.anisotropy = options.anisotropy;
          if (options.minFilter !== undefined)
            texture.minFilter = options.minFilter;
          if (options.magFilter !== undefined)
            // Cast to any to avoid the type mismatch - THREE.js types are inconsistent here
            texture.magFilter = options.magFilter as any;
          if (options.wrapS !== undefined) texture.wrapS = options.wrapS;
          if (options.wrapT !== undefined) texture.wrapT = options.wrapT;

          texture.needsUpdate = true;
          resolve(texture);
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

            // Notify progress
            this.dispatchProgressEvent(progressEvent);
          }
        },
        // Error callback
        (error) => {
          const errorMessage =
            error instanceof Error
              ? error.message
              : typeof error === "string"
              ? error
              : "Unknown error loading texture";

          reject(new Error(`Failed to load texture (${id}): ${errorMessage}`));
        }
      );
    });
  }
}
