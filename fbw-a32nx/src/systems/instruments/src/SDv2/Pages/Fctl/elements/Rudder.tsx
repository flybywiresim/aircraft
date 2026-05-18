import { ConsumerSubject, EventBus, FSComponent, MappedSubject, MathUtils, Subject, VNode } from '@microsoft/msfs-sdk';

import { DestroyableComponent } from '@flybywiresim/msfs-avionics-common';
import { ComponentPositionProps } from '../../../common/ComponentPositionProps';
import { HydraulicSystemIndicator } from '../../../common/HydraulicSystemIndicator';
import { SDSimvars } from '../../../SDSimvarPublisher';
import { SvgGroup } from '../../../common/SvgGroup';
import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';
import { A32NXFacBusEvents } from '@shared/publishers/A32NXFacBusPublisher';

export class Rudder extends DestroyableComponent<ComponentPositionProps & { bus: EventBus }> {
  private readonly rudderDeflection = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on('rudderDeflection').withPrecision(0.05),
    0,
  );

  private readonly rudderDeflectPctNormalized = this.rudderDeflection.map(
    (deflection) => (-MathUtils.round(deflection, 0.01) * 25) / 100,
  );
  private readonly rudderPositionValid = Subject.create(true);

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

  private readonly cursorClass = MappedSubject.create(
    ([greenHydraulicsPressurized, blueHydraulicsPressurized, yellowHydraulicsPressurized]) =>
      greenHydraulicsPressurized || blueHydraulicsPressurized || yellowHydraulicsPressurized
        ? 'Green SW3'
        : 'Amber SW3',
    this.greenHydraulicsPressurized,
    this.blueHydraulicsPressurized,
    this.yellowHydraulicsPressurized,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.rudderDeflection,
      this.rudderDeflectPctNormalized,
      this.greenHydraulicsPressurized,
      this.blueHydraulicsPressurized,
      this.yellowHydraulicsPressurized,
      this.cursorClass,
    );
  }

  destroy(): void {
    super.destroy();
  }

  render() {
    return (
      <SvgGroup x={this.props.x} y={this.props.y}>
        <text class="F25 White Center LS1" x={-1} y={0}>
          RUD
        </text>

        <path id="rudderPath" class="SW3 White LineRound" d="M66 131 A 122 122 0 0 1 -66 131" />
        <path id="rudderCenter" class="SW3 White LineJoinRound" d="m-3 151 v 6 h 5 v-6" />

        <path
          id="rudderLeftBorder"
          class="SW3 White LineJoinRound"
          transform="rotate(30 0 26)"
          d="m-4.5 151 v 6 h 9 v-6"
        />
        <path
          id="rudderRightBorder"
          class="SW3 White LineJoinRound"
          transform="rotate(-30 0 26)"
          d="m-4.5 151 v 6 h 9 v-6"
        />

        <g transform={this.rudderDeflectPctNormalized.map((deflection) => `rotate(${deflection} 0 26)`)}>
          <path id="rudderCircle" class={this.cursorClass} d="M -9 93 A 9 9 0 0 1 9 93" />
          <path id="rudderTail" class={this.cursorClass} d="M-9 93 l9 57 l9,-57" />
        </g>

        <text x={-26} y={76} visibility={!this.rudderPositionValid ? 'visible' : 'hidden'} class="F26 Amber Center">
          XX
        </text>

        <HydraulicSystemIndicator x={-38} y={14} system={'G'} hydraulicsAvailable={this.greenHydraulicsPressurized} />
        <HydraulicSystemIndicator x={-13} y={14} system={'B'} hydraulicsAvailable={this.blueHydraulicsPressurized} />
        <HydraulicSystemIndicator x={12} y={14} system={'Y'} hydraulicsAvailable={this.yellowHydraulicsPressurized} />

        <RudderTravelLimiter bus={this.props.bus} />
        <RudderTrim bus={this.props.bus} />
      </SvgGroup>
    );
  }
}

class RudderTrim extends DestroyableComponent<{ bus: EventBus }> {
  private readonly sub = this.props.bus.getSubscriber<A32NXFacBusEvents>();

