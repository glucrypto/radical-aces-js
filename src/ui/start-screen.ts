/**
 * Start Screen
 * Main menu screen for the game that matches the original Java version
 */

import UIComponent from "./ui-component";

// Game screen phases matching the original game's 'fase' values
export enum ScreenPhase {
  INTRO = -8, // Mars background with scrolling text
  INSTRUCTIONS1 = -7, // First instruction screen
  INSTRUCTIONS2 = -6, // Second instruction screen
  INSTRUCTIONS3 = -55, // Third instruction screen
  MAIN_MENU = -5, // Main menu screen
}

/**
 * Start screen configuration
 */
export interface StartScreenOptions {
  onStart?: () => void;
  onSettings?: () => void;
  onCredits?: () => void;
  onExit?: () => void;
  onResume?: () => void;
  hasSavedGame?: boolean;
  backgroundUrl?: string;
  debug?: boolean; // Skip intro and go directly to main menu
}

/**
 * Start Screen class
 */
export default class StartScreen extends UIComponent {
  private menuItems: HTMLElement[] = [];
  private selectedIndex: number = 0;
  private callbacks: {
    onStart?: () => void;
    onSettings?: () => void;
    onCredits?: () => void;
    onExit?: () => void;
    onResume?: () => void;
  };
  private hasSavedGame: boolean = false;
  private noSavedGameWarning!: HTMLElement;
  private warningCount: number = 0;
  private animationFrameId: number | null = null;
  private flickerState: boolean = false;
  private mainImage!: HTMLImageElement;
  private shipImages: HTMLImageElement[] = [];
  private radarImage: HTMLImageElement | null = null;
  private radarX: number = 500;
  private radarY: number = 50;
  private radCntS: number = 10;
  private radCntF: number = 0;

  // Instruction screen elements
  private currentPhase: ScreenPhase = ScreenPhase.INTRO;
  private marsImage!: HTMLImageElement;
  private textImage: HTMLDivElement | null = null;
  private textY: number = 380;
  private instructionScreens!: {
    inst1: HTMLImageElement;
    inst2: HTMLImageElement;
    inst3: HTMLImageElement;
  };
  private instructionContainer!: HTMLElement;
  private continueText!: HTMLElement;
  private mainMenuContainer!: HTMLElement;

  // Store debug mode setting
  private debugMode: boolean = false;

  /**
   * Create a new start screen based on the original game
   * @param options Configuration options
   */
  constructor(options: StartScreenOptions = {}) {
    // Create container
    super("div", {
      id: "start-screen",
      className: "game-screen",
    });

    // Store callbacks
    this.callbacks = {
      onStart: options.onStart,
      onSettings: options.onSettings,
      onCredits: options.onCredits,
      onExit: options.onExit,
      onResume: options.onResume,
    };

    this.hasSavedGame = options.hasSavedGame || false;

    // Store debug mode setting
    this.debugMode = options.debug || false;

    // Style the container
    this.element.style.position = "absolute";
    this.element.style.top = "0";
    this.element.style.left = "0";
    this.element.style.width = "100%";
    this.element.style.height = "100%";
    this.element.style.display = "flex";
    this.element.style.flexDirection = "column";
    this.element.style.justifyContent = "center";
    this.element.style.alignItems = "center";
    this.element.style.color = "#ffffff";
    this.element.style.fontFamily = "Arial, sans-serif";
    this.element.style.zIndex = "100";

    // Create phase containers
    this.setupIntroScreen();
    this.setupInstructionScreens();
    this.setupMainMenuScreen(
      options.backgroundUrl || "assets/graphics/main.gif"
    );

    // Add keyboard event listener
    document.addEventListener("keydown", this.handleKeyDown.bind(this));

    // Show the correct container based on initial phase
    this.setPhase(ScreenPhase.INTRO);

    // Initially hide the screen
    this.hide();
  }

