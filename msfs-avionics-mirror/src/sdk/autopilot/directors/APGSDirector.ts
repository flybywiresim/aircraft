/// <reference types="msfstypes/JS/simvar" />

import { EventBus, SimVarValueType } from '../../data';
import { GeoPoint } from '../../geo';
import { AdcEvents, Glideslope, GNSSEvents, NavRadioEvents } from '../../instruments';
import { MathUtils, SimpleMovingAverage, UnitType } from '../../math';
import { APLateralModes, APValues } from '../APConfig';
import { VNavVars } from '../data/VNavEvents';
import { ApproachGuidanceMode } from '../VerticalNavigation';
import { VNavUtils } from '../VNavUtils';
import { DirectorState, PlaneDirector } from './PlaneDirector';

/**
 * A glideslope autopilot director.
 */
export class APGSDirector implements PlaneDirector {

  public state: DirectorState;

  /** A callback called when the director activates. */
  public onActivate?: () => void;

  /** A callback called when the director arms. */
  public onArm?: () => void;

  private geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private ppos = new GeoPoint(0, 0);
  private gsLocation = new GeoPoint(NaN, NaN);
  private glideslope?: Glideslope;
  private verticalWindAverage = new SimpleMovingAverage(10);
  private tas = 0;
  private groundSpeed = 0;

  /**
   * Creates an instance of the LateralDirector.
   * @param bus The event bus to use with this instance.
   * @param apValues is the APValues object from the Autopilot.
   */
  constructor(private readonly bus: EventBus, private readonly apValues: APValues) {
    this.state = DirectorState.Inactive;
    const nav = this.bus.getSubscriber<NavRadioEvents>();
    nav.on('nav_radio_active_glideslope').handle(gs => this.glideslope = gs);
    nav.on('nav_radio_active_gs_location').handle((loc) => {
      this.gsLocation.set(loc.lat, loc.long);
    });
    const gnss = this.bus.getSubscriber<GNSSEvents>();
    gnss.on('gps-position').atFrequency(1).handle((lla) => {
      this.ppos.set(lla.lat, lla.long);
    });
    gnss.on('ground_speed').withPrecision(0).handle((gs) => {
      this.groundSpeed = gs;
    });
    this.bus.getSubscriber<AdcEvents>().on('tas').withPrecision(0).handle((tas) => {
      this.tas = tas;
    });
  }

  /**
   * Activates this director.
   */
  public activate(): void {
    this.state = DirectorState.Active;
    SimVar.SetSimVarValue(VNavVars.GPApproachMode, SimVarValueType.Number, ApproachGuidanceMode.GSActive);
    if (this.onActivate !== undefined) {
      this.onActivate();
    }
    SimVar.SetSimVarValue('AUTOPILOT GLIDESLOPE ACTIVE', 'Bool', true);
    SimVar.SetSimVarValue('AUTOPILOT APPROACH ACTIVE', 'Bool', true);
    SimVar.SetSimVarValue('AUTOPILOT GLIDESLOPE ARM', 'Bool', false);
  }

  /**
   * Arms this director.
   */
  public arm(): void {
    if (this.canArm() && this.state === DirectorState.Inactive) {
      this.state = DirectorState.Armed;
      SimVar.SetSimVarValue(VNavVars.GPApproachMode, SimVarValueType.Number, ApproachGuidanceMode.GSArmed);
      if (this.onArm !== undefined) {
        this.onArm();
      }
      SimVar.SetSimVarValue('AUTOPILOT GLIDESLOPE ARM', 'Bool', true);
      SimVar.SetSimVarValue('AUTOPILOT GLIDESLOPE ACTIVE', 'Bool', false);
      SimVar.SetSimVarValue('AUTOPILOT APPROACH ACTIVE', 'Bool', true);
    }
  }

  /**
   * Deactivates this director.
   */
  public deactivate(): void {
    this.state = DirectorState.Inactive;
    SimVar.SetSimVarValue(VNavVars.GPApproachMode, SimVarValueType.Number, ApproachGuidanceMode.None);
    SimVar.SetSimVarValue('AUTOPILOT GLIDESLOPE ARM', 'Bool', false);
    SimVar.SetSimVarValue('AUTOPILOT GLIDESLOPE ACTIVE', 'Bool', false);
    SimVar.SetSimVarValue('AUTOPILOT APPROACH ACTIVE', 'Bool', false);
  }

  /**
   * Updates this director.
   */
  public update(): void {
    if (this.state === DirectorState.Armed) {
      if (this.apValues.lateralActive.get() === APLateralModes.LOC && this.glideslope !== undefined &&
        this.glideslope.isValid && this.glideslope.deviation <= 0.1 && this.glideslope.deviation >= -0.1) {
        this.activate();
      }
      if (!this.canArm()) {
        this.deactivate();
      }
    }
    if (this.state === DirectorState.Active) {
      if (this.apValues.lateralActive.get() !== APLateralModes.LOC) {
        this.deactivate();
      }
      this.trackGlideslope();
    }
  }

  /**
   * Method to check whether the director can arm.
   * @returns Whether or not this director can arm.
   */
  private canArm(): boolean {
    if ((this.apValues.navToNavLocArm && this.apValues.navToNavLocArm()) || (this.glideslope !== undefined && this.glideslope.isValid)) {
      return true;
    }
    return false;
  }

  /**
   * Tracks the Glideslope.
   */
  private trackGlideslope(): void {
    if (this.glideslope !== undefined && this.glideslope.isValid) {
      let gsDistance = UnitType.NMILE.convertTo(5, UnitType.METER);
      if (!isNaN(this.gsLocation.lat)) {
        const gsPosition = this.geoPointCache[0];
        gsPosition.set(this.gsLocation);

        const planePosGP = this.geoPointCache[1];
        planePosGP.set(this.ppos);

        gsDistance = UnitType.GA_RADIAN.convertTo(planePosGP.distance(gsPosition), UnitType.METER);
      }

      const gainDenominator = MathUtils.clamp((2200 - (0.4 * gsDistance)) / 3000, 0.1, 1);
      const fpaPercentage = Math.max(this.glideslope.deviation / gainDenominator, -1) + 1;

      const pitchForFpa = MathUtils.clamp(this.glideslope.gsAngle * fpaPercentage * -1, -8, 3);
      const vsRequiredForFpa = VNavUtils.getVerticalSpeedFromFpa(-pitchForFpa, this.groundSpeed);

      //We need the instant vertical wind component here so we're avoiding the bus
      const verticalWindComponent = this.verticalWindAverage.getAverage(SimVar.GetSimVarValue('AMBIENT WIND Y', SimVarValueType.FPM));

      const vsRequiredWithVerticalWind = vsRequiredForFpa - verticalWindComponent;

      const pitchForVerticalSpeed = VNavUtils.getFpa(UnitType.NMILE.convertTo(this.tas / 60, UnitType.FOOT), vsRequiredWithVerticalWind);

      //We need the instant AOA here so we're avoiding the bus
      const aoa = SimVar.GetSimVarValue('INCIDENCE ALPHA', SimVarValueType.Degree);

      const targetPitch = aoa + pitchForVerticalSpeed;

      SimVar.SetSimVarValue('AUTOPILOT PITCH HOLD REF', SimVarValueType.Degree, -targetPitch);
    } else {
      this.deactivate();
    }
  }
}