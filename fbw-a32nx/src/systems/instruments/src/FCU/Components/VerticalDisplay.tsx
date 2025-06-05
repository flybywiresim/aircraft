import {
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

export class VerticalDisplay extends DisplayComponent<{ x: number; y: number; bus: EventBus }> {
  private altValue = ConsumerSubject.create(null, 0);

  private vsValue = ConsumerSubject.create(null, 0);

  private vsDashes = ConsumerSubject.create(null, false);

  private trkFpaMode = ConsumerSubject.create(null, false);

  private managed = ConsumerSubject.create(null, false);

  private lightsTest = Subject.create(false);

  private dotVisibilitySub = MappedSubject.create(
    ([lightsTest, managed]) => (managed || lightsTest ? 'visible' : 'hidden'),
    this.lightsTest,
    this.managed,
  );

  private fpaLabelSub = MappedSubject.create(
    ([trkFpa, lightsTest]) => trkFpa || lightsTest,
    this.trkFpaMode,
    this.lightsTest,
  );
  private vsLabelSub = MappedSubject.create(
    ([trkFpa, lightsTest]) => !trkFpa || lightsTest,
    this.trkFpaMode,
    this.lightsTest,
  );

  private altValueSub = MappedSubject.create(
    ([lightsTest, altValue]) => {
      if (lightsTest) {
        return '88888';
      } else {
        return Math.round(altValue).toString().padStart(5, '0');
      }
    },
    this.lightsTest,
    this.altValue,
  );

  private vsValueSub = MappedSubject.create(
    ([lightsTest, vsDashes, vsValue, trkFpaMode]) => {
      const sign = Math.sign(vsValue) >= 0 ? '+' : '~';
      const absValue = Math.abs(vsValue);

      if (lightsTest) {
        return '+8.888';
      } else if (trkFpaMode && vsDashes) {
        return '~-.-';
      } else if (trkFpaMode && !vsDashes) {
        return `${sign}${absValue.toFixed(1)}`;
      } else if (vsDashes) {
        return '~----';
      } else {
        return `${sign}${Math.floor(absValue * 0.01)
          .toString()
          .padStart(2, '0')}oo`;
      }
    },
    this.lightsTest,
    this.vsDashes,
    this.vsValue,
    this.trkFpaMode,
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

    this.vsDashes.setConsumer(sub.on('afsDisplayVsFpaDashes'));

    this.vsValue.setConsumer(sub.on('afsDisplayVsFpaValue'));

    this.altValue.setConsumer(sub.on('afsDisplayAltValue'));

    this.managed.setConsumer(sub.on('afsDisplayLvlChManaged'));
  }

  public render(): VNode {
    return (
      <g transform={`translate(${this.props.x} ${this.props.y})`}>
        <g>
          <text id="ALT" class="Active" x="256" y="57.6">
            ALT
          </text>
          <text id="Value" class="Value" x="96" y="163">
            {this.altValueSub}
          </text>
        </g>

        <g transform="translate(512 0)">
          <text
            id="VS"
            x="348"
            y="57.6"
            text-anchor="end"
            class={{ Active: this.vsLabelSub, Inactive: this.vsLabelSub.map(SubscribableMapFunctions.not()) }}
          >
            V/S
          </text>
          <text
            id="FPA"
            x="461"
            y="57.6"
            text-anchor="end"
            class={{ Active: this.fpaLabelSub, Inactive: this.fpaLabelSub.map(SubscribableMapFunctions.not()) }}
          >
            FPA
          </text>
          <text id="Value" class="Value" x="77" y="163">
            {this.vsValueSub}
          </text>
        </g>

        <g>
          <line x1="369" y1="34.5" x2="369" y2="57.6" />
          <line x1="369" y1="38.4" x2="440" y2="38.4" />
          <text id="LVLCH" class="Active" x="450.5" y="57.6">
            LVL/CH
          </text>
          <line x1="747.5" y1="34.5" x2="747.5" y2="57.6" />
          <line x1="747.5" y1="38.4" x2="676" y2="38.4" />
          <circle id="Illuminator" r="28" cx="544" cy="119" visibility={this.dotVisibilitySub} />
        </g>
      </g>
    );
  }
}
