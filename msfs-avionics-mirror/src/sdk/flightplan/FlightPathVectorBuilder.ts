/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { GeoCircle, GeoPoint, LatLonInterface, NavMath } from '../geo';
import { MathUtils, ReadonlyFloat64Array, UnitType, Vec3Math } from '../math';
import { FlightPathUtils } from './FlightPathUtils';
import { CircleVector, FlightPathVector, FlightPathVectorFlags, VectorTurnDirection } from './FlightPlanning';

/**
 * Builds circle vectors.
 */
export class CircleVectorBuilder {
  private static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  /**
   * Builds a circle vector and adds it to a sequence.
   * @param vectors The flight path vector sequence to which to add the vector.
   * @param index The index in the sequence at which to add the vector.
   * @param direction The direction of the circle.
   * @param radius The radius of the circle, in meters.
   * @param center The center of the circle.
   * @param start The start point.
   * @param end The end point.
   * @param flags The flags to set on the vector. Defaults to none (0).
   * @returns The number of vectors added to the sequence, which is always equal to 1.
   */
  public build(
    vectors: FlightPathVector[],
    index: number,
    direction: VectorTurnDirection,
    radius: number,
    center: ReadonlyFloat64Array | LatLonInterface,
    start: ReadonlyFloat64Array | LatLonInterface,
    end: ReadonlyFloat64Array | LatLonInterface,
    flags?: number
  ): 1;
  /**
   * Builds a circle vector and adds it to a sequence.
   * @param vectors The flight path vector sequence to which to add the vector.
   * @param index The index in the sequence at which to add the vector.
   * @param circle The circle which defines the vector path.
   * @param start The start point.
   * @param end The end point.
   * @param flags The flags to set on the vector. Defaults to none (0).
   * @returns The number of vectors added to the sequence, which is always equal to 1.
   */
  public build(
    vectors: FlightPathVector[],
    index: number,
    circle: GeoCircle,
    start: ReadonlyFloat64Array | LatLonInterface,
    end: ReadonlyFloat64Array | LatLonInterface,
    flags?: number
  ): 1;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public build(
    vectors: FlightPathVector[],
    index: number,
    ...args: [
      VectorTurnDirection,
      number,
      ReadonlyFloat64Array | LatLonInterface,
      ReadonlyFloat64Array | LatLonInterface,
      ReadonlyFloat64Array | LatLonInterface,
      number?
    ] | [
      GeoCircle,
      ReadonlyFloat64Array | LatLonInterface,
      ReadonlyFloat64Array | LatLonInterface,
      number?
    ]
  ): 1 {
    if (args[0] instanceof GeoCircle) {
      this.setFromCircle(vectors, index, ...(args as [
        GeoCircle,
        ReadonlyFloat64Array | LatLonInterface,
        ReadonlyFloat64Array | LatLonInterface,
        number?
      ]));
    } else {
      this.setFromPoints(vectors, index, ...(args as [
        VectorTurnDirection,
        number,
        ReadonlyFloat64Array | LatLonInterface,
        ReadonlyFloat64Array | LatLonInterface,
        ReadonlyFloat64Array | LatLonInterface,
        number?
      ]));
    }
    return 1;
  }

  /**
   * Sets the parameters for a circle vector in a flight path vector sequence. If a circle vector does not exist at the
   * specified index in the sequence, a new one will be created.
   * @param vectors A flight path vector sequence.
   * @param index The index in the sequence at which to set the circle vector.
   * @param direction The direction of the circle.
   * @param radius The radius of the circle, in meters.
   * @param center The center of the circle.
   * @param start The start point.
   * @param end The end point.
   * @param flags The flags to set on the vector. Defaults to none (0).
   * @returns The set circle vector.
   */
  private setFromPoints(
    vectors: FlightPathVector[],
    index: number,
    direction: VectorTurnDirection,
    radius: number,
    center: ReadonlyFloat64Array | LatLonInterface,
    start: ReadonlyFloat64Array | LatLonInterface,
    end: ReadonlyFloat64Array | LatLonInterface,
    flags = 0
  ): CircleVector {
    const circle = FlightPathUtils.getTurnCircle(
      center,
      UnitType.METER.convertTo(radius, UnitType.GA_RADIAN),
      direction,
      CircleVectorBuilder.geoCircleCache[0]
    );
    return this.setFromCircle(vectors, index, circle, start, end, flags);
  }

  /**
   * Sets the parameters for a circle vector in a flight path vector sequence. If a circle vector does not exist at the
   * specified index in the sequence, a new one will be created.
   * @param vectors A flight path vector sequence.
   * @param index The index in the sequence at which to set the circle vector.
   * @param circle The circle which defines the vector path.
   * @param start The start point.
   * @param end The end point.
   * @param flags The flags to set on the vector. Defaults to none (0).
   * @returns The set circle vector.
   */
  private setFromCircle(
    vectors: FlightPathVector[],
    index: number,
    circle: GeoCircle,
    start: ReadonlyFloat64Array | LatLonInterface,
    end: ReadonlyFloat64Array | LatLonInterface,
    flags = 0
  ): CircleVector {
    const vector = (vectors[index]?.vectorType === 'circle' ? vectors[index] : (vectors[index] = FlightPathUtils.createEmptyCircleVector())) as CircleVector;
    return FlightPathUtils.setCircleVector(vector, circle, start, end, flags);
  }
}

/**
 * Builds great-circle paths between defined start and end points.
 */
export class GreatCircleBuilder {
  private static readonly vec3Cache = [new Float64Array(3)];
  private static readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  private readonly circleVectorBuilder = new CircleVectorBuilder();

  /**
   * Builds a sequence of vectors representing a great-circle path between two points. The great circle path chosen is
   * the shortest great-circle path between the two points.
   * @param vectors The flight path vector sequence to which to add the vectors.
   * @param index The index in the sequence at which to add the vectors.
   * @param start The start point.
   * @param end The end point.
   * @param initialCourse The initial true course bearing. Used to define a unique great-circle path when `start` and
   * `end` are antipodal.
   * @param flags The flags to set on the vector. Defaults to none (0).
   * @throws Error if `start` and `end` are antipodal and `initialCourse` is undefined.
   */
  public build(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    end: ReadonlyFloat64Array | LatLonInterface,
    initialCourse?: number,
    flags?: number
  ): number;
  /**
   * Builds a sequence of vectors representing a great-circle path between two points.
   * @param vectors The flight path vector sequence to which to add the vectors.
   * @param index The index in the sequence at which to add the vectors.
   * @param start The start point.
   * @param path The great-circle path.
   * @param end The end point.
   * @param flags The flags to set on the vector. Defaults to none (0).
   */
  public build(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    path: GeoCircle,
    end: ReadonlyFloat64Array | LatLonInterface,
    flags?: number
  ): number;
  /**
   * Builds a sequence of vectors representing a great-circle path between two points. The end point is chosen such
   * that it is offset from the start point by a specified distance.
   * @param vectors
   * @param index The index in the sequence at which to add the vectors.
   * @param start The start point.
   * @param path The great-circle path.
   * @param distance The distance along the path between the start and end points, in meters.
   * @param flags The flags to set on the vector. Defaults to none (0).
   */
  public build(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    path: GeoCircle,
    distance: number,
    flags?: number
  ): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public build(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    pathArg: ReadonlyFloat64Array | LatLonInterface | GeoCircle,
    endArg?: ReadonlyFloat64Array | LatLonInterface | number,
    flags?: number
  ): number {
    if (pathArg instanceof GeoCircle) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.buildFromPath(vectors, index, start, pathArg, endArg!, flags);
    } else {
      return this.buildFromEndpoints(vectors, index, start, pathArg, endArg as number | undefined, flags);
    }
  }

  /**
   * Builds a sequence of vectors representing the shortest great-circle path between two points.
   * @param vectors The flight path vector sequence to which to add the vectors.
   * @param index The index in the sequence at which to add the vectors.
   * @param start The start point.
   * @param end The end point.
   * @param initialCourse The initial true course bearing. Used to define a unique great-circle path when `start` and
   * `end` are antipodal.
   * @param flags The flags to set on the vector. Defaults to none (0).
   * @returns The number of vectors added to the sequence.
   * @throws Error if `start` and `end` are antipodal and `initialCourse` is undefined.
   */
  private buildFromEndpoints(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    end: ReadonlyFloat64Array | LatLonInterface,
    initialCourse?: number,
    flags?: number
  ): number {
    const startPoint = start instanceof Float64Array
      ? GreatCircleBuilder.geoPointCache[0].setFromCartesian(start)
      : GreatCircleBuilder.geoPointCache[0].set(start as LatLonInterface);
    const endPoint = end instanceof Float64Array
      ? GreatCircleBuilder.geoPointCache[1].setFromCartesian(end)
      : GreatCircleBuilder.geoPointCache[1].set(end as LatLonInterface);
    const distance = startPoint.distance(endPoint);

    const path = GreatCircleBuilder.geoCircleCache[0];
    if (distance >= Math.PI - GeoPoint.EQUALITY_TOLERANCE) {
      if (initialCourse === undefined) {
        throw new Error('GreatCircleVectorBuilder: cannot build a unique direct track from antipodal endpoints.');
      } else {
        path.setAsGreatCircle(start, initialCourse);
      }
    } else {
      path.setAsGreatCircle(start, end);
    }

    return this.buildFromPath(vectors, index, start, path, end, flags);
  }

  /**
   * Builds a sequence of vectors representing a great-circle path from a start point to either a defined endpoint
   * or a distance offset.
   * @param vectors The flight path vector sequence to which to add the vectors.
   * @param index The index in the sequence at which to add the vectors.
   * @param start The start point.
   * @param path The great-circle path.
   * @param endArg The end point or distance offset.
   * @param flags The flags to set on the vector. Defaults to none (0).
   * @returns The number of vectors added to the sequence.
   * @throws Error if `path` is not a great circle.
   */
  private buildFromPath(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    path: GeoCircle,
    endArg: ReadonlyFloat64Array | LatLonInterface | number,
    flags = 0
  ): number {
    if (!path.isGreatCircle()) {
      throw new Error(`GreatCircleVectorBuilder: expected GeoCircle radius of pi / 2; instead was ${path.radius}`);
    }

    const end = typeof endArg === 'number'
      ? path.offsetDistanceAlong(start, UnitType.METER.convertTo(endArg, UnitType.GA_RADIAN), GreatCircleBuilder.vec3Cache[0], Math.PI)
      : endArg;

    return this.circleVectorBuilder.build(vectors, index, path, start, end, flags);
  }
}

/**
 * Builds constant-radius turns toward specified course bearings.
 */
