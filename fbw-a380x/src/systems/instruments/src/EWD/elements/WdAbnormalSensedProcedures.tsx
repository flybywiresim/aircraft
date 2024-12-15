import { ConsumerSubject, FSComponent, VNode } from '@microsoft/msfs-sdk';
import {
  ChecklistLineStyle,
  EcamAbnormalSensedProcedures,
  EcamDeferredProcedures,
  isAbnormalSensedProcedure,
  isChecklistAction,
  isChecklistCondition,
  WdLineData,
  WdSpecialLine,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
import { WdAbstractChecklistComponent } from 'instruments/src/EWD/elements/WdAbstractChecklistComponent';
import { FwsEwdAbnormalSensedEntry } from 'instruments/src/MsfsAvionicsCommon/providers/FwsEwdPublisher';

export class WdAbnormalSensedProcedures extends WdAbstractChecklistComponent {
  private readonly procedures = ConsumerSubject.create(this.sub.on('fws_abn_sensed_procedures'), []);

  public updateChecklists() {
    this.lineData.length = 0;

    WdAbnormalSensedProcedures.generateProcedureLineData(this.procedures.get(), this.lineData, true, false);
    super.updateChecklists();
  }

  public static generateProcedureLineData(
    procedures: FwsEwdAbnormalSensedEntry[],
    lineData: WdLineData[],
    showOnlyFirst = true,
    deferredProcedure = false,
  ) {
    procedures.forEach((procState, procIndex, array) => {
      if (
        procState &&
        ((!deferredProcedure && EcamAbnormalSensedProcedures[procState.id]) ||
          (deferredProcedure && EcamDeferredProcedures[procState.id]))
      ) {
        const cl = deferredProcedure
          ? EcamDeferredProcedures[procState.id]
          : EcamAbnormalSensedProcedures[procState.id];

        lineData.push({
          abnormalProcedure: true,
          activeProcedure: procIndex === 0 || deferredProcedure,
          sensed: true,
          checked: false,
          text: cl.title,
          style: ChecklistLineStyle.Headline,
          firstLine: !deferredProcedure,
          lastLine: procIndex !== 0 ? true : false,
        });

        if (!showOnlyFirst || procIndex === 0) {
          if (isAbnormalSensedProcedure(cl) && cl.recommendation) {
            lineData.push({
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

          if (deferredProcedure) {
            lineData.push({
              abnormalProcedure: true,
              activeProcedure: procIndex === 0 || deferredProcedure,
              sensed: false,
              checked: procState.procedureCompleted ?? false,
              text: `${'\xa0'.repeat(31)}ACTIVATE`,
              style: ChecklistLineStyle.ChecklistItem,
              firstLine: procIndex !== 0 ? true : false,
              lastLine: procIndex !== 0 ? true : false,
              originalItemIndex: -1,
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
              if (item.name.substring(0, 4) === 'WHEN') {
                text += `.${item.name}`;
              } else {
                text += procState.itemsChecked[itemIndex]
                  ? `.AS ${item.name.substring(0, 2) === 'IF' ? item.name.substring(2) : item.name}`
                  : `.IF ${item.name.substring(0, 2) === 'IF' ? item.name.substring(2) : item.name}`;
              }
            } else {
              text += item.name;
            }

            lineData.push({
              abnormalProcedure: true,
              activeProcedure: procIndex === 0 || deferredProcedure,
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
              const confirmText = `${item.level ? '\xa0'.repeat(item.level) : ''}CONFIRM ${item.name}`;
              lineData.push({
                abnormalProcedure: true,
                activeProcedure: procIndex === 0 || deferredProcedure,
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

          lineData.push({
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
          lineData.push({
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
          lineData.push({
            abnormalProcedure: true,
            activeProcedure: procIndex === 0 || deferredProcedure,
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
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.procedures.sub(() => this.updateChecklists(), true);
  }

  render() {
    return super.render();
  }
}
