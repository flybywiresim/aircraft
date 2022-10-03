/// <reference types="msfstypes/JS/simvar" />

import { EventBus, SimVarValueType } from '../../data';
import { AdcEvents } from '../../instruments';
import { MathUtils, SimpleMovingAverage, UnitType } from '../../math';
import { APValues } from '../APConfig';
import { DirectorState, PlaneDirector } from './PlaneDirector';

/**
 * A vertical speed autopilot director.
 */
export class APVSDirector implements PlaneDirector {

  public state: DirectorState;

  /** A callback called when the director activates. */
  public onActivate?: () => void;

  /** A callback called when the director arms. */
  public onArm?: () => void;

  private tas = 0;
  private selectedVS = 0;
  private verticalWindAverage = new SimpleMovingAverage(10);


  /**
   * Creates an instance of the LateralDirector.
   * @param bus The event bus to use with this instance.
   * @param apValues are the ap selected values for the autopilot.
   */
  constructor(private readonly bus: EventBus, apValues: APValues) {
    this.state = DirectorState.Inactive;

    this.bus.getSubscriber<AdcEvents>().on('tas').withPrecision(0).handle((tas) => {
      this.tas = tas;
    });

    apValues.selectedVerticalSpeed.sub((vs) => {
      this.selectedVS = vs;
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
    Coherent.call('AP_VS_VAR_SET_ENGLISH', 1, Simplane.getVerticalSpeed());
    SimVar.SetSimVarValue('AUTOPILOT VERTICAL HOLD', 'Bool', true);
  }

  /**
   * Arms this director.
   * This director has no armed mode, so it activates immediately.
   */
  public arm(): void {
    if (this.state == DirectorState.Inactive) {
      this.activate();
    }
  }

  /**
   * Deactivates this director.
   */
  public deactivate(): void {
    this.state = DirectorState.Inactive;
    SimVar.SetSimVarValue('AUTOPILOT VERTICAL HOLD', 'Bool', false);
  }

  /**
   * Updates this director.
   */
  public update(): void {
    if (this.state === DirectorState.Active) {
      this.setPitch(this.getDesiredPitch());
    }
  }

  /**
   * Gets a desired pitch from the selected vs value.
   * @returns The desired pitch angle.
   */
  private getDesiredPitch(): number {
    //We need the instant AOA and VS here so we're avoiding the bus
    const aoa = SimVar.GetSimVarValue('INCIDENCE ALPHA', SimVarValueType.Degree);
    const verticalWindComponent = this.verticalWindAverage.getAverage(SimVar.GetSimVarValue('AMBIENT WIND Y', SimVarValueType.FPM));

    const desiredPitch = this.getFpa(UnitType.NMILE.convertTo(this.tas / 60, UnitType.FOOT), this.selectedVS - verticalWindComponent);
    return MathUtils.clamp(aoa + (isNaN(desiredPitch) ? 10 : desiredPitch), -10, 10);
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
      SimVar.SetSimVarValue('AUTOPILOT PITCH HOLD REF', SimVarValueType.Degree, -targetPitch);
    }
  }
}