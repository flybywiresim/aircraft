import { LatLonInterface } from '../../../geo/GeoInterfaces';
import { ReadonlyFloat64Array } from '../../../math/VecMath';
import { Subscribable } from '../../../sub/Subscribable';
import { MapLayerProps } from '../MapLayer';
import { MapProjection } from '../MapProjection';
import { MapSyncedCanvasLayer } from './MapSyncedCanvasLayer';

/**
 * Component props for MapLineLayer.
 */
export interface MapLineLayerProps extends MapLayerProps<any> {
  /**
   * A subscribable which provides the start point of the line, as a set of lat/lon coordinates or a 2D vector in
   * projected coordinates. If the start point is `null`, a line will not be drawn.
   */
  start: Subscribable<LatLonInterface | ReadonlyFloat64Array | null>;

  /**
   * A subscribable which provides the end point of the line, as a set of lat/lon coordinates or a 2D vector in
   * projected coordinates. If the end point is `null`, a line will not be drawn.
   */
  end: Subscribable<LatLonInterface | ReadonlyFloat64Array | null>;

  /** The width of the line stroke, in pixels. Defaults to 2 pixels. */
  strokeWidth?: number;

  /** The style of the line stroke. Defaults to `'white'`. */
  strokeStyle?: string | CanvasGradient | CanvasPattern;

  /** The dash array of the line stroke. Defaults to `[]`. */
  strokeDash?: readonly number[];

  /** The width of the line outline, in pixels. Defaults to 0 pixels. */
  outlineWidth?: number;

  /** The style of the line outline. Defaults to `'black'`. */
  outlineStyle?: string | CanvasGradient | CanvasPattern;

  /** The dash array of the line outline. Defaults to `[]`. */
  outlineDash?: readonly number[];
}

/**
 * A map layer that draws a line between two points. The line is drawn in projected coordinate space, so it will always
 * be straight on the projected map.
 */
export class MapLineLayer extends MapSyncedCanvasLayer<MapLineLayerProps> {
  private static readonly DEFAULT_STROKE_WIDTH = 2; // px
  private static readonly DEFAULT_STROKE_STYLE = 'white';
  private static readonly DEFAULT_STROKE_DASH = [];
  private static readonly DEFAULT_OUTLINE_WIDTH = 0; // px
  private static readonly DEFAULT_OUTLINE_STYLE = 'black';
  private static readonly DEFAULT_OUTLINE_DASH = [];

  private readonly strokeWidth = this.props.strokeWidth ?? MapLineLayer.DEFAULT_STROKE_WIDTH;
  private readonly strokeStyle = this.props.strokeStyle ?? MapLineLayer.DEFAULT_STROKE_STYLE;
  private readonly strokeDash = this.props.strokeDash ?? MapLineLayer.DEFAULT_STROKE_DASH;
  private readonly outlineWidth = this.props.outlineWidth ?? MapLineLayer.DEFAULT_OUTLINE_WIDTH;
  private readonly outlineStyle = this.props.outlineStyle ?? MapLineLayer.DEFAULT_OUTLINE_STYLE;
  private readonly outlineDash = this.props.outlineDash ?? MapLineLayer.DEFAULT_OUTLINE_DASH;

  private vec = new Float64Array([0, 0]);

  private isUpdateScheduled = false;

  /** @inheritdoc */
  public onAttached(): void {
    super.onAttached();

    this.props.start.sub(() => { this.scheduleUpdate(); });
    this.props.end.sub(() => { this.scheduleUpdate(); });

    this.scheduleUpdate();
  }

  /** @inheritdoc */
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    super.onMapProjectionChanged(mapProjection, changeFlags);
    this.scheduleUpdate();
  }

  /**
   * Schedules the layer for a draw update.
   */
  private scheduleUpdate(): void {
    this.isUpdateScheduled = true;
  }

  /** @inheritdoc */
  public onUpdated(time: number, elapsed: number): void {
    super.onUpdated(time, elapsed);

    if (this.isUpdateScheduled) {
      this.display.clear();

      const start = this.props.start.get();
      const end = this.props.end.get();

      if (start !== null && end !== null) {
        const [x1, y1] = start instanceof Float64Array ? start : this.props.mapProjection.project(start as LatLonInterface, this.vec);
        const [x2, y2] = end instanceof Float64Array ? end : this.props.mapProjection.project(end as LatLonInterface, this.vec);

        this.drawLine(x1, y1, x2, y2);
      }

      this.isUpdateScheduled = false;
    }
  }

  /**
   * Draws this layer's line.
   * @param x1 The x coordinate of the start of the line.
   * @param y1 The y coordinate of the start of the line.
   * @param x2 The x coordinate of the end of the line.
   * @param y2 The y coordinate of the end of the line.
   */
  private drawLine(x1: number, y1: number, x2: number, y2: number): void {
    const context = this.display.context;

    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);

    if (this.outlineWidth > 0) {
      this.stroke(context, this.strokeWidth + this.outlineWidth * 2, this.outlineStyle, this.outlineDash);
    }
    if (this.strokeWidth > 0) {
      this.stroke(context, this.strokeWidth, this.strokeStyle, this.strokeDash);
    }
  }

  /**
   * Applies a stroke to a canvas rendering context.
   * @param context A canvas rendering context.
   * @param width The width of the stroke, in pixels.
   * @param style The style of the stroke.
   * @param dash The dash array of the stroke.
   */
  private stroke(context: CanvasRenderingContext2D, width: number, style: string | CanvasGradient | CanvasPattern, dash: readonly number[]): void {
    context.lineWidth = width;
    context.strokeStyle = style;
    context.setLineDash(dash);

    context.stroke();
  }
}