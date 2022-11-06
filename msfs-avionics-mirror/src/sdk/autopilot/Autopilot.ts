/// <reference types="msfstypes/Coherent/APController" />

import { ControlEvents, EventBus } from '../data';
import { FlightPlanner } from '../flightplan';
import { AdcEvents, APEvents, NavEvents, NavProcSimVars, NavSourceId, NavSourceType } from '../instruments';
import { MSFSAPStates } from '../navigation';
import { Subject } from '../sub';
import { APAltitudeModes, APConfig, APLateralModes, APValues, APVerticalModes } from './APConfig';
import { VNavEvents } from './data/VNavEvents';
import { DirectorState, PlaneDirector } from './directors/PlaneDirector';
import { APModePressEvent, APStateManager } from './managers/APStateManager';
import { NavToNavManager } from './managers/NavToNavManager';
import { VNavManager } from './managers/VNavManager';
import { VNavAltCaptureType, VNavState } from './VerticalNavigation';

/**
 * A collection of autopilot plane directors.
 */
export type APDirectors = {

  /** The autopilot's heading mode director. */
  readonly headingDirector?: PlaneDirector;

  /** The autopilot's roll mode director. */
  readonly rollDirector?: PlaneDirector;

  /** The autopilot's wings level mode director. */
  readonly wingLevelerDirector?: PlaneDirector;

  /** The autopilot's GPS LNAV mode director. */
  readonly gpssDirector?: PlaneDirector;

  /** The autopilot's VOR mode director. */
  readonly vorDirector?: PlaneDirector;

  /** The autopilot's LOC  mode director. */
  readonly locDirector?: PlaneDirector;

  /** The autopilot's back-course mode director. */
  readonly bcDirector?: PlaneDirector;

  /** The autopilot's pitch mode director. */
  readonly pitchDirector?: PlaneDirector;

  /** The autopilot's vertical speed mode director. */
  readonly vsDirector?: PlaneDirector;

  /** The autopilot's flight level change mode director. */
  readonly flcDirector?: PlaneDirector;

  /** The autopilot's altitude hold mode director. */
  readonly altHoldDirector?: PlaneDirector;

  /** The autopilot's wings altitude capture director. */
  readonly altCapDirector?: PlaneDirector;

  /** The autopilot's VNAV path mode director. */
  readonly vnavPathDirector?: PlaneDirector;

  /** The autopilot's GPS glidepath mode director. */
  readonly gpDirector?: PlaneDirector;

  /** The autopilot's ILS glideslope mode director. */
  readonly gsDirector?: PlaneDirector;
}

/**
 * An Autopilot.
 */
export class Autopilot {
  /** This autopilot's plane directors. */
  public readonly directors: APDirectors;

  /** This autopilot's nav-to-nav transfer manager. */
  public readonly navToNavManager: NavToNavManager | undefined;

  /** This autopilot's VNav Manager. */
  public readonly vnavManager: VNavManager | undefined;

  /** This autopilot's variable bank angle Manager. */
  public readonly variableBankManager: Record<any, any> | undefined;

  protected cdiSource: NavSourceId = { type: NavSourceType.Nav, index: 0 };

  protected lateralModes: Map<APLateralModes, PlaneDirector> = new Map();

  protected verticalModes: Map<APVerticalModes, PlaneDirector> = new Map();
  protected verticalAltitudeArmed: APAltitudeModes = APAltitudeModes.NONE;
  protected verticalApproachArmed: APVerticalModes = APVerticalModes.NONE;
  protected altCapArmed = false;
  protected lateralModeFailed = false;

  protected inClimb = false;
  protected currentAltitude = 0;
  protected vnavCaptureType = VNavAltCaptureType.None;

  protected flightPlanSynced = false;

  /** Can be set to false in child classes to override behavior for certain aircraft. */
  protected requireApproachIsActiveForNavToNav = true;

  public readonly apValues: APValues = {
    selectedAltitude: Subject.create(0),
    selectedVerticalSpeed: Subject.create(0),
    selectedIas: Subject.create(0),
    selectedMach: Subject.create(0),
    isSelectedSpeedInMach: Subject.create<boolean>(false),
    selectedPitch: Subject.create(0),
    maxBankAngle: Subject.create(30),
    selectedHeading: Subject.create(0),
    capturedAltitude: Subject.create(0),
    approachIsActive: Subject.create<boolean>(false),
    approachHasGP: Subject.create<boolean>(false),
    nav1HasGs: Subject.create<boolean>(false),
    nav2HasGs: Subject.create<boolean>(false),
    lateralActive: Subject.create<APLateralModes>(APLateralModes.NONE),
    verticalActive: Subject.create<APVerticalModes>(APVerticalModes.NONE),
    lateralArmed: Subject.create<APLateralModes>(APLateralModes.NONE),
    verticalArmed: Subject.create<APVerticalModes>(APVerticalModes.NONE),
    apApproachModeOn: Subject.create<boolean>(false)
  };

