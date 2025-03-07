/**
 * Asset Manager
 * Central system for loading and managing game assets
 */

import { EventDispatcher } from "three";
import { AssetLoader } from "./asset-loader";
import {
  AssetDescriptor,
  AssetManifest,
  AssetType,
  AssetTypeOf,
} from "./asset-types";
import { ModelLoader } from "./loaders/model-loader";
import { TextureLoader } from "./loaders/texture-loader";

/**
 * Asset Manager class
 * Handles loading and caching of all game assets
 */
export class AssetManager extends EventDispatcher {
  // Loaders for each asset type
  private loaders: Map<AssetType, AssetLoader<any>> = new Map();

  // Tracks overall loading progress
  private totalAssets: number = 0;
  private loadedAssets: number = 0;
  private loadingManifest: boolean = false;

  // Priority queue for assets
  private queue: AssetDescriptor[] = [];

  constructor() {
    super();

    // Initialize loaders
    this.registerLoader("texture", new TextureLoader());
    this.registerLoader("model", new ModelLoader());

    // Will add other loaders as they're implemented
    // this.registerLoader('audio', new AudioLoader());
    // this.registerLoader('json', new JsonLoader());
    // this.registerLoader('font', new FontLoader());
    // this.registerLoader('cubemap', new CubemapLoader());
  }

  /**
   * Register a loader for a specific asset type
   * @param type Asset type
   * @param loader Loader instance
   */
  public registerLoader<T extends AssetType>(
    type: T,
    loader: AssetLoader<T>
  ): void {
    this.loaders.set(type, loader);

    // Listen for progress events
    loader.addEventListener("progress", (event) => {
      // Forward to our own event system with overall progress
      this.dispatchEvent({
        type: "progress",
        assetId: event.assetId,
        loaded: event.loaded,
        total: event.total,
        progress: event.progress,
        overallProgress: this.loadedAssets / this.totalAssets,
      });
    });

    // Listen for error events
    loader.addEventListener("error", (event) => {
      // Forward the error
      this.dispatchEvent({
        type: "error",
        assetId: event.assetId,
        url: event.url,
        error: event.error,
      });
    });

    // Listen for load events
    loader.addEventListener("load", (event) => {
      this.loadedAssets++;
      const progress = this.loadedAssets / this.totalAssets;

      // Forward the load event with progress
      this.dispatchEvent({
        type: "load",
        assetId: event.assetId,
        progress,
      });

      // If all assets are loaded, dispatch complete event
      if (this.loadedAssets === this.totalAssets && this.loadingManifest) {
        this.loadingManifest = false;
        this.dispatchEvent({ type: "complete" });
      }
    });
  }

  /**
   * Load a single asset
   * @param assetId Unique identifier for the asset
   * @param url URL to load the asset from
   * @param type Type of asset to load
   * @returns Promise resolving to the loaded asset
   */
  public async load<T extends AssetType>(
    assetId: string,
    url: string,
    type: T
  ): Promise<AssetTypeOf<T>> {
    const loader = this.loaders.get(type);

    if (!loader) {
      throw new Error(`No loader registered for asset type: ${type}`);
    }

    const asset = await loader.load({
      id: assetId,
      url,
      type,
    } as AssetDescriptor);
    return asset as AssetTypeOf<T>;
  }

  /**
   * Preload a collection of assets defined in a manifest
   * @param manifest Asset manifest to load
   * @returns Promise resolving when all assets are loaded
   */
  public async preload(manifest: AssetManifest): Promise<void> {
    if (manifest.length === 0) {
      return Promise.resolve();
    }

    this.loadingManifest = true;
    this.totalAssets = manifest.length;
    this.loadedAssets = 0;

    // Sort the manifest by priority (higher number = higher priority)
    this.queue = [...manifest].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    );

    // Create promises for all assets
    const promises = this.queue.map((descriptor) => {
      const loader = this.loaders.get(descriptor.type);

      if (!loader) {
        return Promise.reject(
          new Error(`No loader registered for asset type: ${descriptor.type}`)
        );
      }

      return loader.load(descriptor).catch((error) => {
        console.error(`Failed to load asset: ${descriptor.id}`, error);
        // Continue loading other assets even if one fails
        return null;
      });
    });

    // Wait for all assets to load
    await Promise.all(promises);
  }

  /**
   * Get a loaded asset by ID
   * @param assetId Asset ID
   * @returns The loaded asset or undefined if not found
   */
  public get<T>(assetId: string): T | undefined {
    for (const loader of this.loaders.values()) {
      const asset = loader.get(assetId);
      if (asset !== undefined) {
        return asset as unknown as T;
      }
    }

    return undefined;
  }

  /**
   * Check if an asset is loaded
   * @param assetId Asset ID
   * @returns True if the asset is loaded and cached
   */
  public isLoaded(assetId: string): boolean {
    for (const loader of this.loaders.values()) {
      if (loader.isCached(assetId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Unload a specific asset
   * @param assetId Asset ID
   */
  public unload(assetId: string): void {
    for (const loader of this.loaders.values()) {
      if (loader.isCached(assetId)) {
        loader.unload(assetId);
        break;
      }
    }
  }

  /**
   * Clear all assets from all loaders
   */
  public clear(): void {
    for (const loader of this.loaders.values()) {
      loader.clear();
    }
  }
}
