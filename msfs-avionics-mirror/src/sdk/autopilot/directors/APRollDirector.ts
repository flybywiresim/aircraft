/// <reference types="msfstypes/JS/simvar" />

import { EventBus } from '../../data';
import { AhrsEvents } from '../../instruments';
import { MathUtils } from '../../math';
import { LinearServo } from '../../utils/controllers';
import { APValues } from '../APConfig';
import { DirectorState, PlaneDirector } from './PlaneDirector';

/**
 * Options for control of the roll director.
 */
export interface RollDirectorOptions {
  /** The minimum bank angle under which the roll director will go to wings level. */
  minimumBankAngle: number,

  /** The maximum bank angle that the roll director will not exceed. */
  maximumBankAngle: number
}

/**
 * An autopilot roll director.
 */
export class APRollDirector implements PlaneDirector {

  public state: DirectorState;

  /** A callback called when the LNAV director activates. */
  public onActivate?: () => void;

  /** A callback called when the LNAV director arms. */
  public onArm?: () => void;

  private currentBankRef = 0;
  private desiredBank = 0;
  private actualBank = 0;

  private readonly bankServo = new LinearServo(10);


  /**
   * Creates an instance of the LateralDirector.
   * @param bus The event bus to use with this instance.
   * @param apValues The AP Values.
   * @param options Options to set on the roll director for bank angle limitations.
   */
  constructor(private readonly bus: EventBus, private readonly apValues: APValues, private readonly options?: RollDirectorOptions) {
    this.state = DirectorState.Inactive;

    const sub = this.bus.getSubscriber<AhrsEvents>();
    sub.on('roll_deg').withPrecision(1).handle((roll) => {
      this.actualBank = roll;
    });
  }

  /**
   * Activates this director.
   */
  public activate(): void {
    this.state = DirectorState.Active;

    const maxBank = Math.min(this.options?.maximumBankAngle ?? 90, this.apValues.maxBankAngle.get());
    const minBank = this.options?.minimumBankAngle ?? 0;

    if (Math.abs(this.actualBank) < minBank) {
      this.desiredBank = 0;
    } else {
      this.desiredBank = MathUtils.clamp(this.actualBank, -maxBank, maxBank);
    }

    if (this.onActivate !== undefined) {
      this.onActivate();
    }

    SimVar.SetSimVarValue('AUTOPILOT BANK HOLD', 'Bool', true);
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
    this.desiredBank = 0;
    SimVar.SetSimVarValue('AUTOPILOT BANK HOLD', 'Bool', false);
  }

  /**
   * Updates this director.
   */
  public update(): void {
    if (this.state === DirectorState.Active) {
      this.setBank(this.desiredBank);
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
}