  protected autopilotInitialized = false;

  /**
   * Creates an instance of the Autopilot.
   * @param bus The event bus.
   * @param flightPlanner This autopilot's associated flight planner.
   * @param config This autopilot's configuration.
   * @param stateManager This autopilot's state manager.
   */
  constructor(
    protected readonly bus: EventBus,
    protected readonly flightPlanner: FlightPlanner,
    protected readonly config: APConfig,
    public readonly stateManager: APStateManager
  ) {
    this.apValues.maxBankAngle.set(config.defaultMaxBankAngle);
    this.directors = this.createDirectors(config);
    this.vnavManager = config.createVNavManager(this.apValues);
    this.navToNavManager = config.createNavToNavManager(this.apValues);
    this.variableBankManager = config.createVariableBankManager(this.apValues);
    this.apValues.navToNavLocArm = this.navToNavManager?.canLocArm;

    this.stateManager.stateManagerInitialized.sub((v) => {
      if (v) {
        this.autopilotInitialized = true;
      } else {
        this.autopilotInitialized = false;
      }
      this.onInitialized();
    });

    this.flightPlanner.flightPlanSynced.on((sender, v) => {
      if (!this.flightPlanSynced && v) {
        this.stateManager.stateManagerInitialized.set(false);
        this.stateManager.initialize(true);
        this.flightPlanSynced = true;
      }
    });

    this.initLateralModes();
    this.initVerticalModes();
    this.initNavToNavManager();
    this.initVNavManager();
    this.monitorEvents();
  }

  /**
   * Creates this autopilot's directors.
   * @param config This autopilot's configuration.
   * @returns This autopilot's directors.
   */
  private createDirectors(config: APConfig): APDirectors {
    return {
      headingDirector: config.createHeadingDirector(this.apValues),
      rollDirector: config.createRollDirector(this.apValues),
      wingLevelerDirector: config.createWingLevelerDirector(this.apValues),
      gpssDirector: config.createGpssDirector(this.apValues),
      vorDirector: config.createVorDirector(this.apValues),
      locDirector: config.createLocDirector(this.apValues),
      bcDirector: config.createBcDirector(this.apValues),
      pitchDirector: config.createPitchDirector(this.apValues),
      vsDirector: config.createVsDirector(this.apValues),
      flcDirector: config.createFlcDirector(this.apValues),
      altHoldDirector: config.createAltHoldDirector(this.apValues),
      altCapDirector: config.createAltCapDirector(this.apValues),
      vnavPathDirector: config.createVNavPathDirector(this.apValues),
      gpDirector: config.createGpDirector(this.apValues),
      gsDirector: config.createGsDirector(this.apValues)
    };
  }

  /**
   * Update method for the Autopilot.
   */
  public update(): void {
    if (this.autopilotInitialized) {
      this.onBeforeUpdate();
      this.checkModes();
      this.manageAltitudeCapture();
      this.updateModes();
      this.onAfterUpdate();
    }
  }

  /**
   * This method runs each update cycle before the update occurs.
   */
  protected onBeforeUpdate(): void {
    // noop
  }

  /**
   * This method runs each update cycle after the update occurs.
   */
  protected onAfterUpdate(): void {
    // noop
  }

  /**
   * This method runs whenever the initialized state of the Autopilot changes.
   */
  protected onInitialized(): void {
    // noop
  }

  /**
   * Handles input from the State Manager when a lateral mode button is pressed.
   * @param data is the AP Lateral Mode Event Data
   */
  protected lateralPressed(data: APModePressEvent): void {
    const mode = data.mode as APLateralModes;
    if (mode !== APLateralModes.NAV && !this.lateralModes.has(mode)) {
      return;
    }
    const set = data.set;
    if (set === undefined || set === false) {
      if (this.isLateralModeActivatedOrArmed(mode)) {
        return;
      }
    }
    if (set === undefined || set === true) {
      if (!this.stateManager.isFlightDirectorOn.get()) {
        this.stateManager.setFlightDirector(true);
      }
      switch (mode) {
        case APLateralModes.NONE:
          break;
        case APLateralModes.LEVEL:
        case APLateralModes.ROLL:
        case APLateralModes.HEADING:
        case APLateralModes.LOC:
        case APLateralModes.BC:
          this.lateralModes.get(mode)?.arm();
          break;
        case APLateralModes.NAV:
          if (this.cdiSource.type === NavSourceType.Gps) {
            this.lateralModes.get(APLateralModes.GPSS)?.arm();
          } else {
            this.lateralModes.get(APLateralModes.VOR)?.arm();
            this.lateralModes.get(APLateralModes.LOC)?.arm();
          }
          break;
      }
    }
  }

