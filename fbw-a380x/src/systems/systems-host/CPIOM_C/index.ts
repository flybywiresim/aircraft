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
  StallWarningPublisher,
  SimVarValueType,
  Subject,
} from '@microsoft/msfs-sdk';
import { ArincEventBus, FailuresConsumer, MsfsFlightModelPublisher } from '@flybywiresim/fbw-sdk';
import { PowerSupplyBusses, PowerSupplyBusTypes } from 'systems-host/Misc/powersupply';
import { FwsCore } from 'systems-host/CPIOM_C/FlightWarningSystem/FwsCore';
import { PseudoFwcSimvarPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/PseudoFwcPublisher';
import {
  ResetPanelSimvarPublisher,
  ResetPanelSimvars,
} from 'instruments/src/MsfsAvionicsCommon/providers/ResetPanelPublisher';
import {
  CpiomAvailableSimvarPublisher,
  CpiomAvailableSimvars,
} from 'instruments/src/MsfsAvionicsCommon/providers/CpiomAvailablePublisher';
import { FuelSystemPublisher } from '../../instruments/src/MsfsAvionicsCommon/providers/FuelSystemPublisher';
import { A380Failure } from '@failures';

CpiomAvailableSimvarPublisher;

class CpiomCSystemsHost extends BaseInstrument {
  private readonly bus = new ArincEventBus();

  private readonly sub = this.bus.getSubscriber<PowerSupplyBusTypes & ResetPanelSimvars & CpiomAvailableSimvars>();

  private readonly backplane = new InstrumentBackplane();

  private readonly clock = new Clock(this.bus);

  private readonly hEventPublisher: HEventPublisher;

  private readonly failuresConsumer = new FailuresConsumer();

  private readonly dcEssBusPowered = ConsumerSubject.create(this.sub.on('dcBusEss'), false);

  private readonly powerPublisher = new PowerSupplyBusses(this.bus);

  private readonly stallWarningPublisher = new StallWarningPublisher(this.bus, 0.9);

  private readonly pseudoFwcPublisher = new PseudoFwcSimvarPublisher(this.bus);

  private readonly resetPanelPublisher = new ResetPanelSimvarPublisher(this.bus);

  private readonly cpiomAvailablePublisher = new CpiomAvailableSimvarPublisher(this.bus);

  private readonly fuelSystemPublisher = new FuelSystemPublisher(this.bus);

  private readonly interactivePointsPublisher = new MsfsFlightModelPublisher(this.bus);

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
    this.backplane.addPublisher('PowerSupply', this.powerPublisher);
    this.backplane.addPublisher('StallWarning', this.stallWarningPublisher);
    this.backplane.addPublisher('PseudoFwc', this.pseudoFwcPublisher);
    this.backplane.addPublisher('ResetPanel', this.resetPanelPublisher);
    this.backplane.addPublisher('CpiomAvailable', this.cpiomAvailablePublisher);
    this.backplane.addPublisher('FuelSystem', this.fuelSystemPublisher);
    this.backplane.addPublisher('InteractivePoints', this.interactivePointsPublisher);

    this.hEventPublisher = new HEventPublisher(this.bus);
    this.fwsCore?.init();

    let lastUpdateTime: number;
    this.bus
      .getSubscriber<ClockEvents>()
      .on('simTimeHiFreq')
      .atFrequency(50)
      .handle((now) => {
        const dt = lastUpdateTime === undefined ? 0 : now - lastUpdateTime;
        lastUpdateTime = now;

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
    return 'A380X_SYSTEMSHOST_CPIOM_C';
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

registerInstrument('systems-host-cpiom-c', CpiomCSystemsHost);
