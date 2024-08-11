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
  private readonly showFromLine = Subject.create(0);

  // Subjects for rendering the WD lines
  private readonly lineSensed = Array.from(Array(WD_NUM_LINES), () => Subject.create(false));
  private readonly lineChecked = Array.from(Array(WD_NUM_LINES), () => Subject.create(false));
  private readonly lineSelected = Array.from(Array(WD_NUM_LINES), () => Subject.create(false));
  private readonly lineChecklistCompleted = Array.from(Array(WD_NUM_LINES), () => Subject.create(false));
  private readonly lineText = Array.from(Array(WD_NUM_LINES), () => Subject.create(''));
  private readonly lineStyle = Array.from(Array(WD_NUM_LINES), () => Subject.create(ChecklistLineStyle.Standard));

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
      lineIdx++;
      sorted.forEach((state, index) => {
        if (
          index >= this.showFromLine.get() &&
          index < WD_NUM_LINES - this.showFromLine.get() &&
          EcamNormalProcedures[state.id]
        ) {
          this.lineSensed[lineIdx].set(true);
          this.lineChecked[lineIdx].set(state.checklistCompleted);
          this.lineSelected[lineIdx].set(this.activeCheckListItem.get() === index);
          this.lineChecklistCompleted[lineIdx].set(state.checklistCompleted);
          this.lineText[lineIdx].set(EcamNormalProcedures[state.id].title);
          this.lineStyle[lineIdx].set(ChecklistLineStyle.ChecklistMenuItem);
          lineIdx++;
        }
      });
    } else if (clState && EcamNormalProcedures[clState.id]) {
      const cl = EcamNormalProcedures[clState.id];

      this.lineSensed[lineIdx].set(true);
      this.lineChecked[lineIdx].set(false);
      this.lineSelected[lineIdx].set(false);
      this.lineChecklistCompleted[lineIdx].set(false);
      this.lineText[lineIdx].set(cl.title);
      this.lineStyle[lineIdx].set(ChecklistLineStyle.Headline);
      lineIdx++;

      cl.items.forEach((item, index) => {
        if (index >= this.showFromLine.get() && index < WD_NUM_LINES - this.showFromLine.get()) {
          this.lineSensed[lineIdx].set(item.sensed);
          this.lineChecked[lineIdx].set(clState.itemsCompleted[index]);
          this.lineSelected[lineIdx].set(this.activeCheckListItem.get() === index);
          this.lineChecklistCompleted[lineIdx].set(clState.checklistCompleted);
          this.lineStyle[lineIdx].set(item.style ? item.style : ChecklistLineStyle.ChecklistMenuItem);

          let text = item.level ? '\xa0'.repeat(item.level * 2) : '';
          text += item.style !== ChecklistLineStyle.SubHeadline ? '-' : '';
          text += item.name;
          if (clState.itemsCompleted[index] && item.labelCompleted) {
            text += ` : ${item.labelCompleted}`;
          } else if (clState.itemsCompleted[index] && item.labelNotCompleted) {
            text += ` : ${item.labelNotCompleted}`;
          } else if (!clState.itemsCompleted[index] && item.labelNotCompleted) {
            // Pad to 40 characters max
            const paddingNeeded = 40 - (item.labelNotCompleted.length + item.name.length + (item.level ?? 0) * 2 + 2);
            text += ` ${'.'.repeat(paddingNeeded)}${item.labelNotCompleted}`;
          }
          this.lineText[lineIdx].set(text.substring(0, 40));

          lineIdx++;
        }
      });

      if (lineIdx < WD_NUM_LINES) {
        this.lineSensed[lineIdx].set(false);
        this.lineChecked[lineIdx].set(false);
        this.lineSelected[lineIdx].set(this.activeCheckListItem.get() === cl.items.length);
        this.lineText[lineIdx].set(`${'\xa0'.repeat(28)}C/L COMPLETE`);
        this.lineStyle[lineIdx].set(ChecklistLineStyle.ChecklistMenuItem);
        lineIdx++;
      }

      if (lineIdx < WD_NUM_LINES) {
        this.lineSensed[lineIdx].set(false);
        this.lineChecked[lineIdx].set(false);
        this.lineSelected[lineIdx].set(this.activeCheckListItem.get() === cl.items.length + 1);
        this.lineText[lineIdx].set(`${'\xa0'.repeat(35)}RESET`);
        this.lineStyle[lineIdx].set(ChecklistLineStyle.ChecklistMenuItem);
        lineIdx++;
      }
    }

    // Fill remaining lines blank
    while (lineIdx < WD_NUM_LINES) {
      this.lineSensed[lineIdx].set(true);
      this.lineChecked[lineIdx].set(false);
      this.lineSelected[lineIdx].set(false);
      this.lineText[lineIdx].set('');
      this.lineStyle[lineIdx].set(ChecklistLineStyle.ChecklistMenuItem);
      lineIdx++;
    }
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.checklists.sub(() => this.updateChecklists(), true);
    this.checklistId.sub(() => this.updateChecklists());
    this.activeCheckListItem.sub(() => this.updateChecklists());
  }

  // 17 lines
  render() {
    return (
      <div class="ProceduresContainer" style={{ display: this.props.visible.map((it) => (it ? 'block' : 'none')) }}>
        {Array.from(Array(WD_NUM_LINES), () => '').map((_, index) => (
          <EclLine
            sensed={this.lineSensed[index]}
            checked={this.lineChecked[index]}
            selected={this.lineSelected[index]}
            checklistCompleted={this.lineChecklistCompleted[index]}
            text={this.lineText[index]}
            style={this.lineStyle[index]}
          />
        ))}
      </div>
    );
  }
}

interface EclLineProps {
  sensed: Subscribable<boolean>;
  checked: Subscribable<boolean>;
  selected: Subscribable<boolean>;
  checklistCompleted: Subscribable<boolean>;
  text: Subscribable<string>;
  style: Subscribable<ChecklistLineStyle>;
}

export class EclLine extends DisplayComponent<EclLineProps> {
  private readonly checkedSymbol = MappedSubject.create(
    ([checked, sensed]) => (sensed ? '' : checked ? 'X' : 'O'),
    this.props.checked,
    this.props.sensed,
  );
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
            ChecklistCompleted: this.props.checklistCompleted,
          }}
          style={{
            display: this.props.style.map((s) => (s === ChecklistLineStyle.SeparationLine ? 'none' : 'flex')),
          }}
        >
          <div
            class={{
              EclLineCheckboxArea: true,
              HiddenElement: this.props.style.map((s) => s === ChecklistLineStyle.Headline),
            }}
          >
            {this.checkedSymbol}
          </div>
          <span class="EclLineText">{this.props.text}</span>
        </div>
        <div
          class={{
            EclSeparationLine: true,
            HiddenElement: this.props.style.map((s) => s !== ChecklistLineStyle.SeparationLine),
          }}
          style={{
            visibility: this.props.style.map((s) => (s === ChecklistLineStyle.SeparationLine ? 'block' : 'none')),
          }}
        />
      </div>
    );
  }
}
