import { FlightPathUtils } from '../../flightplan';
import { GeoCircle, GeoPoint } from '../../geo';
import { GeoProjectionPathStreamStack } from './GeoProjectionPathStreamStack';

/**
 * Renders arcs along geo circles to a path stream stack.
 */
export class GeoCirclePathRenderer {
  private static readonly NORTH_POLE_VEC = new Float64Array([0, 0, 1]);

  private static readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private static readonly vec3Cache = [new Float64Array(3)];

  /**
   * Renders an arc along a geo circle to a path stream stack.
   * @param circle The geo circle containing the arc to render.
   * @param startLat The latitude of the start of the arc, in degrees.
   * @param startLon The longitude of the start of the arc, in degrees.
   * @param endLat The latitude of the end of the arc, in degrees.
   * @param endLon The longitude of the end of the arc, in degrees.
   * @param streamStack The path stream stack to which to render.
   * @param continuePath Whether to continue the previously rendered path. If true, a discontinuity in the rendered
   * path will not be inserted before the arc is rendered. This may lead to undesired artifacts if the previously
   * rendered path does not terminate at the point where the projected arc starts. Defaults to false.
   */
  public render(
    circle: GeoCircle,
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number,
    streamStack: GeoProjectionPathStreamStack,
    continuePath = false
  ): void {
    if (!continuePath) {
      streamStack.beginPath();
      streamStack.moveTo(startLon, startLat);
    }

    if (circle.isGreatCircle()) {
      const startPoint = GeoPoint.sphericalToCartesian(startLat, startLon, GeoCirclePathRenderer.vec3Cache[0]);
      const distance = circle.distanceAlong(startPoint, GeoCirclePathRenderer.geoPointCache[0].set(endLat, endLon), Math.PI);

      if (distance >= Math.PI - GeoPoint.EQUALITY_TOLERANCE) {
        const midPoint = circle.offsetDistanceAlong(startPoint, distance / 2, GeoCirclePathRenderer.geoPointCache[0], Math.PI);
        const midLat = midPoint.lat;
        const midLon = midPoint.lon;

        streamStack.lineTo(midLon, midLat);
        streamStack.lineTo(endLon, endLat);
      } else {
        streamStack.lineTo(endLon, endLat);
      }
    } else {
      const turnCenter = FlightPathUtils.getTurnCenterFromCircle(circle, GeoCirclePathRenderer.geoPointCache[0]);
      const turnDirection = FlightPathUtils.getTurnDirectionFromCircle(circle);

      const isCenterPole = Math.abs(turnCenter.lat) >= 90 - GeoCircle.ANGULAR_TOLERANCE * Avionics.Utils.RAD2DEG;

      let startAngle, endAngle;
      if (isCenterPole) {
        startAngle = startLon;
        endAngle = endLon;
      } else {
        startAngle = turnCenter.bearingTo(startLat, startLon);
        endAngle = turnCenter.bearingTo(endLat, endLon);
      }

      streamStack.arc(
        turnCenter.lon, turnCenter.lat,
        FlightPathUtils.getTurnRadiusFromCircle(circle),
        startAngle, endAngle,
        turnDirection === 'left'
      );
    }
  }
}