/**
 * Asset Types and Interfaces for the Asset Loading System
 */

import * as THREE from "three";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";

/**
 * Supported asset types
 */
export type AssetType =
  | "texture"
  | "model"
  | "audio"
  | "json"
  | "font"
  | "cubemap";

/**
 * Base asset descriptor interface
 */
export interface AssetDescriptor {
  id: string;
  url: string;
  type: AssetType;
  priority?: number; // Higher number = higher priority
}

/**
 * Collection of assets to be loaded
 */
export type AssetManifest = Array<AssetDescriptor>;

/**
 * Texture asset descriptor with texture-specific options
 */
export interface TextureAssetDescriptor extends AssetDescriptor {
  type: "texture";
  options?: {
    flipY?: boolean;
    anisotropy?: number;
    minFilter?: THREE.TextureFilter;
    magFilter?: THREE.TextureFilter;
    wrapS?: THREE.Wrapping;
    wrapT?: THREE.Wrapping;
  };
}

/**
 * Cubemap asset descriptor with cubemap-specific options
 */
export interface CubemapAssetDescriptor extends AssetDescriptor {
  type: "cubemap";
  urls: {
    px: string; // positive x
    nx: string; // negative x
    py: string; // positive y
    ny: string; // negative y
    pz: string; // positive z
    nz: string; // negative z
  };
  options?: {
    path?: string; // Base path to prepend to each URL
  };
}

/**
 * Model asset descriptor with model-specific options
 */
export interface ModelAssetDescriptor extends AssetDescriptor {
  type: "model";
  options?: {
    scale?: number;
    position?: { x: number; y: number; z: number };
    castShadow?: boolean;
    receiveShadow?: boolean;
  };
}

/**
 * Audio asset descriptor with audio-specific options
 */
export interface AudioAssetDescriptor extends AssetDescriptor {
  type: "audio";
  options?: {
    positional?: boolean;
    loop?: boolean;
    volume?: number;
    autoplay?: boolean;
  };
}

/**
 * JSON asset descriptor
 */
export interface JsonAssetDescriptor extends AssetDescriptor {
  type: "json";
}

/**
 * Font asset descriptor
 */
export interface FontAssetDescriptor extends AssetDescriptor {
  type: "font";
}

/**
 * Union type of all asset descriptors
 */
export type AnyAssetDescriptor =
  | TextureAssetDescriptor
  | CubemapAssetDescriptor
  | ModelAssetDescriptor
  | AudioAssetDescriptor
  | JsonAssetDescriptor
  | FontAssetDescriptor;

/**
 * Asset load progress event data
 */
export interface AssetProgressEvent {
  assetId: string;
  loaded: number;
  total: number;
  progress: number; // 0 to 1
  overallProgress: number; // 0 to 1
}

/**
 * Asset error event data
 */
export interface AssetErrorEvent {
  assetId: string;
  url: string;
  error: Error;
}

/**
 * Asset events that can be listened to
 */
export type AssetEventType = "progress" | "complete" | "error" | "load";

/**
 * Map of asset types to their corresponding loaded type
 */
export interface AssetTypeMap {
  texture: THREE.Texture;
  cubemap: THREE.CubeTexture;
  model: THREE.Group;
  audio: AudioBuffer;
  json: any;
  font: Font;
}

/**
 * Get the loaded asset type by asset type string
 */
export type AssetTypeOf<T extends AssetType> = AssetTypeMap[T];
