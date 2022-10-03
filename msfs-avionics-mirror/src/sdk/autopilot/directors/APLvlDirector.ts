/// <reference types="msfstypes/JS/simvar" />

import { EventBus } from '../../data';
import { AhrsEvents } from '../../instruments';
import { LinearServo } from '../../utils/controllers';
import { DirectorState, PlaneDirector } from './PlaneDirector';

/**
 * An autopilot wing leveler director.
 */
export class APLvlDirector implements PlaneDirector {

  public state: DirectorState;

  /** A callback called when the wing leveler director activates. */
  public onActivate?: () => void;

  /** A callback called when the wing leveler director arms. */
  public onArm?: () => void;

  private currentBankRef = 0;
  private desiredBank = 0;
  private actualBank = 0;

  private readonly bankServo = new LinearServo(10);


  /**
   * Creates an instance of the wing leveler.
   * @param bus The event bus to use with this instance.
   */
  constructor(private readonly bus: EventBus) {
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
    this.desiredBank = 0;
    if (this.onActivate !== undefined) {
      this.onActivate();
    }
    SimVar.SetSimVarValue('AUTOPILOT WING LEVELER', 'Bool', true);
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
    SimVar.SetSimVarValue('AUTOPILOT WING LEVELER', 'Bool', false);
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