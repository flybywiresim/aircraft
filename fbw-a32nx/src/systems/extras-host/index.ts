// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-await-in-loop */
// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Clock, EventBus, HEventPublisher, InstrumentBackplane } from '@microsoft/msfs-sdk';
import {
  BaroUnitSelector,
  ExtrasSimVarPublisher,
  FlightDeckBounds,
  GPUManagement,
  GroundSupportPublisher,
  MsfsElectricsPublisher,
  MsfsFlightModelPublisher,
  MsfsMiscPublisher,
  NotificationManager,
  PilotSeatManager,
} from '@flybywiresim/fbw-sdk';
import { PushbuttonCheck } from 'extras-host/modules/pushbutton_check/PushbuttonCheck';
import { FlightPlanAsoboSync } from 'extras-host/modules/flightplan_sync/FlightPlanAsoboSync';
import { KeyInterceptor } from './modules/key_interceptor/KeyInterceptor';
import { VersionCheck } from './modules/version_check/VersionCheck';
import { AircraftSync } from './modules/aircraft_sync/AircraftSync';
import { LightSync } from 'extras-host/modules/light_sync/LightSync';
import { A32NXEcpBusPublisher } from '../shared/src/publishers/A32NXEcpBusPublisher';

/**
 * This is the main class for the extras-host instrument.
 *
 * It provides an environment for non-aircraft non-wasm systems/modules to run in.
 *
 * Usage:
 *  - Add new modules as private readonly members of this class.
 *  - Add the modules to the constructor if not constructed in the definition.
 *  - If the modules do implement Instrument or Publisher (preferred):
 *    - Add the modules to the backplane, init and update will be taken care of by the backplane.
 *  - If the modules do not implement Instrument or Publisher:
 *    - Add the modules to the connectedCallback() method.
 *    - Add the modules to the Update() method.
 *
 * Each module not on the backplane must implement the following methods:
 * - `constructor` to get access to the system-wide EventBus
 * - `connectedCallback` which is called after the simulator set up everything. These functions will also add the subscribtion to special events.
 * - `startPublish` which is called as soon as the simulator starts running. It will also start publishing the simulator variables onto the EventBus
 * - `update` is called in every update call of the simulator, but only after `startPublish` is called
 */
class ExtrasHost extends BaseInstrument {
  private static readonly flightDeckBounds: FlightDeckBounds = {
    minX: -0.79,
    maxX: 0.79,
    minY: 1.0,
    maxY: 2.8,
    minZ: 9.7,
    maxZ: 11.8,
  };

  private readonly bus = new EventBus();

  private readonly backplane = new InstrumentBackplane();

  private readonly clock = new Clock(this.bus);

  private readonly notificationManager: NotificationManager;

  private readonly hEventPublisher: HEventPublisher;

  private readonly simVarPublisher: ExtrasSimVarPublisher;

  private readonly msfsElectricsPublisher: MsfsElectricsPublisher;

  private readonly msfsFlightModelPublisher: MsfsFlightModelPublisher;

  private readonly msfsMiscPublisher: MsfsMiscPublisher;

  private readonly groundSupportPublisher: GroundSupportPublisher;

  private readonly pushbuttonCheck: PushbuttonCheck;

  private readonly versionCheck: VersionCheck;

  private readonly keyInterceptor: KeyInterceptor;

  private readonly flightPlanAsoboSync: FlightPlanAsoboSync;

  private readonly aircraftSync: AircraftSync;

  private readonly pilotSeatManager = new PilotSeatManager(ExtrasHost.flightDeckBounds);

  public readonly xmlConfig: Document;
  /**interactionpoint 8 is GPU connection and 1 GPU in total */
  private readonly gpuManagement = new GPUManagement(this.bus, 8, 1);

  private readonly lightSync: LightSync = new LightSync(this.bus);

