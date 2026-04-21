import { ConsumerSubject, FSComponent, VNode } from '@microsoft/msfs-sdk';
import {
  ChecklistLineStyle,
  EcamAbnormalSensedProcedures,
  EcamAbNormalSensedSubMenuVector,
  isChecklistAction,
  isChecklistCondition,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
import { AbnormalNonSensedProceduresOverview } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/AbnormalNonSensedProcedures';
import { WdAbstractChecklistComponent } from 'instruments/src/EWD/elements/WdAbstractChecklistComponent';

function removeUnderline(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b4m[\s\S]*\x1bm /gm, '');
}

export class WdAbnormalNonSensedProcedures extends WdAbstractChecklistComponent {
  private readonly checklistId = ConsumerSubject.create(this.sub.on('fws_abn_non_sensed_id'), 0);

  private readonly checklistActivated = ConsumerSubject.create(this.sub.on('fws_abn_non_sensed_current_active'), false);

  public updateChecklists() {
    this.lineData.length = 0;

    if (this.checklistId.get() === 0) {
      // Render overview page
      this.lineData.push({
        activeProcedure: true,
        abnormalProcedure: true,
        sensed: true,
        checked: false,
        text: '\x1b4mABNORMAL PROC\x1bm',
        style: ChecklistLineStyle.Headline,
        firstLine: true,
        lastLine: false,
      });

      const numItems =
        AbnormalNonSensedProceduresOverview.filter((v) => v.category === null).length +
        EcamAbNormalSensedSubMenuVector.length;

      AbnormalNonSensedProceduresOverview.forEach((proc, index) => {
        if (proc.category === null) {
          this.lineData.push({
            activeProcedure: true,
            abnormalProcedure: true,
            sensed: true,
            checked: false,
            text: `\xa0\xa0${removeUnderline(EcamAbnormalSensedProcedures[proc.id].title)}`,
            style: ChecklistLineStyle.Headline,
            firstLine: false,
            lastLine: index === numItems - 1,
            originalItemIndex: index,
          });
        }
      });

      EcamAbNormalSensedSubMenuVector.forEach((cat, index) => {
        this.lineData.push({
          activeProcedure: true,
          abnormalProcedure: true,
          sensed: true,
          checked: false,
          text: `\xa0\xa0${cat ?? ''}`,
          style: ChecklistLineStyle.Headline,
          firstLine: false,
          lastLine: index === EcamAbNormalSensedSubMenuVector.length - 1,
          originalItemIndex: index + AbnormalNonSensedProceduresOverview.filter((v) => v.category === null).length,
        });
      });
    } else if (this.checklistId.get() > 0 && this.checklistId.get() <= 10) {
      const category = EcamAbNormalSensedSubMenuVector[this.checklistId.get() - 1];

      // sub categories
      this.lineData.push({
        activeProcedure: true,
        abnormalProcedure: true,
        sensed: true,
        checked: false,
        text: '\x1b4mABNORMAL PROC\x1bm',
        style: ChecklistLineStyle.Headline,
        firstLine: true,
        lastLine: false,
      });

      this.lineData.push({
        activeProcedure: true,
        abnormalProcedure: true,
        sensed: true,
        checked: false,
        text: `\xa0\xa0\x1b4m${EcamAbNormalSensedSubMenuVector[this.checklistId.get() - 1]}\x1bm`,
        style: ChecklistLineStyle.Headline,
        firstLine: false,
        lastLine: false,
      });

      const numItems = AbnormalNonSensedProceduresOverview.filter((v) => v.category === category).length;
      AbnormalNonSensedProceduresOverview.filter((v) => v.category === category).forEach((proc, index) => {
        this.lineData.push({
          activeProcedure: true,
          abnormalProcedure: true,
          sensed: true,
          checked: false,
          text: `\xa0\xa0\xa0\xa0${removeUnderline(EcamAbnormalSensedProcedures[proc.id].title)}`,
          style: ChecklistLineStyle.Headline,
          firstLine: false,
          lastLine: index === numItems - 1,
          originalItemIndex: index,
        });
      });
    } else if (EcamAbnormalSensedProcedures[this.checklistId.get()]) {
      const abn = EcamAbnormalSensedProcedures[this.checklistId.get()];

      this.lineData.push({
        activeProcedure: true,
        abnormalProcedure: true,
        sensed: true,
        checked: false,
        text: abn.title,
        style: ChecklistLineStyle.Headline,
        firstLine: true,
        lastLine: false,
      });

      this.lineData.push({
        activeProcedure: true,
        abnormalProcedure: true,
        sensed: false,
        checked: this.checklistActivated.get(),
        text: `${'\xa0'.repeat(31)}ACTIVATE`,
        style: ChecklistLineStyle.ChecklistItem,
        firstLine: false,
        lastLine: abn.items.length === 0 ? true : false,
        originalItemIndex: -1,
      });

      abn.items.forEach((item, index) => {
        let text = item.level ? '\xa0'.repeat(item.level) : '';
        if (isChecklistAction(item)) {
          text += '-';
          text += item.name;
          if (item.labelNotCompleted) {
            // Pad to 39 characters max
            const paddingNeeded = Math.max(
              0,
              39 - (item.labelNotCompleted.length + item.name.length + (item.level ?? 0) * 1 + 2),
            );

            text += ` ${'.'.repeat(paddingNeeded)}${item.labelNotCompleted}`;
          }
        } else if (isChecklistCondition(item)) {
          if (item.name.substring(0, 4) === 'WHEN') {
            text += `.${item.name}`;
          } else {
            text += `.IF ${item.name.substring(0, 2) === 'IF' ? item.name.substring(2) : item.name}`;
          }
        } else {
          text += item.name;
        }

        this.lineData.push({
          activeProcedure: true,
          abnormalProcedure: true,
          sensed: item.sensed,
          checked: false,
          text: text.substring(0, 39),
          style: ChecklistLineStyle.ChecklistItem,
          firstLine: false,
          lastLine: index === abn.items.length - 1,
          originalItemIndex: index + 1,
          inactive: true,
        });
      });
    }
    super.updateChecklists();
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.checklistId.sub(() => this.updateChecklists(), true);
  }

  // 17 lines
  render() {
    return super.render();
  }
}