export class TurnToCourseBuilder {
  private static readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];

  private readonly circleVectorBuilder = new CircleVectorBuilder();

  /**
   * Adds a turn from a defined start point and initial course to a specific final course to a flight path vector
   * sequence. If the difference between the initial and final course is small enough such that the start and end of
   * the turn are identical, no turn will be added to the vector sequence.
   * @param vectors The flight path vector sequence to which to add the turn.
   * @param index The index in the sequence at which to add the turn.
   * @param start The start point of the turn.
   * @param radius The radius of the turn, in meters.
   * @param direction The direction of the turn.
   * @param fromCourse The initial true course at the start of the turn.
   * @param toCourse The final true course at the end of the turn.
   * @param flags The flags to set on the turn vector. Defaults to the `TurnToCourse` flag.
   * @returns The number of vectors added to the sequence.
   */
  public build(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    radius: number,
    direction: VectorTurnDirection,
    fromCourse: number,
    toCourse: number,
    flags = FlightPathVectorFlags.TurnToCourse
  ): number {
    if (start instanceof Float64Array) {
      start = TurnToCourseBuilder.geoPointCache[0].setFromCartesian(start);
    }

    const radiusRad = UnitType.METER.convertTo(radius, UnitType.GA_RADIAN);
    const turnCenterPoint = TurnToCourseBuilder.geoPointCache[1].set(start as LatLonInterface).offset(fromCourse + (direction === 'left' ? -90 : 90), radiusRad);
    const turnStartBearing = turnCenterPoint.bearingTo(start as LatLonInterface);
    const turnEndBearing = NavMath.normalizeHeading(turnStartBearing + (toCourse - fromCourse));
    const turnEndPoint = turnCenterPoint.offset(turnEndBearing, radiusRad, TurnToCourseBuilder.geoPointCache[2]);

    if (turnEndPoint.equals(start as LatLonInterface)) {
      return 0;
    }

    return this.circleVectorBuilder.build(
      vectors, index,
      direction, radius,
      turnCenterPoint, start, turnEndPoint,
      flags
    );
  }
}

/**
 * Builds great-circle paths to intercept other geo circles.
 */
export class CircleInterceptBuilder {
  private static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];
  private static readonly intersectionCache = [new Float64Array(3), new Float64Array(3)];

  private readonly greatCircleBuilder = new GreatCircleBuilder();
  private readonly circleVectorBuilder = new CircleVectorBuilder();

  /**
   * Builds a sequence of vectors representing a great-circle path from a defined start point to an intersection with
   * another geo circle.
   * @param vectors The flight path vector sequence to which to add the vectors.
   * @param index The index in the sequence at which to add the vectors.
   * @param start The start point.
   * @param course The initial true course bearing.
   * @param circle The circle to intercept.
   * @param flags The flags to set on the vector. Defaults to none (0).
   * @returns The number of vectors added to the sequence.
   */
  public build(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    course: number,
    circle: GeoCircle,
    flags?: number
  ): number;
  /**
   * Builds a sequence of vectors representing a path from a defined start point to an intersection with another geo
   * circle.
   * @param vectors The flight path vector sequence to which to add the vectors.
   * @param index The index in the sequence at which to add the vectors.
   * @param start The start point.
   * @param startPath The initial path.
   * @param circle The circle to intercept.
   * @param flags The flags to set on the vector. Defaults to none (0).
   * @returns The number of vectors added to the sequence.
   * @throws Error if `start` does not lie on `startPath`.
   */
  public build(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    startPath: GeoCircle,
    circle: GeoCircle,
    flags?: number
  ): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public build(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    pathArg: number | GeoCircle,
    circle: GeoCircle,
    flags = 0
  ): number {
    if (circle.includes(start)) {
      return 0;
    }

    let startPath;
    if (pathArg instanceof GeoCircle) {
      if (!pathArg.includes(start)) {
        throw new Error('CircleInterceptBuilder: the starting point does not lie on the starting path.');
      }

      startPath = pathArg;
    } else {
      startPath = CircleInterceptBuilder.geoCircleCache[0].setAsGreatCircle(start, pathArg);
    }

    const intersections = CircleInterceptBuilder.intersectionCache;
    const numIntersections = startPath.intersection(circle, intersections);
    if (numIntersections === 0) {
      return 0;
    }

    const intersectionIndex = (numIntersections === 1 || circle.encircles(start)) ? 0 : 1;
    const endVec = intersections[intersectionIndex];

    return startPath.isGreatCircle()
      ? this.greatCircleBuilder.build(vectors, index, start, startPath, endVec, flags)
      : this.circleVectorBuilder.build(vectors, index, startPath, start, endVec, flags);
  }
}

/**
 * Builds constant-radius turns to join great-circle paths.
 */
export class TurnToJoinGreatCircleBuilder {
  private static readonly vec3Cache = [new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3)];
  private static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0)];

  private readonly circleVectorBuilder = new CircleVectorBuilder();

  /**
   * Builds an arc representing a turn from a defined start point and initial course toward a defined target great-
   * circle path, ending at the point in the turn circle which is closest to the target path.
   * @param vectors The flight path vector sequence to which to add the vectors.
   * @param index The index in the sequence at which to add the vectors.
   * @param start The start point.
   * @param startCourse The initial true course bearing.
   * @param endPath The great-circle path defining the target course.
   * @param radius The radius of the turn, in meters.
   * @param flags The flags to set on the turn vector. Defaults to the `TurnToCourse` flag.
   * @returns The number of vectors added to the sequence, which is always equal to 1.
   * @throws Error if `endPath` is not a great circle.
   */
  public build(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    startCourse: number,
    endPath: GeoCircle,
    radius: number,
    flags?: number
  ): 1;
  /**
   * Builds an arc representing a turn from a defined start point and initial course toward a defined target great-
   * circle path, ending at the point in the turn circle which is closest to the target path.
   * @param vectors The flight path vector sequence to which to add the vectors.
   * @param index The index in the sequence at which to add the vectors.
   * @param start The start point.
   * @param startPath The great-circle path defining the initial course.
   * @param endPath The great-circle path defining the target course.
   * @param radius The radius of the turn, in meters.
   * @param flags The flags to set on the turn vector. Defaults to the `TurnToCourse` flag.
   * @returns The number of vectors added to the sequence, which is always equal to 1.
   * @throws Error if `startPath` or `endPath` is not a great circle, or if `start` does not lie on `startPath`.
   */
  public build(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    startPath: GeoCircle,
    endPath: GeoCircle,
    radius: number,
    flags?: number
  ): 1;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public build(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    startPathArg: GeoCircle | number,
    endPath: GeoCircle,
    radius: number,
    flags = FlightPathVectorFlags.TurnToCourse
  ): 1 {
    if (!endPath.isGreatCircle()) {
      throw new Error(`TurnToJoinPathBuilder: expected GeoCircle radius of pi / 2; instead was ${endPath.radius}`);
    }

    let startPath;
    if (startPathArg instanceof GeoCircle) {
      if (!startPathArg.isGreatCircle()) {
        throw new Error(`TurnToJoinPathBuilder: expected GeoCircle radius of pi / 2; instead was ${startPathArg.radius}`);
      } else if (!startPathArg.includes(start)) {
        throw new Error('TurnToJoinPathBuilder: the starting point does not lie on the starting path.');
      }

      startPath = startPathArg;
    } else {
      startPath = TurnToJoinGreatCircleBuilder.geoCircleCache[0].setAsGreatCircle(start, startPathArg);
    }

    if (!(start instanceof Float64Array)) {
      start = GeoPoint.sphericalToCartesian(start as LatLonInterface, TurnToJoinGreatCircleBuilder.vec3Cache[0]);
    }

    const turnDirection = endPath.encircles(start) ? 'left' : 'right';
    const radiusRad = turnDirection === 'left'
      ? UnitType.METER.convertTo(radius, UnitType.GA_RADIAN)
      : Math.PI - UnitType.METER.convertTo(radius, UnitType.GA_RADIAN);

    const turnStartToCenterNormal = Vec3Math.cross(start, startPath.center, TurnToJoinGreatCircleBuilder.vec3Cache[1]);
    const turnStartToCenterPath = TurnToJoinGreatCircleBuilder.geoCircleCache[1].set(turnStartToCenterNormal, Math.PI / 2);
    const turnCenter = turnStartToCenterPath.offsetDistanceAlong(start, radiusRad, TurnToJoinGreatCircleBuilder.vec3Cache[2]);

    const turnCircle = TurnToJoinGreatCircleBuilder.geoCircleCache[1].set(turnCenter, radiusRad);
    const end = turnCircle.closest(
      Vec3Math.multScalar(endPath.center, turnDirection === 'left' ? -1 : 1, TurnToJoinGreatCircleBuilder.vec3Cache[3]),
      TurnToJoinGreatCircleBuilder.vec3Cache[1]
    );

    return this.circleVectorBuilder.build(
      vectors, index,
      turnCircle, start, end,
      flags
    );
  }
}

/**
 * Builds paths to connect two geo circles.
 */
