import { ConsumerSubject, EventBus, FSComponent, MappedSubject, MathUtils, VNode } from '@microsoft/msfs-sdk';

import { DestroyableComponent } from '@flybywiresim/msfs-avionics-common';
import { ComponentPositionProps } from '../../../common/ComponentPositionProps';
import { ComponentSidePositionProps } from '../../../common/ComponentSidePositionProps';
import { HydraulicSystem, HydraulicSystemIndicator } from '../../../common/HydraulicSystemIndicator';
import { ServoControlIndicator } from './ServoControlIndicator';
import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';
import { SDSimvars } from '../../../SDSimvarPublisher';
import { SvgGroup } from '../../../common/SvgGroup';
import { A32NXFcdcBusEvents } from '@shared/publishers/A32NXFcdcBusPublisher';
import { FcdcChoiceEvents } from '../../../providers/FcdcChoiceProvider';

export class Elevator extends DestroyableComponent<
  ComponentPositionProps & ComponentSidePositionProps & { bus: EventBus }
> {
  private readonly sub = this.props.bus.getSubscriber<A32NXFcdcBusEvents & FcdcChoiceEvents>();

  private readonly elevatorPositionWord1 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on(
      this.props.side === 'left'
        ? 'a32nx_fcdc_left_elevator_position_deg_1'
        : 'a32nx_fcdc_right_elevator_position_deg_1',
    ),
  );
  private readonly fcdc1Chosen = this.elevatorPositionWord1.map((word) => !word.isFailureWarning());
  private readonly chosenElevatorPosition = Arinc429LocalVarConsumerSubject.create(null);

  private readonly fcdcDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fcdc_discrete_word_041'),
  );
  private readonly fcdcDiscreteWord3 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fcdc_discrete_word_042'),
  );

  private readonly servocontrol1Avail = this.fcdcDiscreteWord3.map((word) =>
    word.bitValueOr(this.props.side === 'left' ? 15 : 18, false),
  );
  private readonly servocontrol2Avail = this.fcdcDiscreteWord3.map((word) =>
    word.bitValueOr(this.props.side === 'left' ? 16 : 17, false),
  );
  private readonly servocontrol1Fault = this.fcdcDiscreteWord2.map((word) =>
    word.bitValueOr(this.props.side === 'left' ? 15 : 18, false),
  );
  private readonly servocontrol2Fault = this.fcdcDiscreteWord2.map((word) =>
    word.bitValueOr(this.props.side === 'left' ? 16 : 17, false),
  );

  private readonly elevatorDeflectPctNormalized = this.chosenElevatorPosition.map(
    (word) => (MathUtils.round(word.valueOr(0), 0.01) * 90) / 30,
  );
  private readonly elevatorPositionValid = this.chosenElevatorPosition.map((word) => !word.isFailureWarning());

  private readonly cursorClass = MappedSubject.create(
    ([servocontrol1Avail, servocontrol2Avail]) =>
      servocontrol1Avail || servocontrol2Avail ? 'Green SW3 LineJoinRound' : 'Amber SW3 LineJoinRound',
    this.servocontrol1Avail,
    this.servocontrol2Avail,
  );

  private readonly hydraulicSystem1: HydraulicSystem = this.props.side === 'left' ? 'B' : 'Y';

  private readonly hydraulicSystem2: HydraulicSystem = this.props.side === 'left' ? 'G' : 'B';

  private readonly greenHydraulicsPressurized = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on('greenHydraulicPressureSwitchPressurized'),
    false,
  );

  private readonly blueHydraulicsPressurized = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on('blueHydraulicPressureSwitchPressurized'),
    false,
  );

  private readonly yellowHydraulicsPressurized = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on('yellowHydraulicPressureSwitchPressurized'),
    false,
  );

  private readonly hydraulics1Pressurized = MappedSubject.create(
    ([blueHydraulicsPressurized, yellowHydraulicsPressurized]) =>
      this.props.side === 'left' ? blueHydraulicsPressurized : yellowHydraulicsPressurized,
    this.blueHydraulicsPressurized,
    this.yellowHydraulicsPressurized,
  );

  private readonly hydraulics2Pressurized = MappedSubject.create(
    ([greenHydraulicsPressurized, blueHydraulicsPressurized]) =>
      this.props.side === 'left' ? greenHydraulicsPressurized : blueHydraulicsPressurized,
    this.greenHydraulicsPressurized,
    this.blueHydraulicsPressurized,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.fcdc1Chosen.sub((fcdc1Chosen) => {
        this.chosenElevatorPosition.setConsumer(
          fcdc1Chosen
            ? this.sub.on(
                this.props.side === 'left'
                  ? 'a32nx_fcdc_left_elevator_position_deg_1'
                  : 'a32nx_fcdc_right_elevator_position_deg_1',
              )
            : this.sub.on(
                this.props.side === 'left'
                  ? 'a32nx_fcdc_left_elevator_position_deg_2'
                  : 'a32nx_fcdc_right_elevator_position_deg_2',
              ),
        );
      }, true),
    );

    this.subscriptions.push(
      this.elevatorPositionWord1,
      this.fcdc1Chosen,
      this.chosenElevatorPosition,
      this.fcdcDiscreteWord2,
      this.fcdcDiscreteWord3,
      this.servocontrol1Avail,
      this.servocontrol2Avail,
      this.servocontrol1Fault,
      this.servocontrol2Fault,
      this.elevatorDeflectPctNormalized,
      this.elevatorPositionValid,
      this.cursorClass,
      this.greenHydraulicsPressurized,
      this.blueHydraulicsPressurized,
      this.yellowHydraulicsPressurized,
      this.hydraulics1Pressurized,
      this.hydraulics2Pressurized,
    );
  }

  destroy(): void {
    super.destroy();
  }

  render() {
    const textPositionX = this.props.side === 'left' ? -59 : 62;

    return (
      <SvgGroup x={this.props.x} y={this.props.y}>
        <text class="F28 White Center" x={textPositionX} y={0}>
          {this.props.side === 'left' ? 'L' : 'R'}
        </text>
        <text class="F25 White Center LS1" x={textPositionX} y={27}>
          ELEV
        </text>

        <ElevatorAxis side={this.props.side} x={0} y={5} />

        <SvgGroup x={0} y={this.elevatorDeflectPctNormalized}>
          <path
            class={this.cursorClass}
            visibility={this.elevatorPositionValid.map((valid) => (valid ? 'visible' : 'hidden'))}
            d={`M0 77 l${this.props.side === 'right' ? '-' : ''}15 -9 l0 18Z`}
          />
        </SvgGroup>

        <text
          x={this.props.side === 'left' ? 26 : -26}
          y={76}
          visibility={this.elevatorPositionValid.map((valid) => (!valid ? 'visible' : 'hidden'))}
          class="Large Amber Center"
        >
          XX
        </text>

        <HydraulicSystemIndicator
          x={this.props.side === 'left' ? -78 : 28}
          y={91}
          system={this.hydraulicSystem1}
          hydraulicsAvailable={this.hydraulics1Pressurized}
        />
        <HydraulicSystemIndicator
          x={this.props.side === 'left' ? -53 : 53}
          y={91}
          system={this.hydraulicSystem2}
          hydraulicsAvailable={this.hydraulics2Pressurized}
        />
        <ServoControlIndicator x={this.props.side === 'left' ? -78 : 28} y={91} servoFailed={this.servocontrol1Fault} />
        <ServoControlIndicator x={this.props.side === 'left' ? -53 : 53} y={91} servoFailed={this.servocontrol2Fault} />
      </SvgGroup>
    );
  }
}

class ElevatorAxis extends DestroyableComponent<ComponentPositionProps & ComponentSidePositionProps> {
  render() {
    const d1 = `M0 -13 l${this.props.side === 'left' ? '-' : ''}6 0 l0 -12 l${
      this.props.side === 'right' ? '-' : ''
    }6 0 l0 148 l${this.props.side === 'left' ? '-' : ''}6 0 l0 -12 l${this.props.side === 'right' ? '-' : ''}6 0`;
    const d2 = `M0 69 l${this.props.side === 'left' ? '-' : ''}6 0 l0 6 l${this.props.side === 'right' ? '-' : ''}6 0`;

    return (
      <SvgGroup x={this.props.x} y={this.props.y}>
        <path class="SW3 White LineJoinRound" d={d1} />
        <path class="SW3 White LineJoinRound" d={d2} />
      </SvgGroup>
    );
  }
}
