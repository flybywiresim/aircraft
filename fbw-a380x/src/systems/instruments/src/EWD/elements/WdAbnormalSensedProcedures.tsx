import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';
import { EwdSimvars } from 'instruments/src/EWD/shared/EwdSimvarPublisher';
import { FwsEwdEvents } from '../../MsfsAvionicsCommon/providers/FwsEwdPublisher';
import {
  ChecklistLineStyle,
  EcamAbnormalSensedProcedures,
  isChecklistAction,
  WD_NUM_LINES,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
import { FormattedFwcText } from 'instruments/src/EWD/elements/FormattedFwcText';

interface WdAbnormalSensedProceduresProps {
  bus: EventBus;
  visible: Subscribable<boolean>;
}

interface LineData {
  activeProcedure: boolean;
  sensed: boolean;
  checked: boolean;
  text: string;
  style: ChecklistLineStyle;
  firstLine: boolean;
  lastLine: boolean;
}

export class WdAbnormalSensedProcedures extends DisplayComponent<WdAbnormalSensedProceduresProps> {
  private readonly sub = this.props.bus.getSubscriber<ClockEvents & EwdSimvars & FwsEwdEvents>();

  private readonly procedures = ConsumerSubject.create(this.sub.on('fws_abn_sensed_procedures'), []);

  private readonly activeLine = ConsumerSubject.create(this.sub.on('fws_abn_sensed_active_line'), 1);

  // Not scrollable for now
  private readonly showFromLine = ConsumerSubject.create(this.sub.on('fws_abn_sensed_show_from_line'), 0);
  private readonly totalLines = Subject.create(0);

  // Overflow indicators
  private readonly overflowTopVisibility = this.showFromLine.map((l) => (l > 0 ? 'visible' : 'hidden'));
  private readonly overflowBottomVisibility = MappedSubject.create(
    ([sf, tl]) => (tl > WD_NUM_LINES && tl - WD_NUM_LINES > sf ? 'visible' : 'hidden'),
    this.showFromLine,
    this.totalLines,
  );

  // Subjects for rendering the WD lines
  private readonly lineSensed = Array.from(Array(WD_NUM_LINES), () => Subject.create(false));
  private readonly lineChecked = Array.from(Array(WD_NUM_LINES), () => Subject.create(false));
  private readonly lineSelected = Array.from(Array(WD_NUM_LINES), () => Subject.create(false));
  private readonly lineText = Array.from(Array(WD_NUM_LINES), () => Subject.create(''));
  private readonly lineStyle = Array.from(Array(WD_NUM_LINES), () => Subject.create(ChecklistLineStyle.Standard));
  private readonly lineFirstLine = Array.from(Array(WD_NUM_LINES), () => Subject.create(false));
  private readonly lineLastLine = Array.from(Array(WD_NUM_LINES), () => Subject.create(false));

  private updateChecklists() {
    let lineIdx = 0;

    const lines: LineData[] = [];

    this.procedures.get().forEach((procState, procIndex, array) => {
      if (procState && EcamAbnormalSensedProcedures[procState.id]) {
        const cl = EcamAbnormalSensedProcedures[procState.id];

        lines.push({
          activeProcedure: procIndex === 0,
          sensed: true,
          checked: false,
          text: cl.title,
          style: ChecklistLineStyle.Headline,
          firstLine: true,
          lastLine: false,
        });

        cl.items.forEach((item, itemIndex) => {
          let text = item.level ? '\xa0'.repeat(item.level * 2) : '';
          if (isChecklistAction(item)) {
            text += item.style !== ChecklistLineStyle.SubHeadline ? '-' : '';
            text += item.name;
            if (procState.itemsCompleted[itemIndex] && item.labelCompleted) {
              text += `${item.colonIfCompleted === false ? ' ' : ' : '}${item.labelCompleted}`;
            } else if (procState.itemsCompleted[itemIndex] && item.labelNotCompleted) {
              text += `${item.colonIfCompleted === false ? ' ' : ' : '}${item.labelNotCompleted}`;
            } else if (!procState.itemsCompleted[itemIndex] && item.labelNotCompleted) {
              // Pad to 39 characters max
              const paddingNeeded = 39 - (item.labelNotCompleted.length + item.name.length + (item.level ?? 0) * 2 + 2);
              text += ` ${'.'.repeat(paddingNeeded)}${item.labelNotCompleted}`;
            }
          } else {
            text += `${item.name.substring(0, 3) === 'IF' ? '.' : ''}${item.name}`;
          }

          lines.push({
            activeProcedure: procIndex === 0,
            sensed: item.sensed,
            checked: procState.itemsCompleted[itemIndex],
            text: text,
            style: item.style ? item.style : ChecklistLineStyle.ChecklistMenuItem,
            firstLine: false,
            lastLine: false,
          });
        });

        if (procIndex === 0) {
          lines.push({
            activeProcedure: true,
            sensed: false,
            checked: false,
            text: `${'\xa0'.repeat(34)}CLEAR`,
            style: ChecklistLineStyle.ChecklistMenuItem,
            firstLine: false,
            lastLine: true,
          });
        }

        // Empty line after procedure
        if (procIndex < array.length - 1) {
          lines.push({
            activeProcedure: procIndex === 0,
            sensed: true,
            checked: false,
            text: '',
            style: ChecklistLineStyle.ChecklistMenuItem,
            firstLine: true,
            lastLine: true,
          });
        }
      }
    });

    lines.slice(0, 17).forEach((line, index) => {
      this.lineSensed[index].set(line.sensed);
      this.lineChecked[index].set(line.checked);
      this.lineSelected[index].set(false);
      this.lineText[index].set(line.text);
      this.lineStyle[index].set(line.style);
      this.lineFirstLine[index].set(line.activeProcedure ? line.firstLine : true);
      this.lineLastLine[index].set(line.activeProcedure ? line.lastLine : true);
    });

    this.totalLines.set(lines.length);

    // Fill remaining lines blank
    lineIdx = lines.length;
    while (lineIdx < WD_NUM_LINES) {
      this.lineSensed[lineIdx].set(true);
      this.lineChecked[lineIdx].set(false);
      this.lineSelected[lineIdx].set(false);
      this.lineText[lineIdx].set('');
      this.lineStyle[lineIdx].set(ChecklistLineStyle.ChecklistMenuItem);
      this.lineFirstLine[lineIdx].set(true);
      this.lineLastLine[lineIdx].set(true);
      lineIdx++;
    }
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.procedures.sub(() => this.updateChecklists(), true);
    this.activeLine.sub(() => this.updateChecklists());
    this.showFromLine.sub(() => this.updateChecklists());
  }

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
              sensed={this.lineSensed[index]}
              checked={this.lineChecked[index]}
              selected={this.lineSelected[index]}
              text={this.lineText[index]}
              style={this.lineStyle[index]}
              firstLine={this.lineFirstLine[index]}
              lastLine={this.lineLastLine[index]}
            />
          ))}
        </div>
      </div>
    );
  }
}