export class ConnectCirclesBuilder {
  private static readonly vec3Cache = [
    new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3),
    new Float64Array(3), new Float64Array(3), new Float64Array(3)
  ];
  private static readonly geoCircleCache = [
    new GeoCircle(new Float64Array(3), 0),
    new GeoCircle(new Float64Array(3), 0),
    new GeoCircle(new Float64Array(3), 0),
    new GeoCircle(new Float64Array(3), 0),
    new GeoCircle(new Float64Array(3), 0)
  ];
  private static readonly intersectionCache = [new Float64Array(3), new Float64Array(3)];

  private readonly circleVectorBuilder = new CircleVectorBuilder();

  /**
   * Builds a sequence of vectors representing a path which consists of a single geo circle which connects two other
   * circles and optionally paths to link the connecting circle with a start point on the from circle and an end point
   * on the to circle.
   * @param vectors The flight path vector sequence to which to add the vectors.
   * @param index The index in the sequence at which to add the vectors.
   * @param fromCircle The circle from which to add the connecting circle.
   * @param toCircle The circle to which to add the connecting circle.
   * @param radius The radius, in meters, of the circle to join the two circles. If not defined, defaults to pi / 2
   * times the radius of the Earth (and therefore the connecting circle will be a great circle).
   * @param from The starting point along `fromCircle`. If not defined, this will be assumed to be equal to the
   * point where the connecting circle meets `fromCircle`.
   * @param to The ending point along `toCircle`. If not defined, this will be assumed to be equal to the point where
   * the connecting circle meets `toCircle`.
   * @param fromCircleVectorFlags The flags to set on the vector along `fromCircle`. Defaults to none (0).
   * @param toCircleVectorFlags The flags to set on the vector along the `toCircle`. Defaults to none (0).
   * @param connectVectorFlags The flags to set on the vector connecting `fromCircle` to `toCircle`. Defaults to none
   * (0).
   * @returns The number of vectors added to the sequence.
   */
  public build(
    vectors: FlightPathVector[],
    index: number,
    fromCircle: GeoCircle,
    toCircle: GeoCircle,
    radius?: number,
    from?: ReadonlyFloat64Array | LatLonInterface,
    to?: ReadonlyFloat64Array | LatLonInterface,
    fromCircleVectorFlags = 0,
    toCircleVectorFlags = 0,
    connectVectorFlags = 0
  ): number {
    if (radius === 0) {
      return 0;
    }

    const angle = Math.acos(Vec3Math.dot(fromCircle.center, toCircle.center));
    if (
      (angle <= GeoPoint.EQUALITY_TOLERANCE && fromCircle.radius === toCircle.radius)
      || (Math.PI - angle <= GeoPoint.EQUALITY_TOLERANCE && Math.PI - fromCircle.radius - toCircle.radius <= GeoPoint.EQUALITY_TOLERANCE)
    ) {
      return 0;
    }

    if (from && !(from instanceof Float64Array)) {
      from = GeoPoint.sphericalToCartesian(from as LatLonInterface, ConnectCirclesBuilder.vec3Cache[0]);
    }
    if (to && !(to instanceof Float64Array)) {
      to = GeoPoint.sphericalToCartesian(to as LatLonInterface, ConnectCirclesBuilder.vec3Cache[1]);
    }

    const radiusRad = Math.min(Math.PI / 2, radius ? UnitType.METER.convertTo(radius, UnitType.GA_RADIAN) : Infinity);
    const joinCircle = this.findCircleToJoinCircles(
      fromCircle, toCircle,
      radiusRad, ConnectCirclesBuilder.geoCircleCache[0],
      from, to
    );

    if (!joinCircle) {
      return 0;
    }

    let vectorIndex = index;

    const joinStart = joinCircle.closest(
      FlightPathUtils.getTurnCenterFromCircle(fromCircle, ConnectCirclesBuilder.vec3Cache[2]),
      ConnectCirclesBuilder.vec3Cache[2]
    );
    const joinEnd = joinCircle.closest(
      FlightPathUtils.getTurnCenterFromCircle(toCircle, ConnectCirclesBuilder.vec3Cache[3]),
      ConnectCirclesBuilder.vec3Cache[3]
    );

    if (from && Math.acos(Vec3Math.dot(from, joinStart)) > GeoPoint.EQUALITY_TOLERANCE) {
      vectorIndex += this.circleVectorBuilder.build(vectors, vectorIndex, fromCircle, from, joinStart, fromCircleVectorFlags);
    }

    vectorIndex += this.circleVectorBuilder.build(vectors, vectorIndex, joinCircle, joinStart, joinEnd, connectVectorFlags);

    if (to && Math.acos(Vec3Math.dot(to, joinEnd)) > GeoPoint.EQUALITY_TOLERANCE) {
      vectorIndex += this.circleVectorBuilder.build(vectors, vectorIndex, toCircle, joinEnd, to, toCircleVectorFlags);
    }

    return vectorIndex - index;
  }

  /**
   * Finds a GeoCircle which connects (is tangent to) two other circles.
   * @param fromCircle The circle at the beginning of the connecting circle.
   * @param toCircle The circle at the end of the connecting circle.
   * @param radius The desired radius of the connecting circle, in great-arc radians.
   * @param out A GeoCircle object to which to write the result.
   * @param from The starting point along `fromCircle`. If not defined, this will be assumed to be equal to the
   * point where the connecting circle meets `fromCircle`.
   * @param to The ending point along `toCircle`. If not defined, this will be assumed to be equal to the point where
   * the connecting circle meets `toCircle`.
   * @returns a GeoCircle which connects the two circles, or null if one could not be found.
   */
  private findCircleToJoinCircles(
    fromCircle: GeoCircle,
    toCircle: GeoCircle,
    radius: number,
    out: GeoCircle,
    from?: ReadonlyFloat64Array,
    to?: ReadonlyFloat64Array
  ): GeoCircle | null {
    /*
     * Theory: the locus of all centers of circle of radius r tangent to circle with center C and radius R is
     * equivalent to the set of circles S(C) with center C and positive radius |r +/- R|. If we further restrict the
     * set of tangent circles to those where both the original and tangent circle run in the same direction at the
     * tangent point, the locus of centers can be further reduced to the single circle Sd(C) with center C and
     * positive radius |r - R|. Therefore, to find the centers of the circles of radius r connecting the circles C1 and
     * C2, we need only find the intersections of Sd(C1) and Sd(C2).
     */

    const solutions: GeoCircle[] = [];
    const intersections = ConnectCirclesBuilder.intersectionCache;

    const leftTurnRadius = radius;
    let fromCircleOffsetRadius = Math.abs(leftTurnRadius - fromCircle.radius);
    let toCircleOffsetRadius = Math.abs(leftTurnRadius - toCircle.radius);
    let fromCircleOffset = ConnectCirclesBuilder.geoCircleCache[1].set(fromCircle.center, fromCircleOffsetRadius);
    let toCircleOffset = ConnectCirclesBuilder.geoCircleCache[2].set(toCircle.center, toCircleOffsetRadius);
    const numLeftTurnSolutions = fromCircleOffset.intersection(toCircleOffset, intersections);

    if (numLeftTurnSolutions === 1) {
      solutions.push(ConnectCirclesBuilder.geoCircleCache[1].set(intersections[0], leftTurnRadius));
    } else if (numLeftTurnSolutions === 2) {
      solutions.push(ConnectCirclesBuilder.geoCircleCache[1].set(intersections[0], leftTurnRadius));
      solutions.push(ConnectCirclesBuilder.geoCircleCache[2].set(intersections[1], leftTurnRadius));
    }

    if (radius !== Math.PI / 2) {
      const rightTurnRadius = Math.PI - radius;
      fromCircleOffsetRadius = Math.abs(rightTurnRadius - fromCircle.radius);
      toCircleOffsetRadius = Math.abs(rightTurnRadius - toCircle.radius);
      fromCircleOffset = ConnectCirclesBuilder.geoCircleCache[3].set(fromCircle.center, fromCircleOffsetRadius);
      toCircleOffset = ConnectCirclesBuilder.geoCircleCache[4].set(toCircle.center, toCircleOffsetRadius);
      const numRightTurnSolutions = fromCircleOffset.intersection(toCircleOffset, intersections);

      if (numRightTurnSolutions === 1) {
        solutions.push(ConnectCirclesBuilder.geoCircleCache[3].set(intersections[0], rightTurnRadius));
      } else if (numRightTurnSolutions === 2) {
        solutions.push(ConnectCirclesBuilder.geoCircleCache[3].set(intersections[0], rightTurnRadius));
        solutions.push(ConnectCirclesBuilder.geoCircleCache[4].set(intersections[1], rightTurnRadius));
      }
    }

    if (solutions.length === 0) {
      return null;
    } else if (solutions.length === 1) {
      return out.set(solutions[0].center, solutions[0].radius);
    } else {
      // choose the solution that results in the shortest path from fromVec to toVec
      let circle = solutions[0];
      let minDistance = this.calculateJoinCirclesPathDistance(fromCircle, toCircle, solutions[0], from, to);
      for (let i = 1; i < solutions.length; i++) {
        const distance = this.calculateJoinCirclesPathDistance(fromCircle, toCircle, solutions[i], from, to);
        if (distance < minDistance) {
          circle = solutions[i];
          minDistance = distance;
        }
      }

      return out.set(circle.center, circle.radius);
    }
  }

  /**
   * Calculates the total distance along the joining path between two circles.
   * @param fromCircle The circle at the beginning of the connecting circle.
   * @param toCircle The circle at the end of the connecting circle.
   * @param joinCircle The connecting circle.
   * @param from The starting point along `fromCircle`. If not defined, this will be assumed to be equal to the
   * point where the connecting circle meets `fromCircle`.
   * @param to The ending point along `toCircle`. If not defined, this will be assumed to be equal to the point where
   * the connecting circle meets `toCircle`.
   * @returns the total distance along the joining path, in great-arc radians.
   */
  private calculateJoinCirclesPathDistance(
    fromCircle: GeoCircle,
    toCircle: GeoCircle,
    joinCircle: GeoCircle,
    from?: ReadonlyFloat64Array,
    to?: ReadonlyFloat64Array
  ): number {
    let distance = 0;

    const joinStartVec = joinCircle.closest(
      FlightPathUtils.getTurnCenterFromCircle(fromCircle, ConnectCirclesBuilder.vec3Cache[6]),
      ConnectCirclesBuilder.vec3Cache[6]
    );
    const joinEndVec = joinCircle.closest(
      FlightPathUtils.getTurnCenterFromCircle(toCircle, ConnectCirclesBuilder.vec3Cache[7]),
      ConnectCirclesBuilder.vec3Cache[7]
    );

    if (from) {
      distance += fromCircle.distanceAlong(from, joinStartVec, Math.PI);
    }

    distance += joinCircle.distanceAlong(joinStartVec, joinEndVec, Math.PI);

    if (to) {
      distance += toCircle.distanceAlong(joinEndVec, to, Math.PI);
    }

    return distance;
  }
}

/**
 * Builds paths connecting initial great circle paths to final great circle paths via a turn starting at the start
 * point and a turn ending at the end point, connected by a great-circle path.
 */
