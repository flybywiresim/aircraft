import { NumberUnitSubject, UnitType } from '../../../math';
import { Subject, Subscribable } from '../../../sub';
import { WxrMode } from '../../bing';

/**
 * A module that describes the display of weather on a Bing Map instance.
 */
export class MapWxrModule {
  /** Whether the weather radar is enabled. */
  public readonly isEnabled = Subject.create(false);

  /** The current map weather radar arc sweep angle in degrees. */
  public readonly weatherRadarArc = NumberUnitSubject.createFromNumberUnit(UnitType.DEGREE.createNumber(90));

  /** The current weather radar mode. */
  public readonly weatherRadarMode = Subject.create<EWeatherRadar.HORIZONTAL | EWeatherRadar.VERTICAL | EWeatherRadar.TOPVIEW>(EWeatherRadar.HORIZONTAL);

  private readonly _wxrMode = Subject.create<WxrMode>({
    mode: this.isEnabled.get() ? this.weatherRadarMode.get() : EWeatherRadar.OFF,
    arcRadians: this.weatherRadarArc.get().asUnit(UnitType.RADIAN),
  });

  /**
   * A subscribable containing the combined WxrMode from the mode and arc subjects,
   * suitable for consumption in a MapBingLayer.
   * @returns The WxrMode subscribable.
   */
  public get wxrMode(): Subscribable<WxrMode> {
    return this._wxrMode;
  }

  /**
   * Constructor.
   */
  constructor() {
    this.isEnabled.sub(v => {
      this._wxrMode.get().mode = v ? this.weatherRadarMode.get() : EWeatherRadar.OFF;
      this._wxrMode.notify();
    });

    this.weatherRadarArc.sub(v => {
      this._wxrMode.get().arcRadians = v.asUnit(UnitType.RADIAN);
      this._wxrMode.notify();
    });

    this.weatherRadarMode.sub(v => {
      this._wxrMode.get().mode = this.isEnabled.get() ? v : EWeatherRadar.OFF;
      this._wxrMode.notify();
    });
  }
}