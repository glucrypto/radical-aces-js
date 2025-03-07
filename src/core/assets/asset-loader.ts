/**
 * Abstract Asset Loader
 * Base class for all asset loaders with common functionality
 */

import { EventDispatcher } from "three";
import {
  AssetDescriptor,
  AssetProgressEvent,
  AssetType,
  AssetTypeOf,
} from "./asset-types";

/**
 * Callback types for asset loading events
 */
export type ProgressCallback = (event: AssetProgressEvent) => void;
export type LoadCallback = (assetId: string) => void;
export type ErrorCallback = (
  assetId: string,
  url: string,
  error: Error
) => void;

/**
 * Abstract base class for all asset loaders
 */
export abstract class AssetLoader<T extends AssetType> extends EventDispatcher {
  protected loading: Map<string, Promise<AssetTypeOf<T>>> = new Map();
  protected cache: Map<string, AssetTypeOf<T>> = new Map();

  constructor() {
    super();
  }

  // Callback lists
  private progressCallbacks: ProgressCallback[] = [];
  private loadCallbacks: LoadCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];

  /**
   * Add a progress callback
   */
  public onProgress(callback: ProgressCallback): void {
    this.progressCallbacks.push(callback);
  }

  /**
   * Add a load complete callback
   */
  public onLoad(callback: LoadCallback): void {
    this.loadCallbacks.push(callback);
  }

  /**
   * Add an error callback
   */
  public onError(callback: ErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Load an asset and return it when complete
   * @param descriptor Asset descriptor
   * @returns Promise resolving to the loaded asset
   */
  public async load(descriptor: AssetDescriptor): Promise<AssetTypeOf<T>> {
    const { id, url } = descriptor;

    // Check if already cached
    if (this.cache.has(id)) {
      return this.cache.get(id) as AssetTypeOf<T>;
    }

    // Check if already loading
    if (this.loading.has(id)) {
      return this.loading.get(id) as Promise<AssetTypeOf<T>>;
    }

    // Start loading
    const loadPromise = this.loadAsset(descriptor)
      .then((asset) => {
        // Cache the loaded asset
        this.cache.set(id, asset);
        this.loading.delete(id);

        // Dispatch load complete event
        this.dispatchEvent({
          type: "load",
          assetId: id,
        });

        return asset;
      })
      .catch((error) => {
        // Ensure error is an Error object
        const errorObj =
          error instanceof Error ? error : new Error(String(error));

        // Dispatch error event
        this.dispatchEvent({
          type: "error",
          assetId: id,
          url,
          error: errorObj,
        });

        this.loading.delete(id);
        throw error;
      });

    // Store the loading promise
    this.loading.set(id, loadPromise);

    return loadPromise;
  }

  /**
   * Check if an asset is cached
   * @param id Asset ID
   */
  public isCached(id: string): boolean {
    return this.cache.has(id);
  }

  /**
   * Get an asset from the cache
   * @param id Asset ID
   */
  public get(id: string): AssetTypeOf<T> | undefined {
    return this.cache.get(id);
  }

  /**
   * Unload an asset from the cache
   * @param id Asset ID
   */
  public unload(id: string): void {
    const asset = this.cache.get(id);

    if (asset) {
      // Call the dispose method if it exists and is a function
      if (
        asset &&
        (asset as any).dispose &&
        typeof (asset as any).dispose === "function"
      ) {
        (asset as any).dispose();
      }

      this.cache.delete(id);
    }
  }

  /**
   * Clear all cached assets
   */
  public clear(): void {
    // Dispose all assets
    this.cache.forEach((asset) => {
      if (
        asset &&
        (asset as any).dispose &&
        typeof (asset as any).dispose === "function"
      ) {
        (asset as any).dispose();
      }
    });

    this.cache.clear();
  }

  /**
   * Create a progress event object
   * @param id Asset ID
   * @param loaded Bytes loaded
   * @param total Total bytes
   * @param overallProgress Overall loading progress
   */
  protected createProgressEvent(
    id: string,
    loaded: number,
    total: number,
    overallProgress: number
  ): AssetProgressEvent {
    return {
      assetId: id,
      loaded,
      total,
      progress: total > 0 ? loaded / total : 0,
      overallProgress,
    };
  }

  /**
   * Dispatch a progress event
   */
  protected dispatchProgressEvent(progressEvent: AssetProgressEvent): void {
    this.dispatchEvent({
      type: "progress",
      ...progressEvent,
    });
  }

  /**
   * Load a specific asset
   * This method must be implemented by subclasses
   * @param descriptor Asset descriptor
   */
  protected abstract loadAsset(
    descriptor: AssetDescriptor
  ): Promise<AssetTypeOf<T>>;
}
