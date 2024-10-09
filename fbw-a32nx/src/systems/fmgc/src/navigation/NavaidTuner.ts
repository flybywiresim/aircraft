// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FlightPhaseManagerEvents } from '@fmgc/flightphase';
import { LandingSystemSelectionManager } from '@fmgc/navigation/LandingSystemSelectionManager';
import { NavaidSelectionManager, VorSelectionReason } from '@fmgc/navigation/NavaidSelectionManager';
import { NavigationProvider } from '@fmgc/navigation/NavigationProvider';
import { NavRadioUtils } from '@fmgc/navigation/NavRadioUtils';
import {
  Arinc429SignStatusMatrix,
  Arinc429Word,
  NotificationManager,
  IlsNavaid,
  NdbNavaid,
  VhfNavaid,
  VhfNavaidType,
} from '@flybywiresim/fbw-sdk';
import { FmgcFlightPhase } from '@shared/flightphase';
import { ConsumerSubject, EventBus, GameStateProvider, SimVarValueType, Subject, Wait } from '@microsoft/msfs-sdk';

export interface NavRadioTuningStatus {
  frequency: number | null;
  ident: string | null;
  /**
   * Whether either the frequency or ident was set manually by the pilot.
   * Whether it was manually set by frequency or ident can be determined by the presence of a facility.
   */
  manual: boolean;
  facility?: VhfNavaid | NdbNavaid | IlsNavaid;
}

export interface VorRadioTuningStatus extends NavRadioTuningStatus {
  facility?: VhfNavaid;
  course: number | null;
  dmeOnly: boolean;
}

export interface MmrRadioTuningStatus extends NavRadioTuningStatus {
  facility?: IlsNavaid;
  /** course derived from the nav database (for resetting if the manual course is cleared) */
  databaseCourse: number | null;
  /** back course flag if the selected approach is backcourse LOC (for resetting if the manual course is cleared) */
  databaseBackcourse: boolean;
  /** loc course in degrees magnetic */
  course: number | null;
  /** if the selected course is manually entered */
  courseManual: boolean;
  /** backcourse flag */
  backcourse: boolean;
  /** slope from the nav database if available, in degrees (-ve = descent) */
  slope: number | null;
}

export interface AdfRadioTuningStatus extends NavRadioTuningStatus {
  facility?: NdbNavaid;
  bfo: boolean;
}

export class NavaidTuner {
  private static readonly DELAY_AFTER_RMP_TUNING = 1000; // ms

