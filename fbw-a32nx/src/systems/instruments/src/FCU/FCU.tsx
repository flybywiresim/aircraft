import {
  ComponentProps,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';
import { EisDisplay } from 'instruments/src/FCU/Components/EisDisplay';
import { AfsDisplay } from 'instruments/src/FCU/Components/AfsDisplay';
import { FcuSimvars } from 'instruments/src/FCU/shared/FcuSimvarPublisher';
import { A32NXElectricalSystemEvents } from '../../../shared/src/publishers/A32NXElectricalSystemPublisher';

import './style.scss';

interface FCUProps extends ComponentProps {
  bus: EventBus;
}

export class FCUComponent extends DisplayComponent<FCUProps> {
  private readonly sub = this.props.bus.getSubscriber<A32NXElectricalSystemEvents & FcuSimvars>();

  private readonly fcuHealthy = ConsumerSubject.create(this.sub.on('fcuHealthy'), false);

  private readonly isBacklightPowered = ConsumerSubject.create(this.sub.on('a32nx_elec_ac_1_bus_is_powered'), false);

  render(): VNode {
    return (
      <>
        <img
          id="fcu-background"
          src="coui://html_ui/Images/fbw-a32nx/FCU/fcu-background.png"
          class={{
            Hide: this.isBacklightPowered.map(SubscribableMapFunctions.not()),
          }}
        />
        <svg
          class={{
            'fcu-svg': true,
            Hide: this.fcuHealthy.map(SubscribableMapFunctions.not()),
          }}
          version="1.1"
          viewBox="0 0 1280 640"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g>
            <AfsDisplay bus={this.props.bus} />
            <EisDisplay isCaptSide x={0} y={438} bus={this.props.bus} />
            <EisDisplay isCaptSide={false} x={920} y={438} bus={this.props.bus} />
          </g>
        </svg>
      </>
    );
  }
}