export class TurnToJoinGreatCircleAtPointBuilder {
  private static readonly vec3Cache = [new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3)];
  private static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0)];

  private readonly connectCirclesBuilder = new ConnectCirclesBuilder();

  /**
   * Builds a sequence of vectors representing a path from a defined start point and initial course which turns and
   * connects with another turn via a great-circle path to terminate at a defined end point and final course.
   * @param vectors The flight path vector sequence to which to add the vectors.
   * @param index The index in the sequence at which to add the vectors.
   * @param start The start point.
   * @param startPath The great-circle path defining the initial course.
   * @param startTurnRadius The radius of the initial turn, in meters.
   * @param startTurnDirection The direction of the initial turn.
   * @param end The end point.
   * @param endPath The great-circle path defining the final course.
   * @param endTurnRadius The radius of the final turn, in meters.
   * @param endTurnDirection The direction of the final turn.
   * @param startTurnVectorFlags The flags to set on the initial turn vector. Defaults to none (0).
   * @param endTurnVectorFlags The flags to set on the final turn vector. Defaults to none (0).
   * @param connectVectorFlags The flags to set on the vector along the great-circle path connecting the turns.
   * Defaults to none (0).
   * @returns The number of vectors added to the sequence.
   */
  public build(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    startPath: GeoCircle,
    startTurnRadius: number,
    startTurnDirection: VectorTurnDirection,
    end: ReadonlyFloat64Array | LatLonInterface,
    endPath: GeoCircle,
    endTurnRadius: number,
    endTurnDirection: VectorTurnDirection,
    startTurnVectorFlags = 0,
    endTurnVectorFlags = 0,
    connectVectorFlags = 0
  ): number {
    if (!(start instanceof Float64Array)) {
      start = GeoPoint.sphericalToCartesian(start as LatLonInterface, TurnToJoinGreatCircleAtPointBuilder.vec3Cache[0]);
    }
    if (!(end instanceof Float64Array)) {
      end = GeoPoint.sphericalToCartesian(end as LatLonInterface, TurnToJoinGreatCircleAtPointBuilder.vec3Cache[1]);
    }

    const startTurnRadiusRad = UnitType.METER.convertTo(startTurnRadius, UnitType.GA_RADIAN);
    const startTurnOffsetPath = TurnToJoinGreatCircleAtPointBuilder.geoCircleCache[0].setAsGreatCircle(start, startPath.center);
    const startTurnCircleRadiusRad = startTurnDirection === 'left' ? startTurnRadiusRad : Math.PI - startTurnRadiusRad;
    const startTurnCircleCenter = startTurnOffsetPath.offsetDistanceAlong(start, startTurnCircleRadiusRad, TurnToJoinGreatCircleAtPointBuilder.vec3Cache[3]);
    const startTurnCircle = TurnToJoinGreatCircleAtPointBuilder.geoCircleCache[0].set(startTurnCircleCenter, startTurnCircleRadiusRad);

    const endTurnRadiusRad = UnitType.METER.convertTo(endTurnRadius, UnitType.GA_RADIAN);
    const endTurnOffsetPath = TurnToJoinGreatCircleAtPointBuilder.geoCircleCache[1].setAsGreatCircle(end, endPath.center);
    const endTurnCircleRadiusRad = endTurnDirection === 'left' ? endTurnRadiusRad : Math.PI - endTurnRadiusRad;
    const endTurnCircleCenter = endTurnOffsetPath.offsetDistanceAlong(end, endTurnCircleRadiusRad, TurnToJoinGreatCircleAtPointBuilder.vec3Cache[3]);
    const endTurnCircle = TurnToJoinGreatCircleAtPointBuilder.geoCircleCache[1].set(endTurnCircleCenter, endTurnCircleRadiusRad);

    return this.connectCirclesBuilder.build(vectors, index, startTurnCircle, endTurnCircle, undefined, start, end, startTurnVectorFlags, endTurnVectorFlags, connectVectorFlags);
  }
}

/**
 * Builds paths connecting initial great-circle paths to final great-circle paths via a turn starting at the start
 * point followed by an angled intercept path which intercepts the final path before the end point.
 */
export class InterceptGreatCircleToPointBuilder {
  private static readonly vec3Cache = [
    new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3)
  ];
  private static readonly geoCircleCache = [
    new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0)
  ];
  private static readonly intersectionCache = [new Float64Array(3), new Float64Array(3)];

  private readonly circleVectorBuilder = new CircleVectorBuilder();
  private readonly turnToJoinGreatCircleBuilder = new TurnToJoinGreatCircleBuilder();

  /**
   * Builds a sequence of vectors representing a path from a defined start point and initial course which turns and
   * intercepts a final course at a specified angle using a great-circle path. Optionally includes a final turn from
   * the intercept path to the final course.
   *
   * If an intercept angle greater than the minimum angle is required to intercept the final course before the end
   * point, no vectors will be calculated.
   *
   * If the initial and final courses are parallel, no vectors will be calculated.
   * @param vectors The flight path vector sequence to which to add the vectors.
   * @param index The index in the sequence at which to add the vectors.
   * @param start The start point.
   * @param startPath The great-circle path defining the initial course.
   * @param startTurnRadius The radius of the initial turn, in meters.
   * @param startTurnDirection The direction of the initial turn. If not defined, the direction of the initial turn
   * will be automatically selected.
   * @param interceptAngle The angle at which to intercept the final path, in degrees. Will be clamped to the range
   * `[0, 90]`.
   * @param end The end point.
   * @param endPath The great-circle path defining the final course.
   * @param endTurnRadius The radius of the final turn, in meters, or `undefined` if a turn to join the final path
   * should not be calculated.
   * @param startTurnVectorFlags The flags to set on the initial turn vector. Defaults to none (0).
   * @param interceptVectorFlags The flags to set on the vector along the intercept path. Defaults to none (0).
   * @param endTurnVectorFlags The flags to set on the final turn vector. Defaults to none (0). Ignored if a turn to
   * join the final path is not calculated.
   * @returns The number of vectors added to the sequence.
   */
  public build(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    startPath: GeoCircle,
    startTurnRadius: number,
    startTurnDirection: VectorTurnDirection | undefined,
    interceptAngle: number,
    end: ReadonlyFloat64Array | LatLonInterface,
    endPath: GeoCircle,
    endTurnRadius?: number,
    startTurnVectorFlags = 0,
    interceptVectorFlags = 0,
    endTurnVectorFlags = 0
  ): number {
    if (!(start instanceof Float64Array)) {
      start = GeoPoint.sphericalToCartesian(start as LatLonInterface, InterceptGreatCircleToPointBuilder.vec3Cache[0]);
    }
    if (!(end instanceof Float64Array)) {
      end = GeoPoint.sphericalToCartesian(end as LatLonInterface, InterceptGreatCircleToPointBuilder.vec3Cache[1]);
    }

    if (Math.acos(Vec3Math.dot(startPath.center, endPath.center)) <= GeoCircle.ANGULAR_TOLERANCE) {
      // initial and final paths are parallel
      return 0;
    }

    const intersections = InterceptGreatCircleToPointBuilder.intersectionCache;

    const interceptAngleRad = MathUtils.clamp(interceptAngle * Avionics.Utils.DEG2RAD, 0, MathUtils.HALF_PI);
    // The set of centers of great circles that intersect the end path at the desired intercept angle
    const interceptPathCenters = InterceptGreatCircleToPointBuilder.geoCircleCache[1].set(endPath.center, interceptAngleRad);

    const startTurnRadiusRad = UnitType.METER.convertTo(startTurnRadius, UnitType.GA_RADIAN);
    if (startTurnDirection === undefined) {
      let target: ReadonlyFloat64Array;

      // Calculate the intercept point if the intercept path were to pass through the start point.
      const interceptCount = interceptPathCenters.intersection(
        InterceptGreatCircleToPointBuilder.geoCircleCache[0].set(start, MathUtils.HALF_PI),
        intersections
      );

      if (interceptCount === 0) {
        // No great-circle path passing through the start point can intercept the final path at the desired intercept angle.
        target = end;
      } else {
        target = Vec3Math.cross(
          intersections[0], endPath.center,
          InterceptGreatCircleToPointBuilder.vec3Cache[2]
        );
      }

      startTurnDirection = startPath.encircles(target) ? 'left' : 'right';
    }

    const startTurnCircle = FlightPathUtils.getTurnCircleStartingFromPath(
      start, startPath,
      startTurnRadiusRad,
      startTurnDirection,
      InterceptGreatCircleToPointBuilder.geoCircleCache[0]
    );

    const endTurnRadiusRad = endTurnRadius === undefined ? undefined : UnitType.METER.convertTo(endTurnRadius, UnitType.GA_RADIAN);

    if (interceptAngleRad <= GeoCircle.ANGULAR_TOLERANCE) {
      // If the desired intercept angle is 0 degrees, the only valid path is when the starting turn ends exactly on the
      // path to intercept and the end of the turn lies before the end point

      if (Math.abs(GeoPoint.distance(startTurnCircle.center, endPath.center) - Math.abs(MathUtils.HALF_PI - startTurnCircle.radius)) > GeoCircle.ANGULAR_TOLERANCE) {
        // starting turn is not tangent to path to intercept
        return 0;
      }

      const startTurnEnd = endPath.closest(
        startTurnCircle.closest(endPath.center, InterceptGreatCircleToPointBuilder.vec3Cache[2]),
        InterceptGreatCircleToPointBuilder.vec3Cache[2]
      );

      const startTurnEndToEndDistance = endPath.angleAlong(startTurnEnd, end, Math.PI);

      if (startTurnEndToEndDistance < MathUtils.TWO_PI - GeoCircle.ANGULAR_TOLERANCE && startTurnEndToEndDistance > Math.PI + GeoCircle.ANGULAR_TOLERANCE) {
        // the end of the starting turn lies after the end point.
        return 0;
      }

      return this.circleVectorBuilder.build(
        vectors, index,
        startTurnCircle,
        start, startTurnEnd,
        startTurnVectorFlags
      );
    }

    // Find the great-circle path that intersects the path to intercept at the desired intercept angle and is tangent
    // to the starting turn.

    // The set of centers of great circles that are tangent to the starting turn
    const startTurnInterceptTangentCenters = InterceptGreatCircleToPointBuilder.geoCircleCache[2].set(
      startTurnCircle.center, Math.abs(MathUtils.HALF_PI - startTurnRadiusRad)
    );

    const interceptPathCount = interceptPathCenters.intersection(startTurnInterceptTangentCenters, intersections);

    if (interceptPathCount === 0) {
      return 0;
    }

    // The start turn is considered to overshoot if any part of the turn circle lies on the contralateral side of the
    // final path. The contralateral side is defined as the right side for left turns and the left side for right turns.
    // If the start turn overshoots, then the desired intercept path will intercept the final path from the contralateral side.
    const doesStartTurnOvershoot = endPath.distance(startTurnCircle.center) > -startTurnCircle.radius + GeoCircle.ANGULAR_TOLERANCE;

    const interceptPath = InterceptGreatCircleToPointBuilder.geoCircleCache[1].set(
      intersections[interceptPathCount === 1 || !doesStartTurnOvershoot ? 0 : 1],
      MathUtils.HALF_PI
    );

    const startTurnEnd = interceptPath.closest(
      startTurnCircle.closest(interceptPath.center, InterceptGreatCircleToPointBuilder.vec3Cache[2]),
      InterceptGreatCircleToPointBuilder.vec3Cache[2]
    );

    const intercept = Vec3Math.multScalar(
      Vec3Math.normalize(
        Vec3Math.cross(interceptPath.center, endPath.center, InterceptGreatCircleToPointBuilder.vec3Cache[3]),
        InterceptGreatCircleToPointBuilder.vec3Cache[3]
      ),
      doesStartTurnOvershoot === (startTurnDirection === 'right') ? 1 : -1,
      InterceptGreatCircleToPointBuilder.vec3Cache[3]
    );

    const interceptDistance = interceptPath.distanceAlong(startTurnEnd, intercept, Math.PI, GeoCircle.ANGULAR_TOLERANCE);

    // Required turn anticipation for the end turn to join the intercept and final paths.
    let minDInterceptEnd = 0;
    if (endTurnRadiusRad !== undefined) {
      const endTheta = Math.PI - interceptAngleRad;
      minDInterceptEnd = Math.asin(Math.tan(endTurnRadiusRad) / Math.tan(endTheta / 2));

      if (isNaN(minDInterceptEnd)) {
        // Turn radius is too large for the end turn to join the intercept and final paths
        return 0;
      }
    }

    const interceptToEndDistance = endPath.distanceAlong(intercept, end, Math.PI, GeoCircle.ANGULAR_TOLERANCE);
    const interceptToEndOffset = (interceptToEndDistance + Math.PI) % MathUtils.TWO_PI - Math.PI;

    if (interceptToEndOffset < minDInterceptEnd) {
      // The intercept path does not intercept the final path early enough to make the end turn before the end point
      return 0;
    }

    let vectorIndex = index;

    if (interceptDistance < minDInterceptEnd || interceptDistance > Math.PI + GeoCircle.ANGULAR_TOLERANCE) {
      // The start turn ends too late to make a turn to join the final path or the start turn overshoots the end path
      // before reaching the intercept course -> attempt to end the start turn early

      if (endTurnRadiusRad === undefined) {
        // We don't need to calculate a final turn, so attempt to end the start turn where it intersects the end path

        const startTurnEndPathIntersectionCount = startTurnCircle.intersection(endPath, intersections);

        if (startTurnEndPathIntersectionCount === 0) {
          return 0;
        }

        const startTurnEndPathIntersection = intersections[startTurnEndPathIntersectionCount === 1 || startTurnDirection === 'right' ? 0 : 1];

        if (endPath.distanceAlong(startTurnEndPathIntersection, end, Math.PI, GeoCircle.ANGULAR_TOLERANCE) > Math.PI + GeoCircle.ANGULAR_TOLERANCE) {
          // The start turn intercepts the final path after the end point
          return 0;
        }

        vectorIndex += this.circleVectorBuilder.build(
          vectors, vectorIndex,
          startTurnCircle,
          start, startTurnEndPathIntersection,
          startTurnVectorFlags
        );
      } else {
        // We need to calculate a final turn to join the end path. This final turn must be tangent to the starting turn
        // and the end path.

        const startTurnCenter = FlightPathUtils.getTurnCenterFromCircle(startTurnCircle, InterceptGreatCircleToPointBuilder.vec3Cache[4]);
        // The set of centers of all geo circles of the desired end turn radius that are tangent to the starting turn
        const startTurnEndTurnTangentCenters = InterceptGreatCircleToPointBuilder.geoCircleCache[1].set(
          startTurnCenter,
          startTurnRadiusRad + endTurnRadiusRad
        );
        // The set of centers of all geo circles of the desried end turn radius that are tangent to the end path
        const endPathEndTurnTangentCenters = InterceptGreatCircleToPointBuilder.geoCircleCache[2].set(
          endPath.center,
          endPath.radius + endTurnRadiusRad * (startTurnDirection === 'left' ? 1 : -1)
        );

        const endTurnCircleCount = endPathEndTurnTangentCenters.intersection(startTurnEndTurnTangentCenters, intersections);

        if (endTurnCircleCount === 0) {
          return 0;
        }

        const endTurnCenter = intersections[0];

        const endTurnCircle = FlightPathUtils.getTurnCircle(
          endTurnCenter,
          endTurnRadiusRad,
          startTurnDirection === 'left' ? 'right' : 'left',
          InterceptGreatCircleToPointBuilder.geoCircleCache[1]
        );

        endTurnCircle.closest(startTurnCenter, startTurnEnd);

        const endTurnEnd = endPath.closest(endTurnCenter, InterceptGreatCircleToPointBuilder.vec3Cache[4]);

        if (endPath.distanceAlong(endTurnEnd, end, Math.PI, GeoCircle.ANGULAR_TOLERANCE) > Math.PI + GeoCircle.ANGULAR_TOLERANCE) {
          // The end turn joins the final path after the end point
          return 0;
        }

        vectorIndex += this.circleVectorBuilder.build(
          vectors, vectorIndex,
          startTurnCircle,
          start, startTurnEnd,
          startTurnVectorFlags
        );

        vectorIndex += this.circleVectorBuilder.build(
          vectors, vectorIndex,
          endTurnCircle,
          startTurnEnd, endTurnEnd,
          endTurnVectorFlags
        );
      }
    } else {
      if (GeoPoint.distance(start, startTurnEnd) > GeoCircle.ANGULAR_TOLERANCE) {
        vectorIndex += this.circleVectorBuilder.build(
          vectors, vectorIndex,
          startTurnCircle,
          start, startTurnEnd,
          startTurnVectorFlags
        );
      }

      let interceptPathEnd = intercept;

      if (endTurnRadiusRad !== undefined) {
        interceptPathEnd = interceptPath.offsetDistanceAlong(
          intercept,
          -minDInterceptEnd,
          InterceptGreatCircleToPointBuilder.vec3Cache[4],
          Math.PI
        );
      }

      if (interceptDistance - minDInterceptEnd > GeoCircle.ANGULAR_TOLERANCE) {
        vectorIndex += this.circleVectorBuilder.build(
          vectors, vectorIndex,
          interceptPath,
          startTurnEnd, interceptPathEnd,
          interceptVectorFlags
        );
      }

      if (endTurnRadius !== undefined) {
        vectorIndex += this.turnToJoinGreatCircleBuilder.build(
          vectors, vectorIndex,
          interceptPathEnd,
          interceptPath,
          endPath,
          endTurnRadius,
          endTurnVectorFlags
        );
      }
    }

    return vectorIndex - index;
  }
}

