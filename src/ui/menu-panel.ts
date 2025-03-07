/**
 * Menu Panel Component
 * Container for organizing menu items and buttons
 */

import UIComponent, { UIComponentOptions } from "./ui-component";

export interface MenuPanelOptions extends UIComponentOptions {
  title?: string;
  width?: string;
}

export default class MenuPanel extends UIComponent {
  private titleElement: HTMLElement | null = null;
  private contentElement: HTMLElement;

  /**
   * Create a new menu panel
   * @param options Menu panel options
   */
  constructor(options: MenuPanelOptions = {}) {
    // Create panel element
    super("div", {
      ...options,
      className: `ui-panel ${options.className || ""}`.trim(),
    });

    // Set panel style
    this.element.style.position = "relative";
    this.element.style.background = "rgba(0, 0, 0, 0.8)";
    this.element.style.borderRadius = "8px";
    this.element.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.5)";
    this.element.style.color = "#ffffff";
    this.element.style.overflow = "hidden";

    if (options.width) {
      this.element.style.width = options.width;
    } else {
      this.element.style.minWidth = "300px";
    }

    // Create title if provided
    if (options.title) {
      this.titleElement = document.createElement("div");
      this.titleElement.className = "ui-panel-title";
      this.titleElement.textContent = options.title;
      this.titleElement.style.padding = "15px 20px";
      this.titleElement.style.background = "rgba(0, 0, 0, 0.3)";
      this.titleElement.style.borderBottom =
        "1px solid rgba(255, 255, 255, 0.1)";
      this.titleElement.style.fontWeight = "bold";
      this.titleElement.style.fontSize = "1.2rem";
      this.element.appendChild(this.titleElement);
    }

    // Create content container
    this.contentElement = document.createElement("div");
    this.contentElement.className = "ui-panel-content";
    this.contentElement.style.padding = "20px";
    this.element.appendChild(this.contentElement);
  }

  /**
   * Set panel title
   * @param title Panel title
   */
  public setTitle(title: string): void {
    if (!this.titleElement) {
      this.titleElement = document.createElement("div");
      this.titleElement.className = "ui-panel-title";
      this.titleElement.style.padding = "15px 20px";
      this.titleElement.style.background = "rgba(0, 0, 0, 0.3)";
      this.titleElement.style.borderBottom =
        "1px solid rgba(255, 255, 255, 0.1)";
      this.titleElement.style.fontWeight = "bold";
      this.titleElement.style.fontSize = "1.2rem";
      this.element.insertBefore(this.titleElement, this.contentElement);
    }

    this.titleElement.textContent = title;
  }

  /**
   * Add component to the panel content
   * @param component UI component to add
   */
  public addComponent(component: UIComponent): void {
    component.appendTo(this.contentElement);
  }

  /**
   * Add multiple components to the panel content
   * @param components Array of components to add
   */
  public addComponents(components: UIComponent[]): void {
    components.forEach((component) => {
      this.addComponent(component);
    });
  }

  /**
   * Get the content element
   */
  public getContentElement(): HTMLElement {
    return this.contentElement;
  }

  /**
   * Clear all content
   */
  public clearContent(): void {
    this.contentElement.innerHTML = "";
  }
}