  private static readonly TUNING_EVENT_INTERCEPTS = [
    'ADF_1_DEC',
    'ADF2_1_DEC',
    'ADF_10_DEC',
    'ADF2_10_DEC',
    'ADF_100_DEC',
    'ADF2_100_DEC',
    'ADF_1_INC',
    'ADF2_1_INC',
    'ADF_10_INC',
    'ADF2_10_INC',
    'ADF_100_INC',
    'ADF2_100_INC',
    'ADF_ACTIVE_SET',
    'ADF2_ACTIVE_SET',
    'ADF_COMPLETE_SET',
    'ADF2_COMPLETE_SET',
    'ADF_EXTENDED_SET',
    'ADF2_EXTENDED_SET',
    'ADF_FRACT_DEC_CARRY',
    'ADF2_FRACT_DEC_CARRY',
    'ADF_FRACT_INC_CARRY',
    'ADF2_FRACT_INC_CARRY',
    'ADF_HIGHRANGE_SET',
    'ADF2_HIGHRANGE_SET',
    'ADF_LOWRANGE_SET',
    'ADF2_LOWRANGE_SET',
    'ADF1_RADIO_SWAP',
    'ADF2_RADIO_SWAP',
    'ADF1_RADIO_TENTHS_DEC',
    'ADF2_RADIO_TENTHS_DEC',
    'ADF1_RADIO_TENTHS_INC',
    'ADF2_RADIO_TENTHS_INC',
    'ADF_SET',
    'ADF2_SET',
    'ADF1_WHOLE_DEC',
    'ADF2_WHOLE_DEC',
    'ADF1_WHOLE_INC',
    'ADF2_WHOLE_INC',
    'NAV1_RADIO_FRACT_DEC',
    'NAV2_RADIO_FRACT_DEC',
    'NAV3_RADIO_FRACT_DEC',
    'NAV4_RADIO_FRACT_DEC',
    'NAV1_RADIO_FRACT_DEC_CARRY',
    'NAV2_RADIO_FRACT_DEC_CARRY',
    'NAV3_RADIO_FRACT_DEC_CARRY',
    'NAV4_RADIO_FRACT_DEC_CARRY',
    'NAV1_RADIO_FRACT_INC',
    'NAV2_RADIO_FRACT_INC',
    'NAV3_RADIO_FRACT_INC',
    'NAV4_RADIO_FRACT_INC',
    'NAV1_RADIO_FRACT_INC_CARRY',
    'NAV2_RADIO_FRACT_INC_CARRY',
    'NAV3_RADIO_FRACT_INC_CARRY',
    'NAV4_RADIO_FRACT_INC_CARRY',
    'NAV1_RADIO_SET',
    'NAV2_RADIO_SET',
    'NAV3_RADIO_SET',
    'NAV4_RADIO_SET',
    'NAV1_RADIO_SET_HZ',
    'NAV2_RADIO_SET_HZ',
    'NAV3_RADIO_SET_HZ',
    'NAV4_RADIO_SET_HZ',
    'NAV1_RADIO_SWAP',
    'NAV2_RADIO_SWAP',
    'NAV3_RADIO_SWAP',
    'NAV4_RADIO_SWAP',
    'NAV1_RADIO_WHOLE_DEC',
    'NAV2_RADIO_WHOLE_DEC',
    'NAV3_RADIO_WHOLE_DEC',
    'NAV4_RADIO_WHOLE_DEC',
    'NAV1_RADIO_WHOLE_INC',
    'NAV2_RADIO_WHOLE_INC',
    'NAV3_RADIO_WHOLE_INC',
    'NAV4_RADIO_WHOLE_INC',
    'TACAN1_ACTIVE_CHANNEL_SET',
    'TACAN2_ACTIVE_CHANNEL_SET',
    'TACAN1_ACTIVE_MODE_SET',
    'TACAN2_ACTIVE_MODE_SET',
    'TACAN1_SWAP',
    'TACAN2_SWAP',
    'TACAN1_SET',
    'TACAN2_SET',
    'TACAN1_OBI_DEC',
    'TACAN2_OBI_DEC',
    'TACAN1_OBI_INC',
    'TACAN2_OBI_INC',
    'TACAN1_OBI_FAST_DEC',
    'TACAN2_OBI_FAST_DEC',
    'TACAN1_OBI_FAST_INC',
    'TACAN2_OBI_FAST_INC',
    'VOR1_OBI_DEC',
    'VOR2_OBI_DEC',
    'VOR3_OBI_DEC',
    'VOR4_OBI_DEC',
    'VOR1_OBI_FAST_DEC',
    'VOR2_OBI_FAST_DEC',
    'VOR3_OBI_FAST_DEC',
    'VOR4_OBI_FAST_DEC',
    'VOR1_OBI_FAST_INC',
    'VOR2_OBI_FAST_INC',
    'VOR3_OBI_FAST_INC',
    'VOR4_OBI_FAST_INC',
    'VOR1_OBI_INC',
    'VOR2_OBI_INC',
    'VOR3_OBI_INC',
    'VOR4_OBI_INC',
    'VOR1_SET',
    'VOR2_SET',
    'VOR3_SET',
    'VOR4_SET',
  ];

  private isInit = false;

