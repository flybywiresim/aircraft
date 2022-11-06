import { SubscribableSet } from '../../../sub/SubscribableSet';
import { FSComponent, VNode } from '../../FSComponent';
import { HorizonLayer, HorizonLayerProps } from '../HorizonLayer';

/**
 * Properties for a MapCanvasLayer.
 */
export interface HorizonCanvasLayerProps extends HorizonLayerProps {
  /** Whether to include an offscreen buffer. False by default. */
  useBuffer?: boolean;

  /** CSS class(es) to apply to the canvas element. */
  class?: string | SubscribableSet<string>;
}

/**
 * An instance of a canvas within a MapCanvasLayer.
 */
export interface HorizonCanvasLayerCanvasInstance {
  /** This instance's canvas element. */
  readonly canvas: HTMLCanvasElement;

  /** This instance's canvas 2D rendering context. */
  readonly context: CanvasRenderingContext2D;

  /** Whether this instance's canvas is displayed. */
  readonly isDisplayed: boolean;

  /** Clears this canvas. */
  clear(): void;

  /**
   * Resets this instance's canvas. This will erase the canvas of all drawn pixels, reset its state (including all
   * styles, transformations, and cached paths), and clear the Coherent GT command buffer associated with it.
   */
  reset(): void;
}

/**
 * An implementation of MapCanvasLayerCanvasInstance.
 */
export class HorizonCanvasLayerCanvasInstanceClass implements HorizonCanvasLayerCanvasInstance {
  /**
   * Creates a new canvas instance.
   * @param canvas The canvas element.
   * @param context The canvas 2D rendering context.
   * @param isDisplayed Whether the canvas is displayed.
   */
  constructor(
    public readonly canvas: HTMLCanvasElement,
    public readonly context: CanvasRenderingContext2D,
    public readonly isDisplayed: boolean
  ) {
  }

  /** @inheritdoc */
  public clear(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** @inheritdoc */
  public reset(): void {
    const width = this.canvas.width;
    this.canvas.width = 0;
    this.canvas.width = width;
  }
}

/**
 * A layer which uses a canvas to draw graphics.
 */
export class HorizonCanvasLayer
  <P extends HorizonCanvasLayerProps = HorizonCanvasLayerProps, C extends HorizonCanvasLayerCanvasInstance = HorizonCanvasLayerCanvasInstance>
  extends HorizonLayer<P> {

  private readonly displayCanvasRef = FSComponent.createRef<HTMLCanvasElement>();
  private width = 0;
  private height = 0;
  private displayCanvasContext: CanvasRenderingContext2D | null = null;
  private _display?: C;
  private _buffer?: C;
  protected isInit = false;

  /**
   * Gets this layer's display canvas instance.
   * @returns This layer's display canvas instance.
   * @throws Error if this layer's display canvas instance has not been initialized.
   */
  public get display(): C {
    if (!this._display) {
      throw new Error('HorizonCanvasLayer: attempted to access display before it was initialized');
    }

    return this._display;
  }

  /**
   * Gets this layer's buffer canvas instance.
   * @returns This layer's buffer canvas instance.
   * @throws Error if this layer's buffer canvas instance has not been initialized.
   */
  public get buffer(): C {
    if (!this._buffer) {
      throw new Error('HorizonCanvasLayer: attempted to access buffer before it was initialized');
    }

    return this._buffer;
  }

  /**
   * Attempts to get this layer's display canvas instance.
   * @returns This layer's display canvas instance, or undefined if it has not been initialized.
   */
  public tryGetDisplay(): C | undefined {
    return this._display;
  }

  /**
   * Attempts to get this layer's buffer canvas instance.
   * @returns This layer's buffer canvas instance, or undefined if it has not been initialized.
   */
  public tryGetBuffer(): C | undefined {
    return this._buffer;
  }

  /**
   * Gets the width of the canvas element, in pixels.
   * @returns the width of the canvas element.
   */
  public getWidth(): number {
    return this.width;
  }

  /**
   * Gets the height of the canvas element, in pixels.
   * @returns the height of the canvas element.
   */
  public getHeight(): number {
    return this.height;
  }

  /**
   * Sets the width of the canvas element, in pixels.
   * @param width The new width.
   */
  public setWidth(width: number): void {
    if (width === this.width) {
      return;
    }

    this.width = width;
    if (this.isInit) {
      this.updateCanvasSize();
    }
  }

  /**
   * Sets the height of the canvas element, in pixels.
   * @param height The new height.
   */
  public setHeight(height: number): void {
    if (height === this.height) {
      return;
    }

    this.height = height;
    if (this.isInit) {
      this.updateCanvasSize();
    }
  }

  /**
   * Copies the contents of the buffer to the display. Has no effect if this layer does not have a buffer.
   */
  public copyBufferToDisplay(): void {
    if (!this.isInit || !this.props.useBuffer) {
      return;
    }

    this.display.context.drawImage(this.buffer.canvas, 0, 0, this.width, this.height);
  }

  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    this.displayCanvasContext = this.displayCanvasRef.instance.getContext('2d');
  }

  /** @inheritdoc */
  protected onVisibilityChanged(): void {
    if (this.isInit) {
      this.updateCanvasVisibility();
    }
  }

  /** @inheritdoc */
  public onAttached(): void {
    super.onAttached();

    this.initCanvasInstances();
    this.isInit = true;
    this.updateCanvasVisibility();
    this.updateCanvasSize();
  }

  /**
   * Initializes this layer's canvas instances.
   */
  private initCanvasInstances(): void {
    this._display = this.createCanvasInstance(this.displayCanvasRef.instance, this.displayCanvasContext as CanvasRenderingContext2D, true);
    if (this.props.useBuffer) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      this._buffer = this.createCanvasInstance(canvas, context as CanvasRenderingContext2D, false);
    }
  }

  /**
   * Creates a canvas instance.
   * @param canvas The canvas element.
   * @param context The canvas 2D rendering context.
   * @param isDisplayed Whether the canvas is displayed.
   * @returns a canvas instance.
   */
  protected createCanvasInstance(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, isDisplayed: boolean): C {
    return new HorizonCanvasLayerCanvasInstanceClass(canvas, context, isDisplayed) as C;
  }

  /**
   * Updates the canvas element's size.
   */
  protected updateCanvasSize(): void {
    const displayCanvas = this.display.canvas;
    displayCanvas.width = this.width;
    displayCanvas.height = this.height;
    displayCanvas.style.width = `${this.width}px`;
    displayCanvas.style.height = `${this.height}px`;

    if (this._buffer) {
      const bufferCanvas = this._buffer.canvas;
      bufferCanvas.width = this.width;
      bufferCanvas.height = this.height;
    }
  }

  /**
   * Updates the visibility of the display canvas.
   */
  private updateCanvasVisibility(): void {
    this.display.canvas.style.display = this.isVisible() ? 'block' : 'none';
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <canvas ref={this.displayCanvasRef} class={this.props.class ?? ''} width='0' height='0' style='position: absolute;' > </canvas>
    );
  }
}