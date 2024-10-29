import { Arinc429ConsumerSubject } from '@flybywiresim/fbw-sdk';
import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subscribable,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';
import { Arinc429Values } from 'instruments/src/EWD/shared/ArincValueProvider';
import { EwdSimvars } from 'instruments/src/EWD/shared/EwdSimvarPublisher';

interface BleedSupplyProps {
  bus: EventBus;
  x: number;
  y: number;
  hidden: Subscribable<boolean>;
}

export class BleedSupply extends DisplayComponent<BleedSupplyProps> {
  private readonly sub = this.props.bus.getSubscriber<EwdSimvars & Arinc429Values>();

  private readonly cpiomBAgsDiscrete = Arinc429ConsumerSubject.create(undefined);
  private readonly noseGearCompressedSys1 = ConsumerSubject.create(
    this.sub.on('nose_gear_compressed_1').whenChanged(),
    false,
  );
  private readonly noseGearCompressedSys2 = ConsumerSubject.create(
    this.sub.on('nose_gear_compressed_2').whenChanged(),
    false,
  );
  private readonly onGround = MappedSubject.create(
    SubscribableMapFunctions.or(),
    this.noseGearCompressedSys1,
    this.noseGearCompressedSys2,
  );

  private readonly engine1State = ConsumerSubject.create(this.sub.on('engine_state_1').whenChanged(), 0);
  private readonly engine2State = ConsumerSubject.create(this.sub.on('engine_state_2').whenChanged(), 0);
  private readonly engine3State = ConsumerSubject.create(this.sub.on('engine_state_3').whenChanged(), 0);
  private readonly engine4State = ConsumerSubject.create(this.sub.on('engine_state_4').whenChanged(), 0);

  private readonly nai1 = ConsumerSubject.create(this.sub.on('eng_anti_ice_1').whenChanged(), false);
  private readonly nai2 = ConsumerSubject.create(this.sub.on('eng_anti_ice_2').whenChanged(), false);
  private readonly nai3 = ConsumerSubject.create(this.sub.on('eng_anti_ice_3').whenChanged(), false);
  private readonly nai4 = ConsumerSubject.create(this.sub.on('eng_anti_ice_4').whenChanged(), false);
  private readonly wai = ConsumerSubject.create(this.sub.on('wing_anti_ice').whenChanged(), false);
  private readonly thrustLimit = ConsumerSubject.create(this.sub.on('thrust_limit_type').whenChanged(), 0);

  private readonly oneEngineRunning = MappedSubject.create(
    ([eng1State, eng2State, eng3State, eng4State]) =>
      eng1State === 1 || eng2State === 1 || eng3State === 1 || eng4State === 1,
    this.engine1State,
    this.engine2State,
    this.engine3State,
    this.engine4State,
  );

  private readonly bleedSupplyVisible = MappedSubject.create(
    ([onGround, thrustLimit, oneEngineRunning, revSelected]) =>
      !revSelected && ((onGround && oneEngineRunning) || (!onGround && thrustLimit >= 2)), // MCT, FLEX TOGA
    this.onGround,
    this.thrustLimit,
    this.oneEngineRunning,
    this.props.hidden,
  );

  private readonly bleedText = MappedSubject.create(
    ([cpiomB, nai1, nai2, nai3, nai4, wai, visible]) => {
      const text = [];
      if (visible) {
        if (cpiomB.bitValueOr(13, false) || cpiomB.bitValueOr(14, false)) {
          text.push('PACKS');
        }

        if (nai1 || nai2 || nai3 || nai4) {
          text.push('NAI');
        }

        if (wai) {
          text.push('WAI');
        }
      }
      return text.join('/');
    },
    this.cpiomBAgsDiscrete,
    this.nai1,
    this.nai2,
    this.nai3,
    this.nai4,
    this.wai,
    this.bleedSupplyVisible,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.cpiomBAgsDiscrete.setConsumer(this.sub.on('cpiomBAgsDiscrete'));
  }

  render() {
    return (
      <text x={this.props.x} y={this.props.y} class="Green F26 End">
        {this.bleedText}
      </text>
    );
  }
}
