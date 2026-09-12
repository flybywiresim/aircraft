import { ComponentProps, DisplayComponent, EventBus, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { EisDisplay } from './Components/EisDisplay';
import { AfsDisplay } from './Components/AfsDisplay';
import { FcuSimvars } from './Publishers/FcuSimvarPublisher';

import './style.scss';

interface FCUProps extends ComponentProps {
  bus: EventBus;
}

export class FCUComponent extends DisplayComponent<FCUProps> {
  private readonly sub = this.props.bus.getSubscriber<FcuSimvars>();

  render(): VNode {
    return (
      <div id="Mainframe">
        <div id="Electricity">
          <AfsDisplay bus={this.props.bus} />
          <EisDisplay isCaptSide bus={this.props.bus} />
          <EisDisplay isCaptSide={false} bus={this.props.bus} />
        </div>
      </div>
    );
  }
}
