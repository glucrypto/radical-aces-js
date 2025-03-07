/**
 * Input manager for handling keyboard and mouse inputs
 */

export enum InputKey {
  UP = "ArrowUp",
  DOWN = "ArrowDown",
  LEFT = "ArrowLeft",
  RIGHT = "ArrowRight",
  SPACE = " ",
  SHIFT = "Shift",
  CTRL = "Control",
  // Aircraft control keys
  W = "w",
  A = "a",
  S = "s",
  D = "d",
  Q = "q",
  E = "e",
  // Aircraft selection keys
  ONE = "1",
  TWO = "2",
  THREE = "3",
  FOUR = "4",
  FIVE = "5",
  // Add more keys as needed
}

export type KeyState = {
  pressed: boolean;
  justPressed: boolean;
  justReleased: boolean;
};

export class InputManager {
  private keyStates: Map<string, KeyState> = new Map();
  private mousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private mouseButtons: Map<number, KeyState> = new Map();

  constructor() {
    // Initialize key states
    Object.values(InputKey).forEach((key) => {
      this.keyStates.set(key, {
        pressed: false,
        justPressed: false,
        justReleased: false,
      });
    });

    // Initialize mouse buttons
    for (let i = 0; i < 3; i++) {
      this.mouseButtons.set(i, {
        pressed: false,
        justPressed: false,
        justReleased: false,
      });
    }

    // Add event listeners
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));
    window.addEventListener("mousemove", this.handleMouseMove.bind(this));
    window.addEventListener("mousedown", this.handleMouseDown.bind(this));
    window.addEventListener("mouseup", this.handleMouseUp.bind(this));
  }

  /**
   * Update the input state (call once per frame)
   */
  public update(): void {
    // Reset just pressed and just released flags
    this.keyStates.forEach((state) => {
      state.justPressed = false;
      state.justReleased = false;
    });

    this.mouseButtons.forEach((state) => {
      state.justPressed = false;
      state.justReleased = false;
    });
  }

  /**
   * Check if a key is currently pressed
   */
  public isKeyPressed(key: InputKey): boolean {
    return this.keyStates.get(key)?.pressed || false;
  }

  /**
   * Check if a key was just pressed this frame
   */
  public isKeyJustPressed(key: InputKey): boolean {
    return this.keyStates.get(key)?.justPressed || false;
  }

  /**
   * Check if a key was just released this frame
   */
  public isKeyJustReleased(key: InputKey): boolean {
    return this.keyStates.get(key)?.justReleased || false;
  }

  /**
   * Get the current mouse position
   */
  public getMousePosition(): { x: number; y: number } {
    return this.mousePosition;
  }

  /**
   * Check if a mouse button is currently pressed
   */
  public isMouseButtonPressed(button: number): boolean {
    return this.mouseButtons.get(button)?.pressed || false;
  }

  /**
   * Handle key down events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const state = this.keyStates.get(event.key);
    if (state) {
      if (!state.pressed) {
        state.justPressed = true;
      }
      state.pressed = true;
    }
  }

  /**
   * Handle key up events
   */
  private handleKeyUp(event: KeyboardEvent): void {
    const state = this.keyStates.get(event.key);
    if (state) {
      state.pressed = false;
      state.justReleased = true;
    }
  }

  /**
   * Handle mouse move events
   */
  private handleMouseMove(event: MouseEvent): void {
    this.mousePosition.x = event.clientX;
    this.mousePosition.y = event.clientY;
  }

  /**
   * Handle mouse down events
   */
  private handleMouseDown(event: MouseEvent): void {
    const state = this.mouseButtons.get(event.button);
    if (state) {
      if (!state.pressed) {
        state.justPressed = true;
      }
      state.pressed = true;
    }
  }

  /**
   * Handle mouse up events
   */
  private handleMouseUp(event: MouseEvent): void {
    const state = this.mouseButtons.get(event.button);
    if (state) {
      state.pressed = false;
      state.justReleased = true;
    }
  }
}

export default InputManager;