/**
 * Builds paths connecting initial great-circle paths to final great-circle paths terminating at defined end points.
 */
export class JoinGreatCircleToPointBuilder {
  private static readonly INTERCEPT_ANGLE = 45; // degrees

  private static readonly vec3Cache = [new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3)];
  private static readonly geoCircleCache = [
    new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0),
    new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0)
  ];
  private static readonly intersectionCache = [new Float64Array(3), new Float64Array(3)];

  private readonly circleVectorBuilder = new CircleVectorBuilder();
  private readonly greatCircleBuilder = new GreatCircleBuilder();
  private readonly turnToJoinGreatCircleBuilder = new TurnToJoinGreatCircleBuilder();
  private readonly interceptGreatCircleToPointBuilder = new InterceptGreatCircleToPointBuilder();
  private readonly directToPointBuilder = new DirectToPointBuilder();

  /**
   * Builds a sequence of vectors representing a path from a defined start point and initial course which turns and
   * joins a great-circle path which terminates at a defined end point.
   *
   * This method will first attempt to connect the starting point and final path with a single constant-radius turn
   * of at least the minimum turn radius and in the desired direction that joins the final path before the end point.
   * If this is not possible, then what happens next depends on the `preferSingleTurn` argument:
   * * If it is `true`, then another path connecting the starting point and final path with a single constant-radius
   * turn will be computed - this path will respect the minimum turn radius but not necessarily the desired turn
   * direction.
   * * If it is `false`, then a path to intercept the final path at a 45-degree angle will be computed. If such a path
   * is not possible or if the intercept point lies after the end point, and `allowDirectFallback` is `true`, a direct
   * course to the end point will be computed. If `allowDirectFallback` is `false` and all attempts to compute a path
   * have failed, then no vectors will be built.
   * @param vectors The flight path vector sequence to which to add the vectors.
   * @param index The index in the sequence at which to add the vectors.
   * @param start The start point.
   * @param startPath The great-circle path defining the initial course.
   * @param end The end point.
   * @param endPath The great-circle path defining the final course.
   * @param desiredTurnDirection The desired initial turn direction. If not defined, the most efficient turn direction
   * that satisfies the constraints will be chosen.
   * @param minTurnRadius The minimum turn radius, in meters. Defaults to 0.
   * @param preferSingleTurn Whether to prefer flight path solutions that consist of a single constant-radius turn
   * from the initial to final course. Defaults to `false`.
   * @param allowDirectFallback Whether the computed path should fall back to a direct course to the end point if the
   * final path cannot be joined before the end point. Defaults to `true`.
   * @param intersection The point of intersection between the start and end paths closest to the start point. If
   * not defined, it will be calculated.
   * @param flags The flags to set on the vectors. Defaults to none (0).
   * @param includeTurnToCourseFlag Whether to include the `TurnToCourse` flag on the turn vectors. True by default.
   * @param includeDirectFlag Whether to include the `Direct` flag on vectors when falling back to a direct course.
   * Defaults to `true`.
   * @param includeInterceptFlag Whether to include the `InterceptCourse` flag on vectors when building an intercept
   * path. Defaults to `true`.
   * @returns The number of vectors added to the sequence.
   */
  public build(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    startPath: GeoCircle,
    end: ReadonlyFloat64Array | LatLonInterface,
    endPath: GeoCircle,
    desiredTurnDirection?: VectorTurnDirection,
    minTurnRadius?: number,
    preferSingleTurn = false,
    allowDirectFallback = true,
    intersection?: ReadonlyFloat64Array,
    flags = 0,
    includeTurnToCourseFlag = true,
    includeDirectFlag = true,
    includeInterceptFlag = true
  ): number {
    let vectorIndex = index;

    if (!(start instanceof Float64Array)) {
      start = GeoPoint.sphericalToCartesian(start as LatLonInterface, JoinGreatCircleToPointBuilder.vec3Cache[0]);
    }
    if (!(end instanceof Float64Array)) {
      end = GeoPoint.sphericalToCartesian(end as LatLonInterface, JoinGreatCircleToPointBuilder.vec3Cache[1]);
    }

    if (!intersection) {
      const intersections = JoinGreatCircleToPointBuilder.intersectionCache;
      const solutionCount = startPath.intersection(endPath, intersections);

      if (solutionCount === 0) {
        return 0;
      }

      // choose the intersection closest to the start point.
      intersection = Vec3Math.copy(
        Vec3Math.dot(intersections[0], start) > 0
          ? intersections[0]
          : intersections[1],
        JoinGreatCircleToPointBuilder.vec3Cache[2]
      );
    }

    const turnFlags = flags | (includeTurnToCourseFlag ? FlightPathVectorFlags.TurnToCourse : 0);

    // Calculate the relative directions of the start point, intersection point, and end point.

    const intersectionToStartDot = Vec3Math.dot(Vec3Math.cross(startPath.center, intersection, JoinGreatCircleToPointBuilder.vec3Cache[3]), start);
    // positive -> start point lies after the intersection (with respect to the direction of start path)
    const intersectionToStartSign = intersectionToStartDot < -GeoCircle.ANGULAR_TOLERANCE ? -1
      : intersectionToStartDot > GeoCircle.ANGULAR_TOLERANCE ? 1 : 0;

    const intersectionToEndDot = Vec3Math.dot(Vec3Math.cross(endPath.center, intersection, JoinGreatCircleToPointBuilder.vec3Cache[3]), end);
    // positive -> end point lies after the intersection (with respect to the direction of end path)
    const intersectionToEndSign = intersectionToEndDot < -GeoCircle.ANGULAR_TOLERANCE ? -1
      : intersectionToEndDot > GeoCircle.ANGULAR_TOLERANCE ? 1 : 0;

    const isEndForwardOfIntersection = intersectionToEndSign > 0;

    minTurnRadius ??= 0;

    const minTurnRadiusRad = UnitType.METER.convertTo(minTurnRadius, UnitType.GA_RADIAN);
    const pathDot = Vec3Math.dot(startPath.center, endPath.center);
    const theta = Math.acos(-pathDot);
    const tanHalfTheta = Math.tan(theta / 2);
    // along-track distance from the intersection point to the start/end of the minimum-radius turn from start path to end path
    let minD = Math.asin(Math.tan(minTurnRadiusRad) / tanHalfTheta);
    if (isNaN(minD)) {
      // Turn radius is too large for any turn to join the start and end paths
      minD = Infinity;
    }

    const intersectionStartDistance = intersectionToStartSign === 0 ? 0 : Math.acos(Vec3Math.dot(intersection, start));
    const intersectionEndDistance = intersectionToEndSign === 0 ? 0 : Math.acos(Vec3Math.dot(intersection, end));

    const intersectionStartOffset = intersectionToStartSign * intersectionStartDistance;
    const intersectionEndOffset = intersectionToEndSign * intersectionEndDistance;

    const towardEndPointTurnDirection = startPath.encircles(end, false) ? 'left' : 'right';

    let needCalculateTwoTurnPath = false;
    let needCalculateOneTurnPath = false;

    if (isEndForwardOfIntersection) {
      if (desiredTurnDirection === undefined || desiredTurnDirection === towardEndPointTurnDirection) {
        const isStartPastRequiredTurnStart = intersectionStartOffset > -minD;
        const isEndBeforeRequiredTurnEnd = intersectionEndOffset < minD;

        if (isStartPastRequiredTurnStart || isEndBeforeRequiredTurnEnd) {
          // The minimum turn radius is too large to intercept the final path before the end point
          needCalculateTwoTurnPath = !preferSingleTurn;
          needCalculateOneTurnPath = preferSingleTurn;
        } else {
          // Make a single constant-radius turn either starting at the start point, or ending at the end point,
          // depending on which is closer to the intersection point.
          const turnRadius = UnitType.GA_RADIAN.convertTo(Math.atan(tanHalfTheta * Math.sin(Math.min(intersectionStartDistance, intersectionEndDistance))), UnitType.METER);

          if (intersectionStartDistance <= intersectionEndDistance) {
            // start turn at start point
            vectorIndex += this.turnToJoinGreatCircleBuilder.build(vectors, vectorIndex, start, startPath, endPath, turnRadius, turnFlags);

            if (intersectionEndDistance - intersectionStartDistance > GeoCircle.ANGULAR_TOLERANCE) {
              const turnEnd = endPath.offsetDistanceAlong(intersection, intersectionStartDistance, JoinGreatCircleToPointBuilder.vec3Cache[3], Math.PI);
              vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, turnEnd, endPath, end, flags);
            }
          } else {
            // end turn at end point
            let turnStart = start;
            if (intersectionStartDistance - intersectionEndDistance > GeoCircle.ANGULAR_TOLERANCE) {
              turnStart = startPath.offsetDistanceAlong(intersection, -intersectionEndDistance, JoinGreatCircleToPointBuilder.vec3Cache[3], Math.PI);
              vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, start, startPath, turnStart, flags);
            }

            vectorIndex += this.turnToJoinGreatCircleBuilder.build(vectors, vectorIndex, turnStart, startPath, endPath, turnRadius, turnFlags);
          }
        }
      } else {
        if (pathDot >= 0) {
          // The start and end paths intersect at an angle <= 90 degrees. This means that for a turn away from the end
          // point, the total flight path distance is minimized when the turn joins the start and end paths directly.

          if (intersectionStartOffset <= minD) {
            // The start point lies at or before the required turn start point to minimize the flight path distance.
            needCalculateOneTurnPath = true;
          } else {
            needCalculateTwoTurnPath = !preferSingleTurn;
            needCalculateOneTurnPath = preferSingleTurn;
          }
        } else {
          needCalculateTwoTurnPath = !preferSingleTurn;
          needCalculateOneTurnPath = preferSingleTurn;
        }
      }
    } else {
      needCalculateTwoTurnPath = !preferSingleTurn;
      needCalculateOneTurnPath = preferSingleTurn;
    }

    let needDirectFallback = false;

    if (needCalculateTwoTurnPath) {
      const interceptFlag = includeInterceptFlag ? FlightPathVectorFlags.InterceptCourse : 0;

      // Attempt to make a turn to intercept the end path at 45 degrees
      const numInterceptVectors = this.interceptGreatCircleToPointBuilder.build(
        vectors, vectorIndex,
        start, startPath, minTurnRadius, desiredTurnDirection,
        JoinGreatCircleToPointBuilder.INTERCEPT_ANGLE,
        end, endPath, minTurnRadius,
        turnFlags | interceptFlag, flags | interceptFlag, turnFlags | interceptFlag
      );

      if (numInterceptVectors === 0) {
        needDirectFallback = allowDirectFallback;
      } else {
        vectorIndex += numInterceptVectors;

        const lastVector = vectors[vectorIndex - 1];
        const interceptEnd = GeoPoint.sphericalToCartesian(lastVector.endLat, lastVector.endLon, JoinGreatCircleToPointBuilder.vec3Cache[5]);

        if (Math.acos(Vec3Math.dot(interceptEnd, end)) > GeoCircle.ANGULAR_TOLERANCE) {
          vectorIndex += this.circleVectorBuilder.build(
            vectors, vectorIndex,
            endPath,
            interceptEnd, end,
            flags
          );
        }
      }
    } else if (needCalculateOneTurnPath) {
      // Make a single constant-radius turn from the start path to join the end path. The turn must start after the
      // intersection of the start and end paths (the only case where the turn starts before the intersection is
      // handled above).

      minD = Math.min(minD, Math.PI / 2);

      if (minD > Math.PI / 2) {
        // No amount of anticipation can provide a turn which joins the start and end paths of the desired radius.
        needDirectFallback = allowDirectFallback;
      } else {
        const minTurnEndOffset = Math.min(intersectionEndOffset, -minD);
        const turnStartOffset = Math.max(-minTurnEndOffset, intersectionStartOffset);

        const turnRadius = UnitType.GA_RADIAN.convertTo(Math.atan(tanHalfTheta * Math.sin(turnStartOffset)), UnitType.METER);

        const turnStart = startPath.offsetDistanceAlong(intersection, turnStartOffset, JoinGreatCircleToPointBuilder.vec3Cache[3]);
        if (turnStartOffset - intersectionStartOffset > GeoPoint.EQUALITY_TOLERANCE) {
          vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, start, startPath, turnStart);
        }

        vectorIndex += this.turnToJoinGreatCircleBuilder.build(vectors, vectorIndex, turnStart, startPath, endPath, turnRadius, turnFlags);

        if (intersectionEndOffset + turnStartOffset > GeoPoint.EQUALITY_TOLERANCE) {
          const turnEnd = endPath.offsetDistanceAlong(intersection, -turnStartOffset, JoinGreatCircleToPointBuilder.vec3Cache[4]);
          vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, turnEnd, endPath, end);
        }
      }
    }

    if (needDirectFallback) {
      vectorIndex += this.directToPointBuilder.build(
        vectors, vectorIndex,
        start, startPath, end,
        minTurnRadius, desiredTurnDirection,
        flags, includeTurnToCourseFlag, includeDirectFlag
      );
    }

    return vectorIndex - index;
  }
}