  /**
   * Set up the intro screen with Mars background and scrolling text
   */
  private setupIntroScreen(): void {
    const introContainer = document.createElement("div");
    introContainer.style.position = "absolute";
    introContainer.style.top = "0";
    introContainer.style.left = "0";
    introContainer.style.width = "100%";
    introContainer.style.height = "100%";
    introContainer.style.display = "none";
    this.element.appendChild(introContainer);

    // Mars background
    this.marsImage = document.createElement("img");
    this.marsImage.src = "assets/graphics/mars.jpg";
    this.marsImage.style.position = "absolute";
    this.marsImage.style.top = "0";
    this.marsImage.style.left = "0";
    this.marsImage.style.width = "100%";
    this.marsImage.style.height = "100%";
    this.marsImage.style.objectFit = "cover";
    introContainer.appendChild(this.marsImage);

    // Create "Click here to start" text - this replaces the continueText
    this.continueText = document.createElement("div");
    this.continueText.textContent = "Click here to Start";
    this.continueText.style.position = "absolute";
    this.continueText.style.left = "50%";
    this.continueText.style.top = "170px";
    this.continueText.style.transform = "translateX(-50%)";
    this.continueText.style.fontFamily = "Arial, sans-serif";
    this.continueText.style.fontSize = "18px";
    this.continueText.style.color = "#000000";
    this.continueText.style.cursor = "pointer";
    this.continueText.style.zIndex = "10";
    this.continueText.addEventListener("click", () => {
      // Change text to "Click here to Continue" after first click
      this.continueText.textContent = "Click here to Continue";

      // Start the scrolling text animation or proceed to next phase
      if (this.textY <= 350) {
        this.setPhase(ScreenPhase.INSTRUCTIONS1);
      }
    });
    introContainer.appendChild(this.continueText);
  }

  /**
   * Set up instruction screens
   */
  private setupInstructionScreens(): void {
    this.instructionContainer = document.createElement("div");
    this.instructionContainer.style.position = "absolute";
    this.instructionContainer.style.top = "0";
    this.instructionContainer.style.left = "0";
    this.instructionContainer.style.width = "100%";
    this.instructionContainer.style.height = "100%";
    this.instructionContainer.style.display = "none";
    this.element.appendChild(this.instructionContainer);

    // Create instruction screens
    this.instructionScreens = {
      inst1: document.createElement("img"),
      inst2: document.createElement("img"),
      inst3: document.createElement("img"),
    };

    this.instructionScreens.inst1.src = "assets/graphics/inst1.gif";
    this.instructionScreens.inst1.style.position = "absolute";
    this.instructionScreens.inst1.style.top = "0";
    this.instructionScreens.inst1.style.left = "0";
    this.instructionScreens.inst1.style.width = "100%";
    this.instructionScreens.inst1.style.height = "100%";
    this.instructionScreens.inst1.style.objectFit = "cover";
    this.instructionScreens.inst1.style.display = "none";
    this.instructionContainer.appendChild(this.instructionScreens.inst1);

    this.instructionScreens.inst2.src = "assets/graphics/inst2.gif";
    this.instructionScreens.inst2.style.position = "absolute";
    this.instructionScreens.inst2.style.top = "0";
    this.instructionScreens.inst2.style.left = "0";
    this.instructionScreens.inst2.style.width = "100%";
    this.instructionScreens.inst2.style.height = "100%";
    this.instructionScreens.inst2.style.objectFit = "cover";
    this.instructionScreens.inst2.style.display = "none";
    this.instructionContainer.appendChild(this.instructionScreens.inst2);

    this.instructionScreens.inst3.src = "assets/graphics/inst3.gif";
    this.instructionScreens.inst3.style.position = "absolute";
    this.instructionScreens.inst3.style.top = "0";
    this.instructionScreens.inst3.style.left = "0";
    this.instructionScreens.inst3.style.width = "100%";
    this.instructionScreens.inst3.style.height = "100%";
    this.instructionScreens.inst3.style.objectFit = "cover";
    this.instructionScreens.inst3.style.display = "none";
    this.instructionContainer.appendChild(this.instructionScreens.inst3);

    // Create instruction continue text
    const instructionContinueText = document.createElement("div");
    instructionContinueText.textContent = "Press Enter to continue >";
    instructionContinueText.style.position = "absolute";
    instructionContinueText.style.left = "50%";
    instructionContinueText.style.top = "354px";
    instructionContinueText.style.transform = "translateX(-50%)";
    instructionContinueText.style.fontFamily = "Arial, sans-serif";
    instructionContinueText.style.fontSize = "16px";
    instructionContinueText.style.color = "#aaaaaa";
    this.instructionContainer.appendChild(instructionContinueText);
  }