interface EclLineProps {
  sensed: Subscribable<boolean>;
  checked: Subscribable<boolean>;
  selected: Subscribable<boolean>;
  text: Subscribable<string>;
  style: Subscribable<ChecklistLineStyle>;
  firstLine: Subscribable<boolean>;
  lastLine: Subscribable<boolean>;
}

export class EclLine extends DisplayComponent<EclLineProps> {
  render() {
    return (
      <div class="EclLineContainer">
        <div
          class={{
            EclLine: true,
            Selected: this.props.selected,
            AbnormalItem: this.props.style.map((s) => s === ChecklistLineStyle.ChecklistMenuItem),
            Headline: this.props.style.map((s) =>
              [ChecklistLineStyle.Headline, ChecklistLineStyle.SubHeadline].includes(s),
            ),
            Checked: this.props.checked,
            Green: this.props.style.map((s) => s === ChecklistLineStyle.Green),
            Cyan: this.props.style.map((s) => s === ChecklistLineStyle.Cyan),
            Amber: this.props.style.map((s) => s === ChecklistLineStyle.Amber),
          }}
          style={{
            display: this.props.style.map((s) => (s === ChecklistLineStyle.SeparationLine ? 'none' : 'flex')),
          }}
        >
          <div
            class={{
              EclLineCheckboxArea: true,
              HiddenElement: this.props.style.map((s) => s === ChecklistLineStyle.Headline),
              Invisible: MappedSubject.create(
                ([sensed, first, last]) => sensed || (first && last),
                this.props.sensed,
                this.props.firstLine,
                this.props.lastLine,
              ),
            }}
          >
            <CheckSymbol checked={this.props.checked} />
          </div>
          <span
            class="EclLineText"
            style={{
              display: this.props.style.map((s) => (s === ChecklistLineStyle.Headline ? 'none' : 'block')),
            }}
          >
            {this.props.text}
          </span>
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            width="600"
            height="33"
            style={{
              display: this.props.style.map((s) => (s === ChecklistLineStyle.Headline ? 'block' : 'none')),
            }}
          >
            <FormattedFwcText x={10} y={24} message={this.props.text} />
          </svg>
        </div>
        <div
          class={{
            EclSeparationLine: true,
            HiddenElement: this.props.style.map((s) => s !== ChecklistLineStyle.SeparationLine),
          }}
          style={{
            display: this.props.style.map((s) => (s === ChecklistLineStyle.SeparationLine ? 'block' : 'none')),
          }}
        />
        <div
          class={{
            EclLineEndMarker: true,
            Selected: this.props.selected,
            First: this.props.firstLine,
            Last: this.props.lastLine,
            HiddenElement: MappedSubject.create(
              SubscribableMapFunctions.and(),
              this.props.firstLine,
              this.props.lastLine,
            ),
          }}
        />
      </div>
    );
  }
}

class CheckSymbol extends DisplayComponent<{ checked: Subscribable<boolean> }> {
  render(): VNode | null {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="25" viewBox="0 0 28 34">
        <g>
          <rect
            height="24"
            width="14"
            y="5"
            x="7"
            stroke-width="3"
            stroke={this.props.checked.map((c) => (c ? '#00ff00' : '#00ffff'))}
            fill="none"
          />
        </g>
        <g visibility={this.props.checked.map((c) => (c ? 'visible' : 'hidden'))}>
          <line
            stroke-width="2"
            stroke={this.props.checked.map((c) => (c ? '#00ff00' : '#00ffff'))}
            stroke-linecap="rounded"
            y2="27.74468"
            x2="12.40425"
            y1="17.6383"
            x1="8.78723"
            fill="none"
          />
          <line
            stroke-width="2"
            stroke={this.props.checked.map((c) => (c ? '#00ff00' : '#00ffff'))}
            stroke-linecap="rounded"
            y2="27.6383"
            x2="12.51064"
            y1="6.68085"
            x1="18.89361"
            fill="none"
          />
        </g>
      </svg>
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
