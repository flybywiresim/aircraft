import {
  ComponentProps,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';
import { FcuSimvars } from '../shared/FcuSimvarPublisher';
import { HdgDisplay } from './HdgDisplay';
import { SpdDisplay } from './SpdDisplay';
import { VerticalDisplay } from './VerticalDisplay';

interface AfsDisplayProps extends ComponentProps {
  bus: EventBus;
}

export class AfsDisplay extends DisplayComponent<AfsDisplayProps> {
  private lightsTest = Subject.create(false);

  private trkFpaMode = ConsumerSubject.create(null, false);

  private trkFpaLabelSub = MappedSubject.create(
    ([trkFpa, lightsTest]) => trkFpa || lightsTest,
    this.trkFpaMode,
    this.lightsTest,
  );
  private hdgVsLabelSub = MappedSubject.create(
    ([trkFpa, lightsTest]) => !trkFpa || lightsTest,
    this.trkFpaMode,
    this.lightsTest,
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<FcuSimvars>();

    sub
      .on('lightsTest')
      .whenChanged()
      .handle((value) => {
        this.lightsTest.set(value === 0);
      });

    this.trkFpaMode.setConsumer(sub.on('afsDisplayTrkFpaMode'));
  }

  public render(): VNode {
    return (
      <>
        <g transform="translate(0 0)">
          <SpdDisplay bus={this.props.bus} x={0} y={0} />

          <HdgDisplay bus={this.props.bus} x={512} y={0} />

          <text
            id="HDG"
            class={{ Active: this.hdgVsLabelSub, Inactive: this.hdgVsLabelSub.map(SubscribableMapFunctions.not()) }}
            x="1229"
            y="96"
            text-anchor="end"
            alignment-baseline="middle"
          >
            HDG
          </text>
          <text
            id="TRK"
            class={{ Active: this.trkFpaLabelSub, Inactive: this.trkFpaLabelSub.map(SubscribableMapFunctions.not()) }}
            x="1229"
            y="163"
            text-anchor="end"
          >
            TRK
          </text>
        </g>

        <g transform="translate(0 224)">
          <text
            id="VS"
            class={{ Active: this.hdgVsLabelSub, Inactive: this.hdgVsLabelSub.map(SubscribableMapFunctions.not()) }}
            x="51"
            y="96"
            alignment-baseline="middle"
          >
            V/S
          </text>
          <text
            id="FPA"
            class={{ Active: this.trkFpaLabelSub, Inactive: this.trkFpaLabelSub.map(SubscribableMapFunctions.not()) }}
            x="51"
            y="163"
          >
            FPA
          </text>

          <VerticalDisplay bus={this.props.bus} x={256} y={0} />
        </g>
      </>
    );
  }
}
