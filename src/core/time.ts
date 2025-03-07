/**
 * Time manager for handling game time, frame delta, and time scaling
 */

export class TimeManager {
  private startTime: number;
  private lastFrameTime: number;
  private deltaTime: number = 0;
  private frameCount: number = 0;
  private elapsedTime: number = 0;
  private timeScale: number = 1.0;
  private fps: number = 0;
  private fpsUpdateInterval: number = 1.0; // Update FPS every second
  private fpsUpdateTimer: number = 0;
  private fpsFrameCount: number = 0;

  constructor() {
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
  }

  /**
   * Update time values (call once per frame)
   */
  public update(): void {
    const currentTime = performance.now();

    // Calculate delta time in seconds
    this.deltaTime =
      ((currentTime - this.lastFrameTime) / 1000) * this.timeScale;
    this.lastFrameTime = currentTime;

    // Update elapsed time
    this.elapsedTime += this.deltaTime;

    // Update frame count
    this.frameCount++;
    this.fpsFrameCount++;

    // Update FPS counter
    this.fpsUpdateTimer += this.deltaTime;
    if (this.fpsUpdateTimer >= this.fpsUpdateInterval) {
      this.fps = this.fpsFrameCount / this.fpsUpdateTimer;
      this.fpsFrameCount = 0;
      this.fpsUpdateTimer = 0;
    }
  }

  /**
   * Get the time elapsed since the last frame in seconds
   */
  public getDeltaTime(): number {
    return this.deltaTime;
  }

  /**
   * Get the total elapsed time since the game started in seconds
   */
  public getElapsedTime(): number {
    return this.elapsedTime;
  }

  /**
   * Get the current frame count
   */
  public getFrameCount(): number {
    return this.frameCount;
  }

  /**
   * Get the current frames per second
   */
  public getFPS(): number {
    return this.fps;
  }

  /**
   * Set the time scale (1.0 = normal speed, 0.5 = half speed, 2.0 = double speed)
   */
  public setTimeScale(scale: number): void {
    this.timeScale = Math.max(0, scale); // Prevent negative time scale
  }

  /**
   * Get the current time scale
   */
  public getTimeScale(): number {
    return this.timeScale;
  }
}

export default TimeManager;
