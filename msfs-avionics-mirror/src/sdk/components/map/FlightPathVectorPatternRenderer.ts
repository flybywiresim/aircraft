import { CircleVector, FlightPathUtils } from '../../flightplan';
import { GeoCircle } from '../../geo';
import { PathPattern } from '../../graphics/path';
import { GeoCirclePatternRenderer } from './GeoCirclePatternRenderer';
import { GeoProjectionPathStreamStack } from './GeoProjectionPathStreamStack';

/**
 * Renders flight path vectors as repeating patterns.
 */
export class FlightPathVectorPatternRenderer {
  private static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  private readonly renderer = new GeoCirclePatternRenderer();

  /**
   * Renders a flight path vector to a canvas.
   * @param vector The flight path vector to render.
   * @param context The canvas 2D rendering context to which to render.
   * @param streamStack The path stream to which to render.
   * @param pattern The pattern to render.
   * @param continuePath Whether to continue the previously rendered path. If true, a discontinuity in the rendered
   * path will not be inserted before the vector is rendered. This may lead to undesired artifacts if the previously
   * rendered path does not terminate at the point where the projected vector starts. Defaults to false.
   */
  public render(
    vector: CircleVector,
    context: CanvasRenderingContext2D,
    streamStack: GeoProjectionPathStreamStack,
    pattern: PathPattern,
    continuePath = false
  ): void {
    const circle = FlightPathUtils.setGeoCircleFromVector(vector, FlightPathVectorPatternRenderer.geoCircleCache[0]);
    this.renderer.render(circle, vector.startLat, vector.startLon, vector.endLat, vector.endLon, context, streamStack, pattern, continuePath);
  }
}