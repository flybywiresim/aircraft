// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  HEventPublisher,
  InstrumentBackplane,
  Clock,
  ClockEvents,
  ConsumerSubject,
  MappedSubject,
  SubscribableMapFunctions,
  WeightBalanceSimvarPublisher,
  StallWarningPublisher,
  SimVarValueType,
  Subject,
} from '@microsoft/msfs-sdk';
import { LegacyGpws } from 'systems-host/systems/LegacyGpws';
import { LegacyFuel } from 'systems-host/systems/LegacyFuel';
import { LegacySoundManager } from 'systems-host/systems/LegacySoundManager';
import { LegacyTcasComputer } from 'systems-host/systems/tcas/components/LegacyTcasComputer';
import { VhfRadio } from 'systems-host/systems/Communications/VhfRadio';
import {
  IrBusPublisher,
  ArincEventBus,
  BtvSimvarPublisher,
  FailuresConsumer,
  MsfsFlightModelPublisher,
  MsfsMiscPublisher,
  PilotSeatPublisher,
  VhfComIndices,
} from '@flybywiresim/fbw-sdk';
import { AudioManagementUnit } from 'systems-host/systems/Communications/AudioManagementUnit';
import { RmpAmuBusPublisher } from 'systems-host/systems/Communications/RmpAmuBusPublisher';
import { Transponder } from 'systems-host/systems/Communications/Transponder';
import { PowerSupplyBusTypes, PowerSupplyBusses } from 'systems-host/systems/powersupply';
import { SimAudioManager } from 'systems-host/systems/Communications/SimAudioManager';
import { AtsuSystem } from 'systems-host/systems/atsu';
import { FwsCore } from 'systems-host/systems/FlightWarningSystem/FwsCore';
import { FuelSystemPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/FuelSystemPublisher';
import { BrakeToVacateDistanceUpdater } from 'systems-host/systems/BrakeToVacateDistanceUpdater';
import { PseudoFwcSimvarPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/PseudoFwcPublisher';
import {
  ResetPanelSimvarPublisher,
  ResetPanelSimvars,
} from 'instruments/src/MsfsAvionicsCommon/providers/ResetPanelPublisher';
import {
  CpiomAvailableSimvarPublisher,
  CpiomAvailableSimvars,
} from 'instruments/src/MsfsAvionicsCommon/providers/CpiomAvailablePublisher';
import { EgpwcBusPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/EgpwcBusPublisher';
import { FGDataPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/FGDataPublisher';
import { AesuBusPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/AesuBusPublisher';
import { A380Failure } from '@failures';
import { EfisTawsBridge } from './systems/EfisTawsBridge';
import { FmsSymbolsPublisher } from 'instruments/src/ND/FmsSymbolsPublisher';

CpiomAvailableSimvarPublisher;
import { AircraftNetworkServerUnit } from 'systems-host/systems/InformationSystems/AircraftNetworkServerUnit';

class SystemsHost extends BaseInstrument {
  private readonly bus = new ArincEventBus();

  private readonly sub = this.bus.getSubscriber<PowerSupplyBusTypes & ResetPanelSimvars & CpiomAvailableSimvars>();

  private readonly backplane = new InstrumentBackplane();

  private readonly clock = new Clock(this.bus);

  private readonly hEventPublisher: HEventPublisher;

  private readonly failuresConsumer = new FailuresConsumer('A32NX');

  // TODO: Migrate PowerSupplyBusses, if needed
  private gpws: LegacyGpws | undefined;

  private soundManager: LegacySoundManager | undefined;

  private readonly acEssBusPowered = ConsumerSubject.create(this.sub.on('acBusEss'), false);
  private readonly acBus2Powered = ConsumerSubject.create(this.sub.on('acBus2'), false);
  private readonly dcEssBusPowered = ConsumerSubject.create(this.sub.on('dcBusEss'), false);
  private readonly dcBus1Powered = ConsumerSubject.create(this.sub.on('dcBus1'), false);
  private readonly dcBus2Powered = ConsumerSubject.create(this.sub.on('dcBus2'), false);

  private readonly vhf1 = new VhfRadio(this.bus, VhfComIndices.Vhf1, 36, this.dcEssBusPowered, this.failuresConsumer);
  private readonly vhf2 = new VhfRadio(this.bus, VhfComIndices.Vhf2, 38, this.dcBus2Powered, this.failuresConsumer);
  private readonly vhf3 = new VhfRadio(this.bus, VhfComIndices.Vhf3, 40, this.dcBus1Powered, this.failuresConsumer);

  // TODO powered subs
  private readonly amu1 = new AudioManagementUnit(this.bus, 1, this.failuresConsumer);
  private readonly amu2 = new AudioManagementUnit(this.bus, 2, this.failuresConsumer);
  private readonly simAudioManager = new SimAudioManager(this.bus, this.amu1, this.amu2);

  private readonly xpdr1 = new Transponder(
    this.bus,
    1,
    41,
    MappedSubject.create(SubscribableMapFunctions.or(), this.acEssBusPowered, this.acBus2Powered),
    this.failuresConsumer,
  );
  // MSFS only supports 1
  // private readonly xpdr2 = new Transponder(2, 144, this.acBus2Powered, this.failuresConsumer);

  private readonly atsu = new AtsuSystem(this.bus);

  private readonly btvDistanceUpdater = new BrakeToVacateDistanceUpdater(this.bus);

  private readonly rmpAmuBusPublisher = new RmpAmuBusPublisher(this.bus);

  private readonly pilotSeatPublisher = new PilotSeatPublisher(this.bus);

  private readonly powerPublisher = new PowerSupplyBusses(this.bus);

  private readonly btvPublisher = new BtvSimvarPublisher(this.bus);

  private readonly weightAndBalancePublisher = new WeightBalanceSimvarPublisher(this.bus);

  private readonly fuelSystemPublisher = new FuelSystemPublisher(this.bus);

  private readonly stallWarningPublisher = new StallWarningPublisher(this.bus, 0.9);

  private readonly pseudoFwcPublisher = new PseudoFwcSimvarPublisher(this.bus);

  private readonly resetPanelPublisher = new ResetPanelSimvarPublisher(this.bus);

  private readonly cpiomAvailablePublisher = new CpiomAvailableSimvarPublisher(this.bus);

  private readonly interactivePointsPublisher = new MsfsFlightModelPublisher(this.bus);

  private readonly fmsSymbolsPublisher = new FmsSymbolsPublisher(this.bus, 'L'); // FIXME figure out side dependency
  private readonly egpwcPublisher = new EgpwcBusPublisher(this.bus, 'L');
  private readonly fgDataPublisher = new FGDataPublisher(this.bus);
  private readonly msfsMiscPublisher = new MsfsMiscPublisher(this.bus);
  private readonly irBusPublisher = new IrBusPublisher(this.bus);
  private readonly aesuBusPublisher = new AesuBusPublisher(this.bus);
  private readonly efisTawsBridge = new EfisTawsBridge(this.bus, this, this.failuresConsumer);

  private readonly fws1ResetPbStatus = ConsumerSubject.create(this.sub.on('a380x_reset_panel_fws1'), false);
  private readonly fws2ResetPbStatus = ConsumerSubject.create(this.sub.on('a380x_reset_panel_fws2'), false);

  private readonly fws1Powered = ConsumerSubject.create(this.sub.on('cpiomC1Avail'), true);
  private readonly fws2Powered = ConsumerSubject.create(this.sub.on('cpiomC2Avail'), true);

  private readonly fws1Failed = Subject.create(false);
  private readonly fws2Failed = Subject.create(false);

  private readonly fwsEcpFailed = Subject.create(false);

  private readonly fwsAvailable = MappedSubject.create(
    ([failed1, failed2]) => !(failed1 && failed2),
    this.fws1Failed,
    this.fws2Failed,
  );

  private fwsCore: FwsCore | undefined = new FwsCore(
    1,
    this.bus,
    this.failuresConsumer,
    this.fws1Failed,
    this.fws2Failed,
  );

  //FIXME add some deltatime functionality to backplane instruments so we dont have to pass SystemHost
  private readonly legacyFuel = new LegacyFuel(this.bus, this);

  // For now, pass ATSU to the ANSUs. In our target architecture, there should be no ATSU
  private readonly nssAnsu1 = new AircraftNetworkServerUnit(this.bus, 1, 'nss', this.failuresConsumer, this.atsu);
  private readonly nssAnsu2 = new AircraftNetworkServerUnit(this.bus, 2, 'nss', this.failuresConsumer, this.atsu);
  private readonly fltOpsAnsu1 = new AircraftNetworkServerUnit(
    this.bus,
    1,
    'flt-ops',
    this.failuresConsumer,
    this.atsu,
  );

  /**
   * "mainmenu" = 0
   * "loading" = 1
   * "briefing" = 2
   * "ingame" = 3
   */
  private gameState = 0;

  constructor() {
    super();

    this.backplane.addInstrument('Clock', this.clock);
    this.backplane.addInstrument('Vhf1', this.vhf1, true);
    this.backplane.addInstrument('Vhf2', this.vhf2, true);
    this.backplane.addInstrument('Vhf3', this.vhf3, true);
    this.backplane.addInstrument('Amu1', this.amu1, true);
    this.backplane.addInstrument('Amu2', this.amu2, true);
    this.backplane.addInstrument('SimAudioManager', this.simAudioManager);
    this.backplane.addInstrument('Xpndr1', this.xpdr1, true);
    this.backplane.addInstrument('AtsuSystem', this.atsu);
    this.backplane.addInstrument('LegacyFuel', this.legacyFuel);
    this.backplane.addInstrument('BtvDistanceUpdater', this.btvDistanceUpdater);
    this.backplane.addInstrument('EfisTawsBridge', this.efisTawsBridge);
    this.backplane.addPublisher('RmpAmuBusPublisher', this.rmpAmuBusPublisher);
    this.backplane.addPublisher('PilotSeatPublisher', this.pilotSeatPublisher);
    this.backplane.addPublisher('PowerPublisher', this.powerPublisher);
    this.backplane.addPublisher('BtvPublisher', this.btvPublisher);
    this.backplane.addPublisher('Weightpublisher', this.weightAndBalancePublisher);
    this.backplane.addPublisher('FuelPublisher', this.fuelSystemPublisher);
    this.backplane.addPublisher('StallWarning', this.stallWarningPublisher);
    this.backplane.addPublisher('PseudoFwc', this.pseudoFwcPublisher);
    this.backplane.addPublisher('ResetPanel', this.resetPanelPublisher);
    this.backplane.addPublisher('CpiomAvailable', this.cpiomAvailablePublisher);
    this.backplane.addPublisher('InteractivePoints', this.interactivePointsPublisher);
    this.backplane.addPublisher('FmsSymbolsPublisher', this.fmsSymbolsPublisher);
    this.backplane.addPublisher('EgpwcPublisher', this.egpwcPublisher);
    this.backplane.addPublisher('FGDataPublisher', this.fgDataPublisher);
    this.backplane.addPublisher('MsfsMiscPublisher', this.msfsMiscPublisher);
    this.backplane.addPublisher('IrBusPublisher', this.irBusPublisher);
    this.backplane.addPublisher('AesuPublisher', this.aesuBusPublisher);
    this.backplane.addInstrument('nssAnsu1', this.nssAnsu1, true);
    this.backplane.addInstrument('nssAnsu2', this.nssAnsu2, true);
    this.backplane.addInstrument('fltOpsAnsu1', this.fltOpsAnsu1, true);

    this.hEventPublisher = new HEventPublisher(this.bus);
    this.soundManager = new LegacySoundManager();
    this.gpws = new LegacyGpws(this.bus, this.soundManager);
    this.gpws.init();
    this.fwsCore?.init();

    this.backplane.addInstrument('TcasComputer', new LegacyTcasComputer(this.bus, this.soundManager));

    let lastUpdateTime: number;
    this.bus
      .getSubscriber<ClockEvents>()
      .on('simTimeHiFreq')
      .atFrequency(50)
      .handle((now) => {
        const dt = lastUpdateTime === undefined ? 0 : now - lastUpdateTime;
        lastUpdateTime = now;

        this.soundManager?.update(dt);
        this.gpws?.update(dt);
        this.fwsCore?.update(dt);
      });

    this.fwsAvailable.sub((a) => {
      if (!a && this.fwsCore !== undefined) {
        this.fwsCore.destroy();
        this.fwsCore = undefined;
        FwsCore.sendFailureWarning(this.bus);
      } else if (a && this.fwsCore === undefined) {
        this.fwsCore = new FwsCore(1, this.bus, this.failuresConsumer, this.fws1Failed, this.fws2Failed);
        this.fwsCore.init();
      }
    }, true);
    this.fws1Failed.sub((f) => SimVar.SetSimVarValue('L:A32NX_FWS1_IS_HEALTHY', SimVarValueType.Bool, !f), true);
    this.fws2Failed.sub((f) => SimVar.SetSimVarValue('L:A32NX_FWS2_IS_HEALTHY', SimVarValueType.Bool, !f), true);

    this.fwsEcpFailed.sub((v) => SimVar.SetSimVarValue('L:A32NX_FWS_ECP_FAILED', SimVarValueType.Bool, v), true);
  }

  get templateID(): string {
    return 'A380X_SYSTEMSHOST';
  }

  public getDeltaTime() {
    return this.deltaTime;
  }

  public onInteractionEvent(args: string[]): void {
    this.hEventPublisher.dispatchHEvent(args[0]);
  }

  public connectedCallback(): void {
    super.connectedCallback();

    // Needed to fetch METARs from the sim
    RegisterViewListener(
      'JS_LISTENER_FACILITY',
      () => {
        console.log('JS_LISTENER_FACILITY registered.');
      },
      true,
    );

    this.failuresConsumer.register(A380Failure.Fws1);
    this.failuresConsumer.register(A380Failure.Fws2);
    this.failuresConsumer.register(A380Failure.Fws1AudioFunction);
    this.failuresConsumer.register(A380Failure.Fws2AudioFunction);
    this.failuresConsumer.register(A380Failure.FwsEcp);

    this.backplane.init();
  }

  public Update(): void {
    super.Update();

    this.failuresConsumer.update();
    this.fws1Failed.set(
      this.failuresConsumer.isActive(A380Failure.Fws1) || this.fws1ResetPbStatus.get() || !this.fws1Powered.get(),
    );
    this.fws2Failed.set(
      this.failuresConsumer.isActive(A380Failure.Fws2) || this.fws2ResetPbStatus.get() || !this.fws2Powered.get(),
    );

    const ecpNotReachable =
      !SimVar.GetSimVarValue('L:A32NX_AFDX_3_3_REACHABLE', SimVarValueType.Bool) &&
      !SimVar.GetSimVarValue('L:A32NX_AFDX_13_13_REACHABLE', SimVarValueType.Bool) &&
      !SimVar.GetSimVarValue('L:A32NX_AFDX_4_4_REACHABLE', SimVarValueType.Bool) &&
      !SimVar.GetSimVarValue('L:A32NX_AFDX_14_14_REACHABLE', SimVarValueType.Bool);
    this.fwsEcpFailed.set(
      this.failuresConsumer.isActive(A380Failure.FwsEcp) || !this.dcEssBusPowered.get() || ecpNotReachable,
    );

    if (this.gameState !== 3) {
      const gamestate = this.getGameState();
      if (gamestate === 3) {
        this.hEventPublisher.startPublish();
      }
      this.gameState = gamestate;
    }

    this.backplane.onUpdate();
  }
}

registerInstrument('systems-host', SystemsHost);
