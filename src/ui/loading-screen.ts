/**
 * Loading Screen
 * Displays loading progress for game assets
 */

/**
 * Loading screen configuration
 */
export interface LoadingScreenOptions {
  backgroundColor?: string;
  progressBarColor?: string;
  textColor?: string;
  logoUrl?: string;
  fadeTime?: number; // milliseconds
}

/**
 * Loading Screen class
 */
export class LoadingScreen {
  private container: HTMLDivElement;
  private progressBar: HTMLDivElement;
  private progressText: HTMLDivElement;
  private logo: HTMLImageElement | null = null;
  private statusText: HTMLDivElement;
  private options: LoadingScreenOptions;
  private isVisible: boolean = false;

  /**
   * Create a new loading screen
   * @param options Configuration options
   */
  constructor(options: LoadingScreenOptions = {}) {
    this.options = {
      backgroundColor: "#000000",
      progressBarColor: "#ff4444",
      textColor: "#ffffff",
      fadeTime: 500,
      ...options,
    };

    // Create container
    this.container = document.createElement("div");
    this.container.style.position = "absolute";
    this.container.style.top = "0";
    this.container.style.left = "0";
    this.container.style.width = "100%";
    this.container.style.height = "100%";
    this.container.style.backgroundColor =
      this.options.backgroundColor || "#000000";
    this.container.style.display = "flex";
    this.container.style.flexDirection = "column";
    this.container.style.justifyContent = "center";
    this.container.style.alignItems = "center";
    this.container.style.color = this.options.textColor || "#ffffff";
    this.container.style.fontFamily = "Arial, sans-serif";
    this.container.style.zIndex = "1000";
    this.container.style.opacity = "1";
    this.container.style.transition = `opacity ${
      this.options.fadeTime || 500
    }ms ease-in-out`;

    // Add logo if provided
    if (this.options.logoUrl) {
      this.logo = document.createElement("img");
      this.logo.src = this.options.logoUrl;
      this.logo.style.maxWidth = "70%";
      this.logo.style.marginBottom = "2rem";
      this.container.appendChild(this.logo);
    }

    // Game title
    const title = document.createElement("h1");
    title.textContent = "Radical Aces";
    title.style.fontSize = "2.5rem";
    title.style.marginBottom = "2rem";
    title.style.textShadow = "0 0 10px rgba(255, 68, 68, 0.7)";
    this.container.appendChild(title);

    // Progress container
    const progressContainer = document.createElement("div");
    progressContainer.style.width = "80%";
    progressContainer.style.maxWidth = "600px";
    progressContainer.style.background = "rgba(0, 0, 0, 0.5)";
    progressContainer.style.borderRadius = "10px";
    progressContainer.style.padding = "4px";
    progressContainer.style.marginBottom = "1rem";
    progressContainer.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";

    // Progress bar
    this.progressBar = document.createElement("div");
    this.progressBar.style.width = "0%";
    this.progressBar.style.height = "20px";
    this.progressBar.style.backgroundColor =
      this.options.progressBarColor || "#ff4444";
    this.progressBar.style.borderRadius = "6px";
    this.progressBar.style.transition = "width 0.3s ease-out";
    progressContainer.appendChild(this.progressBar);

    this.container.appendChild(progressContainer);

    // Progress text
    this.progressText = document.createElement("div");
    this.progressText.style.fontSize = "1rem";
    this.progressText.style.marginBottom = "1rem";
    this.progressText.textContent = "Loading: 0%";
    this.container.appendChild(this.progressText);

    // Status text
    this.statusText = document.createElement("div");
    this.statusText.style.fontSize = "0.9rem";
    this.statusText.style.opacity = "0.7";
    this.statusText.textContent = "Preparing game...";
    this.container.appendChild(this.statusText);

    // Hide by default
    this.container.style.display = "none";
  }

  /**
   * Show the loading screen
   */
  public show(): void {
    if (!this.isVisible) {
      document.body.appendChild(this.container);
      this.container.style.display = "flex";
      this.isVisible = true;

      // Force a reflow before setting opacity for the transition to work
      this.container.offsetHeight;
      this.container.style.opacity = "1";
    }
  }

  /**
   * Hide the loading screen
   */
  public hide(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isVisible) {
        this.container.style.opacity = "0";

        setTimeout(() => {
          this.container.style.display = "none";
          if (this.container.parentNode) {
            document.body.removeChild(this.container);
          }
          this.isVisible = false;
          resolve();
        }, this.options.fadeTime || 500);
      } else {
        resolve();
      }
    });
  }

  /**
   * Update the progress bar
   * @param progress Progress value (0-1)
   */
  public updateProgress(progress: number): void {
    const percentage = Math.floor(progress * 100);
    this.progressBar.style.width = `${percentage}%`;
    this.progressText.textContent = `Loading: ${percentage}%`;
  }

  /**
   * Update the status text
   * @param status New status text
   */
  public updateStatus(status: string): void {
    this.statusText.textContent = status;
  }
}
