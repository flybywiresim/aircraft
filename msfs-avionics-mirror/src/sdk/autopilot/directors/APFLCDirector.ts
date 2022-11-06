/// <reference types="msfstypes/JS/simvar" />

import { EventBus, SimVarValueType } from '../../data';
import { AdcEvents, AhrsEvents } from '../../instruments';
import { ExpSmoother, MathUtils, UnitType } from '../../math';
import { PidController } from '../../utils/controllers';
import { APValues } from '../APConfig';
import { DirectorState, PlaneDirector } from './PlaneDirector';

/**
 * A Flight Level Change autopilot director.
 */
export class APFLCDirector implements PlaneDirector {

  public state: DirectorState;

  /** A callback called when the director activates. */
  public onActivate?: () => void;

  /** A callback called when the director arms. */
  public onArm?: () => void;

  private _lastTime = 0;
  private currentIas = 0;
  private selectedIas = 0;
  private selectedMach = 0;
  private isSelectedSpeedInMach = false;
  private selectedAltitude = 0;
  private currentAltitude = 0;
  private currentPitch = 0;
  private accelerationController = new PidController(.3, 0, 0.5, 10, -10);
  private pitchController = new PidController(1.5, 0, 0, 15, -15);
  private filter = new ExpSmoother(5);

  /**
   * Creates an instance of the FLC Director.
   * @param bus The event bus to use with this instance.
   * @param apValues is the AP selected values subject.
   * @param pitchClamp is the maximum pitch angle, in degrees, to clamp FLC at.
   */
  constructor(private readonly bus: EventBus, apValues: APValues, private pitchClamp = 15) {
    this.state = DirectorState.Inactive;

    const sub = this.bus.getSubscriber<AdcEvents & AhrsEvents>();
    sub.on('indicated_alt').withPrecision(0).handle((alt) => {
      this.currentAltitude = alt;
    });
    sub.on('ias').withPrecision(2).handle((ias) => {
      this.currentIas = ias;
    });
    sub.on('pitch_deg').withPrecision(1).handle((pitch) => {
      this.currentPitch = -pitch;
    });

    apValues.selectedIas.sub((ias) => {
      this.selectedIas = ias;
    });
    apValues.selectedMach.sub((mach) => {
      this.selectedMach = mach;
    });
    apValues.isSelectedSpeedInMach.sub((isMach) => {
      this.isSelectedSpeedInMach = isMach;
    });
    apValues.selectedAltitude.sub((alt) => {
      this.selectedAltitude = alt;
    });
  }

  /**
   * Activates this director.
   */
  public activate(): void {
    this.state = DirectorState.Active;
    this.initialize();
    this.onActivate && this.onActivate();
    SimVar.SetSimVarValue('AUTOPILOT FLIGHT LEVEL CHANGE', 'Bool', true);
    // Make sure we sync the selected IAS when FLC activates.
    SimVar.SetSimVarValue('K:AP_SPD_VAR_SET', 'number', this.currentIas);
  }

  /**
   * Arms this director.
   * This director can be armed, but it will never automatically activate and remain in the armed state.
   */
  public arm(): void {
    this.state = DirectorState.Armed;
    this.onArm && this.onArm();
  }

  /**
   * Deactivates this director.
   */
  public deactivate(): void {
    this.state = DirectorState.Inactive;
    SimVar.SetSimVarValue('AUTOPILOT FLIGHT LEVEL CHANGE', 'Bool', false);
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
   * Initializes this director on activation.
   */
  private initialize(): void {
    this._lastTime = 0;
    this.accelerationController.reset();
    this.pitchController.reset();
  }

  /**
   * Gets a desired pitch from the selected vs value.
   * @returns The desired pitch angle.
   */
  private getDesiredPitch(): number {
    const time = performance.now() / 1000;
    let dt = time - this._lastTime;
    if (this._lastTime === 0) {
      dt = 0;
    }

    const targetIas = this.isSelectedSpeedInMach ? Simplane.getMachToKias(this.selectedMach) : this.selectedIas;

    //step 1 - we want to find the IAS error from target and set a target acceleration
    const iasError = this.currentIas - targetIas;
    const targetAcceleration = this.accelerationController.getOutput(dt, -iasError);

    //step 2 - we want to find the current acceleration, feed that to the pid to manage to the target acceleration
    const acceleration = UnitType.FOOT.convertTo(SimVar.GetSimVarValue('ACCELERATION BODY Z', 'feet per second squared'), UnitType.NMILE) * 3600;
    const accelerationError = acceleration - targetAcceleration;
    const pitchCorrection = this.pitchController.getOutput(dt, accelerationError);

    const aoa = SimVar.GetSimVarValue('INCIDENCE ALPHA', SimVarValueType.Degree);
    this._lastTime = time;
    let targetPitch = isNaN(pitchCorrection) ? this.currentPitch - aoa : (this.currentPitch - aoa) + pitchCorrection;
    targetPitch = this.filter.next(targetPitch, dt);

    if (this.selectedAltitude > this.currentAltitude) {
      return MathUtils.clamp(targetPitch + aoa, aoa, this.pitchClamp);
    } else {
      return MathUtils.clamp(targetPitch + aoa, -this.pitchClamp, aoa);
    }
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