  /**
   * Handles input from the State Manager when a vertical mode button is pressed.
   * @param data is the AP Vertical Mode Event Data
   */
  protected verticalPressed(data: APModePressEvent): void {
    const mode = data.mode as APVerticalModes;
    if (!this.verticalModes.has(mode)) {
      return;
    }
    const set = data.set;
    if (set === undefined || set === false) {
      if (this.deactivateArmedOrActiveVerticalMode(mode)) {
        return;
      }
    }
    if (set === undefined || set === true) {
      if (!this.stateManager.isFlightDirectorOn.get()) {
        this.stateManager.setFlightDirector(true);
      }
      switch (mode) {
        case APVerticalModes.NONE:
        case APVerticalModes.PATH:
          break;
        case APVerticalModes.ALT:
          if (this.vnavManager?.state !== VNavState.Enabled_Active ||
            (this.vnavManager && this.vnavManager.state === VNavState.Enabled_Active && this.vnavManager.canVerticalModeActivate(mode))) {
            this.setAltHold();
          }
          break;
        case APVerticalModes.PITCH:
        case APVerticalModes.VS:
        case APVerticalModes.FLC:
          if (this.vnavManager?.state === VNavState.Enabled_Active && !this.vnavManager.canVerticalModeActivate(mode)) {
            // If the VNav Manager is active, don't activate the mode until VNav Approves.
            this.verticalModes.get(mode)?.arm();
          } else {
            this.verticalModes.get(mode)?.activate();
          }
          break;
        case APVerticalModes.GP:
        case APVerticalModes.GS:
          this.verticalModes.get(mode)?.arm();
      }
    }
  }

