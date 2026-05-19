import { DestroyableComponent } from '@flybywiresim/msfs-avionics-common';
import { FSComponent, Subscribable } from '@microsoft/msfs-sdk';
import { ComponentPositionProps } from '../../../common/ComponentPositionProps';
import { SvgGroup } from '../../../common/SvgGroup';

interface ServoControlIndicatorProps extends ComponentPositionProps {
  servoFailed: Subscribable<boolean>;
}

export class ServoControlIndicator extends DestroyableComponent<ServoControlIndicatorProps> {
  render() {
    return (
      <SvgGroup x={this.props.x} y={this.props.y}>
        <path
          visibility={this.props.servoFailed.map((failed) => (failed ? 'inherit' : 'hidden'))}
          class="Amber SW3 NoFill LineRound"
          d="m 1 29 l 23 0 l 0 -32 l -23 0"
        />
      </SvgGroup>
    );
  }
}
