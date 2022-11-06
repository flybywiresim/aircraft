import { MathUtils } from '../math/MathUtils';
import { ReadonlyFloat64Array, Vec2Math, Vec3Math } from '../math/VecMath';
import { GeoCircle } from './GeoCircle';
import { LatLonInterface } from './GeoInterfaces';
import { GeoPoint, GeoPointInterface } from './GeoPoint';
import { GeoProjection } from './GeoProjection';

/**
 * A function which handles resampled points.
 * @param vector A vector which describes the projected path terminating at the resampled point.
 */
export type GeoCircleResamplerHandler = (vector: Readonly<GeoCircleResamplerVector>) => void;

/**
 * A vector describing the projected path terminating at a point resampled by {@link GeoCircleResampler}.
 */
export type GeoCircleResamplerVector = GeoCircleResamplerStartVector | GeoCircleResamplerLineVector | GeoCircleResamplerArcVector;

/** Base vector class. */
type GeoCircleResamplerBaseVector = {
  /** The type of this vector. */
  type: string;

  /** The resampled point that terminates this vector. */
  point: GeoPointInterface;

  /** The projected position, in pixel coordinates, of the resampled point that terminates this vector. */
  projected: ReadonlyFloat64Array;

  /** The index of the resampled point that terminates this vector. `0` is the first point, `1` is the second, and so on. */
  index: number;
};

/**
 * A vector describing the starting point of a path resampled by {@link GeoCircleResampler}.
 */
export type GeoCircleResamplerStartVector = GeoCircleResamplerBaseVector & {
  /** The type of this vector. */
  type: 'start';
};

/**
 * A vector describing a projected straight line terminating at a point resampled by {@link GeoCircleResampler}.
 */
export type GeoCircleResamplerLineVector = GeoCircleResamplerBaseVector & {
  /** The type of this vector. */
  type: 'line';
};

/**
 * A vector describing a projected circular arc terminating at a point resampled by {@link GeoCircleResampler}.
 */
export type GeoCircleResamplerArcVector = GeoCircleResamplerBaseVector & {
  /** The type of this vector. */
  type: 'arc';

  /** The center of the projected arc, in pixel coordinates. */
  projectedArcCenter: ReadonlyFloat64Array;

  /** The radius of the projected arc, in pixels. */
  projectedArcRadius: number;

  /** The radial of the start of the projected arc, in radians. */
  projectedArcStartAngle: number;

  /** The radial of the end of the projected arc, in radians. */
  projectedArcEndAngle: number;
};

/**
 * A state of the {@link GeoCircleResampler} resampling algorithm.
 */
type ResampleState = {
  /** The index of the next point to be resampled. */
  index: number;

  /** The x-coordinate of the last resampled point, in pixels. */
  prevX: number;

  /** The y-coordinate of the last resampled point, in pixels. */
  prevY: number;

  /** The current modeled vector type of the path. */
  vectorType: 'line' | 'arc';

  /**
   * The x-coordinate, in pixels, of the center of the circle containing the model arc. Only valid if the current
   * modeled vector type is `'arc'`.
   */
  arcCenterX: number;

  /**
   * The y-coordinate, in pixels, of the center of the circle containing the model arc. Only valid if the current
   * modeled vector type is `'arc'`.
   */
  arcCenterY: number;

  /**
   * The radius, in pixels, of the circle containing the model arc. Only valid if the current modeled vector type is
   * `'arc'`.
   */
  arcRadius: number;

  /** Whether the model arc proceeds counterclockwise. Only valid if the current modeled vector type is `'arc'`. */
  isArcCounterClockwise: boolean;
};

/**
 * Resamples projected great- and small-circle paths between defined endpoints into series of straight line segments and circular arcs.
 */
export class GeoCircleResampler {
  private readonly cosMinDistance: number;
  private readonly dpTolSq: number;

