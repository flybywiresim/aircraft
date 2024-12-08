import { ConsumerSubject, FSComponent, VNode } from '@microsoft/msfs-sdk';
import {
  ChecklistLineStyle,
  EcamAbnormalSensedProcedures,
  isChecklistAction,
  isChecklistCondition,
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

        if (procIndex === 0) {
          if (cl.recommendation) {
            this.lineData.push({
              abnormalProcedure: true,
              activeProcedure: procIndex === 0,
              sensed: true,
              checked: false,
              text: cl.recommendation,
              style: cl.recommendation === 'LAND ASAP' ? ChecklistLineStyle.LandAsap : ChecklistLineStyle.LandAnsa,
              firstLine: false,
              lastLine: false,
            });
          }
          // If first and most important procedure: Display in full
          cl.items.forEach((item, itemIndex) => {
            if (!procState.itemsToShow[itemIndex]) {
              return;
            }

            let clStyle: ChecklistLineStyle = item.style ? item.style : ChecklistLineStyle.ChecklistItem;
            let text = item.level ? '\xa0'.repeat(item.level) : '';
            if (isChecklistAction(item)) {
              text += clStyle !== ChecklistLineStyle.SubHeadline ? '-' : '';
              text += item.name;
              if (!procState.itemsActive[itemIndex] && clStyle === ChecklistLineStyle.ChecklistItem) {
                clStyle = ChecklistLineStyle.ChecklistItemInactive;
              }
              if (procState.itemsChecked[itemIndex] && item.labelCompleted) {
                text += `${item.colonIfCompleted === false ? ' ' : ' : '}${item.labelCompleted}`;
              } else if (procState.itemsChecked[itemIndex] && item.labelNotCompleted) {
                text += `${item.colonIfCompleted === false ? ' ' : ' : '}${item.labelNotCompleted}`;
              } else if (!procState.itemsChecked[itemIndex] && item.labelNotCompleted) {
                // Pad to 39 characters max
                const paddingNeeded = Math.max(
                  0,
                  39 - (item.labelNotCompleted.length + item.name.length + (item.level ?? 0) * 1 + 2),
                );

                text += ` ${'.'.repeat(paddingNeeded)}${item.labelNotCompleted}`;
              }
            } else if (isChecklistCondition(item)) {
              clStyle = ChecklistLineStyle.ChecklistCondition;
              text += procState.itemsChecked[itemIndex]
                ? `.AS ${item.name.substring(0, 2) === 'IF' ? item.name.substring(2) : item.name}`
                : `.IF ${item.name.substring(0, 2) === 'IF' ? item.name.substring(2) : item.name}`;
            } else {
              text += item.name;
            }

            this.lineData.push({
              abnormalProcedure: true,
              activeProcedure: procIndex === 0,
              sensed: isChecklistCondition(item) ? true : item.sensed,
              checked: procState.itemsChecked[itemIndex],
              text: text,
              style: clStyle,
              firstLine: procIndex !== 0 ? true : false,
              lastLine: procIndex !== 0 ? true : false,
              originalItemIndex: isChecklistCondition(item) ? undefined : itemIndex,
            });

            if (isChecklistCondition(item) && !item.sensed) {
              // Insert CONFIRM <condition>
              const confirmText = `CONFIRM ${item.name}`;
              this.lineData.push({
                abnormalProcedure: true,
                activeProcedure: procIndex === 0,
                sensed: item.sensed,
                checked: procState.itemsChecked[itemIndex],
                text: confirmText,
                style: clStyle,
                firstLine: procIndex !== 0 ? true : false,
                lastLine: procIndex !== 0 ? true : false,
                originalItemIndex: itemIndex,
              });
            }
          });

          this.lineData.push({
            abnormalProcedure: true,
            activeProcedure: true,
            sensed: false,
            checked: false,
            text: `${'\xa0'.repeat(34)}CLEAR`,
            style: ChecklistLineStyle.ChecklistItem,
            firstLine: false,
            lastLine: true,
            originalItemIndex: cl.items.length,
          });
        } else {
          // Only three dots for following procedures
          this.lineData.push({
            abnormalProcedure: true,
            activeProcedure: false,
            sensed: true,
            checked: false,
            text: '...',
            style: ChecklistLineStyle.OmissionDots,
            firstLine: true,
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
