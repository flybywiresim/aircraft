import { GeoPoint, GeoPointInterface, GeoPointReadOnly } from '../../utils/geo/GeoPoint';
import { Vec2Math } from '../../utils/math/VecMath';
import { MapProjection } from './MapProjection';

/**
 * A text label to be displayed on a map.
 */
export interface MapTextLabel {
  /** The text of this label. */
  readonly text: string;

  /** The render priority of this label. */
  readonly priority: number;

  /**
   * Draws this label to a canvas.
   * @param context The canvas rendering context to use to draw.
   * @param mapProjection The projection to use to project the location of the label.
   */
  draw(context: CanvasRenderingContext2D, mapProjection: MapProjection): void;
}

/**
 * Options for a AbstractMapTextLabel.
 */
export interface AbstractMapTextLabelOptions {
  /**
   * The anchor point of the label, expressed relative to the width/height of the label. [0, 0] is the top-left
   * corner, and [1, 1] is the bottom-right corner.
   */
  anchor?: Float64Array;

  /** The font type of the label. */
  font?: string;

  /** The font size of the label, in pixels. */
  fontSize?: number;

  /** The font color of the label. */
  fontColor?: string;

  /** The font outline width of the label, in pixels. */
  fontOutlineWidth?: number;

  /** The font outline color of the label. */
  fontOutlineColor?: string;

  /** Whether to show the background for the label. */
  showBg?: boolean;

  /** The label's background color. */
  bgColor?: string;

  /** The padding of the label's background, in pixels. Expressed as [left, top, right, bottom]. */
  bgPadding?: number[];

  /** The border radius of the label's background. */
  bgBorderRadius?: number;

  /** The outline width of the label's background. */
  bgOutlineWidth?: number;

  /** The outline color of the label's background. */
  bgOutlineColor?: string;
}

/**
 * An abstract implementation of a map text label.
 */
export abstract class AbstractMapTextLabel implements MapTextLabel {
  protected static readonly tempVec2 = new Float64Array(2);

  /**
   * The anchor point of this label, expressed relative to this label's width/height. [0, 0] is the top-left corner,
   * and [1, 1] is the bottom-right corner.
   */
  public readonly anchor = new Float64Array(2);

  /** The font type of this label. */
  public readonly font: string;

  /** The font size of this label, in pixels. */
  public readonly fontSize: number;

  /** The font color of this label. */
  public readonly fontColor: string;

  /** The font outline width of this label, in pixels. */
  public readonly fontOutlineWidth: number;

  /** The font outline color of this label. */
  public readonly fontOutlineColor: string;

  /** Whether to show the background for this label. */
  public readonly showBg: boolean;

  /** This label's background color. */
  public readonly bgColor: string;

  /** The padding of this label's background, in pixels. Expressed as [top, right, bottom, left]. */
  public readonly bgPadding = new Float64Array(4);

  /** The border radius of this label's background. */
  public readonly bgBorderRadius: number;

  /** The outline width of this label's background. */
  public readonly bgOutlineWidth: number;

  /** The outline color of this label's background. */
  public readonly bgOutlineColor: string;

