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
import { EcamNormalProcedures } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/NormalProcedures';
import { ChecklistLineStyle, WD_NUM_LINES } from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
// import { ChecklistAction } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/index';

interface WdNormalChecklistsProps {
  bus: EventBus;
  visible: Subscribable<boolean>;
}

export class WdNormalChecklists extends DisplayComponent<WdNormalChecklistsProps> {
  private readonly sub = this.props.bus.getSubscriber<ClockEvents & EwdSimvars & FwsEwdEvents>();

  private readonly checklists = ConsumerSubject.create(this.sub.on('fws_normal_checklists'), []);

  private readonly checklistId = ConsumerSubject.create(this.sub.on('fws_normal_checklists_id'), 0);

  private readonly activeCheckListItem = ConsumerSubject.create(this.sub.on('fws_normal_checklists_active_line'), 0);

  // Not scrollable for now
  private readonly showFromLine = ConsumerSubject.create(this.sub.on('fws_normal_checklists_show_from_line'), 0);
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
  // private readonly lineChecklistCompleted = Array.from(Array(WD_NUM_LINES), () => Subject.create(false));
  private readonly lineText = Array.from(Array(WD_NUM_LINES), () => Subject.create(''));
  private readonly lineStyle = Array.from(Array(WD_NUM_LINES), () => Subject.create(ChecklistLineStyle.Standard));
  private readonly lineFirstLine = Array.from(Array(WD_NUM_LINES), () => Subject.create(false));
  private readonly lineLastLine = Array.from(Array(WD_NUM_LINES), () => Subject.create(false));

