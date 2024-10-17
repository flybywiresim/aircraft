import { ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { EisDisplay } from 'instruments/src/FCU/Components/EisDisplay';
import { AfsDisplay } from 'instruments/src/FCU/Components/AfsDisplay';

import './style.scss';
import { FcuSimvars } from 'instruments/src/FCU/shared/FcuSimvarPublisher';

interface FCUProps extends ComponentProps {
  bus: EventBus;
}

export class FCUComponent extends DisplayComponent<FCUProps> {
  private visSub = Subject.create<'' | 'Hide'>('Hide');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<FcuSimvars>();

    sub
      .on('fcuHealthy')
      .whenChanged()
      .handle((value) => {
        this.visSub.set(value ? '' : 'Hide');
      });
  }

  render(): VNode {
    return (
      <>
        <img id="fcu-background" src="coui://html_ui/Images/fbw-a32nx/FCU/fcu-background.png" />
        <svg class="fcu-svg" version="1.1" viewBox="0 0 1280 640" xmlns="http://www.w3.org/2000/svg">
          <g class={this.visSub}>
            <AfsDisplay bus={this.props.bus} />
            <EisDisplay isCaptSide x={0} y={438} bus={this.props.bus} />
            <EisDisplay isCaptSide={false} x={920} y={438} bus={this.props.bus} />
          </g>
        </svg>
      </>
    );
  }
}
