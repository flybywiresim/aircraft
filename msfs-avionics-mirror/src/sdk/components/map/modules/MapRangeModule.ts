import { UnitType } from '../../../utils/math/NumberUnit';
import { NumberUnitSubject } from '../../../utils/math/NumberUnitSubject';

/**
 * A module describing the nominal range of a map.
 */
export class MapRangeModule {
  public readonly nominalRange = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(1));
}