  private updateChecklists() {
    let lineIdx = 0;
    const sorted = this.checklists
      .get()
      .filter((v) => v.id !== 0)
      .sort((a, b) => a.id - b.id);
    const clState = sorted.find((v) => v.id === this.checklistId.get());

    if (this.checklistId.get() === 0) {
      // Render overview page
      this.lineSensed[lineIdx].set(true);
      this.lineChecked[lineIdx].set(false);
      this.lineSelected[lineIdx].set(false);
      this.lineText[lineIdx].set('CHECKLISTS');
      this.lineStyle[lineIdx].set(ChecklistLineStyle.Headline);
      this.lineFirstLine[lineIdx].set(true);
      this.lineLastLine[lineIdx].set(false);
      lineIdx++;
      sorted.forEach((state, index) => {
        if (index >= this.showFromLine.get() && lineIdx < WD_NUM_LINES && EcamNormalProcedures[state.id]) {
          this.lineSensed[lineIdx].set(true);
          this.lineChecked[lineIdx].set(state.checklistCompleted);
          this.lineSelected[lineIdx].set(this.activeCheckListItem.get() === index);
          // this.lineChecklistCompleted[lineIdx].set(state.checklistCompleted);
          this.lineText[lineIdx].set(EcamNormalProcedures[state.id].title);
          this.lineStyle[lineIdx].set(
            state.checklistCompleted ? ChecklistLineStyle.CompletedChecklist : ChecklistLineStyle.ChecklistMenuItem,
          );
          this.lineFirstLine[lineIdx].set(false);
          this.lineLastLine[lineIdx].set(index === sorted.length - 1);
          lineIdx++;
        }
      });
      this.totalLines.set(sorted.length + 1);
    } else if (clState && EcamNormalProcedures[clState.id]) {
      const cl = EcamNormalProcedures[clState.id];

      this.lineSensed[lineIdx].set(true);
      this.lineChecked[lineIdx].set(false);
      this.lineSelected[lineIdx].set(false);
      // this.lineChecklistCompleted[lineIdx].set(false);
      this.lineText[lineIdx].set(cl.title);
      this.lineStyle[lineIdx].set(ChecklistLineStyle.Headline);
      this.lineFirstLine[lineIdx].set(true);
      this.lineLastLine[lineIdx].set(false);
      lineIdx++;

      cl.items.forEach((item, index) => {
        if (index >= this.showFromLine.get() && lineIdx < WD_NUM_LINES) {
          this.lineSensed[lineIdx].set(item.sensed);
          this.lineChecked[lineIdx].set(clState.itemsCompleted[index]);
          this.lineSelected[lineIdx].set(this.activeCheckListItem.get() === index);
          // this.lineChecklistCompleted[lineIdx].set(clState.checklistCompleted);
          this.lineStyle[lineIdx].set(item.style ? item.style : ChecklistLineStyle.ChecklistMenuItem);
          this.lineFirstLine[lineIdx].set(false);
          this.lineLastLine[lineIdx].set(false);

          let text = item.level ? '\xa0'.repeat(item.level * 2) : '';
          text += item.style !== ChecklistLineStyle.SubHeadline ? '-' : '';
          text += item.name;
          if (clState.itemsCompleted[index] && item.labelCompleted) {
            text += `${item.colonIfCompleted === false ? ' ' : ' : '}${item.labelCompleted}`;
          } else if (clState.itemsCompleted[index] && item.labelNotCompleted) {
            text += `${item.colonIfCompleted === false ? ' ' : ' : '}${item.labelNotCompleted}`;
          } else if (!clState.itemsCompleted[index] && item.labelNotCompleted) {
            // Pad to 39 characters max
            const paddingNeeded = 39 - (item.labelNotCompleted.length + item.name.length + (item.level ?? 0) * 2 + 2);
            text += ` ${'.'.repeat(paddingNeeded)}${item.labelNotCompleted}`;
          }
          this.lineText[lineIdx].set(text.substring(0, 39));

          lineIdx++;
        }
      });

      if (lineIdx < WD_NUM_LINES) {
        this.lineSensed[lineIdx].set(false);
        this.lineChecked[lineIdx].set(clState.checklistCompleted);
        this.lineSelected[lineIdx].set(this.activeCheckListItem.get() === cl.items.length);
        this.lineText[lineIdx].set(`${'\xa0'.repeat(27)}C/L COMPLETE`);
        this.lineStyle[lineIdx].set(ChecklistLineStyle.ChecklistMenuItem);
        this.lineFirstLine[lineIdx].set(false);
        this.lineLastLine[lineIdx].set(false);
        lineIdx++;
      }

      if (lineIdx < WD_NUM_LINES) {
        this.lineSensed[lineIdx].set(false);
        this.lineChecked[lineIdx].set(false);
        this.lineSelected[lineIdx].set(this.activeCheckListItem.get() === cl.items.length + 1);
        this.lineText[lineIdx].set(`${'\xa0'.repeat(34)}RESET`);
        this.lineStyle[lineIdx].set(ChecklistLineStyle.ChecklistMenuItem);
        this.lineFirstLine[lineIdx].set(false);
        this.lineLastLine[lineIdx].set(true);
        lineIdx++;
      }

      this.totalLines.set(cl.items.length + 3);
    }

    // Fill remaining lines blank
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

    this.checklists.sub(() => this.updateChecklists(), true);
    this.checklistId.sub(() => this.updateChecklists());
    this.activeCheckListItem.sub(() => this.updateChecklists());
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
              sensed={this.lineSensed[index]}
              checked={this.lineChecked[index]}
              selected={this.lineSelected[index]}
              // checklistCompleted={this.lineChecklistCompleted[index]}
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
            ChecklistMenuItem: this.props.style.map((s) => s === ChecklistLineStyle.ChecklistMenuItem),
            Headline: this.props.style.map((s) =>
              [ChecklistLineStyle.Headline, ChecklistLineStyle.SubHeadline].includes(s),
            ),
            Checked: this.props.checked,
            ChecklistCompleted: this.props.style.map((s) => s === ChecklistLineStyle.CompletedChecklist),
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
          <span class="EclLineText">{this.props.text}</span>
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
