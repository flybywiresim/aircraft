import { NumberUnitSubject, UnitType } from '../../../math';
import { Subject, Subscribable } from '../../../sub';
import { Tcas, TcasOperatingMode } from '../../../traffic';

/**
 * Traffic alert level modes.
 */
export enum MapTrafficAlertLevelVisibility {
  Other = 1 << 0,
  ProximityAdvisory = 1 << 1,
  TrafficAdvisory = 1 << 2,
  ResolutionAdvisory = 1 << 3,
  All = 1 << 0 | 1 << 1 | 1 << 2 | 1 << 3
}

/**
 * A module describing the display of traffic.
 */
export class MapTrafficModule {
  /** Whether to show traffic information. */
  public readonly show = Subject.create(true);

  /** The TCAS operating mode. */
  public readonly operatingMode: Subscribable<TcasOperatingMode> = Subject.create(TcasOperatingMode.Standby);

  /**
   * The distance from the own airplane beyond which intruders are considered off-scale. If the value is `NaN`,
   * intruders are never considered off-scale.
   */
  public readonly offScaleRange = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(NaN));

  /** Alert level visibility flags. */
  public readonly alertLevelVisibility = Subject.create<number>(MapTrafficAlertLevelVisibility.All);

  /** The difference in altitude above the own airplane above which intruders will not be displayed. */
  public readonly altitudeRestrictionAbove = NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(9900));

  /** The difference in altitude below the own airplane below which intruders will not be displayed. */
  public readonly altitudeRestrictionBelow = NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(9900));

  /** Whether displayed intruder altitude is relative. */
  public readonly isAltitudeRelative = Subject.create(true);

  /**
   * Creates an instance of a MapTrafficModule.
   * @param tcas This module's associated TCAS.
   */
  constructor(public readonly tcas: Tcas) {
    this.tcas.getEventSubscriber().on('tcas_operating_mode').whenChanged().handle(mode => {
      (this.operatingMode as Subject<TcasOperatingMode>).set(mode);
    });
  }
}