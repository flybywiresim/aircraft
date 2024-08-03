import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  Subject,
  VNode,
} from '@microsoft/msfs-sdk';
import { FormattedFwcText } from 'instruments/src/EWDv2/elements/FormattedFwcText';
import { EwdSimvars } from 'instruments/src/EWDv2/shared/EwdSimvarPublisher';
import EWDMessages from '@instruments/common/EWDMessages';

interface WdMemosProps {
  bus: EventBus;
}

const padEWDCode = (code: number) => code.toString().padStart(9, '0');

export class WdMemos extends DisplayComponent<WdMemosProps> {
  private readonly sub = this.props.bus.getSubscriber<ClockEvents & EwdSimvars>();

  private readonly memosLeftSvgRef = FSComponent.createRef<SVGGraphicsElement>();

  private readonly memosRightSvgRef = FSComponent.createRef<SVGGraphicsElement>();

  private readonly memosLeft = Array.from(Array(10), (_, idx) =>
    ConsumerSubject.create(this.sub.on(`memo_left_${idx + 1}`).whenChanged(), 0),
  );

  private readonly memosRight = Array.from(Array(10), (_, idx) =>
    ConsumerSubject.create(this.sub.on(`memo_right_${idx + 1}`).whenChanged(), 0),
  );

  private readonly memosLeftFormatString = Subject.create('');

  private readonly memosRightFormatString = Subject.create('');

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub
      .on('realTime')
      .atFrequency(4)
      .handle(() => {
        this.memosLeftFormatString.set(
          this.memosLeft
            .filter((v) => !!v.get())
            .map((val) => EWDMessages[padEWDCode(val.get())])
            .join('\r'),
        );
        this.memosRightFormatString.set(
          this.memosRight
            .filter((v) => !!v.get())
            .map((val) => EWDMessages[padEWDCode(val.get())])
            .join('\r'),
        );

        this.memosLeftSvgRef.instance.style.height = `${(this.memosLeftSvgRef.instance.getBBox().height + 12).toFixed(1)}px`;
        this.memosRightSvgRef.instance.style.height = `${(this.memosRightSvgRef.instance.getBBox().height + 12).toFixed(1)}px`;
      });
  }

  render() {
    return (
      <>
        <div class="MemosContainer">
          <div class="MemosDividedArea">
            <div class="MemosLeft">
              <svg ref={this.memosLeftSvgRef} version="1.1" xmlns="http://www.w3.org/2000/svg">
                <FormattedFwcText x={0} y={24} message={this.memosLeftFormatString} />
              </svg>
            </div>
            <div class="MemosRight">
              <svg ref={this.memosRightSvgRef} version="1.1" xmlns="http://www.w3.org/2000/svg">
                <FormattedFwcText x={0} y={24} message={this.memosRightFormatString} />
              </svg>
            </div>
          </div>
          <div class="MemosFillArea" />
        </div>
      </>
    );
  }
}