  /**
   * Set up the main menu screen
   */
  private setupMainMenuScreen(backgroundUrl: string): void {
    this.mainMenuContainer = document.createElement("div");
    this.mainMenuContainer.style.position = "absolute";
    this.mainMenuContainer.style.top = "0";
    this.mainMenuContainer.style.left = "0";
    this.mainMenuContainer.style.width = "100%";
    this.mainMenuContainer.style.height = "100%";
    this.mainMenuContainer.style.display = "none";
    this.element.appendChild(this.mainMenuContainer);

    // Create main background image
    this.mainImage = document.createElement("img");
    this.mainImage.src = backgroundUrl;
    this.mainImage.style.position = "absolute";
    this.mainImage.style.top = "0";
    this.mainImage.style.left = "0";
    this.mainImage.style.width = "100%";
    this.mainImage.style.height = "100%";
    this.mainImage.style.objectFit = "cover";
    this.mainMenuContainer.appendChild(this.mainImage);

    // Add logo at the top of the screen
    const logoImage = document.createElement("img");
    logoImage.src = "/wordlogo_white_full.png";
    logoImage.style.position = "absolute";
    logoImage.style.top = "100px";
    logoImage.style.left = "50%";
    logoImage.style.transform = "translateX(-50%)";
    logoImage.style.maxWidth = "30%";
    logoImage.style.height = "auto";
    logoImage.style.zIndex = "1";
    this.mainMenuContainer.appendChild(logoImage);

    // Create menu items based on the original game
    const menuItemsData = [
      { text: "Start New Game", callback: () => this.handleStart(), y: 274 },
      {
        text: "Resume Saved Game",
        callback: () => this.handleResume(),
        disabled: !this.hasSavedGame,
        y: 289,
      },
      { text: "Game Controls", callback: () => this.handleSettings(), y: 304 },
      { text: "Credits", callback: () => this.handleCredits(), y: 319 },
      { text: "Exit Game", callback: () => this.handleExit(), y: 334 },
    ];

    menuItemsData.forEach((item, index) => {
      const menuItem = document.createElement("div");
      menuItem.textContent = item.text;
      menuItem.style.position = "absolute";
      menuItem.style.left = "50%";
      menuItem.style.top = `${item.y}px`; // Use exact y-position from original game
      menuItem.style.transform = "translateX(-50%)";
      menuItem.style.fontFamily = "Arial, sans-serif";
      menuItem.style.fontSize = "16px";
      menuItem.style.color = item.disabled ? "#c8c8c8" : "#000000";
      menuItem.style.cursor = item.disabled ? "default" : "pointer";
      menuItem.dataset.index = index.toString();

      menuItem.addEventListener("click", () => {
        if (!item.disabled) {
          this.selectedIndex = index;
          item.callback();
        } else if (index === 1 && !this.hasSavedGame) {
          this.showNoSavedGameWarning();
        }
      });

      this.mainMenuContainer.appendChild(menuItem);
      this.menuItems.push(menuItem);
    });

    // Create no saved game warning
    this.noSavedGameWarning = document.createElement("div");
    this.noSavedGameWarning.textContent = "No Saved Game!";
    this.noSavedGameWarning.style.position = "absolute";
    this.noSavedGameWarning.style.left = "50%";
    this.noSavedGameWarning.style.top = "289px";
    this.noSavedGameWarning.style.transform = "translateX(-50%)";
    this.noSavedGameWarning.style.fontFamily = "Arial, sans-serif";
    this.noSavedGameWarning.style.fontSize = "16px";
    this.noSavedGameWarning.style.color = "#640000";
    this.noSavedGameWarning.style.display = "none";
    this.mainMenuContainer.appendChild(this.noSavedGameWarning);

    // Add instructions text at bottom
    const instructionsText = document.createElement("div");
    instructionsText.textContent =
      "( use keyboard arrows to select and press Enter )";
    instructionsText.style.position = "absolute";
    instructionsText.style.left = "50%";
    instructionsText.style.top = "354px";
    instructionsText.style.transform = "translateX(-50%)";
    instructionsText.style.fontFamily = "Arial, sans-serif";
    instructionsText.style.fontSize = "14px";
    instructionsText.style.color = "#aaaaaa";
    this.mainMenuContainer.appendChild(instructionsText);
  }

