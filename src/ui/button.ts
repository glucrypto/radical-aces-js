/**
 * Button Component
 * Interactive button for UI
 */

import UIComponent, { UIComponentOptions } from "./ui-component";

export interface ButtonOptions extends UIComponentOptions {
  text?: string;
  onClick?: (event: MouseEvent) => void;
}

export default class Button extends UIComponent {
  /**
   * Create a new button
   * @param options Button options
   */
  constructor(options: ButtonOptions = {}) {
    // Create button element
    super("button", {
      ...options,
      className: `ui-button ${options.className || ""}`.trim(),
    });

    // Set button text
    if (options.text) {
      this.setText(options.text);
    }

    // Add click handler
    if (options.onClick) {
      this.onClick(options.onClick);
    }

    // Add hover effects
    this.element.addEventListener("mouseenter", () => {
      this.addClass("hover");
    });

    this.element.addEventListener("mouseleave", () => {
      this.removeClass("hover");
    });

    // Add active effects
    this.element.addEventListener("mousedown", () => {
      this.addClass("active");
    });

    this.element.addEventListener("mouseup", () => {
      this.removeClass("active");
    });

    // Add focus styles
    this.element.addEventListener("focus", () => {
      this.addClass("focus");
    });

    this.element.addEventListener("blur", () => {
      this.removeClass("focus");
    });
  }

  /**
   * Set button text
   * @param text Button text
   */
  public setText(text: string): void {
    this.element.textContent = text;
  }

  /**
   * Add click handler
   * @param callback Function to call on click
   */
  public onClick(callback: (event: MouseEvent) => void): void {
    this.element.addEventListener("click", callback);
  }

  /**
   * Enable the button
   */
  public enable(): void {
    (this.element as HTMLButtonElement).disabled = false;
    this.removeClass("disabled");
  }

  /**
   * Disable the button
   */
  public disable(): void {
    (this.element as HTMLButtonElement).disabled = true;
    this.addClass("disabled");
  }
}
