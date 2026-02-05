import { FmsDisplayInterface } from '@fmgc/flightplanning/interface/FmsDisplayInterface';
import {
  ConsumerSubject,
  EventBus,
  MappedSubject,
  SimVarValueType,
  Subject,
  Subscribable,
  Subscription,
} from '@microsoft/msfs-sdk';
import { FlightManagementComputer } from 'instruments/src/MFD/FMC/FlightManagementComputer';
import { FmcInterface, FmcOperatingModes } from 'instruments/src/MFD/FMC/FmcInterface';
import { FmcIndex, FmcServiceInterface } from 'instruments/src/MFD/FMC/FmcServiceInterface';
import { MfdDisplayInterface } from 'instruments/src/MFD/MFD';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { ResetPanelSimvars } from 'instruments/src/MsfsAvionicsCommon/providers/ResetPanelPublisher';

/*
 * Handles navigation (and potentially other aspects) for MFD pages
 */
export class FmcService implements FmcServiceInterface {
  protected subs = [] as Subscription[];

  private readonly sub = this.bus.getSubscriber<MfdSimvars & ResetPanelSimvars>();

  protected fmc: FmcInterface[] = [];

  private readonly dcEssBusPowered = ConsumerSubject.create(this.sub.on('dcBusEss'), false);
  private readonly fmcAReset = ConsumerSubject.create(this.sub.on('a380x_reset_panel_fmc_a'), false);
  private readonly fmcAInop = MappedSubject.create(
    ([powered, reset, fail]) => !powered || reset || fail,
    this.dcEssBusPowered,
    this.fmcAReset,
    this.fmcAFailed,
  );

  private readonly dc1BusPowered = ConsumerSubject.create(this.sub.on('dcBus1'), false);
  private readonly fmcBReset = ConsumerSubject.create(this.sub.on('a380x_reset_panel_fmc_b'), false);
  private readonly fmcBInop = MappedSubject.create(
    ([powered, reset, fail]) => !powered || reset || fail,
    this.dc1BusPowered,
    this.fmcBReset,
    this.fmcBFailed,
  );

  private readonly dc2BusPowered = ConsumerSubject.create(this.sub.on('dcBus2'), false);
  private readonly fmcCReset = ConsumerSubject.create(this.sub.on('a380x_reset_panel_fmc_c'), false);
  private readonly fmcCInop = MappedSubject.create(
    ([powered, reset, fail]) => !powered || reset || fail,
    this.dc2BusPowered,
    this.fmcCReset,
    this.fmcCFailed,
  );
  private readonly fmsDataKnob = ConsumerSubject.create(this.sub.on('fmsDataKnob'), 1);

  private readonly fmsCaptSideFailed = MappedSubject.create(
    ([knob, fmcAFailed, fmcBFailed, fmcCFailed]) => (knob === 0 ? fmcBFailed && fmcCFailed : fmcAFailed && fmcCFailed),
    this.fmsDataKnob,
    this.fmcAInop,
    this.fmcBInop,
    this.fmcCInop,
  );
  private readonly fmsFoSideFailed = MappedSubject.create(
    ([knob, fmcAFailed, fmcBFailed, fmcCFailed]) => (knob === 2 ? fmcAFailed && fmcCFailed : fmcBFailed && fmcCFailed),
    this.fmsDataKnob,
    this.fmcAInop,
    this.fmcBInop,
    this.fmcCInop,
  );

  constructor(
    private readonly bus: EventBus,
    private readonly mfdReference: (FmsDisplayInterface & MfdDisplayInterface) | null,
    private readonly fmcAFailed: Subscribable<boolean>,
    private readonly fmcBFailed: Subscribable<boolean>,
    private readonly fmcCFailed: Subscribable<boolean>,
  ) {
    this.createFmc(this.mfdReference);

    this.fmsCaptSideFailed.sub((f) => SimVar.SetSimVarValue('L:A32NX_FMS_L_FAILED', SimVarValueType.Bool, f));
    this.fmsFoSideFailed.sub((f) => SimVar.SetSimVarValue('L:A32NX_FMS_R_FAILED', SimVarValueType.Bool, f));
  }

  get master() {
    return this.fmc.find((it) => it.operatingMode === FmcOperatingModes.Master) ?? null;
  }

  get slave() {
    return this.fmc.find((it) => it.operatingMode === FmcOperatingModes.Slave) ?? null;
  }

  get standby() {
    return this.fmc.find((it) => it.operatingMode === FmcOperatingModes.Standby) ?? null;
  }

  createFmc(mfdReference: (FmsDisplayInterface & MfdDisplayInterface) | null): void {
    // Only FMC-A is operative for now, this takes up enough resources already
    // Before more FMC can be added, they have to be synced
    this.fmc.push(
      new FlightManagementComputer(FmcIndex.FmcA, FmcOperatingModes.Master, this.bus, this.fmcAInop, mfdReference),
    );

    this.fmc.push(
      new FlightManagementComputer(FmcIndex.FmcB, FmcOperatingModes.Slave, this.bus, this.fmcBInop, mfdReference),
    );

    this.fmc.push(
      new FlightManagementComputer(FmcIndex.FmcC, FmcOperatingModes.Standby, this.bus, this.fmcCInop, mfdReference),
    );

    this.masterFmcChanged.notify();
  }

  has(forFmcIndex: FmcIndex) {
    return this.fmc[forFmcIndex] !== undefined;
  }

  get(forFmcIndex: FmcIndex) {
    return this.fmc[forFmcIndex];
  }

  setMfdReference(forFmcIndex: FmcIndex, mfd: FmsDisplayInterface & MfdDisplayInterface) {
    if (this.fmc[forFmcIndex] === undefined) {
      return;
    }

    this.fmc[forFmcIndex].mfdReference = mfd;
  }

  public readonly masterFmcChanged = Subject.create(false);
}
