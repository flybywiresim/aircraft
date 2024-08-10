import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { EwdSimvars } from 'instruments/src/EWD/shared/EwdSimvarPublisher';
import { FwsEwdEvents } from '../../MsfsAvionicsCommon/providers/FwsEwdPublisher';
import { EcamNormalProcedures } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/NormalProcedures';
import { ChecklistLineStyle } from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
// import { ChecklistAction } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/index';

interface WdNormalChecklistsProps {
  bus: EventBus;
  visible: Subscribable<boolean>;
}

const WD_NUM_LINES = 17;

export class WdNormalChecklists extends DisplayComponent<WdNormalChecklistsProps> {
  private readonly sub = this.props.bus.getSubscriber<ClockEvents & EwdSimvars & FwsEwdEvents>();

  private readonly checklists = ConsumerSubject.create(this.sub.on('fws_normal_checklists'), []);

  private readonly checklistId = ConsumerSubject.create(this.sub.on('fws_normal_checklists_id'), 0);

  private readonly activeCheckListItem = ConsumerSubject.create(this.sub.on('fws_normal_checklists_active_line'), 1);

  // Not scrollable for now
  private readonly showFromLine = Subject.create(0);

  // Subjects for rendering the WD lines
  private readonly lineSensed = Array.from(Array(WD_NUM_LINES), () => Subject.create(false));
  private readonly lineChecked = Array.from(Array(WD_NUM_LINES), () => Subject.create(false));
  private readonly lineActive = Array.from(Array(WD_NUM_LINES), () => Subject.create(false));
  private readonly lineText = Array.from(Array(WD_NUM_LINES), () => Subject.create(''));
  private readonly lineStyle = Array.from(Array(WD_NUM_LINES), () => Subject.create(ChecklistLineStyle.Standard));

  private updateChecklists() {
    let lineIdx = 0;
    const sorted = this.checklists
      .get()
      .filter((v) => v.id !== 0)
      .sort((a, b) => a.id - b.id);

    if (this.checklistId.get() === 0) {
      // Render overview page
      this.lineSensed[lineIdx].set(true);
      this.lineChecked[lineIdx].set(false);
      this.lineActive[lineIdx].set(false);
      this.lineText[lineIdx].set('CHECKLISTS');
      this.lineStyle[lineIdx].set(ChecklistLineStyle.Headline);
      lineIdx++;
      sorted.forEach((val, index) => {
        if (
          index >= this.showFromLine.get() &&
          index < WD_NUM_LINES - this.showFromLine.get() &&
          EcamNormalProcedures[val.id]
        ) {
          this.lineSensed[lineIdx].set(true);
          this.lineChecked[lineIdx].set(val.checklistCompleted);
          this.lineActive[lineIdx].set(this.activeCheckListItem.get() === index);
          this.lineText[lineIdx].set(EcamNormalProcedures[val.id].title);
          this.lineStyle[lineIdx].set(ChecklistLineStyle.ChecklistMenuItem);
          lineIdx++;
        }
      });
    }
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.checklists.sub(() => this.updateChecklists(), true);
  }

  // 17 lines
  render() {
    return (
      <div class="ProceduresContainer" style={{ display: this.props.visible.map((it) => (it ? 'block' : 'none')) }}>
        {Array.from(Array(WD_NUM_LINES), () => '').map((_, index) => (
          <EclLine
            sensed={this.lineSensed[index]}
            checked={this.lineChecked[index]}
            active={this.lineActive[index]}
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
  active: Subscribable<boolean>;
  text: Subscribable<string>;
  style: Subscribable<ChecklistLineStyle>;
}

export class EclLine extends DisplayComponent<EclLineProps> {
  render() {
    return (
      <div
        class={{
          EclLine: true,
          Active: this.props.active,
          ChecklistMenuItem: this.props.style.map((s) => s === ChecklistLineStyle.ChecklistMenuItem),
          Headline: this.props.style.map((s) =>
            [ChecklistLineStyle.Headline, ChecklistLineStyle.SubHeadline].includes(s),
          ),
          Completed: this.props.checked,
          '123': true,
        }}
      >
        <div
          class={{
            EclLineCheckboxArea: true,
            HiddenElement: this.props.style.map((s) => s === ChecklistLineStyle.Headline),
          }}
        ></div>
        <span class="EclLineText">{this.props.text}</span>
      </div>
    );
  }
}
