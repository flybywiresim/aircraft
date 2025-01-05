import { ConsumerSubject, FSComponent, VNode } from '@microsoft/msfs-sdk';
import {
  ChecklistLineStyle,
  EcamAbnormalSensedProcedures,
  isChecklistAction,
  WdSpecialLine,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
import { WdAbstractChecklistComponent } from 'instruments/src/EWD/elements/WdAbstractChecklistComponent';

export class WdAbnormalSensedProcedures extends WdAbstractChecklistComponent {
  private readonly procedures = ConsumerSubject.create(this.sub.on('fws_abn_sensed_procedures'), []);

  public updateChecklists() {
    this.lineData.length = 0;

    this.procedures.get().forEach((procState, procIndex, array) => {
      if (procState && EcamAbnormalSensedProcedures[procState.id]) {
        const cl = EcamAbnormalSensedProcedures[procState.id];

        this.lineData.push({
          abnormalProcedure: true,
          activeProcedure: procIndex === 0,
          sensed: true,
          checked: false,
          text: cl.title,
          style: ChecklistLineStyle.Headline,
          firstLine: true,
          lastLine: procIndex !== 0 ? true : false,
        });

        cl.items.forEach((item, itemIndex) => {
          if (procState.itemsToShow[itemIndex] === false) {
            return;
          }

          let text = item.level ? '\xa0'.repeat(item.level * 2) : '';
          if (isChecklistAction(item)) {
            text += item.style !== ChecklistLineStyle.SubHeadline ? '-' : '';
            text += item.name;
            if (procState.itemsChecked[itemIndex] && item.labelCompleted) {
              text += `${item.colonIfCompleted === false ? ' ' : ' : '}${item.labelCompleted}`;
            } else if (procState.itemsChecked[itemIndex] && item.labelNotCompleted) {
              text += `${item.colonIfCompleted === false ? ' ' : ' : '}${item.labelNotCompleted}`;
            } else if (!procState.itemsChecked[itemIndex] && item.labelNotCompleted) {
              // Pad to 39 characters max
              const paddingNeeded = 39 - (item.labelNotCompleted.length + item.name.length + (item.level ?? 0) * 2 + 2);
              text += ` ${'.'.repeat(paddingNeeded)}${item.labelNotCompleted}`;
            }
          } else {
            text += `${item.name.substring(0, 3) === 'IF' ? '.' : ''}${item.name}`;
          }

          this.lineData.push({
            abnormalProcedure: true,
            activeProcedure: procIndex === 0,
            sensed: item.sensed,
            checked: procState.itemsChecked[itemIndex],
            text: text,
            style: item.style ? item.style : ChecklistLineStyle.ChecklistItem,
            firstLine: procIndex !== 0 ? true : false,
            lastLine: procIndex !== 0 ? true : false,
          });
        });

        if (procIndex === 0) {
          this.lineData.push({
            abnormalProcedure: true,
            activeProcedure: true,
            sensed: false,
            checked: false,
            text: `${'\xa0'.repeat(34)}CLEAR`,
            style: ChecklistLineStyle.ChecklistItem,
            firstLine: false,
            lastLine: true,
          });
        }

        // Empty line after procedure
        if (procIndex < array.length - 1) {
          this.lineData.push({
            abnormalProcedure: true,
            activeProcedure: procIndex === 0,
            sensed: true,
            checked: false,
            text: '',
            style: ChecklistLineStyle.ChecklistItem,
            firstLine: true,
            lastLine: true,
            specialLine: WdSpecialLine.Empty,
          });
        }
      }
    });
    super.updateChecklists();
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.procedures.sub(() => this.updateChecklists(), true);
  }

  render() {
    return super.render();
  }
}
