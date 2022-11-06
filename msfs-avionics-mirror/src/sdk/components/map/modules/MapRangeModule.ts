import { UnitType } from '../../../math/NumberUnit';
import { NumberUnitSubject } from '../../../math/NumberUnitSubject';

/**
 * A module describing the nominal range of a map.
 */
export class MapRangeModule {

  /** The range of the map as a number unit. */
  public readonly nominalRange = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(1));
}