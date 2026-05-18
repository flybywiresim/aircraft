import { ConsumerSubject, EventBus, FSComponent, MappedSubject, VNode } from '@microsoft/msfs-sdk';

import { DestroyableComponent } from '@flybywiresim/msfs-avionics-common';
import { ComponentPositionProps } from '../../../common/ComponentPositionProps';
import { HydraulicSystemIndicator } from '../../../common/HydraulicSystemIndicator';
import { SDSimvars } from '../../../SDSimvarPublisher';
import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';
import { SvgGroup } from '../../../common/SvgGroup';
import { A32NXFcdcBusEvents } from '@shared/publishers/A32NXFcdcBusPublisher';
import { FcdcChoiceEvents } from '../../../providers/FcdcChoiceProvider';

export class PitchTrim extends DestroyableComponent<ComponentPositionProps & { bus: EventBus }> {
  private readonly sub = this.props.bus.getSubscriber<A32NXFcdcBusEvents & FcdcChoiceEvents>();

  private readonly thsPositionWord1 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fcdc_ths_position_deg_1'),
  );
  private readonly fcdc1Chosen = this.thsPositionWord1.map((word) => !word.isFailureWarning());
  private readonly chosenTrimPosition = Arinc429LocalVarConsumerSubject.create(null);

  private readonly fcdcDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fcdc_discrete_word_041'),
  );

  private readonly thsJam = this.fcdcDiscreteWord2.map((word) => word.bitValueOr(27, false));

  private readonly pitchTrimPositionValid = this.chosenTrimPosition.map((word) => !word.isFailureWarning());

  private readonly greenHydraulicsPressurized = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on('greenHydraulicPressureSwitchPressurized'),
    false,
  );

  private readonly yellowHydraulicsPressurized = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on('yellowHydraulicPressureSwitchPressurized'),
    false,
  );

  private readonly hydraulicAvailableClass = MappedSubject.create(
    ([greenHydraulicsPressurized, yellowHydraulicsPressurized]) =>
      greenHydraulicsPressurized || yellowHydraulicsPressurized ? 'Green' : 'Amber',
    this.greenHydraulicsPressurized,
    this.yellowHydraulicsPressurized,
  );

  private readonly trimSeparated = this.chosenTrimPosition.map((position) =>
    Math.abs(position.value).toFixed(1).split('.'),
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.fcdc1Chosen.sub((fcdc1Chosen) => {
        this.chosenTrimPosition.setConsumer(
          fcdc1Chosen ? this.sub.on('a32nx_fcdc_ths_position_deg_1') : this.sub.on('a32nx_fcdc_ths_position_deg_2'),
        );
      }, true),
    );

    this.subscriptions.push(
      this.thsPositionWord1,
      this.fcdc1Chosen,
      this.chosenTrimPosition,
      this.fcdcDiscreteWord2,
      this.thsJam,
      this.pitchTrimPositionValid,
      this.greenHydraulicsPressurized,
      this.yellowHydraulicsPressurized,
      this.hydraulicAvailableClass,
      this.trimSeparated,
    );
  }

  destroy(): void {
    super.destroy();
  }

  render() {
    return (
      <SvgGroup x={this.props.x} y={this.props.y}>
        <text class={this.thsJam.map((jam) => (jam ? 'Amber F25 Center LS1' : 'White F25 Center LS1'))} x={0} y={22}>
          PITCH TRIM
        </text>

        <SvgGroup x={-15} y={96}>
          <path id="stabLeft" class="SW2 Grey LineRound" d="M0 0 l-72,9 l0,-28 l38,-19" />
          <path id="stabRight" class="SW2 Grey LineRound" d="M85 0 l72,9 l0,-28 l-38,-19" />
        </SvgGroup>

        <g visibility={this.pitchTrimPositionValid.map((valid) => (valid ? 'visible' : 'hidden'))}>
          <text x={-1} y={53} class={this.hydraulicAvailableClass.map((availClass) => `${availClass} F29 End`)}>
            {this.trimSeparated.map((array) => array[0])}
          </text>
          <text x={4} y={53} class={this.hydraulicAvailableClass.map((availClass) => `${availClass} F26 Center`)}>
            .
          </text>
          <text x={21} y={53} class={this.hydraulicAvailableClass.map((availClass) => `${availClass} F22 Center`)}>
            {this.trimSeparated.map((array) => array[1])}
          </text>
          <text x={41} y={56} class="Cyan F36 Center">
            °
          </text>
          <text
            x={74}
            y={52}
            visibility={this.chosenTrimPosition.map((word) =>
              Math.abs(word.valueOr(0)) > 0.05 ? 'visible' : 'hidden',
            )}
            class={this.hydraulicAvailableClass.map((availClass) => `${availClass} F22 Center`)}
          >
            {this.chosenTrimPosition.map((word) => (Math.sign(word.valueOr(0)) === 1 ? 'DN' : 'UP'))}
          </text>
        </g>

        <text
          x={28}
          y={50}
          visibility={this.pitchTrimPositionValid.map((valid) => (!valid ? 'visible' : 'hidden'))}
          class="Large Amber Center"
        >
          XX
        </text>

        <HydraulicSystemIndicator x={102} y={0} system={'G'} hydraulicsAvailable={this.greenHydraulicsPressurized} />
        <HydraulicSystemIndicator x={128} y={0} system={'Y'} hydraulicsAvailable={this.yellowHydraulicsPressurized} />
      </SvgGroup>
    );
  }
}
