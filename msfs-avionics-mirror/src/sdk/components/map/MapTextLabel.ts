import { GeoPointInterface } from '../../geo/GeoPoint';
import { ReadonlyFloat64Array, Vec2Math, VecNMath } from '../../math/VecMath';
import { Subscribable } from '../../sub/Subscribable';
import { SubscribableUtils } from '../../sub/SubscribableUtils';
import { MapProjection } from './MapProjection';

/**
 * A text label to be displayed on a map.
 */
export interface MapTextLabel {
  /** The text of this label. */
  readonly text: Subscribable<string>;

  /** The render priority of this label. */
  readonly priority: Subscribable<number>;

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
   * The anchor point of the label, expressed relative to the width/height of the label. `[0, 0]` is the top-left
   * corner, and `[1, 1]` is the bottom-right corner. Defaults to `[0, 0]`.
   */
  anchor?: ReadonlyFloat64Array | Subscribable<ReadonlyFloat64Array>;

  /** The font type of the label. Defaults to `''` (the default canvas font). */
  font?: string | Subscribable<string>;

  /** The font size of the label, in pixels. Defaults to 10 pixels. */
  fontSize?: number | Subscribable<number>;

  /** The font color of the label. Defaults to `'white'`. */
  fontColor?: string | Subscribable<string>;

  /** The font outline width of the label, in pixels. Defaults to 0. */
  fontOutlineWidth?: number | Subscribable<number>;

  /** The font outline color of the label. Defaults to `'black'`. */
  fontOutlineColor?: string | Subscribable<string>;

  /** Whether to show the background for the label. Defaults to `false`. */
  showBg?: boolean | Subscribable<boolean>;

  /** The label's background color. Defaults to `'black'`. */
  bgColor?: string | Subscribable<string>;

  /** The padding of the label's background, in pixels. Expressed as `[top, right, bottom, left]`. Defaults to `[0, 0, 0, 0]`. */
  bgPadding?: ReadonlyFloat64Array | Subscribable<ReadonlyFloat64Array>;

  /** The border radius of the label's background, in pixels. Defaults to 0. */
  bgBorderRadius?: number | Subscribable<number>;

  /** The outline width of the label's background, in pixels. Defaults to 0. */
  bgOutlineWidth?: number | Subscribable<number>;

  /** The outline color of the label's background. Defaults to `'white'`. */
  bgOutlineColor?: string | Subscribable<string>;
}

/**
 * An abstract implementation of a map text label.
 */
export abstract class AbstractMapTextLabel implements MapTextLabel {
  protected static readonly tempVec2 = new Float64Array(2);

  /** @inheritdoc */
  public readonly text: Subscribable<string>;

  /** @inheritdoc */
  public readonly priority: Subscribable<number>;

  /**
   * The anchor point of this label, expressed relative to this label's width/height. [0, 0] is the top-left corner,
   * and [1, 1] is the bottom-right corner.
   */
  public readonly anchor: Subscribable<ReadonlyFloat64Array>;

  /** The font type of this label. */
  public readonly font: Subscribable<string>;

  /** The font size of this label, in pixels. */
  public readonly fontSize: Subscribable<number>;

  /** The font color of this label. */
  public readonly fontColor: Subscribable<string>;

  /** The font outline width of this label, in pixels. */
  public readonly fontOutlineWidth: Subscribable<number>;

  /** The font outline color of this label. */
  public readonly fontOutlineColor: Subscribable<string>;

  /** Whether to show the background for this label. */
  public readonly showBg: Subscribable<boolean>;

  /** This label's background color. */
  public readonly bgColor: Subscribable<string>;

  /** The padding of this label's background, in pixels. Expressed as [top, right, bottom, left]. */
  public readonly bgPadding: Subscribable<ReadonlyFloat64Array>;

  /** The border radius of this label's background. */
  public readonly bgBorderRadius: Subscribable<number>;

  /** The outline width of this label's background. */
  public readonly bgOutlineWidth: Subscribable<number>;

  /** The outline color of this label's background. */
  public readonly bgOutlineColor: Subscribable<string>;

