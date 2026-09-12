import { ComponentProps, ConsumerSubject, DisplayComponent, EventBus, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { BaroRefDisplay } from './BaroRefDisplay';
import { NdDataDisplay } from './NdDataDisplay';
import { FcuSimvars } from '../Publishers/FcuSimvarPublisher';

interface EisDisplayProps extends ComponentProps {
  isCaptSide: boolean;
  bus: EventBus;
}

export class EisDisplay extends DisplayComponent<EisDisplayProps> {
  private readonly sub = this.props.bus.getSubscriber<FcuSimvars>();

  private efisCpActive = ConsumerSubject.create(
    this.sub.on(`eisDisplay${this.props.isCaptSide ? 'Left' : 'Right'}Active`),
    false,
  );

  public render(): VNode {
    return (
      <div style={{ visibility: this.efisCpActive.map((active) => (active ? 'inherit' : 'hidden')) }}>
        <BaroRefDisplay isCaptSide={this.props.isCaptSide} bus={this.props.bus} />
        <NdDataDisplay index={this.props.isCaptSide ? 0 : 1} bus={this.props.bus} />
      </div>
    );
  }
}