  private vorTuningStatus: VorRadioTuningStatus[] = [
    {
      // VOR 1
      frequency: null,
      ident: null,
      manual: false,
      course: null,
      dmeOnly: false,
    },
    {
      // VOR 2
      frequency: null,
      ident: null,
      manual: false,
      course: null,
      dmeOnly: false,
    },
  ];

  private mmrTuningStatus: MmrRadioTuningStatus[] = [
    {
      // MMR 1
      databaseCourse: null,
      databaseBackcourse: false,
      frequency: null,
      course: null,
      courseManual: false,
      ident: null,
      manual: false,
      backcourse: false,
      slope: null,
    },
    {
      // MMR 2
      databaseCourse: null,
      databaseBackcourse: false,
      frequency: null,
      course: null,
      courseManual: false,
      ident: null,
      manual: false,
      backcourse: false,
      slope: null,
    },
  ];

  private adfTuningStatus: AdfRadioTuningStatus[] = [
    {
      // ADF 1
      frequency: null,
      ident: null,
      manual: false,
      bfo: false,
    },
    {
      // ADF 2
      frequency: null,
      ident: null,
      manual: false,
      bfo: false,
    },
  ];

  private lastVorFrequencies = [null, null];

  private lastVorCourses = [null, null];

  private lastMmrFrequencies = [null, null];

  private lastMmrCourses = [null, null];

  private lastAdfFrequencies = [null, null];

  /** Increments each time the tuned navaids change */
  public navaidVersion = 0;

  private rmpTuningActive = false;

  private readonly arincNavDiscrete = Arinc429Word.empty();

  private lastArincNavDiscreteValueWritten = null;

  private tuneNavaidMessage: [number, string] | null = null;

  private rwyLsMismatchMessage: boolean = false;

  private tuningLockoutTimer = -1;

  private tuningActive = false;

  private readonly flightPhase = ConsumerSubject.create(
    this.bus.getSubscriber<FlightPhaseManagerEvents>().on('fmgc_flight_phase'),
    FmgcFlightPhase.Preflight,
  );

  /** FM 1 and 2 backbeam selection LVAR output. */
  private readonly backbeamOutput = [
    { selected: Subject.create(false), localVar: 'L:A32NX_FM1_BACKBEAM_SELECTED' },
    { selected: Subject.create(false), localVar: 'L:A32NX_FM2_BACKBEAM_SELECTED' },
  ];

  /** Whether the tuning event blocked message has been shown before. It is only shown once. */
  private blockEventMessageShown = false;

  private notificationManager = new NotificationManager(this.bus);

  constructor(
    private readonly bus: EventBus,
    private readonly navigationProvider: NavigationProvider,
    private readonly navaidSelectionManager: NavaidSelectionManager,
    private readonly landingSystemSelectionManager: LandingSystemSelectionManager,
  ) {}

