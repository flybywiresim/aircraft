import { GeoCircle } from '../../geo/GeoCircle';
import { GeoCircleResampler, GeoCircleResamplerVector } from '../../geo/GeoCircleResampler';
import { GeoPoint } from '../../geo/GeoPoint';
import { GeoProjection } from '../../geo/GeoProjection';
import { MathUtils, Vec2Math } from '../../math';
import { AbstractTransformingPathStream, PathStream } from './PathStream';

/**
 * A path stream which transforms a path stream in geographic spherical coordinates to one in projected planar
 * coordinates.
 */
export class GeoProjectionPathStream extends AbstractTransformingPathStream {
  private static readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  private readonly resampler: GeoCircleResampler;

  private readonly firstPoint = new GeoPoint(NaN, NaN);
  private readonly prevPoint = new GeoPoint(NaN, NaN);

  private readonly prevPointProjected = new Float64Array(2);

  private readonly resampleHandler = this.onResampled.bind(this);

  /**
   * Constructor.
   * @param consumer The path stream that consumes this stream's transformed output.
   * @param projection The projection this stream uses.
   * @param minDistance The minimum great-circle distance this stream's resampler enforces between two adjacent
   * resampled points, in great-arc radians.
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
   * @param resampler The geo circle resampler this stream uses.
   */
  constructor(consumer: PathStream, projection: GeoProjection, resampler: GeoCircleResampler);
  // eslint-disable-next-line jsdoc/require-jsdoc
  constructor(consumer: PathStream, private projection: GeoProjection, arg1: number | GeoCircleResampler, arg2?: number, arg3?: number) {
    super(consumer);

    if (arg1 instanceof GeoCircleResampler) {
      this.resampler = arg1;
    } else {
      this.resampler = new GeoCircleResampler(arg1, arg2 as number, arg3 as number);
    }
  }

  /**
   * Gets the projection used by this stream.
   * @returns The projection used by this stream.
   */
  public getProjection(): GeoProjection {
    return this.projection;
  }

  /**
   * Sets the projection used by this stream.
   * @param projection A projection.
   */
  public setProjection(projection: GeoProjection): void {
    this.projection = projection;
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
   * @throws Error if the specified point is antipodal to the last pathed point.
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
    const circle = GeoProjectionPathStream.geoCircleCache[0].setAsGreatCircle(this.prevPoint, point);

    if (!isFinite(circle.center[0])) {
      throw new Error(`Cannot unambiguously path a great circle from ${this.prevPoint.lat} lat, ${this.prevPoint.lon} lon to ${lat} lat, ${lon} lon`);
    }

    this.resampler.resample(this.projection, circle, this.prevPoint, point, this.resampleHandler);

    this.prevPoint.set(lat, lon);
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
   * @param startAngle If the center of the circle containing the arc is not one of the poles, the true bearing, in
   * degrees, from the center of the circle to the start of the arc; otherwise the longitude, in degrees, of the start
   * of the arc.
   * @param endAngle If the center of the circle containing the arc is not one of the poles, the true bearing, in
   * degrees, from the center of the circle to the end of the arc; otherwise the longitude, in degrees, of the end of
   * the arc.
   * @param counterClockwise Whether the arc should be drawn counterclockwise. False by default.
   */
  public arc(lon: number, lat: number, radius: number, startAngle: number, endAngle: number, counterClockwise?: boolean): void {
    if (!(isFinite(lon) && isFinite(lat) && isFinite(radius) && isFinite(startAngle) && isFinite(endAngle))) {
      return;
    }

    if (radius === 0 || Math.abs(startAngle - endAngle) <= GeoCircle.ANGULAR_TOLERANCE * Avionics.Utils.RAD2DEG) {
      return;
    }

    if (MathUtils.diffAngle(startAngle * Avionics.Utils.DEG2RAD, endAngle * Avionics.Utils.DEG2RAD, false) <= GeoCircle.ANGULAR_TOLERANCE) {
      // Since we early return above if startAngle and endAngle are equal, hitting this case means they are a multiple
      // of 360 degrees apart. The resampler will interpret them as being the same point and won't draw a full circle
      // so we will split the arc into two.
      const midAngle = startAngle + 180 * Math.sign(endAngle - startAngle);
      this.arc(lon, lat, radius, startAngle, midAngle, counterClockwise);
      this.arc(lon, lat, radius, midAngle, endAngle, counterClockwise);
      return;
    }

    const center = GeoProjectionPathStream.geoPointCache[1].set(lat, lon);

    const start = GeoProjectionPathStream.geoPointCache[2];
    const end = GeoProjectionPathStream.geoPointCache[3];

    if (Math.abs(lat) >= 90 - GeoCircle.ANGULAR_TOLERANCE * Avionics.Utils.RAD2DEG) {
      // The center of the arc circle is one of the poles
      const circleLat = Math.sign(lat) * (MathUtils.HALF_PI - radius) * Avionics.Utils.RAD2DEG;
      start.set(circleLat, startAngle);
      end.set(circleLat, endAngle);
    } else {
      center.offset(startAngle, radius, start);
      center.offset(endAngle, radius, end);
    }

    if (isNaN(start.lat) || isNaN(start.lon) || isNaN(end.lat) || isNaN(end.lon)) {
      return;
    }

    if (isNaN(this.prevPoint.lat)) {
      this.moveTo(start.lon, start.lat);
    } else if (!start.equals(this.prevPoint)) {
      this.lineTo(start.lon, start.lat);
    }

    const circle = GeoProjectionPathStream.geoCircleCache[0].set(center, radius);
    if (!counterClockwise) {
      circle.reverse();
    }

    this.resampler.resample(this.projection, circle, start, end, this.resampleHandler);

    this.prevPoint.set(end);
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

  /**
   * Handles resampled points.
   * @param vector A vector which describes the projected path terminating at the resampled point.
   */
  private onResampled(vector: GeoCircleResamplerVector): void {
    switch (vector.type) {
      case 'start':
        return;
      case 'line':
        this.consumer.lineTo(vector.projected[0], vector.projected[1]);
        break;
      case 'arc':
        this.consumer.arc(
          vector.projectedArcCenter[0], vector.projectedArcCenter[1], vector.projectedArcRadius,
          vector.projectedArcStartAngle, vector.projectedArcEndAngle,
          vector.projectedArcStartAngle > vector.projectedArcEndAngle
        );
        break;
    }

    Vec2Math.copy(vector.projected, this.prevPointProjected);
  }
}