/**
 * Builds procedure turns.
 */
export class ProcedureTurnBuilder {
  private static readonly vec3Cache = [new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3)];
  private static readonly geoPointCache = [
    new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0),
    new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)
  ];
  private static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];
  private static readonly intersectionCache = [new Float64Array(3), new Float64Array(3)];

  private readonly greatCircleBuilder = new GreatCircleBuilder();
  private readonly circleVectorBuilder = new CircleVectorBuilder();

  /**
   * Builds a sequence of vectors representing a procedure turn from a defined starting point and initial course to a
   * defined end point and final course. A procedure turn begins with a variable-length leg from the start point along
   * the initial course followed by an initial turn to intercept the outbound leg of the procedure turn, then a
   * variable-length outbound leg, a 180-degree turn, a variable-length inbound leg, and finally a turn to intercept
   * the final course at the end point. If a full set of vectors cannot be computed given the restraints imposed by the
   * path geometry and the desired turn radius, parts of the turn beginning with the inbound leg of the procedure turn
   * may be altered or omitted entirely.
   * @param vectors The flight path vector sequence to which to add the vectors.
   * @param index The index in the sequence at which to add the vectors.
   * @param start The start point.
   * @param startPath The great-circle path defining the initial course.
   * @param end The end point.
   * @param endPath The great-circle path defining the final course.
   * @param outboundCourse The true course, in degrees, of the outbound leg of the turn.
   * @param desiredTurnRadius The desired turn radius, in meters.
   * @param desiredTurnDirection The desired turn direction.
   * @param initialCourse The initial course. If not defined, it will be calculated from `startPath` and `start`.
   * @param finalCourse The final course. If not defined, it will be calculated from `endPath` and `end`.
   * @param flags The flags to set on the vectors. Defaults to the `CourseReversal` flag.
   * @param includeTurnToCourseFlag Whether to include the `TurnToCourse` flag on the turn vectors. True by default.
   * @returns The number of vectors added to the sequence.
   */
  public build(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    startPath: GeoCircle,
    end: ReadonlyFloat64Array | LatLonInterface,
    endPath: GeoCircle,
    outboundCourse: number,
    desiredTurnRadius: number,
    desiredTurnDirection?: VectorTurnDirection,
    initialCourse?: number,
    finalCourse?: number,
    flags = FlightPathVectorFlags.CourseReversal,
    includeTurnToCourseFlag = true
  ): number {
    let vectorIndex = index;

    if (!(start instanceof Float64Array)) {
      start = GeoPoint.sphericalToCartesian(start as LatLonInterface, ProcedureTurnBuilder.vec3Cache[0]);
    }
    if (!(end instanceof Float64Array)) {
      end = GeoPoint.sphericalToCartesian(end as LatLonInterface, ProcedureTurnBuilder.vec3Cache[1]);
    }

    /*
     * We need to calculate two parameters: (1) the distance to stay on the initial outbound segment, and (2) the
     * distance to stay on the outbound segment of the turn. We ideally would like to choose these parameters such
     * that the procedure turn ends at a location where it can immediately make another turn to intercept the next
     * leg. However, this may not be possible since we are constrained by the fact that the two distance parameters
     * cannot be negative. To simplify the math, we will do an approximated calculation based on a pseudo-Euclidean
     * geometry instead of spherical geometry. The error is proportional to the angle between the outbound path and the
     * the path to intercept; if they are exactly antiparallel the error is zero.
     */

    initialCourse ??= startPath.bearingAt(start, Math.PI);
    finalCourse ??= endPath.bearingAt(end, Math.PI);

    const startPoint = ProcedureTurnBuilder.geoPointCache[0].setFromCartesian(start);

    const initialTurnDirection = NavMath.getTurnDirection(initialCourse, outboundCourse);
    const isInitialTurnTowardEndPath = startPath.encircles(end) === (initialTurnDirection === 'left');

    const deltaOutbound = Math.abs(NavMath.diffAngle(initialCourse, outboundCourse)) * Avionics.Utils.DEG2RAD;
    const thetaOutbound = (Math.PI - deltaOutbound) / 2;
    const desiredTurnRadiusRad = UnitType.METER.convertTo(desiredTurnRadius, UnitType.GA_RADIAN);

    // If there is a desired turn direction, honor it. Otherwise choose the direction that results in the shortest path
    // to intercept the next leg.
    const turnDirection = desiredTurnDirection
      ?? (((initialTurnDirection === 'left') === deltaOutbound < Math.PI) ? 'right' : 'left');

    const endPointToStartPathXTrackDistance = Math.abs(startPath.distance(end));

    let desiredAlongTurnOutboundPathDistance = Math.abs(deltaOutbound - Math.PI / 2) > 1e-10
      ? Math.asin(Math.tan(2 * desiredTurnRadiusRad) / Math.tan(deltaOutbound)) * (turnDirection === initialTurnDirection ? -1 : 1)
      : 0;
    desiredAlongTurnOutboundPathDistance += Math.asin(Math.sin(endPointToStartPathXTrackDistance) / Math.sin(deltaOutbound))
      * (isInitialTurnTowardEndPath ? 1 : -1);
    const alongTurnOutboundPathDistance = Math.max(0, desiredAlongTurnOutboundPathDistance);

    let desiredAlongStartPathDistance = (startPath.distanceAlong(start, end, Math.PI) + Math.PI) % (2 * Math.PI) - Math.PI;
    desiredAlongStartPathDistance -= desiredAlongTurnOutboundPathDistance === 0 ? 0 : Math.atan(Math.cos(deltaOutbound) * Math.tan(desiredAlongTurnOutboundPathDistance));
    desiredAlongStartPathDistance += Math.asin(Math.sin(deltaOutbound) * Math.sin(2 * desiredTurnRadiusRad)) * (turnDirection === initialTurnDirection ? 1 : -1);
    const alongStartPathDistance = Math.max(0, desiredAlongStartPathDistance);

    const initialTurnStartPoint = alongStartPathDistance > 0
      ? startPath.offsetDistanceAlong(start, alongStartPathDistance, ProcedureTurnBuilder.geoPointCache[1])
      : startPoint;

    const initialTurnCenterPoint = initialTurnStartPoint.offset(initialCourse + (initialTurnDirection === 'left' ? -90 : 90), desiredTurnRadiusRad, ProcedureTurnBuilder.geoPointCache[2]);
    const initialTurnHalfAngularWidth = Math.acos(Math.sin(thetaOutbound) * Math.cos(desiredTurnRadiusRad)) * Avionics.Utils.RAD2DEG;
    const initialTurnStartBearing = initialTurnCenterPoint.bearingTo(initialTurnStartPoint);
    const initialTurnEndBearing = NavMath.normalizeHeading(initialTurnStartBearing + initialTurnHalfAngularWidth * 2 * (initialTurnDirection === 'left' ? -1 : 1));
    const initialTurnEndPoint = initialTurnCenterPoint.offset(initialTurnEndBearing, desiredTurnRadiusRad, ProcedureTurnBuilder.geoPointCache[3]);

    const turnStartPoint = alongTurnOutboundPathDistance > 0
      ? initialTurnEndPoint.offset(outboundCourse, alongTurnOutboundPathDistance, ProcedureTurnBuilder.geoPointCache[4])
      : initialTurnEndPoint;

    const turnCenterPoint = turnStartPoint.offset(outboundCourse + (turnDirection === 'left' ? -90 : 90), desiredTurnRadiusRad, ProcedureTurnBuilder.geoPointCache[5]);
    const turnStartBearing = turnCenterPoint.bearingTo(turnStartPoint);
    let turnEndBearing = NavMath.normalizeHeading(turnStartBearing + 180);
    const turnEndPoint = turnCenterPoint.offset(turnEndBearing, desiredTurnRadiusRad, ProcedureTurnBuilder.geoPointCache[6]);
    const turnEndVec = turnEndPoint.toCartesian(ProcedureTurnBuilder.vec3Cache[2]);

    let finalTurnDirection: VectorTurnDirection | undefined;
    let finalTurnRadius: number | undefined;
    let finalTurnStartPoint: GeoPoint | undefined;
    let finalTurnCenterPoint: GeoPoint | undefined;
    let finalTurnEndPoint: GeoPoint | undefined;
    let endPoint: GeoPoint | undefined;

    if (endPath.encircles(turnEndVec) === (initialTurnDirection === 'left')) {
      // the end of the turn lies beyond the path to intercept due to approximation error, so we need to end the turn early.
      const turnCircle = ProcedureTurnBuilder.geoCircleCache[0].set(turnCenterPoint, desiredTurnRadiusRad);
      const intersections = ProcedureTurnBuilder.intersectionCache;
      const numIntersections = turnCircle.intersection(endPath, intersections);
      if (numIntersections === 0) {
        // the path to intersect is completely outside of the turn, which can only happen if there is a major deviation
        // from the pseudo-Euclidean approximation. There is no easy way to recover from this state, so we just bail
        // out with a track directly to the endpoint.
        endPoint = ProcedureTurnBuilder.geoPointCache[7].setFromCartesian(end);
      } else {
        if (numIntersections === 2) {
          // choose the intersection point which gives the smallest angle between the end of the turn and the path to intercept
          const headingAdjustment = turnDirection === 'left' ? -90 : 90;
          const angleDiff_0 = Math.abs(NavMath.diffAngle(
            Math.acos(Vec3Math.dot(
              GeoCircle.getGreatCircleNormal(turnCenterPoint, intersections[0], ProcedureTurnBuilder.vec3Cache[3]),
              endPath.center
            )) * Avionics.Utils.RAD2DEG + headingAdjustment,
            0
          ));
          const angleDiff_1 = Math.abs(NavMath.diffAngle(
            Math.acos(Vec3Math.dot(
              GeoCircle.getGreatCircleNormal(turnCenterPoint, intersections[1], ProcedureTurnBuilder.vec3Cache[3]),
              endPath.center
            )) * Avionics.Utils.RAD2DEG + headingAdjustment,
            0
          ));
          turnEndPoint.setFromCartesian(intersections[angleDiff_0 < angleDiff_1 ? 0 : 1]);
        } else {
          turnEndPoint.setFromCartesian(intersections[0]);
        }

        turnEndBearing = turnCenterPoint.bearingTo(turnEndPoint);
      }
    } else {
      const turnFinalCourse = NavMath.normalizeHeading(outboundCourse + 180);
      const turnInboundPath = ProcedureTurnBuilder.geoCircleCache[0].setAsGreatCircle(turnEndPoint, turnFinalCourse);

      const intersections = ProcedureTurnBuilder.intersectionCache;
      const numIntersections = turnInboundPath.intersection(endPath, intersections);

      // Only move forward if the end of the turn does not lie on the path to intercept.
      if (numIntersections !== 0 && !endPath.includes(turnEndVec)) {
        const intersection = intersections[(numIntersections === 1 || endPath.encircles(turnEndVec)) ? 0 : 1];
        // Only move forward if the intersection lies before the endpoint, otherwise we will just end the leg at the
        // end of the procedure turn.
        if (Vec3Math.dot(
          GeoCircle.getGreatCircleNormal(intersection, end, ProcedureTurnBuilder.vec3Cache[3]),
          endPath.center
        ) > 0) {
          // Because we used an approximation to place the procedure turn, the inbound segment of the turn may not
          // allow for a turn of the desired radius to perfectly intercept the final path. Therefore, we need to
          // explicitly calculate the maximum allowed turn radius for this final turn and adjust the turn radius as
          // needed. Note that if the initial and final paths are antiparallel, these calculations are not strictly
          // necessary, but we will carry them out in all cases to account for floating point errors that may have
          // accrued during previous calculations.
          const deltaInbound = Math.acos(Vec3Math.dot(endPath.center, turnInboundPath.center));
          const thetaInbound = (Math.PI - deltaInbound) / 2;
          const tanThetaInbound = Math.tan(thetaInbound);

          const desiredFinalTurnAlongTrackDistance = Math.asin(Math.tan(desiredTurnRadiusRad) / tanThetaInbound);
          const finalTurnAlongTrackDistance = Math.min(
            desiredFinalTurnAlongTrackDistance,
            Math.acos(Vec3Math.dot(intersection, turnEndVec)),
            Math.acos(Vec3Math.dot(intersection, end))
          );
          const finalTurnRadiusRad = finalTurnAlongTrackDistance === desiredFinalTurnAlongTrackDistance
            ? desiredTurnRadiusRad
            : Math.atan(Math.sin(finalTurnAlongTrackDistance) * tanThetaInbound);

          finalTurnDirection = NavMath.getTurnDirection(turnFinalCourse, finalCourse);
          finalTurnRadius = UnitType.GA_RADIAN.convertTo(finalTurnRadiusRad, UnitType.METER);

          finalTurnStartPoint = turnInboundPath.offsetDistanceAlong(intersection, -finalTurnAlongTrackDistance, ProcedureTurnBuilder.geoPointCache[7], Math.PI);
          finalTurnCenterPoint = finalTurnStartPoint.offset(turnFinalCourse + (finalTurnDirection === 'left' ? -90 : 90), finalTurnRadiusRad, ProcedureTurnBuilder.geoPointCache[8]);
          finalTurnEndPoint = endPath.offsetDistanceAlong(intersection, finalTurnAlongTrackDistance, ProcedureTurnBuilder.geoPointCache[9], Math.PI);
        }
      }
    }

    // Set vectors.

    const turnFlags = flags | (includeTurnToCourseFlag ? FlightPathVectorFlags.TurnToCourse : 0);

    if (initialTurnStartPoint !== startPoint) {
      vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, startPoint, initialTurnStartPoint, undefined, flags);
    }

    vectorIndex += this.circleVectorBuilder.build(
      vectors,
      vectorIndex,
      initialTurnDirection, desiredTurnRadius,
      initialTurnCenterPoint, initialTurnStartPoint, initialTurnEndPoint,
      turnFlags
    );

    if (turnStartPoint !== initialTurnEndPoint) {
      vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, initialTurnEndPoint, turnStartPoint, undefined, flags);
    }

    vectorIndex += this.circleVectorBuilder.build(
      vectors,
      vectorIndex,
      turnDirection, desiredTurnRadius,
      turnCenterPoint, turnStartPoint, turnEndPoint,
      turnFlags
    );

    if (finalTurnCenterPoint) {
      if (!finalTurnStartPoint!.equals(turnEndPoint)) {
        vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, turnEndPoint, finalTurnStartPoint!, undefined, flags);
      }

      vectorIndex += this.circleVectorBuilder.build(
        vectors,
        vectorIndex,
        finalTurnDirection!, finalTurnRadius!,
        finalTurnCenterPoint, finalTurnStartPoint!, finalTurnEndPoint!,
        turnFlags
      );
    } else {
      if (endPoint) {
        vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, turnEndPoint, endPoint, undefined, flags);
      }
    }

    return vectorIndex - index;
  }
}

