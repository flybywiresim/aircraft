import { ComponentProps, ConsumerSubject, DisplayComponent, EventBus, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { HdgDisplay } from './HdgDisplay';
import { SpdDisplay } from './SpdDisplay';
import { VsDisplay } from './VsDisplay';
import { AltDisplay } from './AltDisplay';
import { FcuSimvars } from '../Publishers/FcuSimvarPublisher';

interface AfsDisplayProps extends ComponentProps {
  bus: EventBus;
}

export class AfsDisplay extends DisplayComponent<AfsDisplayProps> {
  private sub = this.props.bus.getSubscriber<FcuSimvars>();

  private afsCpActive = ConsumerSubject.create(this.sub.on('afsDisplayActive'), false);

  public render(): VNode {
    return (
      <div id="LargeScreen" style={{ visibility: this.afsCpActive.map((active) => (active ? 'inherit' : 'hidden')) }}>
        <SpdDisplay bus={this.props.bus} />
        <HdgDisplay bus={this.props.bus} />

        <div id="AltVS">
          <AltDisplay bus={this.props.bus} />
          <VsDisplay bus={this.props.bus} />
        </div>
      </div>
    );
  }
}