  /**
   * Set the current phase and update display
   */
  private setPhase(phase: ScreenPhase): void {
    this.currentPhase = phase;

    // Hide all containers
    this.marsImage.parentElement!.style.display = "none";
    this.instructionContainer.style.display = "none";
    this.mainMenuContainer.style.display = "none";

    // Show the appropriate container
    switch (phase) {
      case ScreenPhase.INTRO:
        this.marsImage.parentElement!.style.display = "block";
        this.textY = 380; // Reset text position
        // The continueText is now the "Click here to Start" text, which is always visible
        break;
      case ScreenPhase.INSTRUCTIONS1:
        this.instructionContainer.style.display = "block";
        this.instructionScreens.inst1.style.display = "block";
        this.instructionScreens.inst2.style.display = "none";
        this.instructionScreens.inst3.style.display = "none";
        break;
      case ScreenPhase.INSTRUCTIONS2:
        this.instructionContainer.style.display = "block";
        this.instructionScreens.inst1.style.display = "none";
        this.instructionScreens.inst2.style.display = "block";
        this.instructionScreens.inst3.style.display = "none";
        break;
      case ScreenPhase.INSTRUCTIONS3:
        this.instructionContainer.style.display = "block";
        this.instructionScreens.inst1.style.display = "none";
        this.instructionScreens.inst2.style.display = "none";
        this.instructionScreens.inst3.style.display = "block";
        break;
      case ScreenPhase.MAIN_MENU:
        this.mainMenuContainer.style.display = "block";
        break;
    }
  }

  /**
   * Handle keyboard navigation
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isVisible) return;

    // Handle enter key in different phases
    if (event.key === "Enter" || event.key === " ") {
      switch (this.currentPhase) {
        case ScreenPhase.INTRO:
          // Change text to "Click here to Continue" after pressing Enter
          this.continueText.textContent = "Click here to Continue";

          // Only proceed if the text animation has completed
          if (this.textY <= 350) {
            this.setPhase(ScreenPhase.INSTRUCTIONS1);
          }
          break;
        case ScreenPhase.INSTRUCTIONS1:
          this.setPhase(ScreenPhase.INSTRUCTIONS2);
          break;
        case ScreenPhase.INSTRUCTIONS2:
          this.setPhase(ScreenPhase.INSTRUCTIONS3);
          break;
        case ScreenPhase.INSTRUCTIONS3:
          this.setPhase(ScreenPhase.MAIN_MENU);
          break;
        case ScreenPhase.MAIN_MENU:
          this.triggerSelectedOption();
          break;
      }
      return;
    }

    // Handle arrow keys in main menu
    if (this.currentPhase === ScreenPhase.MAIN_MENU) {
      switch (event.key) {
        case "ArrowUp":
          this.selectedIndex = Math.max(0, this.selectedIndex - 1);
          break;
        case "ArrowDown":
          this.selectedIndex = Math.min(4, this.selectedIndex + 1);
          break;
      }
    }
  }

  /**
   * Trigger the currently selected menu option
   */
  private triggerSelectedOption(): void {
    switch (this.selectedIndex) {
      case 0:
        this.handleStart();
        break;
      case 1:
        this.handleResume();
        break;
      case 2:
        this.handleSettings();
        break;
      case 3:
        this.handleCredits();
        break;
      case 4:
        this.handleExit();
        break;
    }
  }

  /**
   * Show "No Saved Game" warning
   */
  private showNoSavedGameWarning(): void {
    this.warningCount = 20;
    this.noSavedGameWarning.style.display = "block";
  }