/**
 * Builds paths directly connecting a defined initial point and course and a defined end point.
 */
export class DirectToPointBuilder {
  private static readonly vec3Cache = [new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3)];
  private static readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0)];

  private readonly circleVectorBuilder = new CircleVectorBuilder();
  private readonly greatCircleBuilder = new GreatCircleBuilder();

  /**
   * Builds a sequence of vectors representing a path which consists of an optional turn from an initial point and
   * course toward an end point followed by an optional great-circle path terminating at the end point.
   * @param vectors The flight path vector sequence to which to add the vectors.
   * @param index The index in the sequence at which to add the vectors.
   * @param start The start point.
   * @param startCourse The initial course.
   * @param end The end point.
   * @param desiredTurnRadius The desired turn radius, in meters.
   * @param desiredTurnDirection The desired turn direction. If undefined, a turn direction will be chosen such that
   * the initial turn is always toward the end point.
   * @param flags The flags to set on the vectors. Defaults to none (0).
   * @param includeTurnToCourseFlag Whether to include the `TurnToCourse` flag on the turn vectors. Defaults to `true`.
   * @param includeDirectFlag Whether to include the `Direct` flag on the vectors. Defaults to `true`.
   * @returns The number of vectors added to the sequence.
   */
  public build(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    startCourse: number,
    end: ReadonlyFloat64Array | LatLonInterface,
    desiredTurnRadius: number,
    desiredTurnDirection?: VectorTurnDirection,
    flags?: number,
    includeTurnToCourseFlag?: boolean,
    includeDirectFlag?: boolean
  ): number;
  /**
   * Builds a sequence of vectors representing a path which consists of an optional turn from an initial point and
   * course toward an end point followed by an optional great-circle path terminating at the end point.
   * @param vectors The flight path vector sequence to which to add the vectors.
   * @param index The index in the sequence at which to add the vectors.
   * @param start The start point.
   * @param startPath The great-circle path defining the initial course.
   * @param end The end point.
   * @param desiredTurnRadius The desired turn radius, in meters.
   * @param desiredTurnDirection The desired turn direction. If undefined, a turn direction will be chosen such that
   * the initial turn is always toward the end point.
   * @param flags The flags to set on the vectors. Defaults to none (0).
   * @param includeTurnToCourseFlag Whether to include the `TurnToCourse` flag on the turn vectors. Defaults to `true`.
   * @param includeDirectFlag Whether to include the `Direct` flag on the vectors. Defaults to `true`.
   * @returns The number of vectors added to the sequence.
   */
  public build(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    startPath: GeoCircle,
    end: ReadonlyFloat64Array | LatLonInterface,
    desiredTurnRadius: number,
    desiredTurnDirection?: VectorTurnDirection,
    flags?: number,
    includeTurnToCourseFlag?: boolean,
    includeDirectFlag?: boolean
  ): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public build(
    vectors: FlightPathVector[],
    index: number,
    start: ReadonlyFloat64Array | LatLonInterface,
    startPath: GeoCircle | number,
    end: ReadonlyFloat64Array | LatLonInterface,
    desiredTurnRadius: number,
    desiredTurnDirection?: VectorTurnDirection,
    flags = 0,
    includeTurnToCourseFlag = true,
    includeDirectFlag = true
  ): number {
    let vectorIndex = index;

    if (typeof startPath === 'number') {
      startPath = DirectToPointBuilder.geoCircleCache[0].setAsGreatCircle(start, startPath);
    }

    const endPos = DirectToPointBuilder.geoPointCache[0];
    if (!(start instanceof Float64Array)) {
      start = GeoPoint.sphericalToCartesian(start as LatLonInterface, DirectToPointBuilder.vec3Cache[0]);
    }
    if (!(end instanceof Float64Array)) {
      endPos.set(end as LatLonInterface);
      end = GeoPoint.sphericalToCartesian(end as LatLonInterface, DirectToPointBuilder.vec3Cache[1]);
    } else {
      endPos.setFromCartesian(end);
    }

    const distanceToEnd = Math.acos(Utils.Clamp(Vec3Math.dot(start, end), -1, 1));

    if (distanceToEnd < GeoPoint.EQUALITY_TOLERANCE) {
      return vectorIndex - index;
    } else if (Math.abs(distanceToEnd - Math.PI) < GeoPoint.EQUALITY_TOLERANCE) {
      // terminator is antipodal to current position
      vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, start, startPath, end, flags);
      return vectorIndex - index;
    }

    const startPathEncirclesTerminator = startPath.encircles(end);
    const startPathIncludesTerminator = startPath.includes(end);

    const turnDirection = desiredTurnDirection ?? (startPathEncirclesTerminator && !startPathIncludesTerminator ? 'left' : 'right');
    const startToTurnCenterPath = DirectToPointBuilder.geoCircleCache[1].set(turnDirection === 'left'
      ? Vec3Math.cross(start, startPath.center, DirectToPointBuilder.vec3Cache[2])
      : Vec3Math.cross(startPath.center, start, DirectToPointBuilder.vec3Cache[2]),
      MathUtils.HALF_PI
    );

    let maxTurnRadiusRad;
    if (!startPathIncludesTerminator && startPathEncirclesTerminator === (turnDirection === 'left')) {
      // terminator lies on the same side as the turn, which means there is the possibility that the turn circle can
      // encircle the terminator, which would make defining a great circle intersecting the terminator fix and also
      // tangent to the turn circle impossible. Therefore, we compute the maximum allowed turn radius, defined as the
      // radius such that the terminator fix lies exactly on the turn circle.

      const startToTerminatorPathNormal = GeoCircle.getGreatCircleNormal(start, end, DirectToPointBuilder.vec3Cache[2]);
      // the angle between the great-circle path from the start point to the turn center and the path from the start
      // point to the terminator fix
      const theta = Math.acos(Vec3Math.dot(startToTurnCenterPath.center, startToTerminatorPathNormal));
      maxTurnRadiusRad = Math.atan(Math.sin(distanceToEnd) / (Math.cos(theta) * (1 + Math.cos(distanceToEnd))));
    } else {
      // terminator lies on the starting path or on the opposite side as the turn. Either way, no turn can encircle the
      // terminator, and so there is no maximum turn radius.
      maxTurnRadiusRad = Math.PI / 2;
    }

    const turnRadiusRad = Math.min(maxTurnRadiusRad, UnitType.METER.convertTo(desiredTurnRadius, UnitType.GA_RADIAN));

    const turnCenterVec = startToTurnCenterPath.offsetDistanceAlong(start, turnRadiusRad, DirectToPointBuilder.vec3Cache[2]);
    const turnCenterPoint = DirectToPointBuilder.geoPointCache[1].setFromCartesian(turnCenterVec);

    // Find the great-circle path from the terminator fix that is tangent to the turn circle. There are guaranteed to
    // be two such paths. We choose between the two based on the initial turn direction.

    const turnCenterToTerminatorDistance = Math.acos(Utils.Clamp(Vec3Math.dot(turnCenterVec, end), -1, 1));
    // The angle between the great-circle path from the terminator fix to the turn center and the two
    // great-circle paths from the terminator fix that are tangent to the turn circle.
    const alpha = Math.asin(Math.min(1, Math.sin(turnRadiusRad) / Math.sin(turnCenterToTerminatorDistance)));
    const terminatorFixBearingToTurnCenter = endPos.bearingTo(turnCenterPoint);
    const finalPathCourse = NavMath.normalizeHeading(terminatorFixBearingToTurnCenter + alpha * Avionics.Utils.RAD2DEG * (turnDirection === 'left' ? -1 : 1) + 180);
    const finalPath = DirectToPointBuilder.geoCircleCache[1].setAsGreatCircle(end, finalPathCourse);
    const turnEndVec = finalPath.closest(turnCenterPoint, DirectToPointBuilder.vec3Cache[3]);

    flags |= includeDirectFlag ? FlightPathVectorFlags.Direct : 0;

    if (!GeoPoint.equals(turnEndVec, start)) {
      vectorIndex += this.circleVectorBuilder.build(
        vectors,
        vectorIndex,
        turnDirection, UnitType.GA_RADIAN.convertTo(turnRadiusRad, UnitType.METER),
        turnCenterPoint, start, turnEndVec,
        flags | (includeTurnToCourseFlag ? FlightPathVectorFlags.TurnToCourse : 0)
      );
    }

    if (!GeoPoint.equals(turnEndVec, end)) {
      vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, turnEndVec, end, undefined, flags);
    }

    return vectorIndex - index;
  }
}