  /**
   * Constructor.
   * @param text The text of this label, or a subscribable which provides it.
   * @param priority The render priority of this label, or a subscribable which provides it.
   * @param options Options with which to initialize this label.
   */
  constructor(text: string | Subscribable<string>, priority: number | Subscribable<number>, options?: AbstractMapTextLabelOptions) {
    this.text = SubscribableUtils.toSubscribable(text, true);

    this.priority = SubscribableUtils.toSubscribable(priority, true);

    this.anchor = SubscribableUtils.toSubscribable(options?.anchor ?? Vec2Math.create(), true);

    this.font = SubscribableUtils.toSubscribable(options?.font ?? '', true);
    this.fontSize = SubscribableUtils.toSubscribable(options?.fontSize ?? 10, true);
    this.fontColor = SubscribableUtils.toSubscribable(options?.fontColor ?? 'white', true);
    this.fontOutlineWidth = SubscribableUtils.toSubscribable(options?.fontOutlineWidth ?? 0, true);
    this.fontOutlineColor = SubscribableUtils.toSubscribable(options?.fontOutlineColor ?? 'black', true);

    this.showBg = SubscribableUtils.toSubscribable(options?.showBg ?? false, true);
    this.bgColor = SubscribableUtils.toSubscribable(options?.bgColor ?? 'black', true);
    this.bgPadding = SubscribableUtils.toSubscribable(options?.bgPadding ?? VecNMath.create(4), true);
    this.bgBorderRadius = SubscribableUtils.toSubscribable(options?.bgBorderRadius ?? 0, true);
    this.bgOutlineWidth = SubscribableUtils.toSubscribable(options?.bgOutlineWidth ?? 0, true);
    this.bgOutlineColor = SubscribableUtils.toSubscribable(options?.bgOutlineColor ?? 'white', true);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public draw(context: CanvasRenderingContext2D, mapProjection: MapProjection): void {
    this.setTextStyle(context);

    const width = context.measureText(this.text.get()).width;
    const height = this.fontSize.get();

    const showBg = this.showBg.get();
    const bgPadding = this.bgPadding.get();
    const bgOutlineWidth = this.bgOutlineWidth.get();

    const bgExtraWidth = showBg ? bgPadding[1] + bgPadding[3] + bgOutlineWidth * 2 : 0;
    const bgExtraHeight = showBg ? bgPadding[0] + bgPadding[2] + bgOutlineWidth * 2 : 0;

    const anchor = this.anchor.get();

    const pos = this.getPosition(mapProjection, AbstractMapTextLabel.tempVec2);
    const centerX = pos[0] - (anchor[0] - 0.5) * (width + bgExtraWidth);
    const centerY = pos[1] - (anchor[1] - 0.5) * (height + bgExtraHeight);

    if (showBg) {
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
    context.font = `${this.fontSize.get()}px ${this.font.get()}`;
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
    const text = this.text.get();
    const fontOutlineWidth = this.fontOutlineWidth.get();

    if (fontOutlineWidth > 0) {
      context.lineWidth = fontOutlineWidth * 2;
      context.strokeStyle = this.fontOutlineColor.get();
      context.strokeText(text, centerX, centerY);
    }
    context.fillStyle = this.fontColor.get();
    context.fillText(text, centerX, centerY);
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
    const bgPadding = this.bgPadding.get();
    const bgOutlineWidth = this.bgOutlineWidth.get();
    const bgBorderRadius = this.bgBorderRadius.get();

    const backgroundLeft = centerX - width / 2 - (bgPadding[3] + bgOutlineWidth);
    const backgroundTop = centerY - height / 2 - (bgPadding[0] + bgOutlineWidth);
    const backgroundWidth = width + (bgPadding[1] + bgPadding[3] + 2 * bgOutlineWidth);
    const backgroundHeight = height + (bgPadding[0] + bgPadding[2] + 2 * bgOutlineWidth);

    let isRounded = false;
    if (bgBorderRadius > 0) {
      isRounded = true;
      this.loadBackgroundPath(context, backgroundLeft, backgroundTop, backgroundWidth, backgroundHeight, bgBorderRadius);
    }

    if (bgOutlineWidth > 0) {
      context.lineWidth = bgOutlineWidth * 2;
      context.strokeStyle = this.bgOutlineColor.get();
      if (isRounded) {
        context.stroke();
      } else {
        context.strokeRect(backgroundLeft, backgroundTop, backgroundWidth, backgroundHeight);
      }
    }
    context.fillStyle = this.bgColor.get();
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
  /** The offset of the label from its projected position, as `[x, y]` in pixels. Defaults to `[0, 0]`. */
  offset?: ReadonlyFloat64Array | Subscribable<ReadonlyFloat64Array>;
}

/**
 * A text label associated with a specific geographic location.
 */
export class MapLocationTextLabel extends AbstractMapTextLabel {
  public readonly location: Subscribable<GeoPointInterface>;

  public readonly offset: Subscribable<ReadonlyFloat64Array>;

  /**
   * Constructor.
   * @param text The text of this label, or a subscribable which provides it.
   * @param priority The render priority of this label, or a subscribable which provides it.
   * @param location The geographic location of this label, or a subscribable which provides it.
   * @param options Options with which to initialize this label.
   */
  constructor(
    text: string | Subscribable<string>,
    priority: number | Subscribable<number>,
    location: GeoPointInterface | Subscribable<GeoPointInterface>,
    options?: MapLocationTextLabelOptions
  ) {
    super(text, priority, options);

    this.location = SubscribableUtils.toSubscribable(location, true);
    this.offset = SubscribableUtils.toSubscribable(options?.offset ?? Vec2Math.create(), true);
  }

  /** @inheritdoc */
  protected getPosition(mapProjection: MapProjection, out: Float64Array): Float64Array {
    mapProjection.project(this.location.get(), out);
    Vec2Math.add(out, this.offset.get(), out);
    return out;
  }
}