// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  EventBus,
  HEventPublisher,
  KeyEventManager,
  Wait,
  GameStateProvider,
  InstrumentBackplane,
  Clock,
  ClockEvents,
  ConsumerSubject,
  MappedSubject,
  SubscribableMapFunctions,
  WeightBalanceSimvarPublisher,
} from '@microsoft/msfs-sdk';
import { LegacyGpws } from 'systems-host/systems/LegacyGpws';
import { LegacyFwc } from 'systems-host/systems/LegacyFwc';
import { LegacyFuel } from 'systems-host/systems/LegacyFuel';
import { LegacySoundManager } from 'systems-host/systems/LegacySoundManager';
import { LegacyTcasComputer } from 'systems-host/systems/tcas/components/LegacyTcasComputer';
import { VhfRadio } from 'systems-host/systems/Communications/VhfRadio';
import { FailuresConsumer, PilotSeatPublisher, VhfComIndices } from '@flybywiresim/fbw-sdk';
import { AudioManagementUnit } from 'systems-host/systems/Communications/AudioManagementUnit';
import { RmpAmuBusPublisher } from 'systems-host/systems/Communications/RmpAmuBusPublisher';
import { Transponder } from 'systems-host/systems/Communications/Transponder';
import { PowerSupplyBusTypes, PowerSupplyBusses } from 'systems-host/systems/powersupply';
import { SimAudioManager } from 'systems-host/systems/Communications/SimAudioManager';
import { AtsuSystem } from 'systems-host/systems/atsu';
import { FwsCore } from 'systems-host/systems/FlightWarningSystem/FwsCore';
import { FuelSystemPublisher } from 'systems-host/systems/FuelSystemPublisher';

class SystemsHost extends BaseInstrument {
  private readonly bus = new EventBus();

  private readonly sub = this.bus.getSubscriber<PowerSupplyBusTypes>();

  private readonly backplane = new InstrumentBackplane();

  private readonly clock = new Clock(this.bus);

  private readonly hEventPublisher: HEventPublisher;

  private readonly failuresConsumer = new FailuresConsumer('A32NX');

  // TODO: Migrate PowerSupplyBusses, if needed

  private fwc: LegacyFwc;

  private gpws: LegacyGpws;

  private soundManager: LegacySoundManager;

  private keyEventManager: KeyEventManager;

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

  private readonly rmpAmuBusPublisher = new RmpAmuBusPublisher(this.bus);

  private readonly pilotSeatPublisher = new PilotSeatPublisher(this.bus);

  private readonly powerPublisher = new PowerSupplyBusses(this.bus);

  private readonly weightAndBalancePublisher = new WeightBalanceSimvarPublisher(this.bus);

  private readonly fuelssystemPublisher = new FuelSystemPublisher(this.bus);

  private readonly fwsCore = new FwsCore(1, this.bus);

  //FIXME add some deltatime functionality to backplane instruments so we dont have to pass SystemHost
  private readonly legacyFuel = new LegacyFuel(this.bus, this);

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
    this.backplane.addPublisher('RmpAmuBusPublisher', this.rmpAmuBusPublisher);
    this.backplane.addPublisher('PilotSeatPublisher', this.pilotSeatPublisher);
    this.backplane.addPublisher('PowerPublisher', this.powerPublisher);
    this.backplane.addPublisher('Weightpublisher', this.weightAndBalancePublisher);
    this.backplane.addPublisher('FuelPublisher', this.fuelssystemPublisher);
    this.backplane.addInstrument('LegacyFuel', this.legacyFuel);

    this.hEventPublisher = new HEventPublisher(this.bus);
    this.fwc = new LegacyFwc();
    this.soundManager = new LegacySoundManager();
    this.gpws = new LegacyGpws(this.soundManager);
    this.gpws.init();
    this.fwsCore.init();

    this.backplane.addInstrument('TcasComputer', new LegacyTcasComputer(this.bus, this.soundManager));

    let lastUpdateTime: number;
    this.bus
      .getSubscriber<ClockEvents>()
      .on('simTimeHiFreq')
      .atFrequency(50)
      .handle((now) => {
        const dt = lastUpdateTime === undefined ? 0 : now - lastUpdateTime;
        lastUpdateTime = now;

        this.fwc.update(dt);
        this.soundManager.update(dt);
        this.gpws.update(dt);
        this.fwsCore.update(dt);
      });

    Promise.all([
      KeyEventManager.getManager(this.bus),
      Wait.awaitSubscribable(GameStateProvider.get(), (state) => state === GameState.ingame, true),
    ]).then(([keyEventManager]) => {
      this.keyEventManager = keyEventManager;
      this.initLighting();
    });
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

    this.backplane.init();
  }

  public Update(): void {
    super.Update();

    this.failuresConsumer.update();

    if (this.gameState !== 3) {
      const gamestate = this.getGameState();
      if (gamestate === 3) {
        this.hEventPublisher.startPublish();
      }
      this.gameState = gamestate;
    }

    this.backplane.onUpdate();
  }

  // TODO this should be in extras host, it's not an aircraft system, but a sim thing
  private initLighting() {
    console.log('[systems-host] initializing lighting to defaults');

    /** automatic brightness based on ambient light, [0, 1] scale */
    const autoBrightness = Math.max(
      15,
      Math.min(85, SimVar.GetSimVarValue('GLASSCOCKPIT AUTOMATIC BRIGHTNESS', 'percent')),
    );

    // OVHD Reading Lights
    this.setPotentiometer(96, 0); // Capt
    this.setPotentiometer(97, 0); // F/O

    // Glareshield
    this.setPotentiometer(84, autoBrightness < 50 ? 1.5 * autoBrightness : 0); // Int Lt
    this.setPotentiometer(87, autoBrightness); // Lcd Brt
    this.setPotentiometer(10, 0); // table Cpt
    this.setPotentiometer(11, 0); // table F/O

    // Instruments Cpt
    this.setPotentiometer(88, autoBrightness); // PFD
    this.setPotentiometer(89, autoBrightness); // ND
    this.setPotentiometer(94, autoBrightness / 2); // wxRadar
    this.setPotentiometer(98, autoBrightness); // MFD
    this.setPotentiometer(8, autoBrightness < 50 ? 20 : 0); // console light

    // Instruments F/O
    this.setPotentiometer(90, autoBrightness); // PFD
    this.setPotentiometer(91, autoBrightness); // ND
    this.setPotentiometer(95, autoBrightness / 2); // wxRadar
    this.setPotentiometer(99, autoBrightness); // MFD
    this.setPotentiometer(9, autoBrightness < 50 ? 20 : 0); // console light

    // Pedestal
    this.setPotentiometer(80, autoBrightness); // rmpCptLightLevel
    this.setPotentiometer(81, autoBrightness); // rmpFoLightLevel
    this.setPotentiometer(82, autoBrightness); // rmpOvhdLightLevel
    this.setPotentiometer(92, autoBrightness); // ecamUpperLightLevel
    this.setPotentiometer(93, autoBrightness); // ecamLowerLightLevel
    this.setPotentiometer(76, autoBrightness); // pedFloodLightLevel
    this.setPotentiometer(83, autoBrightness); // mainPnlFloodLightLevel
    this.setPotentiometer(85, autoBrightness); // integralLightLevel
    this.setPotentiometer(7, autoBrightness); // ambientLightLevel
  }

  private setPotentiometer(potentiometer: number, brightness: number) {
    this.keyEventManager.triggerKey('LIGHT_POTENTIOMETER_SET', false, potentiometer, brightness);
  }
}

registerInstrument('systems-host', SystemsHost);