  /**
   * Update animation frame
   */
  private update(): void {
    // Handle intro screen text scrolling
    if (this.currentPhase === ScreenPhase.INTRO) {
      // Animate text scrolling up
      if (this.textY > 0) {
        this.textY--;

        // Create text element if it doesn't exist yet
        if (!this.textImage) {
          // In the original game, this was an image
          // Here we'll simulate it with a text element
          /*  this.textImage = document.createElement("div");
          this.textImage.style.position = "absolute";
          this.textImage.style.left = "10px";
          this.textImage.style.color = "white";
          this.textImage.style.fontFamily = "Arial, sans-serif";
          this.textImage.style.fontSize = "16px";
          this.textImage.style.textAlign = "center";
          this.textImage.style.width = "480px";
          this.textImage.innerHTML = `
            <h2>Radical Aces</h2>
            <p>It is the year 3003...</p>
            <p>Earth's resources have been depleted, forcing humanity to establish colonies on Mars.</p>
            <p>As tensions rise between the different factions, you've been recruited as an elite pilot in the Radical Aces squadron.</p>
            <p>Your mission: defend the Mars colonies against enemy forces and ensure humanity's survival.</p>
            <p>Take control of the most advanced fighter craft and prove your worth in the skies of Mars.</p>
            <p>The fate of the colonies rests in your hands.</p>
          `;
          this.marsImage.parentElement!.appendChild(this.textImage); */
        }

        //this.textImage.style.top = `${this.textY}px`;

        // No need to show a separate "Press Enter to continue" message
        // The "Click here to Start/Continue" message is always visible
      }
    }

    // Handle warning countdown
    if (this.warningCount > 0) {
      this.warningCount--;
      if (this.warningCount === 0) {
        this.noSavedGameWarning.style.display = "none";
      }
    }

    // Update selection highlight only in main menu
    if (this.currentPhase === ScreenPhase.MAIN_MENU) {
      this.menuItems.forEach((item, index) => {
        if (index === this.selectedIndex) {
          // Calculate selection width based on text length
          const textWidth = item.textContent ? item.textContent.length * 5 : 60;

          // Flicker the selection rectangle
          if (this.flickerState) {
            item.style.boxShadow = `0 0 0 1px #e1e6ff`;
            item.style.background = "none";
          } else {
            item.style.boxShadow = `0 0 0 1px #a8b7ff`;
            item.style.background = "none";
          }

          // Add visual indicator for selection
          const widthOffset = textWidth / 2;
          item.style.paddingLeft = `${widthOffset}px`;
          item.style.paddingRight = `${widthOffset}px`;
          item.style.marginLeft = `-${widthOffset}px`;
        } else {
          item.style.boxShadow = "none";
          item.style.background = "none";
          item.style.paddingLeft = "0";
          item.style.paddingRight = "0";
          item.style.marginLeft = "0";
        }
      });

      // Toggle flicker state
      this.flickerState = !this.flickerState;

      // Update radar position
      this.radCntS -= 7;
      if (this.radCntS < -900) {
        this.radCntS = 0;
        this.radCntF = Math.floor(Math.random() * 150);
      }
    }

    // Request next frame
    this.animationFrameId = requestAnimationFrame(this.update.bind(this));
  }

  /**
   * Handle start button click
   */
  private handleStart(): void {
    if (this.callbacks.onStart) {
      this.callbacks.onStart();
    }
  }

  /**
   * Handle resume button click
   */
  private handleResume(): void {
    if (!this.hasSavedGame) {
      this.showNoSavedGameWarning();
      return;
    }

    if (this.callbacks.onResume) {
      this.callbacks.onResume();
    }
  }

  /**
   * Handle settings button click
   */
  private handleSettings(): void {
    // In the original game, this showed the instruction screens
    this.setPhase(ScreenPhase.INSTRUCTIONS1);

    if (this.callbacks.onSettings) {
      this.callbacks.onSettings();
    }
  }

  /**
   * Handle credits button click
   */
  private handleCredits(): void {
    if (this.callbacks.onCredits) {
      this.callbacks.onCredits();
    }
  }

  /**
   * Handle exit button click
   */
  private handleExit(): void {
    if (this.callbacks.onExit) {
      this.callbacks.onExit();
    }
  }

  /**
   * Show the start screen
   */
  public show(): void {
    // Add to DOM if not already present
    if (!this.parent) {
      document.body.appendChild(this.element);
      this.parent = document.body;
    }

    super.show();

    // If debug mode is enabled, skip to main menu immediately
    if (this.debugMode) {
      this.setPhase(ScreenPhase.MAIN_MENU);
    } else {
      // Otherwise, start from the beginning
      this.setPhase(ScreenPhase.INTRO);
    }

    // Start animation
    this.update();
  }

  /**
   * Skip to main menu (bypassing intro and instructions)
   */
  public skipToMainMenu(): void {
    this.setPhase(ScreenPhase.MAIN_MENU);
  }

  /**
   * Hide the start screen
   */
  public hide(): void {
    super.hide();

    // Stop animation
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
