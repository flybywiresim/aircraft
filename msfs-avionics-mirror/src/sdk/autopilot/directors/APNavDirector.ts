/// <reference types="msfstypes/JS/simvar" />

import { EventBus } from '../../data';
import { GeoPoint, MagVar, NavMath } from '../../geo';
import {
  AdcEvents, AhrsEvents, CdiDeviation, GNSSEvents, Localizer, NavEvents, NavRadioEvents, NavSourceId, NavSourceType, ObsSetting
} from '../../instruments';
import { MathUtils, UnitType } from '../../math';
import { Subject } from '../../sub';
import { LinearServo } from '../../utils/controllers';
import { APLateralModes, APValues } from '../APConfig';
import { DirectorState, PlaneDirector } from './PlaneDirector';

/**
 * Calculates an intercept angle, in degrees, to capture the desired track from a navigation signal for
 * {@link APNavDirector}.
 * @param distanceToSource The distance from the plane to the source of the navigation signal, in nautical miles.
 * @param deflection The lateral deflection of the desired track relative to the plane, normalized from `-1` to `1`.
 * Negative values indicate that the desired track is to the left of the plane.
 * @param tas The true airspeed of the plane, in knots.
 * @param isLoc Whether the source of the navigation signal is a localizer. Defaults to `false`.
 * @returns The intercept angle, in degrees, to capture the desired track from the navigation signal.
 */
export type APNavDirectorInterceptFunc = (distanceToSource: number, deflection: number, tas: number, isLoc?: boolean) => number;

/**
 * A Nav/Loc autopilot director.
 */
export class APNavDirector implements PlaneDirector {

  public state: DirectorState;

  /** A callback called when the director activates. */
  public onActivate?: () => void;

  /** A callback called when the director arms. */
  public onArm?: () => void;

  /** A callback called when the director deactivates. */
  public onDeactivate?: () => void;

  private readonly bankServo = new LinearServo(10);
  private currentBankRef = 0;
  private currentHeading = 0;
  private currentTrack = 0;
  private navSource?: NavSourceId;
  private cdi?: CdiDeviation;
  private obs?: ObsSetting;
  private loc?: Localizer;
  private magVar?: number;

  private ppos = new GeoPoint(0, 0);
  private navLocation = new GeoPoint(NaN, NaN);
  private tas = 0;

  private isApproachMode = Subject.create<boolean>(false);

  private isNavLock = Subject.create<boolean>(false);

  /**
   * Creates an instance of the LateralDirector.
   * @param bus The event bus to use with this instance.
   * @param apValues Is the apValues object.
   * @param mode is the APLateralMode for this instance of the director.
   * @param lateralInterceptCurve The optional curve used to translate DTK and XTK into a track intercept angle.
   */
  constructor(
    private readonly bus: EventBus,
    private readonly apValues: APValues,
    private readonly mode: APLateralModes,
    private readonly lateralInterceptCurve?: APNavDirectorInterceptFunc
  ) {
    this.state = DirectorState.Inactive;
    this.monitorEvents();

    this.isNavLock.sub((newState: boolean) => {
      if (SimVar.GetSimVarValue('AUTOPILOT NAV1 LOCK', 'Bool') !== newState) {
        SimVar.SetSimVarValue('AUTOPILOT NAV1 LOCK', 'Bool', newState);
      }
    });
  }


  /**
   * Activates this director.
   */
  public activate(): void {
    if (this.onActivate !== undefined) {
      this.onActivate();
    }
    this.setNavLock(true);
    this.state = DirectorState.Active;
  }

  /**
   * Arms this director.
   */
  public arm(): void {
    if (this.state === DirectorState.Inactive && this.canArm()) {
      this.state = DirectorState.Armed;
      if (this.onArm !== undefined) {
        this.onArm();
      }
      this.setNavLock(true);

    }
  }

  /**
   * Deactivates this director.
   */
  public deactivate(): void {
    this.state = DirectorState.Inactive;
    this.setNavLock(false);

  }

  /**
   * Sets the NAV1 Lock state.
   * @param newState The new state of the NAV1 lock.
   */
  public setNavLock(newState: boolean): void {
    this.isNavLock.set(newState);
  }

