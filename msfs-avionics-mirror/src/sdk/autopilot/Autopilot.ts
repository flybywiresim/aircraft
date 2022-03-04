import { Subject } from '..';
import { EventBus } from '../data';
import { ADCEvents, APEvents, NavEvents, NavSourceId, NavSourceType } from '../instruments';
import { APController, MSFSAPStates } from '../navigation';
import { FlightPlanner } from '../flightplan';
import { APAltitudeModes, APConfig, APLateralModes, APValues, APVerticalModes } from './APConfig';
import { APModePressEvent, APStateManager } from './APStateManager';
import { NavToNavManager } from './NavToNavManager';
import { DirectorState, PlaneDirector } from './PlaneDirector';
import { VNavAltCaptureType, VNavSimVarEvents } from './VerticalNavigation';

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

  /** The autopilot's VNAV mode director. */
  readonly vnavDirector?: PlaneDirector;

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

  protected cdiSource: NavSourceId = { type: NavSourceType.Nav, index: 0 };

  protected lateralModes: Map<APLateralModes, PlaneDirector> = new Map();
  protected lateralActive: APLateralModes = APLateralModes.NONE;
  protected lateralArmed: APLateralModes = APLateralModes.NONE;

  protected verticalModes: Map<APVerticalModes, PlaneDirector> = new Map();
  protected verticalActive: APVerticalModes = APVerticalModes.NONE;
  protected verticalArmed: APVerticalModes = APVerticalModes.NONE;
  protected verticalAltitudeArmed: APAltitudeModes = APAltitudeModes.NONE;
  protected verticalApproachArmed: APVerticalModes = APVerticalModes.NONE;
  protected altCapArmed = false;
  protected lateralModeFailed = false;

  protected inClimb = false;
  protected currentAltitude = 0;
  protected vnavCaptureType = VNavAltCaptureType.None;

  public readonly apValues: APValues = {
    selectedAltitude: Subject.create(0),
    selectedVerticalSpeed: Subject.create(0),
    selectedIas: Subject.create(0),
    selectedPitch: Subject.create(0),
    selectedHeading: Subject.create(0),
    capturedAltitude: Subject.create(0),
    approachIsActive: Subject.create<boolean>(false),
    approachHasGP: Subject.create<boolean>(false),
    nav1HasGs: Subject.create<boolean>(false),
    nav2HasGs: Subject.create<boolean>(false),
    lateralActive: Subject.create<APLateralModes>(APLateralModes.NONE),
    verticalActive: Subject.create<APVerticalModes>(APVerticalModes.NONE),
    navToNavLocArm: false
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
    this.directors = this.createDirectors(config);
    this.navToNavManager = config.createNavToNavManager(this.apValues);

    this.stateManager.stateManagerInitialized.sub((v) => {
      if (v) {
        this.autopilotInitialized = true;
      } else {
        this.autopilotInitialized = false;
      }
      this.onInitialized();
    });

    this.flightPlanner.flightPlanSynced.on((sender, v) => {
      if (v) {
        this.stateManager.stateManagerInitialized.set(false);
        this.stateManager.initialize(true);
      }
    });

    this.initLateralModes();
    this.initVerticalModes();
    this.initNavToNavManager();
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
      vnavDirector: config.createVNavDirector(this.apValues),
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
  private lateralPressed(data: APModePressEvent): void {
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
      if (!this.stateManager.fdMasterOn.get()) {
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
  private verticalPressed(data: APModePressEvent): void {
    const mode = data.mode as APVerticalModes;
    if (!this.verticalModes.has(mode)) {
      return;
    }
    const set = data.set;
    if (set === undefined || set === false) {
      if (this.isVerticalModeActivatedOrArmed(mode)) {
        return;
      }
    }
    if (set === undefined || set === true) {
      if (!this.stateManager.fdMasterOn.get()) {
        this.stateManager.setFlightDirector(true);
      }
      switch (mode) {
        case APVerticalModes.NONE:
        case APVerticalModes.VNAV:
          break;
        case APVerticalModes.ALT:
          this.setAltHold();
          break;
        case APVerticalModes.PITCH:
        case APVerticalModes.VS:
        case APVerticalModes.FLC:
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
  private isLateralModeActivatedOrArmed(mode: APLateralModes): boolean {
    switch (mode) {
      case this.lateralActive:
        this.lateralModes.get(mode)?.deactivate();
        this.lateralModes.get(this.config.defaultLateralMode)?.arm();
        return true;
      case this.lateralArmed:
        this.lateralModes.get(mode)?.deactivate();
        this.lateralArmed = APLateralModes.NONE;
        return true;
      case APLateralModes.NAV: {
        const activeNavMode = this.lateralActive === APLateralModes.LOC ? APLateralModes.LOC
          : this.lateralActive === APLateralModes.VOR ? APLateralModes.VOR
            : this.lateralActive === APLateralModes.GPSS ? APLateralModes.GPSS
              : APLateralModes.NONE;
        if (activeNavMode !== APLateralModes.NONE) {
          this.lateralModes.get(activeNavMode)?.deactivate();
          this.lateralModes.get(this.config.defaultLateralMode)?.arm();
          this.lateralActive = this.config.defaultLateralMode;
        }
        const armedNavMode = this.lateralArmed === APLateralModes.LOC ? APLateralModes.LOC
          : this.lateralArmed === APLateralModes.VOR ? APLateralModes.VOR
            : this.lateralArmed === APLateralModes.GPSS ? APLateralModes.GPSS
              : APLateralModes.NONE;
        if (armedNavMode !== APLateralModes.NONE) {
          this.lateralModes.get(armedNavMode)?.deactivate();
          this.lateralArmed = APLateralModes.NONE;
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
  private isVerticalModeActivatedOrArmed(mode: APVerticalModes): boolean {
    switch (mode) {
      case this.verticalActive:
        this.verticalModes.get(mode)?.deactivate();
        this.verticalActive = this.config.defaultVerticalMode;
        this.verticalModes.get(this.verticalActive)?.arm();
        return true;
      case this.verticalArmed:
        if (mode !== APVerticalModes.ALT) {
          this.verticalModes.get(mode)?.deactivate();
          this.verticalArmed = APVerticalModes.NONE;
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
  private approachPressed(set?: boolean): void {
    if ((set === undefined || set === false) && this.isVerticalModeActivatedOrArmed(APVerticalModes.GP)) {
      this.lateralModes.get(APLateralModes.GPSS)?.deactivate();
      this.apValues.navToNavLocArm = false;
      return;
    }
    if ((set === undefined || set === false) && this.isVerticalModeActivatedOrArmed(APVerticalModes.GS)) {
      this.lateralModes.get(APLateralModes.LOC)?.deactivate();
      this.apValues.navToNavLocArm = false;
      return;
    }
    if (set === undefined || set === true) {
      switch (this.canApproachArm()) {
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
   * A method to check whether an approach can arm.
   * @returns The AP Lateral Mode that can be armed.
   */
  private canApproachArm(): APLateralModes {
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
        } else if (this.navToNavManager) {
          if (this.navToNavManager.canLocArm() && this.apValues.approachIsActive.get()) {
            this.apValues.navToNavLocArm = true;
            return APLateralModes.LOC;
          }
        }
    }
    return APLateralModes.NONE;
  }

  /**
   * Callback to set the lateral active mode.
   * @param mode is the mode being set.
   */
  private setLateralActive(mode: APLateralModes): void {
    this.checkRollModeActive();
    if (mode !== this.lateralActive) {
      const currentMode = this.lateralModes.get(this.lateralActive);
      currentMode?.deactivate();
      this.lateralActive = mode;
    }
    if (this.lateralArmed === mode) {
      this.lateralArmed = APLateralModes.NONE;
    }
    this.apValues.lateralActive.set(this.lateralActive);
  }

  /**
   * Callback to set the lateral armed mode.
   * @param mode is the mode being set.
   */
  private setLateralArmed(mode: APLateralModes): void {
    const currentMode = this.lateralModes.get(this.lateralArmed);
    currentMode?.deactivate();
    this.lateralArmed = mode;
  }

  /**
   * Callback to set the vertical active mode.
   * @param mode is the mode being set.
   */
  private setVerticalActive(mode: APVerticalModes): void {
    this.checkPitchModeActive();
    if (mode !== this.verticalActive) {
      const currentMode = this.verticalModes.get(this.verticalActive);
      if (currentMode?.state !== DirectorState.Inactive) {
        currentMode?.deactivate();
      }
      this.verticalActive = mode;
    }
    if (this.verticalArmed === mode) {
      this.verticalArmed = APVerticalModes.NONE;
    } else if (this.verticalApproachArmed === mode) {
      this.verticalApproachArmed = APVerticalModes.NONE;
    }
    this.apValues.verticalActive.set(this.verticalActive);
  }

  /**
   * Callback to set the vertical armed mode.
   * @param mode is the mode being set.
   */
  private setVerticalArmed(mode: APVerticalModes): void {
    if (mode !== this.verticalArmed) {
      const currentMode = this.verticalModes.get(this.verticalArmed);
      if (currentMode?.state !== DirectorState.Inactive) {
        currentMode?.deactivate();
      }
    }
    this.verticalArmed = mode;
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
  private setAltHold(): void {
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
  }

  /**
   * Initializes the Autopilot with the available Nav To Nav Manager.
   */
  private initNavToNavManager(): void {
    if (this.navToNavManager) {
      this.navToNavManager.onTransferred = (): void => {
        if (this.lateralActive === APLateralModes.GPSS) {
          this.lateralModes.get(APLateralModes.LOC)?.activate();
        }
        this.apValues.navToNavLocArm = false;
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
        if (this.verticalArmed === APVerticalModes.ALT) {
          this.verticalModes.get(this.verticalArmed)?.deactivate();
        }
      };
      this.directors.altCapDirector.onActivate = (): void => {
        this.altCapArmed = false;
        this.setVerticalActive(APVerticalModes.CAP);
        this.verticalModes.get(APVerticalModes.ALT)?.arm();
      };
    }
    if (this.directors.vnavDirector) {
      this.verticalModes.set(APVerticalModes.VNAV, this.directors.vnavDirector);
      this.directors.vnavDirector.onArm = (): void => {
        this.setVerticalArmed(APVerticalModes.VNAV);
      };
      this.directors.vnavDirector.onActivate = (): void => {
        this.setVerticalActive(APVerticalModes.VNAV);
      };
      this.directors.vnavDirector.onDeactivate = (): void => {
        this.verticalModes.get(APVerticalModes.CAP)?.activate();
      };
    }
    if (this.directors.gpDirector) {
      this.verticalModes.set(APVerticalModes.GP, this.directors.gpDirector);
      this.directors.gpDirector.onArm = (): void => {
        this.setVerticalApproachArmed(APVerticalModes.GP);
      };
      this.directors.gpDirector.onActivate = (): void => {
        this.setVerticalActive(APVerticalModes.GP);
        this.verticalModes.get(APVerticalModes.VNAV)?.deactivate();
        this.setVerticalArmed(APVerticalModes.NONE);
        this.setVerticalApproachArmed(APVerticalModes.NONE);
      };
    }
    if (this.directors.gsDirector) {
      this.verticalModes.set(APVerticalModes.GS, this.directors.gsDirector);
      this.directors.gsDirector.onArm = (): void => {
        this.setVerticalApproachArmed(APVerticalModes.GS);
      };
      this.directors.gsDirector.onActivate = (): void => {
        this.setVerticalActive(APVerticalModes.GS);
        this.verticalModes.get(APVerticalModes.VNAV)?.deactivate();
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

    if (!this.stateManager.apMasterOn.get() && !this.stateManager.fdMasterOn.get()) {
      return;
    }
    if (!this.lateralModes.has(this.lateralActive) || this.lateralModes.get(this.lateralActive)?.state !== DirectorState.Active) {
      if (this.lateralActive !== APLateralModes.NONE) {
        this.lateralModeFailed = true;
      }
      this.lateralModes.get(this.config.defaultLateralMode)?.arm();
    }
    if (this.lateralArmed !== APLateralModes.NONE && (!this.lateralModes.has(this.lateralArmed) || this.lateralModes.get(this.lateralArmed)?.state !== DirectorState.Armed)) {
      this.setLateralArmed(APLateralModes.NONE);
    }
    if (!this.verticalModes.has(this.verticalActive) || this.verticalModes.get(this.verticalActive)?.state !== DirectorState.Active) {
      this.verticalModes.get(APVerticalModes.PITCH)?.arm();
    }
    if (this.verticalArmed !== APVerticalModes.NONE && (!this.verticalModes.has(this.verticalArmed) || this.verticalModes.get(this.verticalArmed)?.state !== DirectorState.Armed)) {
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
    if (this.lateralActive !== APLateralModes.NONE && this.lateralModes.has(this.lateralActive)) {
      this.lateralModes.get(this.lateralActive)?.update();
    }
    if (this.lateralArmed !== APLateralModes.NONE && this.lateralModes.has(this.lateralArmed)) {
      this.lateralModes.get(this.lateralArmed)?.update();
    }
    if (this.verticalActive !== APVerticalModes.NONE && this.verticalActive !== APVerticalModes.VNAV && this.verticalModes.has(this.verticalActive)) {
      this.verticalModes.get(this.verticalActive)?.update();
    }
    if (this.verticalArmed !== APVerticalModes.NONE && this.verticalArmed !== APVerticalModes.VNAV && this.verticalModes.has(this.verticalArmed)) {
      this.verticalModes.get(this.verticalArmed)?.update();
    }
    if (this.verticalApproachArmed !== APVerticalModes.NONE && this.verticalModes.has(this.verticalApproachArmed)) {
      this.verticalModes.get(this.verticalApproachArmed)?.update();
    }
    if (this.altCapArmed) {
      this.verticalModes.get(APVerticalModes.CAP)?.update();
    }
    //while vnav and vnav director are one in the same we always want to
    //run the vnav update cycle no matter the director state
    this.verticalModes.get(APVerticalModes.VNAV)?.update();
    //while lnav and lnav director are one in the same we always want to
    //run the lnav update cycle no matter the director state
    this.lateralModes.get(APLateralModes.GPSS)?.update();
  }

  /**
   * Checks and sets the proper armed altitude mode.
   */
  private manageAltitudeCapture(): void {
    let altCapType = APAltitudeModes.NONE;
    let armAltCap = false;
    switch (this.verticalActive) {
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
      case APVerticalModes.VNAV: {
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
          this.verticalModes.get(APVerticalModes.VNAV)?.arm();
        } else {
          this.verticalModes.get(APVerticalModes.VNAV)?.deactivate();
        }
      }
    });

    const ap = this.bus.getSubscriber<APEvents>();
    ap.on('alt_select').withPrecision(0).handle((alt) => {
      this.apValues.selectedAltitude.set(alt);
    });
    ap.on('heading_select').withPrecision(0).handle((hdg) => {
      this.apValues.selectedHeading.set(hdg);
    });
    ap.on('flc_hold_knots').withPrecision(0).handle((ias) => {
      this.apValues.selectedIas.set(ias);
    });
    ap.on('pitch_ref').withPrecision(1).handle((pitch) => {
      this.apValues.selectedPitch.set(pitch);
    });
    ap.on('vs_hold_fpm').withPrecision(0).handle((ias) => {
      this.apValues.selectedVerticalSpeed.set(ias);
    });

    const nav = this.bus.getSubscriber<NavEvents>();
    nav.on('cdi_select').handle((src) => {
      this.cdiSource = src;
    });
    nav.on('glideslope').handle((gs) => {
      if (gs.source.type === NavSourceType.Nav) {
        switch (gs.source.index) {
          case 1:
            this.apValues.nav1HasGs.set(gs.isValid);
            break;
          case 2:
            this.apValues.nav2HasGs.set(gs.isValid);
            break;
        }
      }
    });

    const adc = this.bus.getSubscriber<ADCEvents>();
    adc.on('vs').withPrecision(0).handle((vs) => {
      this.inClimb = vs < 1 ? false : true;
    });
    adc.on('alt').withPrecision(0).handle(alt => {
      this.currentAltitude = alt;
    });

    const vnav = this.bus.getSubscriber<VNavSimVarEvents>();
    vnav.on('vnavAltCaptureType').whenChanged().handle((v) => {
      this.vnavCaptureType = v;
    });

    this.stateManager.apMasterOn.sub(() => {
      if (this.autopilotInitialized) {
        this.handleApFdStateChange();
      }
    });
    this.stateManager.fdMasterOn.sub(() => {
      if (this.autopilotInitialized) {
        this.handleApFdStateChange();
      }
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
    const fd = this.stateManager.fdMasterOn.get();
    if (ap && !fd) {
      SimVar.SetSimVarValue('K:TOGGLE_FLIGHT_DIRECTOR', 'number', 0);
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
      this.lateralActive = APLateralModes.NONE;
      this.lateralArmed = APLateralModes.NONE;
      this.verticalActive = APVerticalModes.NONE;
      this.verticalArmed = APVerticalModes.NONE;
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
  private checkRollModeActive(): void {
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