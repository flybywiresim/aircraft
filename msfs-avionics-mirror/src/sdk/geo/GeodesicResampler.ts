import { Vec2Math, Vec3Math } from '../math/VecMath';
import { LatLonInterface } from './GeoInterfaces';
import { GeoPoint, GeoPointInterface } from './GeoPoint';
import { GeoProjection } from './GeoProjection';

/**
 * A function which handles resampled points.
 */
export type GeodesicResamplerHandler = (point: GeoPointInterface, projected: Float64Array, index: number) => void;

/**
 * Resamples projected geodesic (great-circle) paths between defined endpoints into series of straight line segments.
 */
export class GeodesicResampler {
  private readonly cosMinDistance: number;
  private readonly dpTolSq: number;

  private geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private vec2Cache = [new Float64Array(2), new Float64Array(2), new Float64Array(2)];
  private vec3Cache = [new Float64Array(3), new Float64Array(3), new Float64Array(3)];

  /**
   * Constructor.
   * @param minDistance The minimum geodesic distance this resampler enforces between two adjacent resampled points, in
   * great-arc radians.
   * @param dpTolerance The Douglas-Peucker tolerance this resampler uses when deciding whether to discard a resampled
   * point during the line simplification process.
   * @param maxDepth The maximum depth of the resampling algorithm used by this resampler. The number of resampled
   * points is bounded from above by 2^[maxDepth] - 1.
   */
  constructor(public readonly minDistance: number, public readonly dpTolerance: number, public readonly maxDepth: number) {
    this.cosMinDistance = Math.cos(minDistance);
    this.dpTolSq = dpTolerance * dpTolerance;
  }

  /**
   * Resamples a projected geodesic (great-circle) path.
   * @param projection The projection to use.
   * @param start The start of the path.
   * @param end The end of the path.
   * @param handler A function to handle the resampled points. The function is called once for each resampled point,
   * in order.
   * @throws Error when the start and end of the path are antipodal.
   */
  public resample(projection: GeoProjection, start: LatLonInterface, end: LatLonInterface, handler: GeodesicResamplerHandler): void {
    const startVec = GeoPoint.sphericalToCartesian(start, this.vec3Cache[0]);
    const endVec = GeoPoint.sphericalToCartesian(end, this.vec3Cache[1]);
    const startProjected = projection.project(start, this.vec2Cache[0]);
    const endProjected = projection.project(end, this.vec2Cache[1]);

    handler(this.geoPointCache[0].set(start), startProjected, 0);

    const index = this.resampleHelper(projection,
      start.lat, start.lon, startVec[0], startVec[1], startVec[2], startProjected[0], startProjected[1],
      end.lat, end.lon, endVec[0], endVec[1], endVec[2], endProjected[0], endProjected[1],
      handler, 0, 1);

    handler(this.geoPointCache[0].set(end), endProjected, index);
  }

  /**
   * Resamples a projected geodesic (great-circle) path. This method will recursively split the path into two halves
   * and resample the midpoint. Recursion continues as long as the maximum depth has not been reached and at least one
   * of the following conditions is met:
   * * The distance from the midpoint to the endpoints is greater than or equal to the minimum resampling distance.
   * * The Douglas-Peucker metric of the projected midpoint is greater than or equal to the set tolerance.
   * @param projection The projection to use.
   * @param lat1 The latitude of the start of the path.
   * @param lon1 The longitude of the start of the path.
   * @param x1 The x-component of the Cartesian position vector of the start of the path.
   * @param y1 The y-component of the Cartesian position vector of the start of the path.
   * @param z1 The z-component of the Cartesian position vector of the start of the path.
   * @param projX1 The x-component of the projected location of the start of the path.
   * @param projY1 The y-component of the projected location of the start of the path.
   * @param lat2 The latitude of the end of the path.
   * @param lon2 The longitude of the end of the path.
   * @param x2 The x-component of the Cartesian position vector of the end of the path.
   * @param y2 The y-component of the Cartesian position vector of the end of the path.
   * @param z2 The z-component of the Cartesian position vector of the end of the path.
   * @param projX2 The x-component of the projected location of the end of the path.
   * @param projY2 The y-component of the projected location of the end of the path.
   * @param handler A function to handle the resampled points.
   * @param depth The current depth of the resampling algorithm.
   * @param index The index of the next resampled point.
   * @returns The index of the next resampled point.
   * @throws Error when the start and end of the path are antipodal.
   */
  private resampleHelper(
    projection: GeoProjection,
    lat1: number, lon1: number, x1: number, y1: number, z1: number, projX1: number, projY1: number,
    lat2: number, lon2: number, x2: number, y2: number, z2: number, projX2: number, projY2: number,
    handler: GeodesicResamplerHandler,
    depth: number, index: number,
  ): number {
    if (depth >= this.maxDepth) {
      return index;
    }

    const startVec = Vec3Math.set(x1, y1, z1, this.vec3Cache[0]);
    const endVec = Vec3Math.set(x2, y2, z2, this.vec3Cache[1]);
    const sumVec = Vec3Math.add(startVec, endVec, this.vec3Cache[2]);
    if (Vec3Math.dot(sumVec, sumVec) === 0) {
      throw new Error('Cannot resample from antipodal endpoints.');
    }
    const midVec = Vec3Math.normalize(sumVec, sumVec);

    const startProjected = Vec2Math.set(projX1, projY1, this.vec2Cache[0]);
    const endProjected = Vec2Math.set(projX2, projY2, this.vec2Cache[1]);
    const deltaProjected = Vec2Math.sub(endProjected, startProjected, this.vec2Cache[2]);
    const deltaProjectedDot = Vec2Math.dot(deltaProjected, deltaProjected);

    const midPoint = this.geoPointCache[0].setFromCartesian(midVec);
    const midProjected = projection.project(midPoint, this.vec2Cache[2]);

    const lat0 = midPoint.lat;
    const lon0 = midPoint.lon;
    const x0 = midVec[0];
    const y0 = midVec[1];
    const z0 = midVec[2];
    const projX0 = midProjected[0];
    const projY0 = midProjected[1];

    const cosDistance = Vec3Math.dot(startVec, midVec);
    // cosine of distance increases with decreasing distance, so the check needs to be greater than.
    if (cosDistance > this.cosMinDistance) {
      // calculate Douglas-Peucker metric.
      const area = (projX2 - projX1) * (projY1 - projY0) - (projX1 - projX0) * (projY2 - projY1);
      const dpDisSq = area * area / deltaProjectedDot;

      if (dpDisSq < this.dpTolSq) {
        return index;
      }
    }

    index = this.resampleHelper(projection,
      lat1, lon1, x1, y1, z1, projX1, projY1,
      lat0, lon0, x0, y0, z0, projX0, projY0,
      handler, depth + 1, index);

    handler(this.geoPointCache[0].set(lat0, lon0), Vec2Math.set(projX0, projY0, this.vec2Cache[0]), index);

    return this.resampleHelper(projection,
      lat0, lon0, x0, y0, z0, projX0, projY0,
      lat2, lon2, x2, y2, z2, projX2, projY2,
      handler, depth + 1, index + 1);
  }
}