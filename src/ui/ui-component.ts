/**
 * Base UI Component
 * Parent class for all UI components in the game
 */

export interface UIComponentOptions {
  id?: string;
  className?: string;
  parent?: HTMLElement | null;
  visible?: boolean;
}

export default class UIComponent {
  protected element: HTMLElement;
  protected isVisible: boolean;
  protected parent: HTMLElement | null;

  /**
   * Create a new UI component
   * @param tagName HTML element tag name
   * @param options Configuration options
   */
  constructor(tagName: string, options: UIComponentOptions = {}) {
    // Create DOM element
    this.element = document.createElement(tagName);

    // Set ID if provided
    if (options.id) {
      this.element.id = options.id;
    }

    // Add class if provided
    if (options.className) {
      this.element.className = options.className;
    }

    // Set visibility
    this.isVisible = options.visible !== undefined ? options.visible : true;
    if (!this.isVisible) {
      this.element.style.display = "none";
    }

    // Store parent reference
    this.parent = options.parent || null;

    // Add to parent if provided
    if (this.parent) {
      this.parent.appendChild(this.element);
    }
  }

  /**
   * Get the DOM element
   */
  public getElement(): HTMLElement {
    return this.element;
  }

  /**
   * Add this component to a parent element
   * @param parent Parent element to append to
   */
  public appendTo(parent: HTMLElement): void {
    this.parent = parent;
    parent.appendChild(this.element);
  }

  /**
   * Remove this component from its parent
   */
  public remove(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.parent = null;
  }

  /**
   * Show this component
   */
  public show(): void {
    this.isVisible = true;
    this.element.style.display = "";
  }

  /**
   * Hide this component
   */
  public hide(): void {
    this.isVisible = false;
    this.element.style.display = "none";
  }

  /**
   * Toggle visibility
   */
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Set content
   * @param content HTML content
   */
  public setContent(content: string): void {
    this.element.innerHTML = content;
  }

  /**
   * Add a CSS class
   * @param className CSS class to add
   */
  public addClass(className: string): void {
    this.element.classList.add(className);
  }

  /**
   * Remove a CSS class
   * @param className CSS class to remove
   */
  public removeClass(className: string): void {
    this.element.classList.remove(className);
  }
}
