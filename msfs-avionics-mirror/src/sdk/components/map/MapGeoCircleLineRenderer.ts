import { GeoCircle, GeodesicResampler, GeoProjectionPathStream, GeoPoint, GeoProjection, MercatorProjection, NullPathStream, PathStream } from '../..';
import { FlightPathUtils } from '../../flightplan';

/**
 * Renders arcs along geo circles as curved lines.
 */
export class MapGeoCircleLineRenderer {
  private static readonly EMPTY_DASH = [];

  private static readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private static readonly vec3Cache = [new Float64Array(3)];

  private readonly projection = new MercatorProjection();
  private readonly projectionStream: GeoProjectionPathStream;

  /**
   * Constructor.
   * @param resampler The geodesic resampler used by this renderer.
   */
  constructor(
    resampler: GeodesicResampler
  ) {
    this.projectionStream = new GeoProjectionPathStream(new NullPathStream(), this.projection, resampler);
  }

  /**
   * Renders an arc along a geo circle to a canvas.
   * @param circle The geo circle containing the arc to render.
   * @param startLat The latitude of the start of the arc, in degrees.
   * @param startLon The longitude of the start of the arc, in degrees.
   * @param endLat The latitude of the end of the arc, in degrees.
   * @param endLon The longitude of the end of the arc, in degrees.
   * @param projection The projection to use when rendering.
   * @param context The canvas 2D rendering context to which to render.
   * @param stream The path stream to which to render.
   * @param width The width of the rendered line.
   * @param style The style of the rendered line.
   * @param dash The dash array of the rendered line. Defaults to no dash.
   */
  public render(
    circle: GeoCircle,
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number,
    projection: GeoProjection,
    context: CanvasRenderingContext2D,
    stream: PathStream,
    width: number,
    style: string,
    dash?: readonly number[]
  ): void {
    this.projection.copyParametersFrom(projection);
    this.projectionStream.setConsumer(stream ?? context);

    this.projectionStream.beginPath();
    this.projectionStream.moveTo(startLon, startLat);

    if (circle.isGreatCircle()) {
      const startPoint = GeoPoint.sphericalToCartesian(startLat, startLon, MapGeoCircleLineRenderer.vec3Cache[0]);
      const distance = circle.distanceAlong(startPoint, MapGeoCircleLineRenderer.geoPointCache[0].set(endLat, endLon), Math.PI);

      if (distance >= Math.PI - GeoPoint.EQUALITY_TOLERANCE) {
        const midPoint = circle.offsetDistanceAlong(startPoint, distance / 2, MapGeoCircleLineRenderer.geoPointCache[0], Math.PI);
        const midLat = midPoint.lat;
        const midLon = midPoint.lon;

        this.projectionStream.lineTo(midLat, midLon);
        this.projectionStream.lineTo(endLon, endLat);
      } else {
        this.projectionStream.lineTo(endLon, endLat);
      }
    } else {
      const turnCenter = FlightPathUtils.getTurnCenterFromCircle(circle, MapGeoCircleLineRenderer.geoPointCache[0]);
      const turnDirection = FlightPathUtils.getTurnDirectionFromCircle(circle);
      const directionSign = turnDirection === 'left' ? 1 : -1;

      this.projectionStream.arc(
        turnCenter.lon, turnCenter.lat,
        FlightPathUtils.getTurnRadiusFromCircle(circle),
        circle.bearingAt(MapGeoCircleLineRenderer.geoPointCache[1].set(startLat, startLon), Math.PI) + 90 * directionSign,
        circle.bearingAt(MapGeoCircleLineRenderer.geoPointCache[1].set(endLat, endLon), Math.PI) + 90 * directionSign,
        turnDirection === 'left'
      );
    }

    context.lineWidth = width;
    context.strokeStyle = style;
    context.setLineDash(dash ?? MapGeoCircleLineRenderer.EMPTY_DASH);
    context.stroke();
  }
}