  /**
   * Constructor.
   * @param text The text of this label.
   * @param priority The render priority of this label.
   * @param options Options with which to initialize this label.
   */
  constructor(public readonly text: string, public readonly priority: number, options?: AbstractMapTextLabelOptions) {
    options?.anchor && this.anchor.set(options.anchor);
    this.font = options?.font ?? 'Roboto';
    this.fontSize = options?.fontSize ?? 10;
    this.fontColor = options?.fontColor ?? 'white';
    this.fontOutlineWidth = options?.fontOutlineWidth ?? 0;
    this.fontOutlineColor = options?.fontOutlineColor ?? 'black';
    this.showBg = options?.showBg ?? false;
    this.bgColor = options?.bgColor ?? 'black';
    options?.bgPadding && this.bgPadding.set(options.bgPadding);
    this.bgBorderRadius = options?.bgBorderRadius ?? 0;
    this.bgOutlineWidth = options?.bgOutlineWidth ?? 0;
    this.bgOutlineColor = options?.bgOutlineColor ?? 'white';
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public draw(context: CanvasRenderingContext2D, mapProjection: MapProjection): void {
    this.setTextStyle(context);

    const width = context.measureText(this.text).width;
    const height = this.fontSize;

    const bgExtraWidth = this.showBg ? this.bgPadding[1] + this.bgPadding[3] + this.bgOutlineWidth * 2 : 0;
    const bgExtraHeight = this.showBg ? this.bgPadding[0] + this.bgPadding[2] + this.bgOutlineWidth * 2 : 0;

    const pos = this.getPosition(mapProjection, AbstractMapTextLabel.tempVec2);
    const centerX = pos[0] - (this.anchor[0] - 0.5) * (width + bgExtraWidth);
    const centerY = pos[1] - (this.anchor[1] - 0.5) * (height + bgExtraHeight);

    if (this.showBg) {
      this.drawBackground(context, centerX, centerY, width, height);
    }

    this.drawText(context, centerX, centerY);
  }

  /**
   * Gets the projected position of the label, in pixels.
   * @param mapProjection The map projection to use.
   * @param out The vector to which to write the result.
   * @returns The projected position of the label.
   */
  protected abstract getPosition(mapProjection: MapProjection, out: Float64Array): Float64Array;

  /**
   * Loads this label's text style to a canvas rendering context.
   * @param context The canvas rendering context to use.
   */
  protected setTextStyle(context: CanvasRenderingContext2D): void {
    context.font = `${this.fontSize}px ${this.font}`;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
  }

  /**
   * Draws this label's text to a canvas.
   * @param context The canvas rendering context.
   * @param centerX The x-coordinate of the center of the label, in pixels.
   * @param centerY the y-coordinate of the center of the label, in pixels.
   */
  protected drawText(context: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    if (this.fontOutlineWidth > 0) {
      context.lineWidth = this.fontOutlineWidth * 2;
      context.strokeStyle = this.fontOutlineColor;
      context.strokeText(this.text, centerX, centerY);
    }
    context.fillStyle = this.fontColor;
    context.fillText(this.text, centerX, centerY);
  }

  /**
   * Draws this label's background to a canvas.
   * @param context The canvas rendering context.
   * @param centerX The x-coordinate of the center of the label, in pixels.
   * @param centerY the y-coordinate of the center of the label, in pixels.
   * @param width The width of the background, in pixels.
   * @param height The height of the background, in pixels.
   */
  protected drawBackground(
    context: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ): void {
    const backgroundLeft = centerX - width / 2 - (this.bgPadding[3] + this.bgOutlineWidth);
    const backgroundTop = centerY - height / 2 - (this.bgPadding[0] + this.bgOutlineWidth);
    const backgroundWidth = width + (this.bgPadding[1] + this.bgPadding[3] + 2 * this.bgOutlineWidth);
    const backgroundHeight = height + (this.bgPadding[0] + this.bgPadding[2] + 2 * this.bgOutlineWidth);

    let isRounded = false;
    if (this.bgBorderRadius > 0) {
      isRounded = true;
      this.loadBackgroundPath(context, backgroundLeft, backgroundTop, backgroundWidth, backgroundHeight, this.bgBorderRadius);
    }

    if (this.bgOutlineWidth > 0) {
      context.lineWidth = this.bgOutlineWidth * 2;
      context.strokeStyle = this.bgOutlineColor;
      if (isRounded) {
        context.stroke();
      } else {
        context.strokeRect(backgroundLeft, backgroundTop, backgroundWidth, backgroundHeight);
      }
    }
    context.fillStyle = this.bgColor;
    if (isRounded) {
      context.fill();
    } else {
      context.fillRect(backgroundLeft, backgroundTop, backgroundWidth, backgroundHeight);
    }
  }

  /**
   * Loads the path of this label's background to a canvas rendering context.
   * @param context The canvas rendering context to use.
   * @param left The x-coordinate of the left edge of the background, in pixels.
   * @param top The y-coordinate of the top edge of the background, in pixels.
   * @param width The width of the background, in pixels.
   * @param height The height of the background, in pixels.
   * @param radius The border radius of the background, in pixels.
   */
  protected loadBackgroundPath(
    context: CanvasRenderingContext2D,
    left: number,
    top: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const right = left + width;
    const bottom = top + height;

    context.beginPath();
    context.moveTo(left + radius, top);
    context.lineTo(right - radius, top);
    context.arcTo(right, top, right, top + radius, radius);
    context.lineTo(right, bottom - radius);
    context.arcTo(right, bottom, right - radius, bottom, radius);
    context.lineTo(left + radius, bottom);
    context.arcTo(left, bottom, left, bottom - radius, radius);
    context.lineTo(left, top + radius);
    context.arcTo(left, top, left + radius, top, radius);
  }
}

/**
 * Options for a MapLocationTextLabel.
 */
export interface MapLocationTextLabelOptions extends AbstractMapTextLabelOptions {
  /** The offset of the label, in pixels, from its projected position. */
  offset?: Float64Array;
}

/**
 * A text label associated with a specific geographic location.
 */
export class MapLocationTextLabel extends AbstractMapTextLabel {
  protected readonly _location: GeoPoint;

  /** The geographic location of this label. */
  public readonly location: GeoPointReadOnly;

  public readonly offset = new Float64Array(2);

  /**
   * Constructor.
   * @param text The text of this label.
   * @param priority The render priority of this label.
   * @param location The geographic location of this label.
   * @param options Options with which to initialize this label.
   */
  constructor(text: string, priority: number, location: GeoPointInterface, options?: MapLocationTextLabelOptions) {
    super(text, priority, options);

    this._location = location.copy();
    this.location = this._location.readonly;

    options?.offset && this.offset.set(options.offset);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected getPosition(mapProjection: MapProjection, out: Float64Array): Float64Array {
    mapProjection.project(this._location, out);
    Vec2Math.add(out, this.offset, out);
    return out;
  }
}