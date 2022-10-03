/// <reference types="msfstypes/JS/simvar" />

import { EventBus, SimVarValueType } from '../../data';
import { AdcEvents } from '../../instruments';
import { MathUtils, SimpleMovingAverage, UnitType } from '../../math';
import { APValues } from '../APConfig';
import { VNavUtils } from '../VNavUtils';
import { DirectorState, PlaneDirector } from './PlaneDirector';

/**
 * An altitude capture autopilot director.
 */
export class APAltCapDirector implements PlaneDirector {

  public state: DirectorState;

  /** A callback called when the director activates. */
  public onActivate?: () => void;

  /** A callback called when the director arms. */
  public onArm?: () => void;

  private tas = 0;
  private capturedAltitude = 0;
  private indicatedAltitude = 0;
  private verticalSpeed = 0;
  private initialFpa = 0;
  private selectedAltitude = 0;
  private verticalWindAverage = new SimpleMovingAverage(10);


  /**
   * Creates an instance of the LateralDirector.
   * @param bus The event bus to use with this instance.
   * @param apValues are the ap selected values for the autopilot.
   * @param captureAltitude The captureAltitude Method to use to capture the altitude
   */
  constructor(private readonly bus: EventBus, private readonly apValues: APValues,
    private readonly captureAltitude: (targetAltitude: number, indicatedAltitude: number, initialFpa: number) => number = APAltCapDirector.captureAltitude) {
    this.state = DirectorState.Inactive;

    this.bus.getSubscriber<AdcEvents>().on('tas').withPrecision(0).handle((tas) => {
      this.tas = tas;
    });

    const adc = this.bus.getSubscriber<AdcEvents>();
    adc.on('indicated_alt').withPrecision(0).handle((alt) => {
      this.indicatedAltitude = alt;
    });
    adc.on('vertical_speed').withPrecision(0).handle((vs) => {
      this.verticalSpeed = vs;
    });
    this.apValues.capturedAltitude.sub((cap) => {
      this.capturedAltitude = Math.round(cap);
    });
    this.apValues.selectedAltitude.sub((alt) => {
      this.selectedAltitude = alt;
    });
  }

  /**
   * Activates this director.
   */
  public activate(): void {
    this.state = DirectorState.Active;
    if (this.onActivate !== undefined) {
      this.onActivate();
    }
    this.setCaptureFpa(this.verticalSpeed);
    SimVar.SetSimVarValue('AUTOPILOT ALTITUDE LOCK', 'Bool', true);
  }

  /**
   * Arms this director.
   * This director has no armed mode, so it activates immediately.
   */
  public arm(): void {
    this.state = DirectorState.Armed;
    if (this.onArm !== undefined) {
      this.onArm();
    }
  }

  /**
   * Deactivates this director.
   * @param captured is whether the altitude was captured.
   */
  public deactivate(captured = false): void {
    this.state = DirectorState.Inactive;
    if (!captured) {
      SimVar.SetSimVarValue('AUTOPILOT ALTITUDE LOCK', 'Bool', false);
    }
    //this.capturedAltitude = 0;
  }

  /**
   * Updates this director.
   */
  public update(): void {
    if (this.state === DirectorState.Active) {
      this.setPitch(this.captureAltitude(this.capturedAltitude, this.indicatedAltitude, this.initialFpa));
    }
    if (this.state === DirectorState.Armed) {
      this.tryActivate();
    }
  }

  /**
   * Attempts to activate altitude capture.
   */
  private tryActivate(): void {
    const deviationFromTarget = Math.abs(this.selectedAltitude - this.indicatedAltitude);

    if (deviationFromTarget <= Math.abs(this.verticalSpeed / 6)) {
      this.apValues.capturedAltitude.set(Math.round(this.selectedAltitude));
      this.activate();
    }
  }

  /**
   * Sets the initial capture FPA from the current vs value when capture is initiated.
   * @param vs target vertical speed.
   */
  private setCaptureFpa(vs: number): void {
    if (Math.abs(vs) < 400) {
      const altCapDeviation = this.indicatedAltitude - this.selectedAltitude;
      vs = altCapDeviation > 0 ? -400 : 400;
    }
    this.initialFpa = this.getFpa(UnitType.NMILE.convertTo(this.tas / 60, UnitType.FOOT), vs);
  }

  /**
   * Gets a desired fpa.
   * @param distance is the distance traveled per minute.
   * @param altitude is the vertical speed per minute.
   * @returns The desired pitch angle.
   */
  private getFpa(distance: number, altitude: number): number {
    return UnitType.RADIAN.convertTo(Math.atan(altitude / distance), UnitType.DEGREE);
  }

  /**
   * Sets the desired AP pitch angle.
   * @param targetPitch The desired AP pitch angle.
   */
  private setPitch(targetPitch: number): void {
    if (isFinite(targetPitch)) {
      const verticalWindComponent = this.verticalWindAverage.getAverage(SimVar.GetSimVarValue('AMBIENT WIND Y', SimVarValueType.FPM));
      const verticalWindPitchAdjustment = VNavUtils.getFpa(UnitType.NMILE.convertTo(this.tas / 60, UnitType.FOOT), -verticalWindComponent);

      SimVar.SetSimVarValue('AUTOPILOT PITCH HOLD REF', SimVarValueType.Degree, -(targetPitch + verticalWindPitchAdjustment));
    }
  }

  /**
   * Default method to use for capturing a target altitude.
   * @param targetAltitude is the captured targed altitude
   * @param indicatedAltitude is the current indicated altitude
   * @param initialFpa is the FPA when capture was initiatiated
   * @returns The target pitch value to set.
   */
  private static captureAltitude(targetAltitude: number, indicatedAltitude: number, initialFpa: number): number {
    const altCapDeviation = indicatedAltitude - targetAltitude;
    const altCapPitchPercentage = Math.min(Math.abs(altCapDeviation) / 100, 1);
    const desiredPitch = (initialFpa * altCapPitchPercentage);
    const aoa = SimVar.GetSimVarValue('INCIDENCE ALPHA', SimVarValueType.Degree);
    return aoa + MathUtils.clamp(desiredPitch, -6, 6);
  }


}