  private readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private readonly vec2Cache = [new Float64Array(2), new Float64Array(2), new Float64Array(2)];
  private readonly vec3Cache = [new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3)];

  private readonly startVector = {
    type: 'start',
    point: new GeoPoint(0, 0),
    projected: new Float64Array(2),
    index: 0
  };
  private readonly lineVector = {
    type: 'line',
    point: new GeoPoint(0, 0),
    projected: new Float64Array(2),
    index: 0
  };
  private readonly arcVector = {
    type: 'arc',
    point: new GeoPoint(0, 0),
    projected: new Float64Array(2),
    projectedArcCenter: new Float64Array(2),
    projectedArcRadius: 0,
    projectedArcStartAngle: 0,
    projectedArcEndAngle: 0,
    index: 0
  };

  private readonly state: ResampleState = {
    index: 0,
    prevX: 0,
    prevY: 0,
    vectorType: 'line',
    arcCenterX: 0,
    arcCenterY: 0,
    arcRadius: 0,
    isArcCounterClockwise: false
  };

  /**
   * Constructor.
   * @param minDistance The minimum great-circle distance this resampler enforces between two adjacent resampled
   * points, in great-arc radians.
   * @param dpTolerance The Douglas-Peucker tolerance, in pixels, this resampler uses when deciding whether to discard
   * a resampled point during the simplification process.
   * @param maxDepth The maximum depth of the resampling algorithm used by this resampler. The number of resampled
   * points is bounded from above by `2^[maxDepth] - 1`.
   */
  constructor(public readonly minDistance: number, public readonly dpTolerance: number, public readonly maxDepth: number) {
    this.cosMinDistance = Math.cos(minDistance);
    this.dpTolSq = dpTolerance * dpTolerance;
  }

  /**
   * Resamples a projected great- or small-circle path.
   * @param projection The projection to use.
   * @param circle The geo circle along which the path lies.
   * @param start The start of the path.
   * @param end The end of the path.
   * @param handler A function to handle the resampled points. The function is called once for each resampled point,
   * in order.
   */
  public resample(
    projection: GeoProjection,
    circle: GeoCircle,
    start: LatLonInterface | ReadonlyFloat64Array,
    end: LatLonInterface | ReadonlyFloat64Array,
    handler: GeoCircleResamplerHandler
  ): void {
    let startPoint, startVec, endPoint, endVec;

    if (start instanceof Float64Array) {
      startPoint = this.geoPointCache[0].setFromCartesian(start);
      startVec = start;
    } else {
      startPoint = start as LatLonInterface;
      startVec = GeoPoint.sphericalToCartesian(start as LatLonInterface, this.vec3Cache[0]);
    }
    if (end instanceof Float64Array) {
      endPoint = this.geoPointCache[0].setFromCartesian(end);
      endVec = end;
    } else {
      endPoint = end as LatLonInterface;
      endVec = GeoPoint.sphericalToCartesian(end as LatLonInterface, this.vec3Cache[1]);
    }

    const startLat = startPoint.lat;
    const startLon = startPoint.lon;
    const endLat = endPoint.lat;
    const endLon = endPoint.lon;

    const startProjected = projection.project(start, this.vec2Cache[0]);
    const endProjected = projection.project(end, this.vec2Cache[1]);

    const startX = startProjected[0];
    const startY = startProjected[1];
    const endX = endProjected[0];
    const endY = endProjected[1];

    this.startVector.point.set(startLat, startLon);
    Vec2Math.copy(startProjected, this.startVector.projected);

    handler(this.startVector as GeoCircleResamplerStartVector);

    this.state.index = 1;
    this.state.prevX = startX;
    this.state.prevY = startY;
    this.state.vectorType = 'line';

    const state = this.resampleHelper(
      projection, circle,
      startLat, startLon, startVec[0], startVec[1], startVec[2], startX, startY,
      endLat, endLon, endVec[0], endVec[1], endVec[2], endX, endY,
      handler, 0, this.state
    );

    this.callHandler(handler, endLat, endLon, endX, endY, state);
  }

  /**
   * Resamples a projected great- or small-circle path. This method will recursively split the path into two halves
   * and resample the midpoint. Based on the projected position of the midpoint relative to those of the start and end
   * points, the projected path is modeled as either a straight line from the start to the end or a circular arc
   * connecting the start, end, and midpoints. Recursion continues as long as the maximum depth has not been reached
   * and at least one of the following conditions is met:
   * * The distance from the midpoint to the endpoints is greater than or equal to the minimum resampling distance.
   * * If the path is modeled as a line: the distance from the projected midpoint to the model line is greater than
   * this resampler's Douglas-Peucker tolerance.
   * * If the path is modeled as an arc: the distance from the projected one-quarter or the three-quarter point along
   * the path to the model arc is greater than this resampler's Douglas-Peucker tolerance.
   * @param projection The projection to use.
   * @param circle The geo circle along which the path lies.
   * @param lat1 The latitude of the start of the path, in degrees.
   * @param lon1 The longitude of the start of the path, in degrees.
   * @param x1 The x-component of the Cartesian position vector of the start of the path.
   * @param y1 The y-component of the Cartesian position vector of the start of the path.
   * @param z1 The z-component of the Cartesian position vector of the start of the path.
   * @param projX1 The x-component of the projected location of the start of the path, in pixels.
   * @param projY1 The y-component of the projected location of the start of the path, in pixels.
   * @param lat2 The latitude of the end of the path, in degrees.
   * @param lon2 The longitude of the end of the path, in degrees.
   * @param x2 The x-component of the Cartesian position vector of the end of the path.
   * @param y2 The y-component of the Cartesian position vector of the end of the path.
   * @param z2 The z-component of the Cartesian position vector of the end of the path.
   * @param projX2 The x-component of the projected location of the end of the path, in pixels.
   * @param projY2 The y-component of the projected location of the end of the path, in pixels.
   * @param handler A function to handle the resampled points.
   * @param depth The current depth of the resampling algorithm.
   * @param state The current state of the resampling algorithm.
   * @returns The index of the next resampled point.
   */
  private resampleHelper(
    projection: GeoProjection,
    circle: GeoCircle,
    lat1: number, lon1: number, x1: number, y1: number, z1: number, projX1: number, projY1: number,
    lat2: number, lon2: number, x2: number, y2: number, z2: number, projX2: number, projY2: number,
    handler: GeoCircleResamplerHandler,
    depth: number,
    state: ResampleState,
  ): ResampleState {
    if (depth >= this.maxDepth) {
      return state;
    }

    const startVec = Vec3Math.set(x1, y1, z1, this.vec3Cache[0]);
    const endVec = Vec3Math.set(x2, y2, z2, this.vec3Cache[1]);

    const angularWidth = circle.angleAlong(startVec, endVec, Math.PI);

    if (angularWidth <= GeoCircle.ANGULAR_TOLERANCE) {
      return state;
    }

    const midVec = circle.offsetAngleAlong(startVec, angularWidth / 2, this.vec3Cache[2]);

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

    const A = projX2 - projX1;
    const B = projY2 - projY1;
    const C = projX1 * projX1 - projX2 * projX2 + projY1 * projY1 - projY2 * projY2;
    const D = projX0 - projX1;
    const E = projY0 - projY1;
    const F = projX1 * projX1 - projX0 * projX0 + projY1 * projY1 - projY0 * projY0;

    // Calculate the Douglas-Peucker metric
    const det = 2 * (A * E - B * D);
    const dpDisSq = (det * det / 4) / deltaProjectedDot;

    if (dpDisSq > this.dpTolSq) {
      // Attempt to model the projected path with an arc
      // Find the center of circle containing the arc passing through the projected start, end, and mid points.
      const arcCenterX = (B * F - C * E) / det;
      const arcCenterY = (C * D - A * F) / det;
      const arcRadius = Math.hypot(arcCenterX - projX1, arcCenterY - projY1);

      const startToEndVec = Vec3Math.set(A, B, 0, this.vec3Cache[3]);
      const centerToMidVec = Vec3Math.set(projX0 - arcCenterX, projY0 - arcCenterY, 0, this.vec3Cache[4]);
      const cross = Vec3Math.cross(startToEndVec, centerToMidVec, this.vec3Cache[4]);

      state.vectorType = 'arc';
      state.arcCenterX = arcCenterX;
      state.arcCenterY = arcCenterY;
      state.arcRadius = arcRadius;
      state.isArcCounterClockwise = cross[2] > 0;
    } else {
      state.vectorType = 'line';
    }

    const cosDistance = Vec3Math.dot(startVec, midVec);
    if (cosDistance > this.cosMinDistance) { // cosine of distance increases with decreasing distance
      // We are below the minimum distance required to continue resampling -> decide if we need to continue or if
      // the path can satisfactorily be modeled as either a straight line or a circular arc.

      if (state.vectorType === 'line') {
        // The path can be modeled as a line.
        return state;
      }

      // To find whether the path can be modeled as an arc, we need to project the one-quarter and three-quarter points
      // along the path and find the projected points' distances from the arc modeled above. If the distances are
      // within the D-P tolerance, then the path can be modeled as an arc.

      const query = circle.offsetAngleAlong(startVec, angularWidth / 4, this.geoPointCache[0]);
      const projectedQuery = projection.project(query, this.vec2Cache[0]);
      let distance = Math.hypot(projectedQuery[0] - state.arcCenterX, projectedQuery[1] - state.arcCenterY);
      if ((distance - state.arcRadius) * (distance - state.arcRadius) <= this.dpTolSq) {
        circle.offsetAngleAlong(startVec, 3 * angularWidth / 4, query);
        projection.project(query, projectedQuery);
        distance = Math.hypot(projectedQuery[0] - state.arcCenterX, projectedQuery[1] - state.arcCenterY);
        if ((distance - state.arcRadius) * (distance - state.arcRadius) <= this.dpTolSq) {
          return state;
        }
      }
    }

    state = this.resampleHelper(
      projection, circle,
      lat1, lon1, x1, y1, z1, projX1, projY1,
      lat0, lon0, x0, y0, z0, projX0, projY0,
      handler, depth + 1, state
    );

    this.callHandler(handler, lat0, lon0, projX0, projY0, state);
    state.index++;
    state.prevX = projX0;
    state.prevY = projY0;

    return this.resampleHelper(
      projection, circle,
      lat0, lon0, x0, y0, z0, projX0, projY0,
      lat2, lon2, x2, y2, z2, projX2, projY2,
      handler, depth + 1, state
    );
  }

  /**
   * Calls a handler function for a resampled point.
   * @param handler The handler function to call.
   * @param lat The latitude of the resampled point, in degrees.
   * @param lon The longitude of the resampled point, in degrees.
   * @param projX The x-coordinate of the projected resampled point, in pixels.
   * @param projY The y-coordinate of the projected resampled point, in pixels.
   * @param state The current state of the resampling algorithm.
   */
  private callHandler(
    handler: GeoCircleResamplerHandler,
    lat: number, lon: number,
    projX: number, projY: number,
    state: ResampleState
  ): void {
    let vector;
    if (state.vectorType === 'line') {
      vector = this.lineVector;
    } else {
      vector = this.arcVector;
      Vec2Math.set(state.arcCenterX, state.arcCenterY, vector.projectedArcCenter);
      vector.projectedArcRadius = state.arcRadius;
      vector.projectedArcStartAngle = Math.atan2(state.prevY - state.arcCenterY, state.prevX - state.arcCenterX);
      vector.projectedArcEndAngle = Math.atan2(projY - state.arcCenterY, projX - state.arcCenterX);

      if (vector.projectedArcEndAngle < vector.projectedArcStartAngle !== state.isArcCounterClockwise) {
        vector.projectedArcEndAngle += state.isArcCounterClockwise ? -MathUtils.TWO_PI : MathUtils.TWO_PI;
      }
    }

    vector.point.set(lat, lon);
    Vec2Math.set(projX, projY, vector.projected);
    vector.index = state.index;

    handler(vector as GeoCircleResamplerVector);
  }
}