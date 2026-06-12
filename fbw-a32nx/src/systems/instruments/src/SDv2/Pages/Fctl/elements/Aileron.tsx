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

export class Aileron extends DestroyableComponent<
  ComponentPositionProps & ComponentSidePositionProps & { bus: EventBus }
> {
  private readonly sub = this.props.bus.getSubscriber<A32NXFcdcBusEvents & FcdcChoiceEvents>();

  private readonly aileronPositionWord1 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on(
      this.props.side === 'left' ? 'a32nx_fcdc_left_aileron_position_deg_1' : 'a32nx_fcdc_right_aileron_position_deg_1',
    ),
  );
  private readonly fcdc1Chosen = this.aileronPositionWord1.map((word) => !word.isFailureWarning());
  private readonly chosenAileronPosition = Arinc429LocalVarConsumerSubject.create(null);

  private readonly fcdcDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fcdc_discrete_word_041'),
  );
  private readonly fcdcDiscreteWord3 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fcdc_discrete_word_042'),
  );

  private readonly servocontrol1Avail = this.fcdcDiscreteWord3.map((word) =>
    word.bitValueOr(this.props.side === 'left' ? 11 : 13, false),
  );
  private readonly servocontrol2Avail = this.fcdcDiscreteWord3.map((word) =>
    word.bitValueOr(this.props.side === 'left' ? 12 : 14, false),
  );
  private readonly servocontrol1Fault = this.fcdcDiscreteWord2.map((word) =>
    word.bitValueOr(this.props.side === 'left' ? 11 : 13, false),
  );
  private readonly servocontrol2Fault = this.fcdcDiscreteWord2.map((word) =>
    word.bitValueOr(this.props.side === 'left' ? 12 : 14, false),
  );

  private readonly aileronDeflectPctNormalized = this.chosenAileronPosition.map(
    (word) => (MathUtils.round(word.valueOr(0), 0.01) * 68.5) / 25,
  );
  private readonly aileronPositionValid = this.chosenAileronPosition.map((word) => !word.isFailureWarning());

  private readonly cursorClass = MappedSubject.create(
    ([servocontrol1Avail, servocontrol2Avail]) =>
      servocontrol1Avail || servocontrol2Avail ? 'Green SW3 LineJoinRound' : 'Amber SW3 LineJoinRound',
    this.servocontrol1Avail,
    this.servocontrol2Avail,
  );

  private readonly hydraulicSystem1: HydraulicSystem = this.props.side === 'left' ? 'B' : 'G';

  private readonly hydraulicSystem2: HydraulicSystem = this.props.side === 'left' ? 'G' : 'B';

  private readonly greenHydraulicsPressurized = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on('greenHydraulicPressureSwitchPressurized'),
    false,
  );

  private readonly blueHydraulicsPressurized = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on('blueHydraulicPressureSwitchPressurized'),
    false,
  );

  private readonly hydraulics1Pressurized = MappedSubject.create(
    ([greenHydraulicsPressurized, blueHydraulicsPressurized]) =>
      this.props.side === 'left' ? blueHydraulicsPressurized : greenHydraulicsPressurized,
    this.greenHydraulicsPressurized,
    this.blueHydraulicsPressurized,
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
        this.chosenAileronPosition.setConsumer(
          fcdc1Chosen
            ? this.sub.on(
                this.props.side === 'left'
                  ? 'a32nx_fcdc_left_aileron_position_deg_1'
                  : 'a32nx_fcdc_right_aileron_position_deg_1',
              )
            : this.sub.on(
                this.props.side === 'left'
                  ? 'a32nx_fcdc_left_aileron_position_deg_2'
                  : 'a32nx_fcdc_right_aileron_position_deg_2',
              ),
        );
      }, true),
    );

    this.subscriptions.push(
      this.aileronPositionWord1,
      this.fcdc1Chosen,
      this.chosenAileronPosition,
      this.fcdcDiscreteWord2,
      this.fcdcDiscreteWord3,
      this.servocontrol1Avail,
      this.servocontrol2Avail,
      this.servocontrol1Fault,
      this.servocontrol2Fault,
      this.aileronDeflectPctNormalized,
      this.aileronPositionValid,
      this.cursorClass,
      this.greenHydraulicsPressurized,
      this.blueHydraulicsPressurized,
      this.hydraulics1Pressurized,
      this.hydraulics2Pressurized,
    );
  }

  destroy(): void {
    super.destroy();
  }

  render() {
    const textPositionX = this.props.side === 'left' ? -53 : 54;

    return (
      <SvgGroup x={this.props.x} y={this.props.y}>
        <text class="F28 White Center" x={textPositionX} y={0}>
          {this.props.side === 'left' ? 'L' : 'R'}
        </text>
        <text class="F25 White Center LS1" x={textPositionX} y={26}>
          AIL
        </text>

        <AileronAxis side={this.props.side} x={0} y={8} />

        <SvgGroup x={0} y={this.aileronDeflectPctNormalized}>
          <path
            class={this.cursorClass}
            visibility={this.aileronPositionValid.map((valid) => (valid ? 'visible' : 'hidden'))}
            d={`M0 57 l${this.props.side === 'right' ? '-' : ''}15 -9 l0 18Z`}
          />
        </SvgGroup>

        <text
          x={this.props.side === 'left' ? 26 : -26}
          y={74}
          visibility={this.aileronPositionValid.map((valid) => (!valid ? 'visible' : 'hidden'))}
          class="F22 Amber Center"
        >
          XX
        </text>

        <HydraulicSystemIndicator
          x={this.props.side === 'left' ? 27 : -75}
          y={96}
          system={this.hydraulicSystem1}
          hydraulicsAvailable={this.hydraulics1Pressurized}
        />
        <HydraulicSystemIndicator
          x={this.props.side === 'left' ? 52 : -50}
          y={96}
          system={this.hydraulicSystem2}
          hydraulicsAvailable={this.hydraulics2Pressurized}
        />
        <ServoControlIndicator x={this.props.side === 'left' ? 27 : -75} y={96} servoFailed={this.servocontrol1Fault} />
        <ServoControlIndicator x={this.props.side === 'left' ? 52 : -50} y={96} servoFailed={this.servocontrol2Fault} />
      </SvgGroup>
    );
  }
}

class AileronAxis extends DestroyableComponent<ComponentPositionProps & ComponentSidePositionProps> {
  render() {
    const d1 = `M0 0 l${this.props.side === 'left' ? '-' : ''}6 0 l0 -25 l${
      this.props.side === 'right' ? '-' : ''
    }6 0 l0 147 l${this.props.side === 'left' ? '-' : ''}6 0 l0 -10 l${this.props.side === 'right' ? '-' : ''}6 0`;
    const d2 = `M0 46 l${this.props.side === 'left' ? '-' : ''}6 0`;
    const d3 = `M0 52 l${this.props.side === 'left' ? '-' : ''}6 0`;
    const d4 = `M0 59 l${this.props.side === 'left' ? '-' : ''}6 0 l0 6 l${this.props.side === 'right' ? '-' : ''}6 0`;

    return (
      <SvgGroup x={this.props.x} y={this.props.y}>
        <path class="SW3 White LineJoinRound" d={d1} />
        <path class="SW3 White LineRound" d={d2} />
        <path class="SW3 White LineRound" d={d3} />
        <path class="SW3 White LineJoinRound" d={d4} />
      </SvgGroup>
    );
  }
}
