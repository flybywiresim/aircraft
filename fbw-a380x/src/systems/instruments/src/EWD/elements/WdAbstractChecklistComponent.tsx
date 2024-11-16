import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { EwdSimvars } from 'instruments/src/EWD/shared/EwdSimvarPublisher';
import { FwsEwdEvents } from '../../MsfsAvionicsCommon/providers/FwsEwdPublisher';
import {
  ChecklistLineStyle,
  WD_NUM_LINES,
  WdLineData,
  WdSpecialLine,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
import { FormattedFwcText } from 'instruments/src/EWD/elements/FormattedFwcText';
import { EclSoftKeys } from 'instruments/src/EWD/elements/EclClickspots';

interface WdAbstractChecklistComponentProps {
  bus: EventBus;
  visible: Subscribable<boolean>;
  abnormal: boolean;
}

export class WdAbstractChecklistComponent extends DisplayComponent<WdAbstractChecklistComponentProps> {
  protected readonly sub = this.props.bus.getSubscriber<ClockEvents & EwdSimvars & FwsEwdEvents>();

  protected readonly lineData: WdLineData[] = [];

  protected readonly activeLine = ConsumerSubject.create(this.sub.on('fws_active_line'), 0);

  protected readonly showFromLine = ConsumerSubject.create(this.sub.on('fws_show_from_line'), 0);
  protected readonly totalLines = Subject.create(0);

  // Overflow indicators
  protected readonly overflowTopVisibility = this.showFromLine.map((l) => (l > 0 ? 'visible' : 'hidden'));
  protected readonly overflowBottomVisibility = MappedSubject.create(
    ([sf, tl]) => (tl > WD_NUM_LINES && tl - WD_NUM_LINES > sf ? 'visible' : 'hidden'),
    this.showFromLine,
    this.totalLines,
  );

  static DefaultLineData: WdLineData = {
    activeProcedure: false,
    sensed: false,
    checked: false,
    text: '',
    style: ChecklistLineStyle.Standard,
    firstLine: false,
    lastLine: false,
  };

  // Subjects for rendering the WD lines
  private readonly lineDataSubject = Array.from(Array(WD_NUM_LINES), () =>
    Subject.create<WdLineData>(WdAbstractChecklistComponent.DefaultLineData),
  );
  private readonly lineSelected = Array.from(Array(WD_NUM_LINES), () => Subject.create<boolean>(false));

  public updateChecklists() {
    let lineIdx = 0;
    this.totalLines.set(this.lineData.length);

    this.lineData.forEach((ld, index) => {
      if (index >= this.showFromLine.get() && lineIdx < WD_NUM_LINES) {
        this.lineDataSubject[lineIdx].set(ld);
        this.lineSelected[lineIdx].set(index === this.activeLine.get());
        lineIdx++;
      }
    });

    // Fill remaining lines blank
    while (lineIdx < WD_NUM_LINES) {
      this.lineDataSubject[lineIdx].set({
        activeProcedure: false,
        sensed: true,
        checked: false,
        text: '',
        style: ChecklistLineStyle.ChecklistItem,
        firstLine: true,
        lastLine: true,
        specialLine: WdSpecialLine.Empty,
      });
      this.lineSelected[lineIdx].set(false);
      lineIdx++;
    }
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.activeLine.sub(() => this.updateChecklists());
    this.showFromLine.sub(() => this.updateChecklists());
  }

  // 17 lines
  render() {
    return (
      <div class="ProceduresContainer" style={{ display: this.props.visible.map((it) => (it ? 'flex' : 'none')) }}>
        <div class="OverflowIndicatorColumn">
          <div style={{ visibility: this.overflowTopVisibility }}>
            <OverflowArrowSymbol facingUp={true} />
          </div>
          <div style={{ visibility: this.overflowBottomVisibility }}>
            <OverflowArrowSymbol facingUp={false} />
          </div>
        </div>
        <div class="WarningsColumn">
          {Array.from(Array(WD_NUM_LINES), () => '').map((_, index) => (
            <EclLine
              data={this.lineDataSubject[index]}
              selected={this.lineSelected[index]}
              abnormal={this.props.abnormal}
            />
          ))}
        </div>
        <EclSoftKeys bus={this.props.bus} />
      </div>
    );
  }
}

interface EclLineProps {
  data: Subscribable<WdLineData>;
  selected: Subscribable<boolean>;
  abnormal: boolean;
}

export class EclLine extends DisplayComponent<EclLineProps> {
  render() {
    return (
      <div class="EclLineContainer">
        <div
          class={{
            EclLine: true,
            Selected: this.props.selected,
            ChecklistItem: this.props.data.map(
              (d) => !d.abnormalProcedure && d.style === ChecklistLineStyle.ChecklistItem,
            ),
            AbnormalItem: this.props.data.map(
              (d) => d.abnormalProcedure === true && d.style === ChecklistLineStyle.ChecklistItem,
            ),
            Headline: this.props.data.map((d) =>
              [ChecklistLineStyle.Headline, ChecklistLineStyle.SubHeadline].includes(d.style),
            ),
            Checked: this.props.data.map((d) => d.checked),
            ChecklistCompleted: this.props.data.map((d) => d.style === ChecklistLineStyle.CompletedChecklist),
            Green: this.props.data.map((d) => d.style === ChecklistLineStyle.Green),
            Cyan: this.props.data.map((d) => d.style === ChecklistLineStyle.Cyan),
            Amber: this.props.data.map((d) => d.style === ChecklistLineStyle.Amber),
          }}
          style={{
            display: this.props.data.map((d) => (d.style === ChecklistLineStyle.SeparationLine ? 'none' : 'flex')),
          }}
        >
          <div
            class={{
              EclLineCheckboxArea: true,
              AbnormalItem: this.props.data.map(
                (d) => d.abnormalProcedure === true && d.style === ChecklistLineStyle.ChecklistItem,
              ),
              Checked: this.props.data.map((d) => d.checked),
              HiddenElement: this.props.data.map((d) => d.style === ChecklistLineStyle.Headline),
              Invisible: this.props.data.map(
                (d) => d.sensed || (d.firstLine && d.lastLine) || d.specialLine === WdSpecialLine.Empty,
              ),
            }}
          >
            {this.props.data.map((d) => (d.checked ? '\u25A0' : '\u25A1'))}
          </div>
          <span
            class="EclLineText"
            style={{
              display: this.props.data.map((d) =>
                d.abnormalProcedure === true && d.style === ChecklistLineStyle.Headline ? 'none' : 'block',
              ),
            }}
          >
            {this.props.data.map((d) => d.text)}
          </span>
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            width="600"
            height="33"
            style={{
              display: this.props.data.map((d) =>
                d.abnormalProcedure === true && d.style === ChecklistLineStyle.Headline ? 'block' : 'none',
              ),
            }}
          >
            <FormattedFwcText x={10} y={24} message={this.props.data.map((d) => d.text)} />
          </svg>
        </div>
        <div
          class={{
            EclSeparationLine: true,
            HiddenElement: this.props.data.map((d) => d.style !== ChecklistLineStyle.SeparationLine),
          }}
          style={{
            display: this.props.data.map((d) => (d.style === ChecklistLineStyle.SeparationLine ? 'block' : 'none')),
          }}
        />
        <div
          class={{
            EclLineEndMarker: true,
            Selected: this.props.selected,
            First: this.props.data.map((d) => d.firstLine),
            Last: this.props.data.map((d) => d.lastLine),
            HiddenElement: this.props.data.map(
              (d) => (d.firstLine && d.lastLine) || d.specialLine === WdSpecialLine.Empty,
            ),
          }}
        />
      </div>
    );
  }
}

class OverflowArrowSymbol extends DisplayComponent<{ facingUp: boolean }> {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="30" viewBox="0 0 36 40" preserveAspectRatio="meet">
        <g transform={this.props.facingUp ? 'rotate (180, 18, 20)' : ''}>
          <rect
            stroke="#000"
            stroke-width="0"
            height="17.42185"
            width="9.53173"
            y="1.62429"
            x="13.25006"
            fill="#00ff00"
          />
          <path
            stroke="#000"
            d="m0.13726,14.20717l17.68697,24.02628c6.01023,-8.01338 12.02045,-16.02675 18.03068,-24.04013"
            stroke-width="0"
            fill="#00ff00"
          />
        </g>
      </svg>
    );
  }
}
