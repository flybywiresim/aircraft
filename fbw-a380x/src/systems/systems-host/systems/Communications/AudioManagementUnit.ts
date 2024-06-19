import {
  ConsumerSubject,
  EventBus,
  Instrument,
  MappedSubject,
  SimVarValueType,
  Subject,
  SubscribableMapFunctions,
} from '@microsoft/msfs-sdk';
import { CameraEvents } from '../../../instruments/src/MsfsAvionicsCommon/providers/CameraPublisher';
import { RmpAmuBusEvents } from 'systems-host/systems/Communications/RmpAmuBusPublisher';
import { FailuresConsumer } from '@flybywiresim/fbw-sdk';
import { A380Failure } from '@failures';

export type AmuIndex = 1 | 2;

enum SimTransmitStates {
  Com1 = 0,
  Com2 = 1,
  Com3 = 2,
  None = 4,
}

/**
 * An audio management unit that controls the MSFS audio systems.
 * AMU1 primarily covers the captain's side, while AMU2 covers the F/O's side.
 */
export class AudioManagementUnit implements Instrument {
  private readonly sub = this.bus.getSubscriber<CameraEvents & RmpAmuBusEvents>();

  private readonly onsideRmpIndex = this.index;
  private readonly offsideRmpIndex = this.index === 2 ? 1 : 2;

  private readonly mainPowerVar = 'A32NX_ELEC_DC_ESS_BUS_IS_POWERED';

  private readonly isHealthy = Subject.create(false);

  private readonly failureKey = this.index === 2 ? A380Failure.AudioManagementUnit2 : A380Failure.AudioManagementUnit1;

  private readonly isPilotSittingFoSide = ConsumerSubject.create(this.sub.on('camera_pilot_in_fo_seat'), false);
  private readonly isPilotSittingOurSide = this.isPilotSittingFoSide.map(
    (v) => (this.index === 1 && !v) || (this.index === 2 && v),
  );

  private readonly isOutputActive = MappedSubject.create(
    SubscribableMapFunctions.and(),
    this.isPilotSittingOurSide,
    this.isHealthy,
  );

  private readonly setTransmitEvent1 = 'K:PILOT_TRANSMITTER_SET';
  private readonly setTransmitEvent2 = 'K:COPILOT_TRANSMITTER_SET';

  // TODO hook up
  private readonly onsideRmpSwitchedOn = Subject.create(true);
  private readonly rmp3SwitchedOn = Subject.create(true);

  private readonly activeRmpIndex = MappedSubject.create(
    ([onsideHealthy, rmp3Healthy]) => (onsideHealthy ? this.onsideRmpIndex : rmp3Healthy ? 3 : this.offsideRmpIndex),
    this.onsideRmpSwitchedOn,
    this.rmp3SwitchedOn,
  );

  private readonly vhf1Receive = ConsumerSubject.create(null, false);
  private readonly vhf2Receive = ConsumerSubject.create(null, false);
  private readonly vhf3Receive = ConsumerSubject.create(null, false);
  private readonly vhf1Transmit = ConsumerSubject.create(null, false);
  private readonly vhf2Transmit = ConsumerSubject.create(null, false);
  private readonly vhf3Transmit = ConsumerSubject.create(null, false);
  private readonly vhf1Volume = ConsumerSubject.create(null, 0);
  private readonly vhf2Volume = ConsumerSubject.create(null, 0);
  private readonly vhf3Volume = ConsumerSubject.create(null, 0);

  constructor(
    private readonly bus: EventBus,
    private readonly index: AmuIndex,
    private readonly failuresConsumer: FailuresConsumer,
  ) {}

