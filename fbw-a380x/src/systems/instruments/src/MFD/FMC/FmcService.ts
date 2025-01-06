import { FailuresConsumer } from '@flybywiresim/fbw-sdk';
import { DisplayInterface } from '@fmgc/flightplanning/interface/DisplayInterface';
import {
  ConsumerSubject,
  EventBus,
  MappedSubject,
  SimVarValueType,
  SubscribableMapFunctions,
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
  private readonly fmcAFailed = MappedSubject.create(
    ([powered, reset]) => !powered || reset,
    this.dcEssBusPowered,
    this.fmcAReset,
  );

  private readonly dc1BusPowered = ConsumerSubject.create(this.sub.on('dcBus1'), false);
  private readonly fmcBReset = ConsumerSubject.create(this.sub.on('a380x_reset_panel_fmc_b'), false);
  private readonly fmcBFailed = MappedSubject.create(
    ([powered, reset]) => !powered || reset,
    this.dc1BusPowered,
    this.fmcBReset,
  );

  private readonly dc2BusPowered = ConsumerSubject.create(this.sub.on('dcBus2'), false);
  private readonly fmcCReset = ConsumerSubject.create(this.sub.on('a380x_reset_panel_fmc_c'), false);
  private readonly fmcCFailed = MappedSubject.create(
    ([powered, reset]) => !powered || reset,
    this.dc2BusPowered,
    this.fmcCReset,
  );

  private readonly allFmcReset = MappedSubject.create(
    SubscribableMapFunctions.and(),
    this.fmcAReset,
    this.fmcBReset,
    this.fmcCReset,
  );

  private readonly fmsDataKnob = ConsumerSubject.create(this.sub.on('fmsDataKnob'), 1);

  private readonly fmsCaptSideFailed = MappedSubject.create(
    ([knob, fmcAFailed, fmcBFailed, fmcCFailed]) => (knob === 0 ? fmcBFailed && fmcCFailed : fmcAFailed && fmcCFailed),
    this.fmsDataKnob,
    this.fmcAFailed,
    this.fmcBFailed,
    this.fmcCFailed,
  );
  private readonly fmsFoSideFailed = MappedSubject.create(
    ([knob, fmcAFailed, fmcBFailed, fmcCFailed]) => (knob === 2 ? fmcAFailed && fmcCFailed : fmcBFailed && fmcCFailed),
    this.fmsDataKnob,
    this.fmcAFailed,
    this.fmcBFailed,
    this.fmcCFailed,
  );

  constructor(
    private readonly bus: EventBus,
    private readonly mfdReference: (DisplayInterface & MfdDisplayInterface) | null,
    private readonly failuresConsumer: FailuresConsumer,
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

  createFmc(mfdReference: (DisplayInterface & MfdDisplayInterface) | null): void {
    // Only FMC-A is operative for now, this takes up enough resources already
    // Before more FMC can be added, they have to be synced
    this.fmc.push(
      new FlightManagementComputer(
        FmcIndex.FmcA,
        FmcOperatingModes.Master,
        this.bus,
        this.dcEssBusPowered,
        this.allFmcReset,
        mfdReference,
        this.failuresConsumer,
      ),
    );
    this.fmc[FmcIndex.FmcA].operatingMode = FmcOperatingModes.Master;

    this.fmc.push(
      new FlightManagementComputer(
        FmcIndex.FmcB,
        FmcOperatingModes.Slave,
        this.bus,
        this.dc2BusPowered,
        this.allFmcReset,
        mfdReference,
        this.failuresConsumer,
      ),
    );
    this.fmc[FmcIndex.FmcB].operatingMode = FmcOperatingModes.Slave;

    this.fmc.push(
      new FlightManagementComputer(
        FmcIndex.FmcC,
        FmcOperatingModes.Standby,
        this.bus,
        this.dc1BusPowered,
        this.allFmcReset,
        mfdReference,
        this.failuresConsumer,
      ),
    );
    this.fmc[FmcIndex.FmcC].operatingMode = FmcOperatingModes.Standby;
  }

  has(forFmcIndex: FmcIndex) {
    return this.fmc[forFmcIndex] !== undefined;
  }

  get(forFmcIndex: FmcIndex) {
    return this.fmc[forFmcIndex];
  }

  setMfdReference(forFmcIndex: FmcIndex, mfd: DisplayInterface & MfdDisplayInterface) {
    if (this.fmc[forFmcIndex] === undefined) {
      return;
    }

    this.fmc[forFmcIndex].mfdReference = mfd;
  }
}
