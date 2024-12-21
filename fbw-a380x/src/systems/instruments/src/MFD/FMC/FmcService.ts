import { FailuresConsumer } from '@flybywiresim/fbw-sdk';
import { DisplayInterface } from '@fmgc/flightplanning/interface/DisplayInterface';
import { ConsumerSubject, EventBus, Subscription } from '@microsoft/msfs-sdk';
import { FlightManagementComputer } from 'instruments/src/MFD/FMC/FlightManagementComputer';
import { FmcInterface, FmcOperatingModes } from 'instruments/src/MFD/FMC/FmcInterface';
import { FmcIndex, FmcServiceInterface } from 'instruments/src/MFD/FMC/FmcServiceInterface';
import { MfdDisplayInterface } from 'instruments/src/MFD/MFD';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';

/*
 * Handles navigation (and potentially other aspects) for MFD pages
 */
export class FmcService implements FmcServiceInterface {
  protected subs = [] as Subscription[];

  private readonly sub = this.bus.getSubscriber<MfdSimvars>();

  protected fmc: FmcInterface[] = [];

  private readonly dcEssBusPowered = ConsumerSubject.create(this.sub.on('dcBusEss'), false);

  private readonly dc1BusPowered = ConsumerSubject.create(this.sub.on('dcBus1'), false);

  private readonly dc2BusPowered = ConsumerSubject.create(this.sub.on('dcBus2'), false);

  constructor(
    private bus: EventBus,
    mfdReference: (DisplayInterface & MfdDisplayInterface) | null,
    private readonly failuresConsumer: FailuresConsumer,
  ) {
    this.createFmc(mfdReference);
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
