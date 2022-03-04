import { GeoCircle, GeodesicResampler, GeoProjection, PathStream } from '../..';
import { CircleVector, FlightPathUtils } from '../../flightplan';
import { MapGeoCircleLineRenderer } from './MapGeoCircleLineRenderer';

/**
 * Renders flight path vectors as a curved line.
 */
export class MapFlightPathVectorLineRenderer {
  private static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  private readonly renderer: MapGeoCircleLineRenderer;

  /**
   * Constructor.
   * @param resampler The geodesic resampler used by this renderer.
   */
  constructor(
    resampler: GeodesicResampler
  ) {
    this.renderer = new MapGeoCircleLineRenderer(resampler);
  }

  /**
   * Renders a flight path vector to a canvas.
   * @param vector The flight path vector to render.
   * @param projection The projection to use when rendering.
   * @param context The canvas 2D rendering context to which to render.
   * @param stream The path stream to which to render.
   * @param width The width of the rendered line.
   * @param style The style of the rendered line.
   * @param dash The dash array of the rendered line. Defaults to no dash.
   */
  public render(
    vector: CircleVector,
    projection: GeoProjection,
    context: CanvasRenderingContext2D,
    stream: PathStream,
    width: number,
    style: string,
    dash?: readonly number[]
  ): void {
    const circle = FlightPathUtils.setGeoCircleFromVector(vector, MapFlightPathVectorLineRenderer.geoCircleCache[0]);
    this.renderer.render(circle, vector.startLat, vector.startLon, vector.endLat, vector.endLon, projection, context, stream, width, style, dash);
  }
}