  /** @inheritdoc */
  init(): void {
    this.activeRmpIndex.sub((rmpIndex) => {
      this.vhf1Receive.setConsumer(this.sub.on(`rmp_amu_vhf1_receive_${rmpIndex}`));
      this.vhf2Receive.setConsumer(this.sub.on(`rmp_amu_vhf2_receive_${rmpIndex}`));
      this.vhf3Receive.setConsumer(this.sub.on(`rmp_amu_vhf3_receive_${rmpIndex}`));
      this.vhf1Transmit.setConsumer(this.sub.on(`rmp_amu_vhf1_transmit_${rmpIndex}`));
      this.vhf2Transmit.setConsumer(this.sub.on(`rmp_amu_vhf2_transmit_${rmpIndex}`));
      this.vhf3Transmit.setConsumer(this.sub.on(`rmp_amu_vhf3_transmit_${rmpIndex}`));
      this.vhf1Volume.setConsumer(this.sub.on(`rmp_amu_vhf1_volume_${rmpIndex}`));
      this.vhf2Volume.setConsumer(this.sub.on(`rmp_amu_vhf2_volume_${rmpIndex}`));
      this.vhf3Volume.setConsumer(this.sub.on(`rmp_amu_vhf3_volume_${rmpIndex}`));
    }, true);

    // we need to only write the com states to the sim when the pilot is on our side of the cockpit
    const activeSubs = [
      this.vhf3Transmit.sub(this.onVhfTransmitStateChanged.bind(this), true, true),
      this.vhf2Transmit.sub(this.onVhfTransmitStateChanged.bind(this), true, true),
      this.vhf1Transmit.sub(this.onVhfTransmitStateChanged.bind(this), true, true),
      this.vhf3Receive.sub(this.onVhfReceiveStateChanged.bind(this, 'K:COM3_RECEIVE_SELECT'), true, true),
      this.vhf2Receive.sub(this.onVhfReceiveStateChanged.bind(this, 'K:COM2_RECEIVE_SELECT'), true, true),
      this.vhf1Receive.sub(this.onVhfReceiveStateChanged.bind(this, 'K:COM1_RECEIVE_SELECT'), true, true),
      this.vhf3Volume.sub(this.onVhfVolumeChanged.bind(this, 'K:COM3_VOLUME_SET'), true, true),
      this.vhf2Volume.sub(this.onVhfVolumeChanged.bind(this, 'K:COM2_VOLUME_SET'), true, true),
      this.vhf1Volume.sub(this.onVhfVolumeChanged.bind(this, 'K:COM1_VOLUME_SET'), true, true),
    ];

    this.isOutputActive.sub((outputOn) => {
      for (const sub of activeSubs) {
        if (outputOn) {
          sub.resume(true);
        } else {
          sub.pause();
        }
      }
    }, true);

    this.failuresConsumer.register(this.failureKey);
  }

  /** @inheritdoc */
  onUpdate(): void {
    const failed = this.failuresConsumer.isActive(this.failureKey);
    const powered = SimVar.GetSimVarValue(this.mainPowerVar, SimVarValueType.Bool);
    this.isHealthy.set(!failed && powered);
  }

  private onVhfReceiveStateChanged(kEvent: string, state: boolean): void {
    if (this.isPilotSittingOurSide.get()) {
      SimVar.SetSimVarValue(kEvent, SimVarValueType.Bool, state);
    }
  }

  private onVhfVolumeChanged(kEvent: string, volume: number): void {
    if (this.isPilotSittingOurSide.get()) {
      SimVar.SetSimVarValue(kEvent, SimVarValueType.Number, volume / 100);
    }
  }

  private onVhfTransmitStateChanged(): void {
    if (this.isPilotSittingOurSide.get()) {
      switch (true) {
        case this.vhf1Transmit.get() && this.vhf2Transmit.get():
          SimVar.SetSimVarValue(this.setTransmitEvent1, SimVarValueType.Number, SimTransmitStates.Com1);
          SimVar.SetSimVarValue(this.setTransmitEvent2, SimVarValueType.Number, SimTransmitStates.Com2);
          break;
        case this.vhf1Transmit.get() && this.vhf3Transmit.get():
          SimVar.SetSimVarValue(this.setTransmitEvent1, SimVarValueType.Number, SimTransmitStates.Com1);
          SimVar.SetSimVarValue(this.setTransmitEvent2, SimVarValueType.Number, SimTransmitStates.Com3);
          break;
        case this.vhf2Transmit.get() && this.vhf3Transmit.get():
          SimVar.SetSimVarValue(this.setTransmitEvent1, SimVarValueType.Number, SimTransmitStates.Com2);
          SimVar.SetSimVarValue(this.setTransmitEvent2, SimVarValueType.Number, SimTransmitStates.Com3);
          break;
        case this.vhf1Transmit.get():
          SimVar.SetSimVarValue(this.setTransmitEvent1, SimVarValueType.Number, SimTransmitStates.Com1);
          SimVar.SetSimVarValue(this.setTransmitEvent2, SimVarValueType.Number, SimTransmitStates.None);
          break;
        case this.vhf2Transmit.get():
          SimVar.SetSimVarValue(this.setTransmitEvent1, SimVarValueType.Number, SimTransmitStates.Com2);
          SimVar.SetSimVarValue(this.setTransmitEvent2, SimVarValueType.Number, SimTransmitStates.None);
          break;
        case this.vhf3Transmit.get():
          SimVar.SetSimVarValue(this.setTransmitEvent1, SimVarValueType.Number, SimTransmitStates.Com3);
          SimVar.SetSimVarValue(this.setTransmitEvent2, SimVarValueType.Number, SimTransmitStates.None);
          break;
        default:
          SimVar.SetSimVarValue(this.setTransmitEvent1, SimVarValueType.Number, SimTransmitStates.None);
          SimVar.SetSimVarValue(this.setTransmitEvent2, SimVarValueType.Number, SimTransmitStates.None);
          break;
      }
    }
  }
}