  /**
   * Updates this director.
   */
  public update(): void {
    if (!this.canArm()) {
      this.deactivate();
    }
    if (this.state === DirectorState.Armed) {
      if (this.canActivate()) {
        this.activate();
      }
    }
    if (this.state === DirectorState.Active) {
      this.setBank(this.desiredBank());
    }
  }

  /**
   * Method to check whether the director can arm.
   * @returns Whether or not this director can arm.
   */
  private canArm(): boolean {
    const typeIsCorrect = this.navSource?.type === NavSourceType.Nav;
    const index = this.navSource?.index;
    if (this.mode === APLateralModes.LOC && typeIsCorrect) {
      const indexIsCorrect = index == this.cdi?.source.index && this.loc?.isValid && index == this.loc?.source.index;
      if (indexIsCorrect) {
        this.isApproachMode.set(true);
        return true;
      }
    }
    if (this.mode === APLateralModes.VOR && typeIsCorrect) {
      const indexIsCorrect = index == this.cdi?.source.index && !this.loc?.isValid && index == this.obs?.source.index;
      if (indexIsCorrect) {
        this.isApproachMode.set(false);
        return true;
      }
    }
    if (this.mode === APLateralModes.LOC && this.apValues.navToNavLocArm && this.apValues.navToNavLocArm()) {
      this.isApproachMode.set(true);
      return true;
    }
    this.isApproachMode.set(false);
    return false;
  }


  /**
   * Method to check whether the director can activate.
   * @returns Whether or not this director can activate.
   */
  private canActivate(): boolean {
    const typeIsCorrect = this.navSource?.type === NavSourceType.Nav;
    const index = this.navSource?.index;
    const indexIsCorrect = index == this.cdi?.source.index
      && ((this.loc?.isValid && index == this.loc?.source.index) || (!this.loc?.isValid && index == this.obs?.source.index));
    if (typeIsCorrect && indexIsCorrect && this.cdi !== undefined && this.cdi.deviation !== null && Math.abs(this.cdi.deviation) < 127 && (this.obs?.heading || this.loc?.course)) {
      const dtk = this.loc && this.loc.isValid && this.loc.course ? this.loc.course * Avionics.Utils.RAD2DEG : this.obs?.heading;
      if (dtk === null || dtk === undefined) {
        return false;
      }
      const headingDiff = NavMath.diffAngle(this.currentHeading, dtk);
      const isLoc = this.loc?.isValid ?? false;
      const sensitivity = isLoc ? 1 : .6;
      if (Math.abs(this.cdi.deviation * sensitivity) < 127 && Math.abs(headingDiff) < 110) {
        return true;
      }
    }
    return false;
  }

  /**
   * Gets a desired bank from the nav input data.
   * @returns The desired bank angle.
   */
  private desiredBank(): number {
    const isLoc = this.loc?.isValid ?? false;
    const hasValidDeviation = this.cdi !== undefined && this.cdi.deviation !== null && Math.abs(this.cdi.deviation) < 127;
    const hasValidObs = this.obs !== undefined && this.obs.heading !== null;
    let zoneOfConfusion = false;

    if (isLoc && !hasValidDeviation) {
      this.deactivate();
      return NaN;
    }
    if (!isLoc && (!hasValidDeviation || !hasValidObs)) {
      if (!this.checkForZoneOfConfusion()) {
        this.deactivate();
        return NaN;
      } else {
        zoneOfConfusion = true;
      }
    }
    if (zoneOfConfusion || (this.cdi && this.cdi.deviation !== null)) {
      const xtk = zoneOfConfusion ? 0 : (this.cdi && this.cdi.deviation !== null) ? this.getXtk(this.cdi.deviation, isLoc) : 0;
      const courseMag = isLoc && this.loc?.course !== undefined ? this.loc.course * Avionics.Utils.RAD2DEG : this.obs?.heading;
      if (courseMag === null || courseMag === undefined) {
        this.deactivate();
        return NaN;
      }

      let absInterceptAngle = 0;
      if (this.lateralInterceptCurve !== undefined) {
        absInterceptAngle = this.lateralInterceptCurve(this.getNavDistance(), (this.cdi?.deviation ?? 0) / 127, this.tas, isLoc);
      } else {
        absInterceptAngle = Math.min(Math.pow(Math.abs(xtk) * 20, 1.35) + (Math.abs(xtk) * 50), 45);
        if (absInterceptAngle <= 2.5) {
          absInterceptAngle = NavMath.clamp(Math.abs(xtk * 150), 0, 2.5);
        }
      }

      const interceptAngle = xtk > 0 ? absInterceptAngle : -1 * absInterceptAngle;
      const desiredTrack = NavMath.normalizeHeading(MagVar.magneticToTrue(courseMag, this.magVar ?? 0) + interceptAngle);

      const turnDirection = NavMath.getTurnDirection(this.currentTrack, desiredTrack);
      const trackDiff = Math.abs(NavMath.diffAngle(this.currentTrack, desiredTrack));

      let baseBank = Math.min(1.25 * trackDiff, 25);
      baseBank *= (turnDirection === 'left' ? 1 : -1);

      return baseBank;
    }

    this.deactivate();
    return NaN;
  }

