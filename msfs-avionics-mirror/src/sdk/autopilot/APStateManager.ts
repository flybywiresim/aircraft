import { SubEvent, Subject } from '..';
import { EventBus, KeyEventData, KeyEvents, KeyInterceptManager, SimVarValueType } from '../data';
import { APEvents, APLockType } from '../instruments';
import { MSFSAPStates } from '../navigation';
import { APLateralModes, APVerticalModes } from './APConfig';

/** AP Mode Types */
export enum APModeType {
  LATERAL,
  VERTICAL,
  APPROACH
}

/** Interface for APModePressEvents */
export interface APModePressEvent {
  /** The Mode */
  mode: APLateralModes | APVerticalModes;
  /** The Set Value, if any */
  set?: boolean;
}

/**
 * A class that manages the autopilot modes and autopilot mode states.
 */
export abstract class APStateManager {

  private keyInterceptManager?: KeyInterceptManager;

  private readonly apListener: ViewListener.ViewListener;

  private apListenerRegistered = false;
  private managedModeSet = false;
  public stateManagerInitialized = Subject.create(false);

  public lateralPressed = new SubEvent<APModePressEvent>();
  public verticalPressed = new SubEvent<APModePressEvent>();
  public approachPressed = new SubEvent<boolean | undefined>();
  public vnavPressed = new SubEvent<boolean>();

  public apMasterOn = Subject.create(false);
  public fdMasterOn = Subject.create(false);

  /**
   * Creates an instance of the APStateManager.
   * @param bus An instance of the event bus.
   */
  constructor(protected readonly bus: EventBus) {

    KeyInterceptManager.getManager(bus).then(manager => {
      this.keyInterceptManager = manager;
      this.setupKeyIntercepts(manager);
      this.bus.getSubscriber<KeyEvents>().on('key_intercept').handle(this.handleKeyIntercepted.bind(this));
    });

    this.apListener = RegisterViewListener('JS_LISTENER_AUTOPILOT', () => {
      this.onAPListenerRegistered();
      this.apListenerRegistered = true;
    });
  }

  /**
   * A callback which is called when the autopilot listener has been registered.
   */
  protected onAPListenerRegistered(): void {
    const ap = this.bus.getSubscriber<APEvents>();

    ap.on('ap_lock_set').handle(lock => {
      if (lock === APLockType.VNav) {
        this.vnavPressed.notify(this, true);
      }
    });

    ap.on('ap_lock_release').handle(lock => {
      if (lock === APLockType.VNav) {
        this.vnavPressed.notify(this, false);
      }
    });

    ap.on('ap_master_disengage').handle(() => {
      this.apMasterOn.set(false);
    });

    ap.on('ap_master_engage').handle(() => {
      this.apMasterOn.set(true);
    });

    ap.on('flight_director_state').whenChanged().handle((fd) => {
      this.fdMasterOn.set(fd);
    });
  }

  /**
   * Sets up key intercepts for the simulation autopilot key events.
   * @param manager The key intercept manager.
   */
  protected abstract setupKeyIntercepts(manager: KeyInterceptManager): void;

  /**
   * Handles an intercepted key event.
   * @param data The event data.
   */
  protected abstract handleKeyIntercepted(data: KeyEventData): void;

  /**
   * Checks whether the AP State Manager has completed listerner steps,
   * and if so, finishes initializing and then notifies Autopilot of the same.
   * @param force forces the initialize
   */
  public initialize(force = false): void {
    this.onBeforeInitialize();
    if (force || (this.keyInterceptManager && this.apListenerRegistered)) {
      this.setManagedMode(true).then(() => {
        SimVar.SetSimVarValue('AUTOPILOT ALTITUDE LOCK VAR', SimVarValueType.Feet, 0);
        if (this.fdMasterOn.get()) {
          this.setFlightDirector(false);
        }
        this.stateManagerInitialized.set(true);
      });
    }
  }

  /**
   * Sets the Flight Director State
   * @param on is wheter to set the FD On.
   */
  public setFlightDirector(on: boolean): void {
    if (on !== this.fdMasterOn.get()) {
      SimVar.SetSimVarValue('K:TOGGLE_FLIGHT_DIRECTOR', 'number', 0);
    }
  }

  /**
   * Sets Managed Mode.
   * @param set is wheter to set or unset managed mode.
   */
  private async setManagedMode(set: boolean): Promise<void> {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        if (set) {
          Coherent.call('apSetAutopilotMode', MSFSAPStates.AvionicsManaged, 1).then(() => resolve());
        } else {
          Coherent.call('apSetAutopilotMode', MSFSAPStates.AvionicsManaged, 0).then(() => resolve());
        }
        this.managedModeSet = set;
      }, 1000);
    });
  }

  /**
   * Toggles VNAV L Var value.
   */
  protected toggleVnav(): void {
    const vnavXmlVarValue = SimVar.GetSimVarValue('L:XMLVAR_VNAVButtonValue', 'Bool');
    SimVar.SetSimVarValue('L:XMLVAR_VNAVButtonValue', 'Bool', vnavXmlVarValue ? 0 : 1);
  }

  /**
   * Sends AP Mode Events from the Intercept to the Autopilot.
   * @param type is the AP Mode Type for this event
   * @param mode is the mode to set/unset.
   * @param set is whether to actively set or unset this mode.
   */
  protected sendApModeEvent(type: APModeType, mode?: APLateralModes | APVerticalModes, set?: boolean): void {
    switch (type) {
      case APModeType.LATERAL:
        if (mode !== undefined) {
          this.lateralPressed.notify(this, { mode: mode, set: set });
        }
        break;
      case APModeType.VERTICAL:
        if (mode !== undefined) {
          this.verticalPressed.notify(this, { mode: mode, set: set });
        }
        break;
      case APModeType.APPROACH:
        this.approachPressed.notify(this, set);
        break;
    }
  }

  /**
   * Method to override with steps to run before initialze method is run.
   */
  protected onBeforeInitialize(): void {
    //noop
  }
}