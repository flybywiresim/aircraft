import {
  ConsumerSubject,
  EventBus,
  GameStateProvider,
  Instrument,
  SimVarValueType,
  Subject,
  Subscribable,
  Wait,
} from '@microsoft/msfs-sdk';
import { MfdSurvEvents } from '../../../instruments/src/MsfsAvionicsCommon/providers/MfdSurvPublisher';
import { FailuresConsumer } from '@flybywiresim/fbw-sdk';
import { A380Failure } from '@failures';

// FIXME implement the rest of the transponder and it's ARINC bus interface

enum MsfsTransponderState {
  Off = 0,
  Standby = 1,
  Test = 2,
  /** Mode A only */
  On = 3,
  /** Mode C */
  Alt = 4,
  /** Mode S */
  Ground = 5,
}

/** The transponder contained within the AESS and interfacing with MSFS. */
export class Transponder implements Instrument {
  private readonly sub = this.bus.getSubscriber<MfdSurvEvents>();

  private readonly isFailed = Subject.create(false);
  private readonly failureKey = this.index === 2 ? A380Failure.Transponder2 : A380Failure.Transponder1;

  private readonly msfsCircuitVar = `CIRCUIT SWITCH ON:${this.msfsCircuit}`;

  private readonly isAuto = ConsumerSubject.create(this.sub.on('mfd_xpdr_set_auto'), false);
  private readonly isAltReportingOn = ConsumerSubject.create(this.sub.on('mfd_xpdr_set_alt_reporting'), true);

  private readonly msfsTransponderState = Subject.create(MsfsTransponderState.Off);
  private readonly msfsTransponderStateVar = `TRANSPONDER STATE:${this.index}`;

  /**
   * Ctor.
   * @param index The transponder index (1-based).
   * @param msfsCircuit The MSFS circuit index for this transceiver (used to switch the radio off when it should not transmit/receive).
   * @param isPowered Whether the transceiver is powered.
   * @param failuresConsumer The failures consumer.
   */
  constructor(
    private readonly bus: EventBus,
    private readonly index: 1 | 2,
    private readonly msfsCircuit: number,
    private readonly isPowered: Subscribable<boolean>,
    private readonly failuresConsumer: FailuresConsumer,
  ) {}

  /** @inheritdoc */
  init(): void {
    this.failuresConsumer.register(this.failureKey);

    this.msfsTransponderState.sub(
      (v) => SimVar.SetSimVarValue(this.msfsTransponderStateVar, SimVarValueType.Enum, v),
      true,
    );

    Wait.awaitSubscribable(GameStateProvider.get(), (v) => v === GameState.ingame).then(() => {
      // set initial squawk code as the cfg file param doesn't seem to work
      SimVar.SetSimVarValue('K:XPNDR_SET', 'number', 0x2000);
      if (!SimVar.GetSimVarValue('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool')) {
        this.bus.getPublisher<MfdSurvEvents>().pub('mfd_xpdr_set_auto', true, true);
      }
    });
  }

  /** @inheritdoc */
  onUpdate(): void {
    this.isFailed.set(this.failuresConsumer.isActive(this.failureKey));
    const isMsfsTransponderOn = SimVar.GetSimVarValue(this.msfsCircuitVar, 'boolean') > 0;
    const shouldBeOn = this.isPowered.get() && !this.isFailed.get();

    if (isMsfsTransponderOn !== shouldBeOn) {
      SimVar.SetSimVarValue('K:ELECTRICAL_CIRCUIT_TOGGLE', 'number', this.msfsCircuit);
    }

    // FIXME better logic. Each AESS has a hardwired LGERS air/ground signal on the 380
    const isOnGround = SimVar.GetSimVarValue('L:A32NX_LGCIU_1_LEFT_GEAR_COMPRESSED', SimVarValueType.Bool);

    switch (true) {
      case !shouldBeOn:
        this.msfsTransponderState.set(MsfsTransponderState.Off);
        break;
      case !this.isAuto.get():
        this.msfsTransponderState.set(MsfsTransponderState.Standby);
        break;
      case !isOnGround && this.isAltReportingOn.get():
        this.msfsTransponderState.set(MsfsTransponderState.Alt);
        break;
      case !isOnGround:
        this.msfsTransponderState.set(MsfsTransponderState.On);
        break;
      default:
        this.msfsTransponderState.set(MsfsTransponderState.Ground);
        break;
    }
  }
}
