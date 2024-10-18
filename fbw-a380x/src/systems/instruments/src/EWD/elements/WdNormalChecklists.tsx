import { ConsumerSubject, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { EcamNormalProcedures } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/NormalProcedures';
import { ChecklistLineStyle } from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
import { WdAbstractChecklistComponent } from 'instruments/src/EWD/elements/WdAbstractChecklistComponent';

export class WdNormalChecklists extends WdAbstractChecklistComponent {
  private readonly checklists = ConsumerSubject.create(this.sub.on('fws_normal_checklists'), []);

  private readonly checklistId = ConsumerSubject.create(this.sub.on('fws_normal_checklists_id'), 0);

  public updateChecklists() {
    this.lineData.length = 0;

    const sorted = this.checklists
      .get()
      .filter((v) => v.id !== 0)
      .sort((a, b) => a.id - b.id);
    const clState = sorted.find((v) => v.id === this.checklistId.get());

    if (this.checklistId.get() === 0) {
      // Render overview page
      this.lineData.push({
        activeProcedure: true,
        sensed: true,
        checked: false,
        text: 'CHECKLISTS',
        style: ChecklistLineStyle.Headline,
        firstLine: true,
        lastLine: false,
      });

      sorted.forEach((state, index) => {
        if (EcamNormalProcedures[state.id]) {
          this.lineData.push({
            activeProcedure: true,
            sensed: true,
            checked: state.checklistCompleted,
            text: EcamNormalProcedures[state.id].title,
            style: state.checklistCompleted ? ChecklistLineStyle.CompletedChecklist : ChecklistLineStyle.ChecklistItem,
            firstLine: false,
            lastLine: index === sorted.length - 1,
          });
        }
      });
      this.totalLines.set(sorted.length + 1);
    } else if (clState && EcamNormalProcedures[clState.id]) {
      const cl = EcamNormalProcedures[clState.id];

      this.lineData.push({
        activeProcedure: true,
        sensed: true,
        checked: false,
        text: cl.title,
        style: ChecklistLineStyle.Headline,
        firstLine: true,
        lastLine: false,
      });

      cl.items.forEach((item, index) => {
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

        this.lineData.push({
          activeProcedure: true,
          sensed: item.sensed,
          checked: clState.itemsCompleted[index],
          text: text.substring(0, 39),
          style: item.style ? item.style : ChecklistLineStyle.ChecklistItem,
          firstLine: false,
          lastLine: false,
        });
      });

      this.lineData.push({
        activeProcedure: true,
        sensed: false,
        checked: clState.checklistCompleted,
        text: `${'\xa0'.repeat(27)}C/L COMPLETE`,
        style: ChecklistLineStyle.ChecklistItem,
        firstLine: false,
        lastLine: false,
      });

      this.lineData.push({
        activeProcedure: true,
        sensed: false,
        checked: false,
        text: `${'\xa0'.repeat(34)}RESET`,
        style: ChecklistLineStyle.ChecklistItem,
        firstLine: false,
        lastLine: true,
      });
    }
    super.updateChecklists();
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.checklists.sub(() => this.updateChecklists(), true);
    this.checklistId.sub(() => this.updateChecklists());
  }

  // 17 lines
  render() {
    return super.render();
  }
}
