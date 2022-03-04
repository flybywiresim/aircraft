import { Vec2Math } from '../math';
import { AbstractTransformingPathStream, PathStream } from './PathStream';
import { GeoCircle } from '../geo/GeoCircle';
import { GeodesicResampler } from '../geo/GeodesicResampler';
import { GeoPoint, GeoPointInterface } from '../geo/GeoPoint';
import { GeoProjection } from '../geo/GeoProjection';

/**
 * A path stream which transforms a path stream in spherical coordinates to one in projected planar coordinates.
 */
export class GeoProjectionPathStream extends AbstractTransformingPathStream {
  private static vec2Cache = [new Float64Array(2)];
  private static geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];

  private readonly resampler: GeodesicResampler;

  private readonly firstPoint = new GeoPoint(NaN, NaN);
  private readonly prevPoint = new GeoPoint(NaN, NaN);

  private readonly prevPointProjected = new Float64Array(2);

  private readonly resampleHandler = this.onResampled.bind(this);

  /**
   * Constructor.
   * @param consumer The path stream that consumes this stream's transformed output.
   * @param projection The projection this stream uses.
   * @param minDistance The minimum geodesic distance this stream's resampler enforces between two adjacent resampled
   * points, in great-arc radians.
   * @param dpTolerance The Douglas-Peucker tolerance this stream's resampler uses when deciding whether to discard a
   * resampled point during the line simplification process.
   * @param maxDepth The maximum depth of the resampling algorithm used by this stream's resampler. The number of
   * resampled points is bounded from above by 2^[maxDepth] - 1.
   */
  constructor(consumer: PathStream, projection: GeoProjection, minDistance: number, dpTolerance: number, maxDepth: number);
  /**
   * Constructor.
   * @param consumer The path stream that consumes this stream's transformed output.
   * @param projection The projection this stream uses.
   * @param resampler The geodesic resampler this stream uses.
   */
  constructor(consumer: PathStream, projection: GeoProjection, resampler: GeodesicResampler);
  // eslint-disable-next-line jsdoc/require-jsdoc
  constructor(consumer: PathStream, private readonly projection: GeoProjection, arg1: number | GeodesicResampler, arg2?: number, arg3?: number) {
    super(consumer);

    if (arg1 instanceof GeodesicResampler) {
      this.resampler = arg1;
    } else {
      this.resampler = new GeodesicResampler(arg1, arg2 as number, arg3 as number);
    }
  }

  /** @inheritdoc */
  public beginPath(): void {
    this.reset();
    this.consumer.beginPath();
  }

  /**
   * Moves to a specified point.
   * @param lon The longitude of the point to which to move, in degrees.
   * @param lat The latitude of the point to which to move, in degrees.
   */
  public moveTo(lon: number, lat: number): void {
    if (!(isFinite(lon) && isFinite(lat))) {
      return;
    }

    if (isNaN(this.firstPoint.lat)) {
      this.firstPoint.set(lat, lon);
    }

    this.prevPoint.set(lat, lon);

    const projected = this.projection.project(this.prevPoint, this.prevPointProjected);
    this.consumer.moveTo(projected[0], projected[1]);
  }

  /**
   * Paths a great-circle arc from the current point to a specified point.
   * @param lon The longitude of the end point, in degrees.
   * @param lat The latitude of the end point, in degrees.
   */
  public lineTo(lon: number, lat: number): void {
    if (!(isFinite(lon) && isFinite(lat))) {
      return;
    }

    if (!isNaN(this.prevPoint.lat) && this.prevPoint.equals(lat, lon)) {
      return;
    }

    if (isNaN(this.prevPoint.lat)) {
      this.moveTo(lon, lat);
      return;
    }

    const point = GeoProjectionPathStream.geoPointCache[0].set(lat, lon);

    this.resampler.resample(this.projection, this.prevPoint, point, this.resampleHandler);

    this.prevPoint.set(lat, lon);
  }

  /**
   * Handles resampled points.
   * @param point The resampled point.
   * @param projected The projected resampled point.
   * @param index The index of the resampled point.
   */
  private onResampled(point: GeoPointInterface, projected: Float64Array, index: number): void {
    if (index === 0) {
      return;
    }

    this.consumer.lineTo(projected[0], projected[1]);
    Vec2Math.copy(projected, this.prevPointProjected);
  }

  /**
   * Not supported by this path stream.
   * @throws Error when called.
   */
  public bezierCurveTo(): void {
    throw new Error('GeodesicResamplerStream: bezierCurveTo() is not supported');
  }

  /**
   * Not supported by this path stream.
   * @throws Error when called.
   */
  public quadraticCurveTo(): void {
    throw new Error('GeodesicResamplerStream: quadraticCurveTo() is not supported');
  }

  /**
   * Paths a small-circle arc.
   * @param lon The longitude of the center of the circle containing the arc, in degrees.
   * @param lat The latitude of the center of the circle containing the arc, in degrees.
   * @param radius The radius of the arc, in great-arc radians.
   * @param startAngle The true bearing from the center of the circle to the start of the arc, in degrees.
   * @param endAngle The true bearing from the center of the circle to the end of the arc, in degrees.
   * @param counterClockwise Whether the arc should be drawn counterclockwise. False by default.
   */
  public arc(lon: number, lat: number, radius: number, startAngle: number, endAngle: number, counterClockwise?: boolean): void {
    if (!(isFinite(lon) && isFinite(lat) && isFinite(radius) && isFinite(startAngle) && isFinite(endAngle))) {
      return;
    }

    if (radius === 0 || startAngle === endAngle) {
      return;
    }

    if (isNaN(this.prevPoint.lat)) {
      this.moveTo(lon, lat);
      return;
    }

    const center = GeoProjectionPathStream.geoPointCache[1].set(lat, lon);

    const start = center.offset(startAngle, radius, GeoProjectionPathStream.geoPointCache[2]);
    const end = center.offset(endAngle, radius, GeoProjectionPathStream.geoPointCache[3]);

    if (isNaN(start.lat) || isNaN(start.lon) || isNaN(end.lat) || isNaN(end.lon)) {
      return;
    }

    const startProjected = this.projection.project(start, GeoProjectionPathStream.vec2Cache[0]);

    const x1 = startProjected[0];
    const y1 = startProjected[1];

    const dx = x1 - this.prevPointProjected[0];
    const dy = y1 - this.prevPointProjected[1];
    if (dx * dx + dy * dy >= 1) {
      this.lineTo(start.lon, start.lat);
    }

    if (Math.abs(radius - Math.PI) <= GeoCircle.ANGULAR_TOLERANCE) {
      this.lineTo(end.lon, end.lat);
      return;
    }

    const endProjected = this.projection.project(end, GeoProjectionPathStream.vec2Cache[0]);

    const x2 = endProjected[0];
    const y2 = endProjected[1];

    const centerProjected = this.projection.project(center, GeoProjectionPathStream.vec2Cache[0]);

    const cx = centerProjected[0];
    const cy = centerProjected[1];

    const radiusPixels = Math.hypot(cx - x1, cy - y1);
    const startRadians = Math.atan2(y1 - cy, x1 - cx);
    const endRadians = Math.atan2(y2 - cy, x2 - cx);

    this.consumer.arc(cx, cy, radiusPixels, startRadians, endRadians, counterClockwise);

    this.prevPoint.set(end);
    Vec2Math.set(x2, y2, this.prevPointProjected);
  }

  /**
   * Paths a great-circle arc from the current point to the first point defined by the current path.
   */
  public closePath(): void {
    if (!isNaN(this.firstPoint.lat)) {
      this.lineTo(this.firstPoint.lon, this.firstPoint.lat);
    }
  }

  /**
   * Resets the state of this stream.
   */
  private reset(): void {
    this.firstPoint.set(NaN, NaN);
    this.prevPoint.set(NaN, NaN);
  }
}