  /**
   * Checks if a mode is active or armed and optionally deactivates it.
   * @param mode is the AP Mode to check.
   * @returns whether this mode was active or armed and subsequently disabled.
   */
  protected isLateralModeActivatedOrArmed(mode: APLateralModes): boolean {
    const { lateralActive, lateralArmed } = this.apValues;
    switch (mode) {
      case lateralActive.get():
        this.lateralModes.get(mode)?.deactivate();
        this.lateralModes.get(this.config.defaultLateralMode)?.arm();
        return true;
      case lateralArmed.get():
        this.lateralModes.get(mode)?.deactivate();
        lateralArmed.set(APLateralModes.NONE);
        return true;
      case APLateralModes.NAV: {
        const activeNavMode = lateralActive.get() === APLateralModes.LOC ? APLateralModes.LOC
          : lateralActive.get() === APLateralModes.VOR ? APLateralModes.VOR
            : lateralActive.get() === APLateralModes.GPSS ? APLateralModes.GPSS
              : APLateralModes.NONE;
        if (activeNavMode !== APLateralModes.NONE) {
          this.lateralModes.get(activeNavMode)?.deactivate();
          this.lateralModes.get(this.config.defaultLateralMode)?.arm();
          lateralActive.set(this.config.defaultLateralMode);
        }
        const armedNavMode = lateralArmed.get() === APLateralModes.LOC ? APLateralModes.LOC
          : lateralArmed.get() === APLateralModes.VOR ? APLateralModes.VOR
            : lateralArmed.get() === APLateralModes.GPSS ? APLateralModes.GPSS
              : APLateralModes.NONE;
        if (armedNavMode !== APLateralModes.NONE) {
          this.lateralModes.get(armedNavMode)?.deactivate();
          lateralArmed.set(APLateralModes.NONE);
        }
        if (armedNavMode !== APLateralModes.NONE || activeNavMode !== APLateralModes.NONE) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Checks if a mode is active or armed and deactivates it.
   * @param mode is the AP Mode to check.
   * @returns whether this mode was active or armed and subsequently disabled.
   */
  protected deactivateArmedOrActiveVerticalMode(mode: APVerticalModes): boolean {
    const { verticalActive, verticalArmed } = this.apValues;
    switch (mode) {
      case verticalActive.get():
        this.verticalModes.get(mode)?.deactivate();
        verticalActive.set(this.config.defaultVerticalMode);
        this.verticalModes.get(verticalActive.get())?.arm();
        return true;
      case verticalArmed.get():
        if (mode !== APVerticalModes.ALT) {
          this.verticalModes.get(mode)?.deactivate();
          verticalArmed.set(APVerticalModes.NONE);
          return true;
        }
        break;
      case this.verticalApproachArmed:
        this.verticalModes.get(mode)?.deactivate();
        this.verticalApproachArmed = APVerticalModes.NONE;
        return true;
    }
    return false;
  }

  /**
   * Handles input from the State Manager when the APPR button is pressed.
   * @param set is whether this event commands a specific set
   */
  protected approachPressed(set?: boolean): void {
    if ((set === undefined || set === false) && this.deactivateArmedOrActiveVerticalMode(APVerticalModes.GP)) {
      this.lateralModes.get(APLateralModes.GPSS)?.deactivate();
      return;
    }
    if ((set === undefined || set === false) && this.deactivateArmedOrActiveVerticalMode(APVerticalModes.GS)) {
      this.lateralModes.get(APLateralModes.LOC)?.deactivate();
      return;
    }
    if (set === undefined || set === true) {
      switch (this.getArmableApproachType()) {
        case APLateralModes.LOC:
          if (this.lateralModes.get(APLateralModes.LOC)?.state === DirectorState.Inactive) {
            this.lateralModes.get(APLateralModes.LOC)?.arm();
          }
          this.verticalModes.get(APVerticalModes.GS)?.arm();
          break;
        case APLateralModes.GPSS:
          if (this.lateralModes.get(APLateralModes.GPSS)?.state === DirectorState.Inactive) {
            this.lateralModes.get(APLateralModes.GPSS)?.arm();
          }
          this.verticalModes.get(APVerticalModes.GP)?.arm();
          break;
      }
    }
  }

  /**
   * Returns the AP Lateral Mode that can be armed.
   * @returns The AP Lateral Mode that can be armed.
   */
  protected getArmableApproachType(): APLateralModes {
    switch (this.cdiSource.type) {
      case NavSourceType.Nav:
        if (this.cdiSource.index === 1 && this.apValues.nav1HasGs.get()) {
          return APLateralModes.LOC;
        } else if (this.cdiSource.index === 2 && this.apValues.nav2HasGs.get()) {
          return APLateralModes.LOC;
        }
        break;
      case NavSourceType.Gps:
        if (this.apValues.approachIsActive.get() && this.apValues.approachHasGP.get()) {
          return APLateralModes.GPSS;
        } else if (this.navToNavManager && this.navToNavManager.canLocArm()) {
          return APLateralModes.LOC;
        }
    }
    return APLateralModes.NONE;
  }

  /**
   * Callback to set the lateral active mode.
   * @param mode is the mode being set.
   */
  protected setLateralActive(mode: APLateralModes): void {
    const { lateralActive, lateralArmed } = this.apValues;
    this.checkRollModeActive();
    if (lateralArmed.get() === mode) {
      lateralArmed.set(APLateralModes.NONE);
    }
    if (mode !== lateralActive.get()) {
      const currentMode = this.lateralModes.get(lateralActive.get());
      currentMode?.deactivate();
      lateralActive.set(mode);
    }
  }

  /**
   * Callback to set the lateral armed mode.
   * @param mode is the mode being set.
   */
  private setLateralArmed(mode: APLateralModes): void {
    const { lateralArmed } = this.apValues;
    const currentMode = this.lateralModes.get(lateralArmed.get());
    currentMode?.deactivate();
    lateralArmed.set(mode);
  }

  /**
   * Callback to set the vertical active mode.
   * @param mode is the mode being set.
   */
  private setVerticalActive(mode: APVerticalModes): void {
    const { verticalActive, verticalArmed } = this.apValues;
    this.checkPitchModeActive();
    if (verticalArmed.get() === mode) {
      verticalArmed.set(APVerticalModes.NONE);
    } else if (this.verticalApproachArmed === mode) {
      this.verticalApproachArmed = APVerticalModes.NONE;
    }
    if (mode !== verticalActive.get()) {
      const currentMode = this.verticalModes.get(verticalActive.get());
      if (currentMode?.state !== DirectorState.Inactive) {
        currentMode?.deactivate();
      }
      verticalActive.set(mode);
    }
  }

  /**
   * Callback to set the vertical armed mode.
   * @param mode is the mode being set.
   */
  private setVerticalArmed(mode: APVerticalModes): void {
    const { verticalArmed } = this.apValues;
    if (mode !== verticalArmed.get()) {
      const currentMode = this.verticalModes.get(verticalArmed.get());
      if (currentMode?.state !== DirectorState.Inactive) {
        currentMode?.deactivate();
      }
    }
    verticalArmed.set(mode);
  }

  /**
   * Callback to set the vertical approach armed mode.
   * @param mode is the mode being set.
   */
  private setVerticalApproachArmed(mode: APVerticalModes): void {
    const currentMode = this.verticalModes.get(this.verticalApproachArmed);
    currentMode?.deactivate();
    this.verticalApproachArmed = mode;
  }

  /**
   * Method called when the ALT button is pressed.
   */
  protected setAltHold(): void {
    if (this.verticalModes.has(APVerticalModes.ALT)) {
      const currentAlt = 10 * (this.inClimb ? Math.ceil(this.currentAltitude / 10) : Math.floor(this.currentAltitude / 10));
      this.apValues.capturedAltitude.set(currentAlt);
      this.verticalModes.get(APVerticalModes.ALT)?.activate();
    }
  }

  /**
   * Initializes the Autopilot with the available lateral modes from the config.
   */
  private initLateralModes(): void {
    if (this.directors.rollDirector) {
      this.lateralModes.set(APLateralModes.ROLL, this.directors.rollDirector);
      this.directors.rollDirector.onActivate = (): void => {
        this.setLateralActive(APLateralModes.ROLL);
      };
    }
    if (this.directors.wingLevelerDirector) {
      this.lateralModes.set(APLateralModes.LEVEL, this.directors.wingLevelerDirector);
      this.directors.wingLevelerDirector.onActivate = (): void => {
        this.setLateralActive(APLateralModes.LEVEL);
      };
    }
    if (this.directors.headingDirector) {
      this.lateralModes.set(APLateralModes.HEADING, this.directors.headingDirector);
      this.directors.headingDirector.onActivate = (): void => {
        this.setLateralActive(APLateralModes.HEADING);
      };
    }
    if (this.directors.gpssDirector) {
      this.lateralModes.set(APLateralModes.GPSS, this.directors.gpssDirector);
      this.directors.gpssDirector.onArm = (): void => {
        this.setLateralArmed(APLateralModes.GPSS);
      };
      this.directors.gpssDirector.onActivate = (): void => {
        this.setLateralActive(APLateralModes.GPSS);
      };
    }
    if (this.directors.vorDirector) {
      this.lateralModes.set(APLateralModes.VOR, this.directors.vorDirector);
      this.directors.vorDirector.onArm = (): void => {
        this.setLateralArmed(APLateralModes.VOR);
      };
      this.directors.vorDirector.onActivate = (): void => {
        this.setLateralActive(APLateralModes.VOR);
      };
    }
    if (this.directors.locDirector) {
      this.lateralModes.set(APLateralModes.LOC, this.directors.locDirector);
      this.directors.locDirector.onArm = (): void => {
        this.setLateralArmed(APLateralModes.LOC);
      };
      this.directors.locDirector.onActivate = (): void => {
        this.setLateralActive(APLateralModes.LOC);
      };
    }
    if (this.directors.bcDirector) {
      this.lateralModes.set(APLateralModes.BC, this.directors.bcDirector);
      this.directors.bcDirector.onArm = (): void => {
        this.setLateralArmed(APLateralModes.BC);
      };
      this.directors.bcDirector.onActivate = (): void => {
        this.setLateralActive(APLateralModes.BC);
      };
    }
  }

  /**
   * Initializes the Autopilot with the available Nav To Nav Manager.
   */
  private initNavToNavManager(): void {
    if (this.navToNavManager) {
      this.navToNavManager.onTransferred = (): void => {
        if (this.apValues.lateralActive.get() === APLateralModes.GPSS) {
          this.lateralModes.get(APLateralModes.LOC)?.activate();
        }
      };
    }
  }

  /**
   * Initializes the Autopilot with the available VNav Manager.
   */
  protected initVNavManager(): void {
    if (this.vnavManager) {
      this.vnavManager.armMode = (mode: APVerticalModes): void => {
        if (mode === APVerticalModes.NONE && this.apValues.verticalArmed.get() === APVerticalModes.PATH) {
          this.setVerticalArmed(mode);
        } else {
          this.verticalModes.get(mode)?.arm();
        }
      };
      this.vnavManager.activateMode = (mode: APVerticalModes): void => {
        if (mode === APVerticalModes.NONE && this.apValues.verticalActive.get() === APVerticalModes.PATH) {
          this.verticalModes.get(this.config.defaultVerticalMode)?.activate();
        } else {
          this.verticalModes.get(mode)?.activate();
        }
      };
    }
  }

  /**
   * Initializes the Autopilot with the available vertical modes from the config.
   */
  private initVerticalModes(): void {
    if (this.directors.pitchDirector) {
      this.verticalModes.set(APVerticalModes.PITCH, this.directors.pitchDirector);
      this.directors.pitchDirector.onActivate = (): void => {
        this.setVerticalActive(APVerticalModes.PITCH);
      };
    }
    if (this.directors.vsDirector) {
      this.verticalModes.set(APVerticalModes.VS, this.directors.vsDirector);
      this.directors.vsDirector.onActivate = (): void => {
        this.setVerticalActive(APVerticalModes.VS);
      };
    }
    if (this.directors.flcDirector) {
      this.verticalModes.set(APVerticalModes.FLC, this.directors.flcDirector);
      this.directors.flcDirector.onActivate = (): void => {
        this.setVerticalActive(APVerticalModes.FLC);
      };
      this.directors.flcDirector.onArm = (): void => {
        this.setVerticalArmed(APVerticalModes.FLC);
      };
    }
    if (this.directors.altHoldDirector) {
      this.verticalModes.set(APVerticalModes.ALT, this.directors.altHoldDirector);
      this.directors.altHoldDirector.onArm = (): void => {
        this.setVerticalArmed(APVerticalModes.ALT);
      };
      this.directors.altHoldDirector.onActivate = (): void => {
        this.altCapArmed = false;
        this.setVerticalActive(APVerticalModes.ALT);
      };
    }
    if (this.directors.altCapDirector) {
      this.verticalModes.set(APVerticalModes.CAP, this.directors.altCapDirector);
      this.directors.altCapDirector.onArm = (): void => {
        this.altCapArmed = true;
        const verticalArmed = this.apValues.verticalArmed.get();
        if (verticalArmed === APVerticalModes.ALT) {
          this.verticalModes.get(verticalArmed)?.deactivate();
        }
      };
      this.directors.altCapDirector.onActivate = (): void => {
        this.altCapArmed = false;
        this.setVerticalActive(APVerticalModes.CAP);
        this.verticalModes.get(APVerticalModes.ALT)?.arm();
      };
    }
    if (this.directors.vnavPathDirector) {
      this.verticalModes.set(APVerticalModes.PATH, this.directors.vnavPathDirector);
      this.directors.vnavPathDirector.onArm = (): void => {
        this.setVerticalArmed(APVerticalModes.PATH);
      };
      this.directors.vnavPathDirector.onDeactivate = (): void => {
        this.vnavManager?.onPathDirectorDeactivated();
      };
      this.directors.vnavPathDirector.onActivate = (): void => {
        this.setVerticalActive(APVerticalModes.PATH);
      };
    }
    if (this.directors.gpDirector) {
      this.verticalModes.set(APVerticalModes.GP, this.directors.gpDirector);
      this.directors.gpDirector.onArm = (): void => {
        this.setVerticalApproachArmed(APVerticalModes.GP);
      };
      this.directors.gpDirector.onActivate = (): void => {
        this.vnavManager?.tryDeactivate(APVerticalModes.NONE);
        this.setVerticalActive(APVerticalModes.GP);
      };
    }
    if (this.directors.gsDirector) {
      this.verticalModes.set(APVerticalModes.GS, this.directors.gsDirector);
      this.directors.gsDirector.onArm = (): void => {
        this.setVerticalApproachArmed(APVerticalModes.GS);
      };
      this.directors.gsDirector.onActivate = (): void => {
        this.setVerticalActive(APVerticalModes.GS);
        this.verticalModes.get(APVerticalModes.PATH)?.deactivate();
        this.setVerticalArmed(APVerticalModes.NONE);
        this.setVerticalApproachArmed(APVerticalModes.NONE);
      };
    }
  }

  /**
   * Checks if all the active and armed modes are still in their proper state
   * and takes corrective action if not.
   */
  private checkModes(): void {
    if (this.lateralModeFailed) {
      this.lateralModeFailed = false;
    }

    if (!this.stateManager.apMasterOn.get() && !this.stateManager.isFlightDirectorOn.get()) {
      return;
    }

    const { lateralActive, lateralArmed, verticalActive, verticalArmed } = this.apValues;

    if (!this.lateralModes.has(lateralActive.get()) || this.lateralModes.get(lateralActive.get())?.state !== DirectorState.Active) {
      if (lateralActive.get() !== APLateralModes.NONE) {
        this.lateralModeFailed = true;
      }
      this.lateralModes.get(this.config.defaultLateralMode)?.arm();
    }
    if (lateralArmed.get() !== APLateralModes.NONE
      && (!this.lateralModes.has(lateralArmed.get()) || this.lateralModes.get(lateralArmed.get())?.state !== DirectorState.Armed)) {
      this.setLateralArmed(APLateralModes.NONE);
    }
    if (!this.verticalModes.has(verticalActive.get()) || this.verticalModes.get(verticalActive.get())?.state !== DirectorState.Active) {
      this.verticalModes.get(APVerticalModes.PITCH)?.arm();
    }
    if (verticalArmed.get() !== APVerticalModes.NONE
      && (!this.verticalModes.has(verticalArmed.get()) || this.verticalModes.get(verticalArmed.get())?.state !== DirectorState.Armed)) {
      this.setVerticalArmed(APVerticalModes.NONE);
    }
    if (this.verticalApproachArmed !== APVerticalModes.NONE &&
      (!this.verticalModes.has(this.verticalApproachArmed) || this.verticalModes.get(this.verticalApproachArmed)?.state !== DirectorState.Armed)) {
      this.setVerticalApproachArmed(APVerticalModes.NONE);
    }
  }

  /**
   * Runs update on each of the active and armed modes.
   */
  private updateModes(): void {
    const { lateralActive, lateralArmed, verticalActive, verticalArmed } = this.apValues;

    if (lateralActive.get() !== APLateralModes.NONE && lateralActive.get() !== APLateralModes.GPSS && this.lateralModes.has(lateralActive.get())) {
      this.lateralModes.get(lateralActive.get())?.update();
    }
    if (lateralArmed.get() !== APLateralModes.NONE && lateralArmed.get() !== APLateralModes.GPSS && this.lateralModes.has(lateralArmed.get())) {
      this.lateralModes.get(lateralArmed.get())?.update();
    }
    if (verticalActive.get() !== APVerticalModes.NONE && this.verticalModes.has(verticalActive.get())) {
      this.verticalModes.get(verticalActive.get())?.update();
    }
    if (verticalArmed.get() !== APVerticalModes.NONE && this.verticalModes.has(verticalArmed.get())) {
      this.verticalModes.get(verticalArmed.get())?.update();
    }
    if (this.verticalApproachArmed !== APVerticalModes.NONE && this.verticalModes.has(this.verticalApproachArmed)) {
      this.verticalModes.get(this.verticalApproachArmed)?.update();
    }
    if (this.altCapArmed) {
      this.verticalModes.get(APVerticalModes.CAP)?.update();
    }
    //while vnav and vnav director are one in the same we always want to
    //run the vnav update cycle no matter the director state
    this.vnavManager?.update();
    //while lnav and lnav director are one in the same we always want to
    //run the lnav update cycle no matter the director state
    this.lateralModes.get(APLateralModes.GPSS)?.update();
  }

  /**
   * Checks and sets the proper armed altitude mode.
   */
  protected manageAltitudeCapture(): void {
    let altCapType = APAltitudeModes.NONE;
    let armAltCap = false;
    switch (this.apValues.verticalActive.get()) {
      case APVerticalModes.VS:
      case APVerticalModes.FLC:
      case APVerticalModes.PITCH:
        if (this.inClimb && this.apValues.selectedAltitude.get() > this.currentAltitude) {
          altCapType = APAltitudeModes.ALTS;
          armAltCap = true;
        } else if (!this.inClimb && this.apValues.selectedAltitude.get() < this.currentAltitude) {
          altCapType = APAltitudeModes.ALTS;
          armAltCap = true;
        }
        break;
      case APVerticalModes.PATH: {
        if (!this.inClimb) {
          altCapType = this.vnavCaptureType === VNavAltCaptureType.VNAV ? APAltitudeModes.ALTV : APAltitudeModes.ALTS;
        }
        break;
      }
      case APVerticalModes.CAP:
        altCapType = this.verticalAltitudeArmed;
        break;
    }
    if (this.verticalAltitudeArmed !== altCapType) {
      this.verticalAltitudeArmed = altCapType;
    }
    if (armAltCap && (!this.altCapArmed || this.verticalModes.get(APVerticalModes.CAP)?.state === DirectorState.Inactive)) {
      this.verticalModes.get(APVerticalModes.CAP)?.arm();
    } else if (!armAltCap && this.altCapArmed) {
      this.verticalModes.get(APVerticalModes.CAP)?.deactivate();
      this.altCapArmed = false;
    }
  }

  /**
   * Monitors subevents and bus events.
   */
  private monitorEvents(): void {
    this.stateManager.lateralPressed.on((sender, data) => {
      if (this.autopilotInitialized && data !== undefined) {
        this.lateralPressed(data);
      }
    });

    this.stateManager.verticalPressed.on((sender, data) => {
      if (this.autopilotInitialized && data !== undefined) {
        this.verticalPressed(data);
      }
    });

    this.stateManager.approachPressed.on((sender, data) => {
      if (this.autopilotInitialized) {
        this.approachPressed(data);
      }
    });

    this.stateManager.vnavPressed.on((sender, data) => {
      if (this.autopilotInitialized) {
        if (data === true) {
          this.vnavManager?.tryActivate();
        } else {
          this.vnavManager?.tryDeactivate();
        }
      }
    });

    const ap = this.bus.getSubscriber<APEvents>();
    ap.on('ap_altitude_selected').withPrecision(0).handle((alt) => {
      this.apValues.selectedAltitude.set(alt);
    });
    ap.on('ap_heading_selected').withPrecision(0).handle((hdg) => {
      this.apValues.selectedHeading.set(hdg);
    });
    ap.on('ap_ias_selected').withPrecision(0).handle((ias) => {
      this.apValues.selectedIas.set(ias);
    });
    ap.on('ap_mach_selected').withPrecision(3).handle((mach) => {
      this.apValues.selectedMach.set(mach);
    });
    ap.on('ap_selected_speed_is_mach').whenChanged().handle((inMach) => {
      this.apValues.isSelectedSpeedInMach.set(inMach);
    });
    ap.on('ap_pitch_selected').withPrecision(1).handle((pitch) => {
      this.apValues.selectedPitch.set(pitch);
    });
    ap.on('ap_vs_selected').withPrecision(0).handle((ias) => {
      this.apValues.selectedVerticalSpeed.set(ias);
    });

    const nav = this.bus.getSubscriber<NavEvents>();
    nav.on('cdi_select').handle((src) => {
      this.cdiSource = src;
    });

    const navproc = this.bus.getSubscriber<NavProcSimVars>();
    navproc.on('nav_glideslope_1').whenChanged().handle((hasgs) => {
      this.apValues.nav1HasGs.set(hasgs);
    });
    navproc.on('nav_glideslope_2').whenChanged().handle((hasgs) => {
      this.apValues.nav2HasGs.set(hasgs);
    });

    const adc = this.bus.getSubscriber<AdcEvents>();
    adc.on('vertical_speed').withPrecision(0).handle((vs) => {
      this.inClimb = vs < 1 ? false : true;
    });
    adc.on('indicated_alt').withPrecision(0).handle(alt => {
      this.currentAltitude = alt;
    });

    const vnav = this.bus.getSubscriber<VNavEvents>();
    vnav.on('vnav_altitude_capture_type').whenChanged().handle((v) => {
      this.vnavCaptureType = v;
    });

    this.stateManager.apMasterOn.sub(() => {
      if (this.autopilotInitialized) {
        this.handleApFdStateChange();
      }
    });
    this.stateManager.isFlightDirectorOn.sub(() => {
      if (this.autopilotInitialized) {
        this.handleApFdStateChange();
      }
    });

    this.bus.getSubscriber<ControlEvents>().on('approach_available').handle(available => {
      this.apValues.approachIsActive.set(available);
    });
  }

  /**
   * Additional events to be monitored (to be overridden).
   */
  protected monitorAdditionalEvents(): void {
    //noop
  }

  /**
   * Manages the FD state and the modes when AP/FD are off.
   */
  protected handleApFdStateChange(): void {
    const ap = this.stateManager.apMasterOn.get();
    const fd = this.stateManager.isFlightDirectorOn.get();
    if (ap && !fd) {
      this.stateManager.setFlightDirector(true);
    } else if (!ap && !fd) {
      this.lateralModes.forEach((mode) => {
        if (mode.state !== DirectorState.Inactive) {
          mode.deactivate();
        }
      });
      this.verticalModes.forEach((mode) => {
        if (mode.state !== DirectorState.Inactive) {
          mode.deactivate();
        }
      });
      this.apValues.lateralActive.set(APLateralModes.NONE);
      this.apValues.lateralArmed.set(APLateralModes.NONE);
      this.apValues.verticalActive.set(APVerticalModes.NONE);
      this.apValues.verticalArmed.set(APVerticalModes.NONE);
      this.verticalApproachArmed = APVerticalModes.NONE;
      this.verticalAltitudeArmed = APAltitudeModes.NONE;
      this.altCapArmed = false;
    }
  }

  /**
   * Sets a sim AP mode.
   * @param mode The mode to set.
   * @param enabled Whether or not the mode is enabled or disabled.
   */
  private setSimAP(mode: MSFSAPStates, enabled: boolean): void {
    Coherent.call('apSetAutopilotMode', mode, enabled ? 1 : 0);
  }

  /**
   * Checks if the sim AP is in roll mode and sets it if not.
   */
  protected checkRollModeActive(): void {
    if (!APController.apGetAutopilotModeActive(MSFSAPStates.Bank)) {
      // console.log('checkRollModeActive had to set Bank mode');
      this.setSimAP(MSFSAPStates.Bank, true);
    }
  }

  /**
   * Checks if the sim AP is in pitch mode and sets it if not.
   */
  private checkPitchModeActive(): void {
    if (!APController.apGetAutopilotModeActive(MSFSAPStates.Pitch)) {
      // console.log('checkPitchModeActive had to set Pitch mode');
      this.setSimAP(MSFSAPStates.Pitch, true);
    }
  }
}