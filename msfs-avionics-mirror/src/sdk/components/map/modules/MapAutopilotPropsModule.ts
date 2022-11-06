import { NumberUnitSubject, UnitType } from '../../../math';

/**
 * A module describing the state of the autopilot.
 */
export class MapAutopilotPropsModule {
  /** The altitude preselector setting. */
  public readonly selectedAltitude = NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(0));

  private readonly apSelectedAltitudeHandler = (alt: number): void => {
    this.selectedAltitude.set(alt);
  };
}