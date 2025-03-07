/**
 * Simple HUD (Heads-Up Display) for showing game information
 */

interface HUDOptions {
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  backgroundColor?: string;
}

export class SimpleHUD {
  private container: HTMLDivElement;
  private speedElement: HTMLDivElement;
  private altitudeElement: HTMLDivElement;
  private aircraftModelElement: HTMLDivElement;
  private throttleMeter: HTMLDivElement;
  private throttleBar: HTMLDivElement;
  private options: Required<HUDOptions>;

  // Default options
  private static readonly DEFAULT_OPTIONS: Required<HUDOptions> = {
    fontSize: 16,
    fontFamily: "Arial, sans-serif",
    textColor: "#ffffff",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  };

  constructor(options: HUDOptions = {}) {
    this.options = { ...SimpleHUD.DEFAULT_OPTIONS, ...options };

    // Create container
    this.container = document.createElement("div");
    this.container.style.position = "absolute";
    this.container.style.top = "0";
    this.container.style.left = "0";
    this.container.style.width = "100%";
    this.container.style.height = "100%";
    this.container.style.pointerEvents = "none";
    this.container.style.zIndex = "100";
    document.body.appendChild(this.container);

    // Create speed indicator
    this.speedElement = document.createElement("div");
    this.speedElement.style.position = "absolute";
    this.speedElement.style.bottom = "20px";
    this.speedElement.style.right = "20px";
    this.speedElement.style.padding = "5px 10px";
    this.speedElement.style.backgroundColor = this.options.backgroundColor;
    this.speedElement.style.color = this.options.textColor;
    this.speedElement.style.fontFamily = this.options.fontFamily;
    this.speedElement.style.fontSize = `${this.options.fontSize}px`;
    this.speedElement.style.borderRadius = "4px";
    this.container.appendChild(this.speedElement);

    // Create altitude indicator
    this.altitudeElement = document.createElement("div");
    this.altitudeElement.style.position = "absolute";
    this.altitudeElement.style.bottom = "20px";
    this.altitudeElement.style.right = "150px";
    this.altitudeElement.style.padding = "5px 10px";
    this.altitudeElement.style.backgroundColor = this.options.backgroundColor;
    this.altitudeElement.style.color = this.options.textColor;
    this.altitudeElement.style.fontFamily = this.options.fontFamily;
    this.altitudeElement.style.fontSize = `${this.options.fontSize}px`;
    this.altitudeElement.style.borderRadius = "4px";
    this.container.appendChild(this.altitudeElement);

    // Create aircraft model indicator
    this.aircraftModelElement = document.createElement("div");
    this.aircraftModelElement.style.position = "absolute";
    this.aircraftModelElement.style.top = "20px";
    this.aircraftModelElement.style.right = "20px";
    this.aircraftModelElement.style.padding = "5px 10px";
    this.aircraftModelElement.style.backgroundColor =
      this.options.backgroundColor;
    this.aircraftModelElement.style.color = this.options.textColor;
    this.aircraftModelElement.style.fontFamily = this.options.fontFamily;
    this.aircraftModelElement.style.fontSize = `${this.options.fontSize}px`;
    this.aircraftModelElement.style.borderRadius = "4px";
    this.container.appendChild(this.aircraftModelElement);

    // Create throttle meter to match the one in the screenshot
    this.throttleMeter = document.createElement("div");
    this.throttleMeter.style.position = "absolute";
    this.throttleMeter.style.top = "120px";
    this.throttleMeter.style.left = "32px";
    this.throttleMeter.style.width = "32px";
    this.throttleMeter.style.height = "200px";
    this.throttleMeter.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    this.throttleMeter.style.border = "2px solid #ff00ff"; // Pink border like in the screenshot
    this.throttleMeter.style.borderRadius = "6px";
    this.throttleMeter.style.overflow = "hidden";
    this.container.appendChild(this.throttleMeter);

    // Create throttle bar (fill)
    this.throttleBar = document.createElement("div");
    this.throttleBar.style.position = "absolute";
    this.throttleBar.style.bottom = "0";
    this.throttleBar.style.left = "0";
    this.throttleBar.style.width = "100%";
    this.throttleBar.style.height = "0%";
    this.throttleBar.style.backgroundColor = "#ffaa00"; // Orange like in the screenshot
    this.throttleMeter.appendChild(this.throttleBar);

    // Add the "m/s" text above throttle meter instead of ZIC/TES
    const speedLabel = document.createElement("div");
    speedLabel.style.position = "absolute";
    speedLabel.style.top = "90px";
    speedLabel.style.left = "32px";
    speedLabel.style.color = "#ffffff";
    speedLabel.style.fontFamily = this.options.fontFamily;
    speedLabel.style.fontSize = `${this.options.fontSize}px`;
    speedLabel.style.textShadow = "1px 1px 2px black";
    speedLabel.textContent = "m/s";
    this.container.appendChild(speedLabel);

    // Add pink marker lines to throttle meter
    const markerCount = 6;
    for (let i = 0; i < markerCount; i++) {
      const position = 100 - i * (100 / (markerCount - 1));
      const marker = document.createElement("div");
      marker.style.position = "absolute";
      marker.style.left = "0";
      marker.style.width = "100%";
      marker.style.height = "2px";
      marker.style.backgroundColor = "#ff00ff"; // Pink markers
      marker.style.bottom = `${position}%`;
      this.throttleMeter.appendChild(marker);
    }
  }

  /**
   * Update HUD information
   * @param modelType Current aircraft model type
   * @param speed Current speed
   * @param altitude Current altitude
   * @param throttle Current throttle level (0-1)
   */
  public update(
    modelType: number,
    speed: number,
    altitude: number,
    throttle: number = 0
  ): void {
    // Format speed to be a whole number
    const speedKmh = Math.round(speed * 3.6); // Convert m/s to km/h
    this.speedElement.textContent = `SPEED: ${speedKmh} km/h`;

    // Format altitude to be a whole number in meters
    const altitudeMeters = Math.round(altitude);
    this.altitudeElement.textContent = `ALT: ${altitudeMeters} m`;

    // Aircraft model name
    const modelNames = [
      "E-7 Sky Bullet",
      "BP-6 Hammer Head",
      "E-9 Dragon Bird",
      "EXA-1 Destroyer",
      "Silver F-51 Legend",
    ];
    const modelName = modelNames[modelType - 1] || "Unknown";
    this.aircraftModelElement.textContent = `AIRCRAFT: ${modelName}`;

    // Update throttle meter
    const throttlePercent = Math.round(throttle * 100);
    this.throttleBar.style.height = `${throttlePercent}%`;

    // Change throttle color based on level
    if (throttlePercent > 80) {
      this.throttleBar.style.backgroundColor = "#ff0000"; // Red at high throttle
    } else if (throttlePercent > 50) {
      this.throttleBar.style.backgroundColor = "#ffaa00"; // Orange at medium throttle
    } else {
      this.throttleBar.style.backgroundColor = "#ffdd00"; // Yellow at low throttle
    }
  }

  /**
   * Remove HUD elements from the DOM
   */
  public destroy(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
