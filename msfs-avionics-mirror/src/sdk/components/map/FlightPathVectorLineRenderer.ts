import { CircleVector, FlightPathUtils } from '../../flightplan';
import { GeoCircle } from '../../geo';
import { GeoCircleLineRenderer } from './GeoCircleLineRenderer';
import { GeoProjectionPathStreamStack } from './GeoProjectionPathStreamStack';

/**
 * Renders flight path vectors as a curved line.
 */
export class FlightPathVectorLineRenderer {
  private static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  private readonly renderer = new GeoCircleLineRenderer();

  /**
   * Renders a flight path vector to a canvas.
   * @param vector The flight path vector to render.
   * @param context The canvas 2D rendering context to which to render.
   * @param streamStack The path stream to which to render.
   * @param width The width of the rendered line.
   * @param style The style of the rendered line.
   * @param dash The dash array of the rendered line. Defaults to no dash.
   */
  public render(
    vector: CircleVector,
    context: CanvasRenderingContext2D,
    streamStack: GeoProjectionPathStreamStack,
    width: number,
    style: string,
    dash?: readonly number[]
  ): void {
    const circle = FlightPathUtils.setGeoCircleFromVector(vector, FlightPathVectorLineRenderer.geoCircleCache[0]);
    this.renderer.render(circle, vector.startLat, vector.startLon, vector.endLat, vector.endLon, context, streamStack, width, style, dash);
  }
}