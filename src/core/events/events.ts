/**
 * Custom event type declarations for Radical Aces
 * Extends Three.js event system with proper typings
 */

import { Event } from "three";

/**
 * Base interface for all Radical Aces events
 */
export interface RAEvent extends Event {
  type: string;
}

/**
 * Asset loading related events
 */
export interface AssetProgressRAEvent extends RAEvent {
  type: "progress";
  assetId: string;
  loaded: number;
  total: number;
  progress: number;
  overallProgress: number;
}

export interface AssetLoadRAEvent extends RAEvent {
  type: "load";
  assetId: string;
}

export interface AssetErrorRAEvent extends RAEvent {
  type: "error";
  assetId: string;
  url: string;
  error: Error;
}

export interface AssetCompleteRAEvent extends RAEvent {
  type: "complete";
}

/**
 * Union type of all asset events
 */
export type AssetEventTypes =
  | AssetProgressRAEvent
  | AssetLoadRAEvent
  | AssetErrorRAEvent
  | AssetCompleteRAEvent;

/**
 * Event listener types for assets
 */
export type AssetEventListener<T extends AssetEventTypes> = (event: T) => void;

/**
 * Map of event types to event objects
 */
export interface AssetEventMap {
  progress: AssetProgressRAEvent;
  load: AssetLoadRAEvent;
  error: AssetErrorRAEvent;
  complete: AssetCompleteRAEvent;
}

/**
 * Helper type for accessing event objects by type
 */
export type AssetEventOf<T extends keyof AssetEventMap> = AssetEventMap[T];