  init(): void {
    // FIXME move this to the RMP when it's rewritten in msfs-avionics-framework
    // FIXME use the framework manager when the framework is updated
    Coherent.on('keyIntercepted', this.handleKeyEvent.bind(this));
    NavaidTuner.TUNING_EVENT_INTERCEPTS.forEach((key) => Coherent.call('INTERCEPT_KEY_EVENT', key, 1));

    for (const backbeam of this.backbeamOutput) {
      backbeam.selected.sub((v) => SimVar.SetSimVarValue(backbeam.localVar, SimVarValueType.Bool, v), true);
    }

    // All selections are reset upon entering the DONE phase after landing.
    this.flightPhase.sub((v) => v === FmgcFlightPhase.Done && this.resetState(false));

    Wait.awaitSubscribable(GameStateProvider.get(), (s) => s === GameState.ingame, true).then(() => {
      this.resetAllReceivers();

      this.isInit = true;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(deltaTime: number): void {
    if (!this.isInit) {
      return;
    }

    // FIXME RMPs should provide a discrete output for this
    const rmpTuningActive =
      SimVar.GetSimVarValue('L:A32NX_RMP_L_NAV_BUTTON_SELECTED', 'bool') ||
      SimVar.GetSimVarValue('L:A32NX_RMP_R_NAV_BUTTON_SELECTED', 'bool');
    const rmpTuningDeActivated = !rmpTuningActive && this.rmpTuningActive;
    this.rmpTuningActive = rmpTuningActive;

    if (rmpTuningDeActivated) {
      // What should happen here is the receivers don't receive any frequency labels on the bus for a short while
      // and they go into standby mode. Since we use the sim radios this doesn't happen so we explicitly reset them to 0
      // This one really belongs in the RMP
      this.resetAllReceivers();

      // we do nothing for a short time
      this.tuningLockoutTimer = NavaidTuner.DELAY_AFTER_RMP_TUNING;
    }

    const tuningActive = !this.rmpTuningActive && this.tuningLockoutTimer <= 0;
    const tuningDeActivated = !tuningActive && this.tuningActive;
    this.tuningActive = tuningActive;

    if (tuningDeActivated) {
      // as above, but this one belongs here, because we are stopping our transmission
      this.resetAllReceivers();
    }

    if (this.tuningActive) {
      this.updateNavaidSelection();
      this.rwyLsMismatchMessage = this.hasRunwayLsMismatch(1) || this.hasRunwayLsMismatch(2);
    } else if (this.tuningLockoutTimer > 0) {
      this.tuningLockoutTimer -= deltaTime;
    }

    this.updateArincBus();
  }

  private handleKeyEvent(key: string, value1?: number, value0?: number, value2?: number): void {
    if (NavaidTuner.TUNING_EVENT_INTERCEPTS.includes(key)) {
      if (this.rmpTuningActive) {
        // pass the tuning event through to the sim
        Coherent.call('TRIGGER_KEY_EVENT', key, true, value0 ?? 0, value1 ?? 0, value2 ?? 0);
      } else if (!this.blockEventMessageShown) {
        this.notificationManager.showNotification({
          message:
            'Navigation radio tuning is not possible while the FMGC controls the radios:\n\n• tune via the MCDU RADIO NAV page, or' +
            '\n• press the NAV button on the RMP to enable manual tuning.',
          timeout: 15000,
        });

        this.blockEventMessageShown = true;
      }
    }
  }

  private resetAllReceivers(): void {
    this.tuneVorFrequency(1, null);
    this.tuneVorCourse(1, null);
    this.tuneVorFrequency(2, null);
    this.tuneVorCourse(2, null);
    this.tuneMmrIlsFrequency(1, null);
    this.tuneMmrCourse(1, null);
    this.tuneMmrIlsFrequency(2, null);
    this.tuneMmrCourse(2, null);
    this.tuneAdf(1, null);
    this.tuneAdf(2, null);
  }

  private updateArincBus(): void {
    for (const [i, vor] of this.vorTuningStatus.entries()) {
      this.arincNavDiscrete.setBitValue(11 + i, this.tuningActive && vor.manual);
    }

    for (const [i, adf] of this.adfTuningStatus.entries()) {
      this.arincNavDiscrete.setBitValue(13 + i, this.tuningActive && adf.manual);
    }

    for (const [i, mmr] of this.mmrTuningStatus.entries()) {
      this.arincNavDiscrete.setBitValue(15 + i, this.tuningActive && mmr.manual);
    }

    const ssm = this.tuningActive ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;
    if (ssm !== this.arincNavDiscrete.ssm || this.lastArincNavDiscreteValueWritten !== this.arincNavDiscrete.value) {
      this.arincNavDiscrete.ssm = ssm;
      this.writeNavDiscreteToBus();
    }
  }

  private writeNavDiscreteToBus(): void {
    Arinc429Word.toSimVarValue('L:A32NX_FM1_NAV_DISCRETE', this.arincNavDiscrete.value, this.arincNavDiscrete.ssm);
    // Arinc429Word.toSimVarValue('L:A32NX_FM2_NAV_DISCRETE', this.arincNavDiscrete.value, this.arincNavDiscrete.ssm);
    this.lastArincNavDiscreteValueWritten = this.arincNavDiscrete.value;
  }

  private updateNavaidSelection(): void {
    let tuneNavaidMessage: [number, string] | null = null;

    for (const [i, vor] of this.vorTuningStatus.entries()) {
      const autoFacility = this.navaidSelectionManager.displayVor ?? undefined;
      if (vor.manual) {
        const autoReason = this.navaidSelectionManager.displayVorReason;
        if (
          (autoReason === VorSelectionReason.Navigation || autoReason === VorSelectionReason.Procedure) &&
          !NavRadioUtils.vhfFrequenciesAreEqual(autoFacility?.frequency, vor.frequency)
        ) {
          tuneNavaidMessage = [autoFacility?.frequency, autoFacility?.ident];
        }
      } else if (vor.facility?.databaseId !== autoFacility?.databaseId) {
        vor.course = null;
        vor.facility = autoFacility;
        vor.frequency = autoFacility?.frequency ?? null;
        vor.ident = autoFacility?.ident ?? null;
        vor.dmeOnly = this.isDmeOnly(autoFacility);
      }
      // TODO if a proc VOR is tuned, make sure it is received

      this.tuneVorFrequency((i + 1) as 1 | 2, vor.frequency);
      this.tuneVorCourse((i + 1) as 1 | 2, vor.course);
    }

    for (const [i, mmr] of this.mmrTuningStatus.entries()) {
      const autoFacility = this.landingSystemSelectionManager.selectedIls ?? undefined;
      const autoCourse = this.landingSystemSelectionManager.selectedLocCourse;
      const autoBackcourse = this.landingSystemSelectionManager.selectedApprBackcourse;
      if (
        !mmr.manual &&
        (mmr.facility?.databaseId !== autoFacility?.databaseId ||
          mmr.course !== autoCourse ||
          mmr.backcourse !== autoBackcourse) &&
        (autoCourse !== null || autoFacility === undefined)
      ) {
        mmr.databaseCourse = autoCourse;
        mmr.databaseBackcourse = this.landingSystemSelectionManager.selectedApprBackcourse;
        mmr.course = mmr.databaseCourse;
        mmr.courseManual = false;
        mmr.frequency = autoFacility?.frequency ?? null;
        mmr.facility = autoFacility;
        mmr.ident = autoFacility?.ident ?? null;
        mmr.backcourse = this.landingSystemSelectionManager.selectedApprBackcourse;
        mmr.slope = this.landingSystemSelectionManager.selectedGsSlope;
      }

      this.tuneMmrIlsFrequency((i + 1) as 1 | 2, mmr.frequency);
      this.tuneMmrCourse((i + 1) as 1 | 2, mmr.course, mmr.backcourse);
    }

    for (const [i, adf] of this.adfTuningStatus.entries()) {
      const autoFacility = this.navaidSelectionManager.displayNdb ?? undefined;
      if (!adf.manual && adf.facility?.databaseId !== autoFacility?.databaseId) {
        adf.facility = autoFacility;
        adf.frequency = autoFacility?.frequency ?? null;
        adf.ident = autoFacility?.ident ?? null;
      }

      this.tuneAdf((i + 1) as 1 | 2, adf.frequency);
    }

    if (this.tuneNavaidMessage !== tuneNavaidMessage) {
      this.tuneNavaidMessage = tuneNavaidMessage;
    }
  }

  /**
   * Tune the VOR receiver and associated DME receiver to a frequency
   * @param index VOR index, 1 or 2
   * @param frequency VOR frequency in MHz
   * @returns promise resolved when the tuning is complete
   */
  private async tuneVorFrequency(index: 1 | 2, frequency: number | null): Promise<unknown> {
    // FIXME tune through RMP (or direct for off-side)
    if (!NavRadioUtils.vhfFrequenciesAreEqual(this.lastVorFrequencies[index - 1], frequency)) {
      this.lastVorFrequencies[index - 1] = frequency;
      this.navaidVersion++;
      return Coherent.call('TRIGGER_KEY_EVENT', `NAV${index}_RADIO_SET_HZ`, true, (frequency ?? 0) * 1_000_000, 0, 0);
    }
    return false;
  }

  /**
   * Tune the VOR to a course
   * @param index VOR index, 1 or 2
   * @param frequency VOR course in degrees
   * @returns promise resolved when the tuning is complete
   */
  private async tuneVorCourse(index: 1 | 2, course: number | null): Promise<unknown> {
    // FIXME tune through RMP (or direct for off-side)
    if (Math.round(this.lastVorCourses[index - 1]) !== Math.round(course)) {
      this.lastVorCourses[index - 1] = course;
      return Coherent.call('TRIGGER_KEY_EVENT', `VOR${index}_SET`, true, course ?? 0, 0, 0);
    }
    return false;
  }

  /**
   * Tune the MMR and associated DME receiver to an ILS frequency
   * @param index MMR index, 1 or 2
   * @param frequency ILS frequency in MHz
   * @returns promise resolved when the tuning is complete
   */
  private async tuneMmrIlsFrequency(index: 1 | 2, frequency: number | null): Promise<unknown> {
    if (this.isMmrTuningLocked()) {
      return false;
    }

    // FIXME tune through RMP (or direct for off-side)
    if (!NavRadioUtils.vhfFrequenciesAreEqual(this.lastMmrFrequencies[index - 1], frequency)) {
      this.lastMmrFrequencies[index - 1] = frequency;
      this.navaidVersion++;
      return Coherent.call(
        'TRIGGER_KEY_EVENT',
        `NAV${index + 2}_RADIO_SET_HZ`,
        true,
        (frequency ?? 0) * 1_000_000,
        0,
        0,
      );
    }
    return false;
  }

  /**
   * Tune the MMR to an ILS course
   * @param index MMR index, 1 or 2
   * @param frequency ILS course in degrees
   * @returns promise resolved when the tuning is complete
   */
  private async tuneMmrCourse(index: 1 | 2, course: number | null, backcourse = false): Promise<unknown> {
    if (this.isMmrTuningLocked()) {
      return false;
    }

    // FIXME tune through RMP (or direct for off-side)
    if (Math.round(this.lastMmrCourses[index - 1]) !== Math.round(course)) {
      this.lastMmrCourses[index - 1] = course;
      return Coherent.call('TRIGGER_KEY_EVENT', `VOR${index + 2}_SET`, true, course ?? 0, 0, 0);
    }
    this.backbeamOutput[index - 1].selected.set(backcourse);
    return false;
  }

  /**
   * Tune the ADF to a frequency
   * @param index ADF index, 1 or 2
   * @param frequency ADF frequency in kHz
   * @returns promise resolved when the tuning is complete
   */
  private async tuneAdf(index: 1 | 2, frequency: number | null): Promise<unknown> {
    // FIXME tune through RMP (or direct for off-side)
    if (!NavRadioUtils.vhfFrequenciesAreEqual(this.lastAdfFrequencies[index - 1], frequency)) {
      this.lastAdfFrequencies[index - 1] = frequency;
      this.navaidVersion++;
      return Coherent.call(
        'TRIGGER_KEY_EVENT',
        `ADF${index > 1 ? index : ''}_COMPLETE_SET`,
        true,
        Avionics.Utils.make_adf_bcd32((frequency ?? 0) * 1_000),
        0,
        0,
      );
    }
    return false;
  }

  private hasRunwayLsMismatch(index: 1 | 2): boolean {
    const mmr = this.getMmrRadioTuningStatus(index);
    const databaseFrequency = this.landingSystemSelectionManager.selectedIls?.frequency ?? null;
    const databaseCourse = this.landingSystemSelectionManager.selectedLocCourse;

    if (
      mmr.frequency !== null &&
      databaseFrequency !== null &&
      !NavRadioUtils.vhfFrequenciesAreEqual(databaseFrequency, mmr.frequency)
    ) {
      return true;
    }

    if (mmr.course !== null && databaseCourse !== null && Math.abs(mmr.course - databaseCourse) > 3) {
      return true;
    }

    return false;
  }

  private isDmeOnly(facility?: VhfNavaid | null): boolean {
    switch (facility?.type) {
      case VhfNavaidType.Dme:
      case VhfNavaidType.Tacan:
        return true;
      default:
        return false;
    }
  }

  /** check if MMR tuning is locked during final approach */
  public isMmrTuningLocked() {
    return (
      this.flightPhase.get() === FmgcFlightPhase.Approach &&
      (this.navigationProvider.getRadioHeight() ?? Infinity) < 700
    );
  }

  public get tunedVors(): VhfNavaid[] {
    return this.vorTuningStatus.map((vorStatus) => vorStatus.facility).filter((fac) => fac !== undefined);
  }

  public get tunedNdbs(): NdbNavaid[] {
    return this.adfTuningStatus.map((adfStatus) => adfStatus.facility).filter((fac) => fac !== undefined);
  }

  deselectNavaid(databaseId: string): void {
    this.navaidSelectionManager.deselectNavaid(databaseId);
  }

  reselectNavaid(databaseId: string): void {
    this.navaidSelectionManager.reselectNavaid(databaseId);
  }

  get deselectedNavaids(): string[] {
    return this.navaidSelectionManager.deselectedNavaids;
  }

  /**
   * Sets the manually (pilot) selected VOR
   * @param index Index of the VOR receiver to set
   * @param vor Any of:
   *   - A VHF navaid if selected by ident
   *   - A frequency if selected by frequency
   *   - null to reset the selection
   */
  setManualVor(index: 1 | 2, vor: VhfNavaid | number | null): void {
    const vorStatus = this.vorTuningStatus[index - 1];
    if (vor === null) {
      vorStatus.manual = false;
      vorStatus.facility = undefined;
      vorStatus.course = null;
      vorStatus.ident = null;
      vorStatus.frequency = null;
    } else if (typeof vor === 'number') {
      vorStatus.manual = true;
      vorStatus.facility = undefined;
      vorStatus.course = null;
      vorStatus.ident = null;
      vorStatus.frequency = vor;
    } else {
      vorStatus.manual = true;
      vorStatus.facility = vor;
      vorStatus.course = null;
      vorStatus.ident = vor.ident;
      vorStatus.frequency = vor.frequency;
    }
    vorStatus.dmeOnly = this.isDmeOnly(vorStatus.facility);
  }

  /**
   * Set a VOR course
   * @param index Index of the receiver
   * @param course The course in degrees (must be an integral value), or null to clear.
   */
  setVorCourse(index: 1 | 2, course: number | null) {
    const vorStatus = this.vorTuningStatus[index - 1];
    vorStatus.course = course;
  }

  /**
   * Sets the manually (pilot) selected ILS
   * @param ils Any of:
   *   - A VHF navaid if selected by ident
   *   - A frequency if selected by frequency
   *   - null to reset the selection
   */
  async setManualIls(ils: IlsNavaid | number | null): Promise<void> {
    for (const mmrStatus of this.mmrTuningStatus) {
      if (ils === null) {
        mmrStatus.databaseCourse = null;
        mmrStatus.databaseBackcourse = false;
        mmrStatus.manual = false;
        mmrStatus.facility = undefined;
        mmrStatus.course = null;
        mmrStatus.courseManual = false;
        mmrStatus.ident = null;
        mmrStatus.frequency = null;
        mmrStatus.backcourse = false;
        mmrStatus.slope = null;
      } else if (typeof ils === 'number') {
        mmrStatus.databaseCourse = null;
        mmrStatus.databaseBackcourse = false;
        mmrStatus.manual = true;
        mmrStatus.facility = undefined;
        mmrStatus.course = null;
        mmrStatus.courseManual = false;
        mmrStatus.ident = null;
        mmrStatus.frequency = ils;
        mmrStatus.backcourse = false;
        mmrStatus.slope = null;
      } else {
        mmrStatus.databaseCourse = ils.locBearing !== -1 ? ils.locBearing : null;
        mmrStatus.databaseBackcourse = false;
        mmrStatus.manual = true;
        mmrStatus.facility = ils;
        mmrStatus.course = ils.locBearing !== -1 ? ils.locBearing : null;
        mmrStatus.courseManual = false;
        mmrStatus.ident = ils.ident;
        mmrStatus.frequency = ils.frequency;
        mmrStatus.backcourse = false;
        mmrStatus.slope = ils.gsSlope ?? null;
      }
    }
  }

  /**
   * Set an ILS course
   * @param course null to clear
   * @param backcourse true if the course is a backcourse
   */
  setIlsCourse(course: number | null, backcourse: boolean = false) {
    for (const mmrStatus of this.mmrTuningStatus) {
      mmrStatus.course = course === null ? mmrStatus.databaseCourse : course % 360;
      mmrStatus.backcourse = course === null ? mmrStatus.databaseBackcourse : backcourse;
      mmrStatus.courseManual = course !== null;
    }
  }

  setManualAdf(index: 1 | 2, ndb: NdbNavaid | number | null): void {
    const adfStatus = this.adfTuningStatus[index - 1];
    if (ndb === null) {
      adfStatus.manual = false;
      adfStatus.facility = undefined;
      adfStatus.ident = null;
      adfStatus.frequency = null;
      adfStatus.bfo = false;
    } else if (typeof ndb === 'number') {
      adfStatus.manual = true;
      adfStatus.facility = undefined;
      adfStatus.ident = null;
      adfStatus.frequency = ndb;
      adfStatus.bfo = false;
    } else {
      adfStatus.manual = true;
      adfStatus.facility = ndb;
      adfStatus.ident = ndb.ident;
      adfStatus.frequency = ndb.frequency;
      adfStatus.bfo = false;
    }
  }

  public getVorRadioTuningStatus(index: 1 | 2): VorRadioTuningStatus {
    return this.vorTuningStatus[index - 1];
  }

  public getMmrRadioTuningStatus(index: 1 | 2): MmrRadioTuningStatus {
    return this.mmrTuningStatus[index - 1];
  }

  public getAdfRadioTuningStatus(index: 1 | 2): AdfRadioTuningStatus {
    return this.adfTuningStatus[index - 1];
  }

  public getTuneNavaidMessage(): [number, string] | null {
    return this.tuneNavaidMessage;
  }

  public getRwyLsMismatchMessage(): boolean {
    return this.rwyLsMismatchMessage;
  }

  public getSpecifiedVorMessage(): boolean {
    // FIXME also check if it is tuned but not received
    return this.navaidSelectionManager.isSpecifiedVorDeselected;
  }

  public getSpecifiedNdbMessage(): boolean {
    // FIXME also check if it is tuned but not received
    return this.navaidSelectionManager.isSpecifiedNdbDeselected;
  }

  public isFmTuningActive(): boolean {
    return this.tuningActive;
  }

  /** Reset all state e.g. when the nav database is switched */
  public resetState(withLockout = true): void {
    for (let i = 1; i <= 2; i++) {
      const n = i as 1 | 2;
      this.setManualAdf(n, null);
      this.setManualVor(n, null);
      this.setVorCourse(n, null);
    }
    this.setManualIls(null);
    this.setIlsCourse(null);

    if (withLockout) {
      this.tuningLockoutTimer = NavaidTuner.DELAY_AFTER_RMP_TUNING;
    }
  }
}
