import { GeoPoint, GeoPointSubject } from '../../../geo';
import { NumberUnitSubject, UnitType } from '../../../math';
import { Subject } from '../../../sub';

/**
 * A module describing the state of the own airplane.
 */
export class MapOwnAirplanePropsModule {
  /** The airplane's position. */
  public readonly position = GeoPointSubject.createFromGeoPoint(new GeoPoint(0, 0));

  /** The airplane's true heading, in degrees. */
  public readonly hdgTrue = Subject.create(0);

  /** The airplane's turn rate, in degrees per second. */
  public readonly turnRate = Subject.create(0);

  /** The airplane's indicated altitude. */
  public readonly altitude = NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(0));

  /** The airplane's vertical speed. */
  public readonly verticalSpeed = NumberUnitSubject.createFromNumberUnit(UnitType.FPM.createNumber(0));

  /** The airplane's true ground track, in degrees. */
  public readonly trackTrue = Subject.create(0);

  /** The airplane's ground speed. */
  public readonly groundSpeed = NumberUnitSubject.createFromNumberUnit(UnitType.KNOT.createNumber(0));

  /** Whether the airplane is on the ground. */
  public readonly isOnGround = Subject.create(true);

  /** The magnetic variation at the airplane's position. */
  public readonly magVar = Subject.create(0);
}