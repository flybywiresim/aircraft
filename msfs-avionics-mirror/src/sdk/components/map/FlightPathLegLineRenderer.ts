import { CircleVector, FlightPathUtils, LegDefinition } from '../../flightplan';
import { GeoCircle, GeoProjection } from '../../geo';
import { AbstractFlightPathLegRenderer } from './AbstractFlightPathLegRenderer';
import { GeoCirclePathRenderer } from './GeoCirclePathRenderer';
import { GeoProjectionPathStreamStack } from './GeoProjectionPathStreamStack';

/**
 * A style definition for a line rendered by {@link FlightPathLegLineRenderer}.
 */
export type FlightPathLegLineStyle = {
  /** The width of the line stroke, in pixels. A width of zero or less will cause the stroke to not be rendered. */
  strokeWidth: number;

  /** The style of the line stroke. */
  strokeStyle: string | CanvasPattern | CanvasGradient;

  /** The dash array of the line stroke, or `null` if the stroke is solid. */
  strokeDash: readonly number[] | null;

  /** The width of the line outline, in pixels. A width of zero or less will cause the outline to not be rendered. */
  outlineWidth: number;

  /** The style of the line outline. */
  outlineStyle: string | CanvasPattern | CanvasGradient;

  /** The dash array of the line outline, or `null` if the outline is solid. */
  outlineDash: readonly number[] | null;

  /** Whether the line is continuous with the last vector. */
  isContinuous: boolean;
};

/**
 * A function which selects a line style for a rendered vector.
 * @param vector The vector for which to select a style.
 * @param isIngress Whether the vector is part of the ingress transition.
 * @param isEgress Whether the vector is part of the egress transition.
 * @param leg The flight plan leg containing the vector to render.
 * @param projection The map projection to use when rendering.
 * @param out The line style object to which to write the selected style.
 * @param args Additional arguments.
 * @returns The selected line style for the vector.
 */
export type FlightPathLegLineStyleSelector<Args extends any[]> = (
  vector: CircleVector,
  isIngress: boolean,
  isEgress: boolean,
  leg: LegDefinition,
  projection: GeoProjection,
  out: FlightPathLegLineStyle,
  ...args: Args
) => FlightPathLegLineStyle;

/**
 * Renders flight plan leg paths as lines, with support for different styles for each flight path vector in the leg.
 */
export class FlightPathLegLineRenderer<Args extends any[] = any[]> extends AbstractFlightPathLegRenderer<Args> {
  private static readonly EMPTY_DASH = [];

  protected static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0)];

  private readonly pathRenderer = new GeoCirclePathRenderer();

  private readonly styleBuffer: FlightPathLegLineStyle[] = [
    {
      strokeWidth: 1,
      strokeStyle: 'white',
      strokeDash: null,
      outlineWidth: 0,
      outlineStyle: 'black',
      outlineDash: null,
      isContinuous: false
    },
    {
      strokeWidth: 1,
      strokeStyle: 'white',
      strokeDash: null,
      outlineWidth: 0,
      outlineStyle: 'black',
      outlineDash: null,
      isContinuous: false
    }
  ];
  private activeStyleIndex = 0;

  private isAtLegStart = false;
  private needStrokeLineAtLegEnd = false;

  /**
   * Constructor.
   * @param styleSelector A function which selects a style for each rendered vector.
   */
  constructor(
    private readonly styleSelector: FlightPathLegLineStyleSelector<Args>
  ) {
    super();
  }

  /** @inheritdoc */
  public render(
    leg: LegDefinition,
    context: CanvasRenderingContext2D,
    streamStack: GeoProjectionPathStreamStack,
    partsToRender: number,
    ...args: Args
  ): void {
    this.isAtLegStart = true;
    this.needStrokeLineAtLegEnd = false;

    super.render(leg, context, streamStack, partsToRender, ...args);

    if (this.needStrokeLineAtLegEnd) {
      this.strokeLine(context, this.styleBuffer[(this.activeStyleIndex + 1) % 2]);
      this.needStrokeLineAtLegEnd = false;
    }
  }

  /** @inheritdoc */
  protected renderVector(
    vector: CircleVector,
    isIngress: boolean,
    isEgress: boolean,
    leg: LegDefinition,
    context: CanvasRenderingContext2D,
    streamStack: GeoProjectionPathStreamStack,
    ...args: Args
  ): void {
    const style = this.styleSelector(vector, isIngress, isEgress, leg, streamStack.getProjection(), this.styleBuffer[this.activeStyleIndex], ...args);
    const previousStyle = this.styleBuffer[(this.activeStyleIndex + 1) % 2];
    const didStyleChange = !this.isAtLegStart && !FlightPathLegLineRenderer.areStylesEqual(style, previousStyle);
    const continuePath = !this.isAtLegStart && style.isContinuous && !didStyleChange;

    if (didStyleChange) {
      this.strokeLine(context, previousStyle);
      this.needStrokeLineAtLegEnd = false;
    }

    const circle = FlightPathUtils.setGeoCircleFromVector(vector, FlightPathLegLineRenderer.geoCircleCache[1]);
    this.pathRenderer.render(circle, vector.startLat, vector.startLon, vector.endLat, vector.endLon, streamStack, continuePath);

    this.activeStyleIndex = (this.activeStyleIndex + 1) % 2;
    this.isAtLegStart = false;
    this.needStrokeLineAtLegEnd = true;
  }

  /**
   * Applies a stroke to a canvas context.
   * @param context A canvas 2D rendering context.
   * @param style The style of the line to stroke.
   */
  private strokeLine(context: CanvasRenderingContext2D, style: FlightPathLegLineStyle): void {
    if (style.outlineWidth > 0) {
      const outlineWidth = style.strokeWidth + 2 * style.outlineWidth;
      context.lineWidth = outlineWidth;
      context.strokeStyle = style.outlineStyle;
      context.setLineDash(style.outlineDash ?? FlightPathLegLineRenderer.EMPTY_DASH);
      context.stroke();
    }

    if (style.strokeWidth > 0) {
      context.lineWidth = style.strokeWidth;
      context.strokeStyle = style.strokeStyle;
      context.setLineDash(style.strokeDash ?? FlightPathLegLineRenderer.EMPTY_DASH);
      context.stroke();
    }
  }

  /**
   * Checks if two line styles are equal. Styles are considered equal if and only if their stroke and outline widths
   * are zero, or their stroke and outline widths, styles, and dash arrays are the same.
   * @param style1 The first style.
   * @param style2 The second style.
   * @returns Whether the two line styles are equal.
   */
  private static areStylesEqual(style1: FlightPathLegLineStyle, style2: FlightPathLegLineStyle): boolean {
    return (
      (
        (style1.strokeWidth === 0 && style2.strokeWidth === 0)
        || (
          style1.strokeWidth === style2.strokeWidth
          && style1.strokeStyle === style2.strokeStyle
          && style1.strokeDash === style2.strokeDash
        )
      ) && (
        (style1.outlineWidth === 0 && style2.outlineWidth === 0)
        || (
          style1.outlineWidth === style2.outlineWidth
          && style1.outlineStyle === style2.outlineStyle
          && style1.outlineDash === style2.outlineDash
        )
      )
    );
  }
}