  private readonly baroUnitSelector = new BaroUnitSelector((isHpa) => {
    SimVar.SetSimVarValue('L:A32NX_FCU_EFIS_L_BARO_IS_INHG', 'bool', !isHpa);
    SimVar.SetSimVarValue('L:A32NX_FCU_EFIS_R_BARO_IS_INHG', 'bool', !isHpa);
  });

  /**
   * "mainmenu" = 0
   * "loading" = 1
   * "briefing" = 2
   * "ingame" = 3
   */
  private gameState = 0;

  constructor() {
    super();

    this.hEventPublisher = new HEventPublisher(this.bus);
    this.simVarPublisher = new ExtrasSimVarPublisher(this.bus);
    this.msfsElectricsPublisher = new MsfsElectricsPublisher(this.bus);
    this.msfsFlightModelPublisher = new MsfsFlightModelPublisher(this.bus);
    this.msfsMiscPublisher = new MsfsMiscPublisher(this.bus);
    this.groundSupportPublisher = new GroundSupportPublisher(this.bus);

    this.notificationManager = new NotificationManager(this.bus);

    this.pushbuttonCheck = new PushbuttonCheck(this.bus, this.notificationManager);
    this.keyInterceptor = new KeyInterceptor(this.bus, this.notificationManager);
    this.flightPlanAsoboSync = new FlightPlanAsoboSync(this.bus);

    this.versionCheck = new VersionCheck(process.env.AIRCRAFT_PROJECT_PREFIX, this.bus);
    this.aircraftSync = new AircraftSync(process.env.AIRCRAFT_PROJECT_PREFIX, this.bus);

    this.backplane.addPublisher('SimvarPublisher', this.simVarPublisher);
    this.backplane.addPublisher('MsfsElectricsPublisher', this.msfsElectricsPublisher);
    this.backplane.addPublisher('MsfsFlightModelPublisher', this.msfsFlightModelPublisher);
    this.backplane.addPublisher('MsfsMiscPublisher', this.msfsMiscPublisher);
    this.backplane.addPublisher('GroundSupportPublisher', this.groundSupportPublisher);
    this.backplane.addPublisher('A32NXEcpBusPublisher', new A32NXEcpBusPublisher(this.bus));

    this.backplane.addInstrument('PilotSeatManager', this.pilotSeatManager);
    this.backplane.addInstrument('GPUManagement', this.gpuManagement);
    this.backplane.addInstrument('Clock', this.clock);
    this.backplane.addInstrument('LightSync', this.lightSync);

    console.log('A32NX_EXTRASHOST: Created');
  }

  get templateID(): string {
    return 'A32NX_EXTRASHOST';
  }

  public getDeltaTime() {
    return this.deltaTime;
  }

  public onInteractionEvent(args: string[]): void {
    this.hEventPublisher.dispatchHEvent(args[0]);
  }

  public connectedCallback(): void {
    super.connectedCallback();

    this.pushbuttonCheck.connectedCallback();
    this.versionCheck.connectedCallback();
    this.keyInterceptor.connectedCallback();
    this.flightPlanAsoboSync.connectedCallback();
    this.aircraftSync.connectedCallback();

    this.backplane.init();

    this.baroUnitSelector.performSelection();
  }

  public parseXMLConfig(): void {
    super.parseXMLConfig();
    this.aircraftSync.parseXMLConfig(this.xmlConfig);
  }

  public Update(): void {
    super.Update();

    if (this.gameState !== GameState.ingame) {
      const gs = this.getGameState();
      if (gs === GameState.ingame) {
        this.hEventPublisher.startPublish();
        this.versionCheck.startPublish();
        this.keyInterceptor.startPublish();
        this.flightPlanAsoboSync.init();
        this.aircraftSync.startPublish();
      }
      this.gameState = gs;
    }

    this.versionCheck.update();
    this.keyInterceptor.update();
    this.aircraftSync.update();

    this.backplane.onUpdate();
  }
}

registerInstrument('extras-host', ExtrasHost);
