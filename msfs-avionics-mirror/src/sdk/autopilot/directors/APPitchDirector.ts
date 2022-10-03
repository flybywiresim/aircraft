/// <reference types="msfstypes/JS/simvar" />

import { EventBus, KeyEventData, KeyEvents, KeyInterceptManager, SimVarValueType } from '../../data';
import { AhrsEvents } from '../../instruments';
import { MathUtils } from '../../math';
import { APValues } from '../APConfig';
import { DirectorState, PlaneDirector } from './PlaneDirector';

/**
 * An autopilot pitch director.
 */
export class APPitchDirector implements PlaneDirector {

  public state: DirectorState;
  private keyInterceptManager?: KeyInterceptManager;

  /** A callback called when the director activates. */
  public onActivate?: () => void;
  /** A callback called when the director arms. */
  public onArm?: () => void;

  private selectedPitch = 0;
  private currentPitch = 0;

  /**
   * Creates an instance of the LateralDirector.
   * @param bus The event bus to use with this instance.
   * @param apValues are the AP Values subjects.
   * @param pitchIncrement is the pitch increment, in degrees, to use when the user presses the pitch inc/dec keys (default: 0.5)
   * @param minPitch is the negative minimum pitch angle, in degrees, to clamp the pitch to. (default: -15)
   * @param maxPitch is the positive maximum pitch angle, in degrees, to clamp the pitch to. (default: 20)
   */
  constructor(private readonly bus: EventBus, private readonly apValues: APValues,
    private readonly pitchIncrement = 0.5, private readonly minPitch = -15, private readonly maxPitch = 20) {
    this.state = DirectorState.Inactive;
    this.apValues.selectedPitch.sub((p) => {
      this.selectedPitch = p;
      if (this.state == DirectorState.Active) {
        // send it in again to make sure its clamped
        this.setPitch(p);
      }
    });

    const ahrsSub = this.bus.getSubscriber<AhrsEvents>();
    ahrsSub.on('pitch_deg').withPrecision(1).handle((p) => {
      this.currentPitch = p;
    });

    // setup inc/dec event intercept
    KeyInterceptManager.getManager(bus).then(manager => {
      this.keyInterceptManager = manager;

      manager.interceptKey('AP_PITCH_REF_INC_UP', false);
      manager.interceptKey('AP_PITCH_REF_INC_DN', false);

      const keySub = this.bus.getSubscriber<KeyEvents>();
      keySub.on('key_intercept').handle(this.onKeyIntercepted.bind(this));

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
    this.setPitch(this.currentPitch);
    SimVar.SetSimVarValue('AUTOPILOT PITCH HOLD', 'Bool', true);
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
    SimVar.SetSimVarValue('AUTOPILOT PITCH HOLD', 'Bool', false);
  }

  /**
   * Responds to key intercepted events.
   * @param k the key event data
   */
  private onKeyIntercepted(k: KeyEventData): void {
    switch (k.key) {
      case 'AP_PITCH_REF_INC_UP':
      case 'AP_PITCH_REF_INC_DN':
        this.setPitch(this.selectedPitch + (k.key === 'AP_PITCH_REF_INC_UP' ? -this.pitchIncrement : this.pitchIncrement));
        break;
      default:
        return;
    }
  }

  /**
   * Updates this director.
   */
  public update(): void {
    //noop
  }

  /**
   * Sets the desired AP pitch angle.
   * @param targetPitch The desired AP pitch angle.
   */
  private setPitch(targetPitch: number): void {
    if (isFinite(targetPitch)) {
      // HINT: min/max pitch are reversed as the pitch is inverted in the sim
      SimVar.SetSimVarValue('AUTOPILOT PITCH HOLD REF', SimVarValueType.Degree, MathUtils.clamp(targetPitch, -this.maxPitch, -this.minPitch));
    }
  }
}