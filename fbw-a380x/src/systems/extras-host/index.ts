// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, HEventPublisher, InstrumentBackplane } from '@microsoft/msfs-sdk';
import { FlightDeckBounds, NotificationManager, PilotSeatManager } from '@flybywiresim/fbw-sdk';
import { ExtrasSimVarPublisher } from 'extras-host/modules/common/ExtrasSimVarPublisher';
import { PushbuttonCheck } from 'extras-host/modules/pushbutton_check/PushbuttonCheck';
import { KeyInterceptor } from './modules/key_interceptor/KeyInterceptor';
import { VersionCheck } from './modules/version_check/VersionCheck';
import { AircraftSync } from 'extras-host/modules/aircraft_sync/AircraftSync';
import { TelexCheck } from 'extras-host/modules/telex_check/TelexCheck';

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
    minX: -0.92,
    maxX: 0.92,
    minY: 2,
    maxY: 3.5,
    minZ: 30.8,
    maxZ: 32.85,
  };

  private readonly bus = new EventBus();
  private readonly backplane = new InstrumentBackplane();

  private readonly notificationManager: NotificationManager;

  private readonly hEventPublisher: HEventPublisher;

  private readonly simVarPublisher: ExtrasSimVarPublisher;

  private readonly pushbuttonCheck: PushbuttonCheck;

  private readonly versionCheck: VersionCheck;

  private readonly keyInterceptor: KeyInterceptor;

  private readonly aircraftSync: AircraftSync;

  private readonly pilotSeatManager = new PilotSeatManager(ExtrasHost.flightDeckBounds);

  private readonly telexCheck = new TelexCheck();

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

    this.notificationManager = new NotificationManager(this.bus);

    this.pushbuttonCheck = new PushbuttonCheck(this.bus, this.notificationManager);
    this.keyInterceptor = new KeyInterceptor(this.bus, this.notificationManager);
    this.versionCheck = new VersionCheck(process.env.AIRCRAFT_PROJECT_PREFIX, this.bus);
    this.aircraftSync = new AircraftSync(process.env.AIRCRAFT_PROJECT_PREFIX, this.bus);

    this.backplane.addInstrument('PilotSeatManager', this.pilotSeatManager);

    console.log('A380X_EXTRASHOST: Created');
  }

  get templateID(): string {
    return 'A380X_EXTRASHOST';
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
    this.aircraftSync.connectedCallback();

    this.backplane.init();
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
        // Start the modules
        this.hEventPublisher.startPublish();
        this.versionCheck.startPublish();
        this.keyInterceptor.startPublish();
        this.simVarPublisher.startPublish();
        this.aircraftSync.startPublish();
        this.telexCheck.showPopup();

        // Signal that the aircraft is ready via L:A32NX_IS_READY
        SimVar.SetSimVarValue('L:A32NX_IS_READY', 'number', 1);
        console.log('A380X_EXTRASHOST: Aircraft is ready');
      }
      this.gameState = gs;
    } else {
      this.simVarPublisher.onUpdate();
    }

    this.backplane.onUpdate();
  }
}

registerInstrument('extras-host', ExtrasHost);
