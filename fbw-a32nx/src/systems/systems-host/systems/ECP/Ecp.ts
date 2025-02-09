// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  Arinc429LocalVarConsumerSubject,
  Arinc429LocalVarOutputWord,
  Arinc429SignStatusMatrix,
  FailuresConsumer,
  UpdateThrottler,
} from '@flybywiresim/fbw-sdk';
import {
  ClockEvents,
  ConsumerSubject,
  DebounceTimer,
  EventBus,
  HEvent,
  Instrument,
  MappedSubject,
  SimVarValueType,
  Subject,
  Subscribable,
  Subscription,
} from '@microsoft/msfs-sdk';
import { A32NXElectricalSystemEvents } from '../../../shared/src/publishers/A32NXElectricalSystemPublisher';
import {
  ANN_LIGHT_BRIGHT_BRIGHTNESS,
  ANN_LIGHT_DIM_BRIGHTNESS,
  A32NXOverheadDiscreteEvents,
} from '../../../shared/src/publishers/A32NXOverheadDiscretePublisher';
import { DmcEcpLightStatus, FakeDmcEvents } from './FakeDmc';
import { A320Failure } from '../../../failures/src/a320';

// TODO
const OUTPUT_BUS_TRANSMIT_INTERVAL_MS = 100;

class EcpKey {
  /** The keys are output as pressed for a minimum of 8 transmissions on the bus. */
  private static readonly MIN_HOLD_TIME_MS = 8.5 * OUTPUT_BUS_TRANSMIT_INTERVAL_MS;

  private isPhysicalKeyPressed = false;
  /** The remaining hold time after the physical key is released, if any. */
  private holdTime = 0;

  constructor(
    public readonly name: string,
    private readonly setBusOutputPressed: (v: boolean) => void,
    protected readonly ecpOperatingNormally: Subscribable<boolean>,
  ) {
    this.ecpOperatingNormally.sub((v) => !v && (this.holdTime = 0));
  }

  public handlePress(): void {
    this.isPhysicalKeyPressed = true;
    if (this.ecpOperatingNormally.get()) {
      this.holdTime = EcpKey.MIN_HOLD_TIME_MS;
    }
  }

  public handleRelease(): void {
    this.isPhysicalKeyPressed = false;
  }

  public update(deltaMs: number): void {
    this.setBusOutputPressed(this.isPhysicalKeyPressed || this.holdTime > 0);
    this.holdTime = Math.max(0, this.holdTime - deltaMs);
  }

  public isPressed(): boolean {
    return this.isPhysicalKeyPressed;
  }
}

class LitEcpKey extends EcpKey {
  private readonly lightLocalVar = `L:A32NX_ECP_LIGHT_${this.name}`;

  private readonly lightBrightness = MappedSubject.create(
    ([ecpHealthy, lightTest, dim, litRequested, flashOn]) => {
      switch (true) {
        case !ecpHealthy:
          return 0;
        case lightTest:
          return ANN_LIGHT_BRIGHT_BRIGHTNESS;
        case litRequested && flashOn && dim:
          return ANN_LIGHT_DIM_BRIGHTNESS;
        case litRequested && flashOn:
          return ANN_LIGHT_BRIGHT_BRIGHTNESS;
        default:
          return 0;
      }
    },
    this.ecpOperatingNormally,
    this.lightTest,
    this.dim,
    this.litRequested,
    this.flashingOn ?? Subject.create(true),
  );

  constructor(
    name: string,
    setBusOutputPressed: (v: boolean) => void,
    ecpOperatingNormally: Subscribable<boolean>,
    private readonly lightTest: Subscribable<boolean>,
    private readonly dim: Subscribable<boolean>,
    private readonly litRequested: Subscribable<boolean>,
    setLightOn: (v: boolean) => void,
    private readonly flashingOn?: Subscribable<boolean>,
  ) {
    super(name, setBusOutputPressed, ecpOperatingNormally);
    this.lightBrightness.sub((v) => SimVar.SetSimVarValue(this.lightLocalVar, SimVarValueType.Number, v), true);
    this.litRequested.map((v) => setLightOn(v));
  }
}