  /**
   * Gets a xtk value from the nav input data.
   * @param deviation is the input deviation value
   * @param isLoc is whether this is a LOC signal.
   * @returns The xtk value.
   */
  private getXtk(deviation: number, isLoc: boolean): number {
    const scale = isLoc ? 1 : 2;
    const factor = isLoc ? .35 : 1;
    return MathUtils.clamp(this.getNavDistance() * Math.sin(UnitType.DEGREE.convertTo(12, UnitType.RADIAN) * ((factor * deviation) / 127)), -scale, scale);
  }

  /**
   * Gets the lateral distance from PPOS to the nav signal.
   * @returns The distance value in nautical miles.
   */
  private getNavDistance(): number {
    if (!isNaN(this.navLocation.lat)) {
      return UnitType.GA_RADIAN.convertTo(this.navLocation.distance(this.ppos), UnitType.NMILE);
    } else {
      return 5;
    }
  }

  /**
   * Sets the desired AP bank angle.
   * @param bankAngle The desired AP bank angle.
   */
  private setBank(bankAngle: number): void {
    if (isFinite(bankAngle)) {
      this.currentBankRef = this.bankServo.drive(this.currentBankRef, bankAngle);
      SimVar.SetSimVarValue('AUTOPILOT BANK HOLD REF', 'degrees', this.currentBankRef);
    }
  }

  /**
   * Checks if we might be getting a wild deviation because of the zone of confusion and allows APNavDirector some time to resolve.
   * @returns Whether we might be in the zone of confusion.
   */
  private checkForZoneOfConfusion(): boolean {
    if (this.getNavDistance() < 2 && this.cdi !== undefined && this.cdi.deviation !== null) {
      return true;
    }
    return false;
  }

  /**
   * Method to monitor nav events to keep track of NAV related data needed for guidance.
   */
  private monitorEvents(): void {
    const sub = this.bus.getSubscriber<AdcEvents & AhrsEvents & GNSSEvents & NavRadioEvents & NavEvents>();

    sub.on('nav_radio_active_cdi_deviation').handle(cdi => this.cdi = cdi);
    sub.on('nav_radio_active_obs_setting').handle(obs => this.obs = obs);
    sub.on('nav_radio_active_localizer').handle(loc => this.loc = loc);
    sub.on('cdi_select').handle((source) => {
      this.navSource = source;
      if (this.state === DirectorState.Active) {
        this.deactivate();
      }
    });
    sub.on('nav_radio_active_nav_location').handle((loc) => {
      this.navLocation.set(loc.lat, loc.long);
    });
    sub.on('nav_radio_active_magvar').handle(magVar => { this.magVar = magVar; });

    sub.on('hdg_deg')
      .withPrecision(0)
      .handle((h) => {
        this.currentHeading = h;
      });

    sub.on('tas').handle(s => this.tas = s);

    sub.on('gps-position').atFrequency(1).handle((lla) => {
      this.ppos.set(lla.lat, lla.long);
    });
    sub.on('track_deg_true').handle((t) => {
      this.currentTrack = t;
    });

  }
}