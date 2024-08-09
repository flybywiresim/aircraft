import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  Subject,
  VNode,
} from '@microsoft/msfs-sdk';
import { FormattedFwcText } from 'instruments/src/EWD/elements/FormattedFwcText';
import { EwdSimvars } from 'instruments/src/EWD/shared/EwdSimvarPublisher';
import { EcamMemos } from '../../MsfsAvionicsCommon/EcamMessages';

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

  private update() {
    this.memosLeftFormatString.set(
      this.memosLeft
        .filter((v) => !!v.get())
        .map((val) => EcamMemos[padEWDCode(val.get())])
        .join('\r'),
    );
    this.memosRightFormatString.set(
      this.memosRight
        .filter((v) => !!v.get())
        .map((val) => EcamMemos[padEWDCode(val.get())])
        .join('\r'),
    );

    // Weirdly enough, we have to wait for the SVG to be rendered to get its bounding box
    setTimeout(() => {
      this.memosLeftSvgRef.instance.style.height = `${(this.memosLeftSvgRef.instance.getBBox().height + 12).toFixed(1)}px`;
      this.memosRightSvgRef.instance.style.height = `${(this.memosRightSvgRef.instance.getBBox().height + 12).toFixed(1)}px`;
    }, 150);
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.memosLeft.forEach((el) => el.sub(() => this.update(), true));
    this.memosRight.forEach((el) => el.sub(() => this.update(), true));
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