/** An A32NX ECAM Control Panel, excluding the DU brightness pots. */
export class Ecp implements Instrument {
  private static readonly BOOT_TIME_MS = 100;
  private static readonly POWER_RIDETHROUGH_MS = 10;

  private static readonly HEVENT_REGEX = /^A32NX_ECP_([\w\d_]+)_(PRESSED|RELEASED)$/;

  private readonly sub = this.bus.getSubscriber<
    A32NXElectricalSystemEvents & FakeDmcEvents & A32NXOverheadDiscreteEvents & ClockEvents & HEvent
  >();

  private readonly simTime = ConsumerSubject.create(this.sub.on('simTime'), 0);
  private lastSimTime = 0;

  // FIXME CB 15WT 49VU
  private readonly isInputPowerHealthy = ConsumerSubject.create(this.sub.on('a32nx_elec_dc_ess_bus_is_powered'), false);
  private readonly powerRideThroughTimer = new DebounceTimer();
  private readonly isPowerHealthy = Subject.create(false);
  private readonly isEcpFailed = Subject.create(false);
  private readonly canBoot = MappedSubject.create(
    ([isPowerHealthy, isEcpFailed]) => isPowerHealthy && !isEcpFailed,
    this.isPowerHealthy,
    this.isEcpFailed,
  );
  private readonly bootTimer = new DebounceTimer();
  private readonly isOperatingNormally = Subject.create(false);

  private readonly failuresConsumer = new FailuresConsumer('A32NX');

  /** Hardwired input from the ANN LT switch. */
  private readonly lightTestInput = ConsumerSubject.create(this.sub.on('ovhd_ann_lt_test'), false);
  /** Hardwired input from the ANN LT switch. */
  private readonly dimInput = ConsumerSubject.create(this.sub.on('ovhd_ann_lt_dim'), false);