  private readonly fac1DiscreteWord2 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fac_discrete_word_2_1'),
  );

  private readonly fac2DiscreteWord2 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fac_discrete_word_2_2'),
  );

  private readonly anyRudderTrimEngaged = MappedSubject.create(
    ([fac1DiscreteWord2, fac2DiscreteWord2]) =>
      fac1DiscreteWord2.bitValueOr(13, false) ||
      fac1DiscreteWord2.bitValueOr(14, false) ||
      fac2DiscreteWord2.bitValueOr(13, false) ||
      fac2DiscreteWord2.bitValueOr(14, false),
    this.fac1DiscreteWord2,
    this.fac2DiscreteWord2,
  );

  private readonly facSourceForRudderTrim = this.fac2DiscreteWord2.map((word) => (word.bitValueOr(13, false) ? 2 : 1));

  private readonly trimPosition = Arinc429LocalVarConsumerSubject.create(null);

  private readonly trimDisplayPosition = this.trimPosition.map((position) => MathUtils.round(position.value, 0.01));

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.facSourceForRudderTrim.sub((source) => {
        this.trimPosition.setConsumer(
          this.sub.on(source === 1 ? 'a32nx_fac_rudder_trim_position_1' : 'a32nx_fac_rudder_trim_position_2'),
        );
      }, true),
    );

    this.subscriptions.push(
      this.fac1DiscreteWord2,
      this.fac2DiscreteWord2,
      this.anyRudderTrimEngaged,
      this.facSourceForRudderTrim,
      this.trimPosition,
      this.trimDisplayPosition,
    );
  }

  destroy(): void {
    super.destroy();
  }

  render() {
    return (
      <>
        <g
          id="rudderTrimCursor"
          transform={this.trimDisplayPosition.map((trimPosition) => `rotate(${trimPosition} 0 26)`)}
          visibility={this.trimPosition.map((trimPosition) =>
            !trimPosition.isFailureWarning() ? 'visible' : 'hidden',
          )}
        >
          <path
            class={this.anyRudderTrimEngaged.map((trimEngaged) =>
              trimEngaged ? 'Cyan SW6 LineRound' : 'Amber SW6 LineRound',
            )}
            d="m0 159 v 11"
          />
        </g>
        <text
          id="rudderTrimFailedFlag"
          class="F24 Amber Center"
          visibility={this.trimPosition.map((trimPosition) => (trimPosition.isFailureWarning() ? 'visible' : 'hidden'))}
          x="1"
          y="190"
        >
          XX
        </text>
      </>
    );
  }
}

class RudderTravelLimiter extends DestroyableComponent<{ bus: EventBus }> {
  private readonly sub = this.props.bus.getSubscriber<A32NXFacBusEvents>();

  private readonly fac1DiscreteWord2 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fac_discrete_word_2_1'),
  );

  private readonly fac2DiscreteWord2 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fac_discrete_word_2_2'),
  );

  private readonly anyTravelLimiterEngaged = MappedSubject.create(
    ([fac1DiscreteWord2, fac2DiscreteWord2]) =>
      fac1DiscreteWord2.bitValueOr(15, false) ||
      fac1DiscreteWord2.bitValueOr(16, false) ||
      fac2DiscreteWord2.bitValueOr(15, false) ||
      fac2DiscreteWord2.bitValueOr(16, false),
    this.fac1DiscreteWord2,
    this.fac2DiscreteWord2,
  );

  private readonly travelLimitSymbolClass = this.anyTravelLimiterEngaged.map((travelLimEngaged) =>
    travelLimEngaged ? 'Green SW3 LineRound' : 'Amber SW3 LineRound',
  );

  private readonly facSourceForRudderTravelLim = this.fac2DiscreteWord2.map((word) =>
    word.bitValueOr(15, false) ? 2 : 1,
  );

  private readonly travelLimiterPosition = Arinc429LocalVarConsumerSubject.create(null);

  private readonly travelLimiterDisplayPosition = this.travelLimiterPosition.map(
    (position) => MathUtils.round(position.value, 0.01) + 2,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.facSourceForRudderTravelLim.sub((source) => {
        this.travelLimiterPosition.setConsumer(
          this.sub.on(source === 1 ? 'a32nx_fac_rudder_travel_lim_command_1' : 'a32nx_fac_rudder_travel_lim_command_2'),
        );
      }, true),
    );

    this.subscriptions.push(
      this.fac1DiscreteWord2,
      this.fac2DiscreteWord2,
      this.anyTravelLimiterEngaged,
      this.travelLimitSymbolClass,
      this.facSourceForRudderTravelLim,
      this.travelLimiterPosition,
      this.travelLimiterDisplayPosition,
    );
  }

  destroy(): void {
    super.destroy();
  }

  render() {
    return (
      <>
        <g
          visibility={this.travelLimiterPosition.map((position) =>
            !position.isFailureWarning() ? 'visible' : 'hidden',
          )}
        >
          <g
            id="rudderLeftMaxAngle"
            transform={this.travelLimiterDisplayPosition.map(
              (travelLimiterPosition) => `rotate(${travelLimiterPosition} 0 26)`,
            )}
          >
            <path class={this.travelLimitSymbolClass} d="m0 151 l 0 21 l 7 0" />
          </g>

          <g
            id="rudderRightMaxAngle"
            transform={this.travelLimiterDisplayPosition.map(
              (travelLimiterPosition) => `rotate(${-travelLimiterPosition} 0 26)`,
            )}
          >
            <path class={this.travelLimitSymbolClass} d="m0 151 l 0 21 l -7 0" />
          </g>
        </g>
        <g
          visibility={this.travelLimiterPosition.map((position) =>
            position.isFailureWarning() ? 'visible' : 'hidden',
          )}
        >
          <text x="-82" y="180" class="F24 Amber Center">
            TLU
          </text>
          <text x="84" y="180" class="F24 Amber Center">
            TLU
          </text>
        </g>
      </>
    );
  }
}
