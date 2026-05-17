import { ConsumerSubject, EventBus, FSComponent } from '@microsoft/msfs-sdk';

import { DestroyableComponent } from '@flybywiresim/msfs-avionics-common';
import { ComponentPositionProps } from '../../../common/ComponentPositionProps';
import { HydraulicSystemIndicator } from '../../../common/HydraulicSystemIndicator';
import { SvgGroup } from '../../../common/SvgGroup';
import { SDSimvars } from '../../../SDSimvarPublisher';
import { Spoilers } from '../../../common/Spoilers';

export class Wings extends DestroyableComponent<ComponentPositionProps & { bus: EventBus }> {
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

  render() {
    return (
      <SvgGroup x={this.props.x} y={this.props.y}>
        <text class="F25 White Center LS1" x={262} y={124}>
          SPD BRK
        </text>

        <HydraulicSystemIndicator x={225} y={0} system="G" hydraulicsAvailable={this.greenHydraulicsPressurized} />
        <HydraulicSystemIndicator x={250} y={0} system="B" hydraulicsAvailable={this.blueHydraulicsPressurized} />
        <HydraulicSystemIndicator x={275} y={0} system="Y" hydraulicsAvailable={this.yellowHydraulicsPressurized} />

        <Spoilers bus={this.props.bus} x={9} y={89} />

        {/* Left spoiler wing shape */}
        <path class="Grey SW2" d="M0 60 l0 -6 l182 -30 l0 6" />
        <path class="Grey SW2" d="M49 119 l0 6 l135 -14 l0 -6" />

        {/* Right spoiler wing shape */}
        <path class="Grey SW2" d="M519 60 l0 -6 l-182 -30 l0 6" />
        <path class="Grey SW2" d="M470 119 l0 6 l-135 -14 l0 -6" />
      </SvgGroup>
    );
  }
}