  // FIXME DMC L and R should each send this word, and we should handle them according to the dmcCode.
  private readonly lightRequestInputWord = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('fake_dmc_light_status_275'),
    0,
  );

  // Label 270
  private readonly warningSwitchesOutputWord = new Arinc429LocalVarOutputWord('L:A32NX_ECP_WARNING_SWITCH_WORD');
  // Label 271
  private readonly systemSwitchesOutputWord = new Arinc429LocalVarOutputWord('L:A32NX_ECP_SYSTEM_SWITCH_WORD');
  // Label 272
  private readonly lightStatusOutputWord = new Arinc429LocalVarOutputWord('L:A32NX_ECP_LIGHT_STATUS_WORD');
  private readonly outputWords = [
    this.warningSwitchesOutputWord,
    this.systemSwitchesOutputWord,
    this.lightStatusOutputWord,
  ];

  private readonly ecpStatusHardwiredState = Subject.create(false);
  private readonly ecpRecallHardwiredState = Subject.create(false);
  private readonly ecpClearHardwiredState = Subject.create(false);
  private readonly ecpEmerCancelHardwiredState = Subject.create(false);
  private readonly ecpAllHardwiredState = Subject.create(false);

  private readonly clrLightRequested = this.lightRequestInputWord.map((w) => w.bitValueOr(27, false));

  private readonly dmcCode = this.lightRequestInputWord.map((w) => ((w.valueOr(0) >> 27) & 0b11) as DmcEcpLightStatus);
  private readonly flashOn = MappedSubject.create(
    ([dmcCode, simTime]) => (dmcCode === DmcEcpLightStatus.MonoDisplay ? simTime % 1000 < 500 : true),
    this.dmcCode,
    this.simTime,
  );

  private readonly warningKeys: Map<string, EcpKey | LitEcpKey> = new Map([
    [
      'CLR_1',
      new LitEcpKey(
        'CLR_1',
        (v) => this.warningSwitchesOutputWord.setBitValue(11, v),
        this.isOperatingNormally,
        this.lightTestInput,
        this.dimInput,
        this.clrLightRequested,
        (v) => this.lightStatusOutputWord.setBitValue(23, v),
      ),
    ],
    [
      'STS',
      new LitEcpKey(
        'STS',
        (v) => this.warningSwitchesOutputWord.setBitValue(13, v),
        this.isOperatingNormally,
        this.lightTestInput,
        this.dimInput,
        this.dmcPageLightRequestFactory(26),
        (v) => this.lightStatusOutputWord.setBitValue(16, v),
      ),
    ],
    ['RCL', new EcpKey('RCL', (v) => this.warningSwitchesOutputWord.setBitValue(14, v), this.isOperatingNormally)],
    [
      'CLR_2',
      new LitEcpKey(
        'CLR_2',
        (v) => this.warningSwitchesOutputWord.setBitValue(16, v),
        this.isOperatingNormally,
        this.lightTestInput,
        this.dimInput,
        this.clrLightRequested,
        (v) => this.lightStatusOutputWord.setBitValue(24, v),
      ),
    ],
    [
      'EMER_CANCEL',
      new EcpKey('EMER_CANCEL', (v) => this.warningSwitchesOutputWord.setBitValue(17, v), this.isOperatingNormally),
    ],
    [
      'TO_CONF_TEST',
      new EcpKey('TO_CONF_TEST', (v) => this.warningSwitchesOutputWord.setBitValue(18, v), this.isOperatingNormally),
    ],
  ]);

  private readonly systemKeys: Map<string, EcpKey | LitEcpKey> = new Map([
    [
      'ENG',
      new LitEcpKey(
        'ENG',
        (v) => this.systemSwitchesOutputWord.setBitValue(11, v),
        this.isOperatingNormally,
        this.lightTestInput,
        this.dimInput,
        this.dmcPageLightRequestFactory(12),
        (v) => this.lightStatusOutputWord.setBitValue(11, v),
        this.flashOn,
      ),
    ],
    [
      'BLEED',
      new LitEcpKey(
        'BLEED',
        (v) => this.systemSwitchesOutputWord.setBitValue(12, v),
        this.isOperatingNormally,
        this.lightTestInput,
        this.dimInput,
        this.dmcPageLightRequestFactory(13),
        (v) => this.lightStatusOutputWord.setBitValue(12, v),
        this.flashOn,
      ),
    ],
    [
      'APU',
      new LitEcpKey(
        'APU',
        (v) => this.systemSwitchesOutputWord.setBitValue(13, v),
        this.isOperatingNormally,
        this.lightTestInput,
        this.dimInput,
        this.dmcPageLightRequestFactory(18),
        (v) => this.lightStatusOutputWord.setBitValue(13, v),
        this.flashOn,
      ),
    ],
    [
      'HYD',
      new LitEcpKey(
        'HYD',
        (v) => this.systemSwitchesOutputWord.setBitValue(14, v),
        this.isOperatingNormally,
        this.lightTestInput,
        this.dimInput,
        this.dmcPageLightRequestFactory(15),
        (v) => this.lightStatusOutputWord.setBitValue(14, v),
        this.flashOn,
      ),
    ],
    [
      'ELEC',
      new LitEcpKey(
        'ELEC',
        (v) => this.systemSwitchesOutputWord.setBitValue(15, v),
        this.isOperatingNormally,
        this.lightTestInput,
        this.dimInput,
        this.dmcPageLightRequestFactory(16),
        (v) => this.lightStatusOutputWord.setBitValue(15, v),
        this.flashOn,
      ),
    ],
    [
      'COND',
      new LitEcpKey(
        'COND',
        (v) => this.systemSwitchesOutputWord.setBitValue(17, v),
        this.isOperatingNormally,
        this.lightTestInput,
        this.dimInput,
        this.dmcPageLightRequestFactory(19),
        (v) => this.lightStatusOutputWord.setBitValue(17, v),
        this.flashOn,
      ),
    ],
    [
      'PRESS',
      new LitEcpKey(
        'PRESS',
        (v) => this.systemSwitchesOutputWord.setBitValue(18, v),
        this.isOperatingNormally,
        this.lightTestInput,
        this.dimInput,
        this.dmcPageLightRequestFactory(14),
        (v) => this.lightStatusOutputWord.setBitValue(18, v),
        this.flashOn,
      ),
    ],
    [
      'FUEL',
      new LitEcpKey(
        'FUEL',
        (v) => this.systemSwitchesOutputWord.setBitValue(19, v),
        this.isOperatingNormally,
        this.lightTestInput,
        this.dimInput,
        this.dmcPageLightRequestFactory(17),
        (v) => this.lightStatusOutputWord.setBitValue(19, v),
        this.flashOn,
      ),
    ],
    [
      'FLT_CTL',
      new LitEcpKey(
        'FLT_CTL',
        (v) => this.systemSwitchesOutputWord.setBitValue(20, v),
        this.isOperatingNormally,
        this.lightTestInput,
        this.dimInput,
        this.dmcPageLightRequestFactory(21),
        (v) => this.lightStatusOutputWord.setBitValue(20, v),
        this.flashOn,
      ),
    ],
    [
      'DOOR',
      new LitEcpKey(
        'DOOR',
        (v) => this.systemSwitchesOutputWord.setBitValue(21, v),
        this.isOperatingNormally,
        this.lightTestInput,
        this.dimInput,
        this.dmcPageLightRequestFactory(20),
        (v) => this.lightStatusOutputWord.setBitValue(21, v),
        this.flashOn,
      ),
    ],
    [
      'BRAKES',
      new LitEcpKey(
        'BRAKES',
        (v) => this.systemSwitchesOutputWord.setBitValue(22, v),
        this.isOperatingNormally,
        this.lightTestInput,
        this.dimInput,
        this.dmcPageLightRequestFactory(22),
        (v) => this.lightStatusOutputWord.setBitValue(22, v),
        this.flashOn,
      ),
    ],
    ['ALL', new EcpKey('ALL', (v) => this.systemSwitchesOutputWord.setBitValue(23, v), this.isOperatingNormally)],
  ]);

  private readonly subs: Subscription[] = [
    this.sub.on('hEvent').handle(this.onHEvent.bind(this), true),
    this.isInputPowerHealthy.sub(this.onPowerStateChanged.bind(this), true),
    this.canBoot.sub(this.onBootStatusChanged.bind(this), true),
    MappedSubject.create(
      ([isHealthy, inputWord]) =>
        isHealthy
          ? inputWord.isFailureWarning()
            ? Arinc429SignStatusMatrix.NoComputedData
            : Arinc429SignStatusMatrix.NormalOperation
          : Arinc429SignStatusMatrix.FailureWarning,
      this.isOperatingNormally,
      this.lightRequestInputWord,
    ).sub((ssm) => this.lightStatusOutputWord.setSsm(ssm), true, true),
    this.ecpStatusHardwiredState.sub(
      (v) => SimVar.SetSimVarValue('L:A32NX_ECP_DISCRETE_OUT_STS', SimVarValueType.Bool, v),
      true,
      true,
    ),
    this.ecpRecallHardwiredState.sub(
      (v) => SimVar.SetSimVarValue('L:A32NX_ECP_DISCRETE_OUT_RCL', SimVarValueType.Bool, v),
      true,
      true,
    ),
    this.ecpClearHardwiredState.sub(
      (v) => SimVar.SetSimVarValue('L:A32NX_ECP_DISCRETE_OUT_CLR', SimVarValueType.Bool, v),
      true,
      true,
    ),
    this.ecpEmerCancelHardwiredState.sub(
      (v) => SimVar.SetSimVarValue('L:A32NX_ECP_DISCRETE_OUT_EMER_CANC', SimVarValueType.Bool, v),
      true,
      true,
    ),
    this.ecpAllHardwiredState.sub(
      (v) => SimVar.SetSimVarValue('L:A32NX_ECP_DISCRETE_OUT_ALL', SimVarValueType.Bool, v),
      true,
      true,
    ),
    this.lightTestInput.sub(
      (v) => {
        this.lightStatusOutputWord.setBitValue(26, v);
      },
      true,
      true,
    ),
    this.dimInput.sub(
      (v) => {
        this.lightStatusOutputWord.setBitValue(27, v);
      },
      true,
      true,
    ),
  ];

  private readonly updateThrottler = new UpdateThrottler(OUTPUT_BUS_TRANSMIT_INTERVAL_MS);

  /**
   * Constructs a new ECAM Control Panel.
   * @param bus The instrument event bus.
   */
  constructor(private readonly bus: EventBus) {}

  private dmcPageLightRequestFactory(bit: number) {
    return MappedSubject.create(
      ([dmcCode, requestWord]) =>
        requestWord.bitValueOr(bit, false) &&
        dmcCode !== DmcEcpLightStatus.EngineWarning &&
        dmcCode !== DmcEcpLightStatus.AutomaticStatusSystems,
      this.dmcCode,
      this.lightRequestInputWord,
    );
  }

  private onHEvent(ev: string): void {
    const match = ev.match(Ecp.HEVENT_REGEX);
    if (match !== null) {
      const key = this.warningKeys.get(match[1]) ?? this.systemKeys.get(match[1]);
      if (key) {
        match[2] === 'PRESSED' ? key.handlePress() : key.handleRelease();
      } else {
        console.error('Got unexpected ECP key event!', ev);
      }
    }
  }

  private onPowerStateChanged(isPowered: boolean): void {
    if (isPowered) {
      this.powerRideThroughTimer.clear();
      this.isPowerHealthy.set(true);
    } else {
      this.powerRideThroughTimer.schedule(() => this.isPowerHealthy.set(false), Ecp.POWER_RIDETHROUGH_MS);
    }
  }

  private onBootStatusChanged(canBoot: boolean): void {
    if (canBoot) {
      this.bootTimer.schedule(() => this.isOperatingNormally.set(true), Ecp.BOOT_TIME_MS);
    } else {
      this.bootTimer.clear();
      this.isOperatingNormally.set(false);
    }
  }

  /** @inheritdoc */
  public init(): void {
    this.failuresConsumer.register(A320Failure.EcamControlPanel);

    for (const sub of this.subs) {
      sub.resume(true);
    }
  }

  private updateKeys(keys: Map<string, EcpKey>, deltaMs: number): void {
    for (const key of keys.values()) {
      key.update(deltaMs);
    }
  }

  private updateHardwiredDiscretes(): void {
    // These do not depend on the ECP being healthy, for critical buttons.
    this.ecpStatusHardwiredState.set(this.warningKeys.get('STS')?.isPressed() === true);
    this.ecpRecallHardwiredState.set(this.warningKeys.get('RCL')?.isPressed() === true);
    this.ecpClearHardwiredState.set(
      this.warningKeys.get('CLR_1')?.isPressed() === true || this.warningKeys.get('CLR_2')?.isPressed() === true,
    );
    this.ecpEmerCancelHardwiredState.set(this.warningKeys.get('EMER_CANCEL')?.isPressed() === true);

    this.ecpAllHardwiredState.set(this.systemKeys.get('ALL')?.isPressed() === true);
  }

  /** @inheritdoc */
  public onUpdate(): void {
    this.failuresConsumer.update();
    this.isEcpFailed.set(this.failuresConsumer.isActive(A320Failure.EcamControlPanel));

    const simTime = this.simTime.get();
    const deltaTime = simTime - this.lastSimTime;
    this.lastSimTime = simTime;
    const updateDelta = this.updateThrottler.canUpdate(deltaTime);
    if (updateDelta >= 0) {
      this.updateKeys(this.warningKeys, updateDelta);
      this.updateKeys(this.systemKeys, updateDelta);

      this.updateHardwiredDiscretes();

      const isOperatingNormally = this.isOperatingNormally.get();
      for (const word of this.outputWords) {
        if (isOperatingNormally) {
          word.setSsm(Arinc429SignStatusMatrix.NormalOperation);
        } else {
          word.setRawValue(0);
          word.setSsm(Arinc429SignStatusMatrix.FailureWarning);
        }
        word.writeToSimVarIfDirty();
      }
    }
  }
}
