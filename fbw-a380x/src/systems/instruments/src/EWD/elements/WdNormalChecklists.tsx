import { ConsumerSubject, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { EcamNormalProcedures } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/NormalProcedures';
import {
  ChecklistLineStyle,
  DeferredProcedureType,
  EcamDeferredProcedures,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
import { WdAbstractChecklistComponent } from 'instruments/src/EWD/elements/WdAbstractChecklistComponent';

export class WdNormalChecklists extends WdAbstractChecklistComponent {
  private readonly checklists = ConsumerSubject.create(this.sub.on('fws_normal_checklists'), []);

  /** Special indices:
   * -1 : all phases
   * -2 : at top of descent
   * -3 : for approach
   * -4 : for landing
   */
  private readonly checklistId = ConsumerSubject.create(this.sub.on('fws_normal_checklists_id'), 0);

  private readonly deferred = ConsumerSubject.create(this.sub.on('fws_deferred_procedures'), []);

  /** ALL PHASES, TOP OF DESCENT, FOR APPROACH, FOR LANDING */
  private readonly hasDeferred = [false, false, false, false];

  /** ALL PHASES, TOP OF DESCENT, FOR APPROACH, FOR LANDING */
  private readonly deferredIsCompleted = [false, false, false, false];

  public updateChecklists() {
    this.lineData.length = 0;

    const sorted = this.checklists
      .get()
      .filter((v) => v.id !== 0)
      .sort((a, b) => a.id - b.id);
    const clState = sorted.find((v) => v.id === this.checklistId.get());

    if (this.deferred.get().length > 0) {
      // Status of deferred procedures
      this.hasDeferred[0] = this.deferred
        .get()
        .some((p) => EcamDeferredProcedures[p.id]?.type === DeferredProcedureType.ALL_PHASES);
      this.hasDeferred[1] = this.deferred
        .get()
        .some((p) => EcamDeferredProcedures[p.id]?.type === DeferredProcedureType.AT_TOP_OF_DESCENT);
      this.hasDeferred[2] = this.deferred
        .get()
        .some((p) => EcamDeferredProcedures[p.id]?.type === DeferredProcedureType.FOR_APPROACH);
      this.hasDeferred[3] = this.deferred
        .get()
        .some((p) => EcamDeferredProcedures[p.id]?.type === DeferredProcedureType.FOR_LANDING);

      this.deferredIsCompleted[0] = this.deferred
        .get()
        .every((p) => EcamDeferredProcedures[p.id]?.type === DeferredProcedureType.ALL_PHASES && p.checklistCompleted);
      this.deferredIsCompleted[1] = this.deferred
        .get()
        .every(
          (p) => EcamDeferredProcedures[p.id]?.type === DeferredProcedureType.AT_TOP_OF_DESCENT && p.checklistCompleted,
        );
      this.deferredIsCompleted[2] = this.deferred
        .get()
        .every(
          (p) => EcamDeferredProcedures[p.id]?.type === DeferredProcedureType.FOR_APPROACH && p.checklistCompleted,
        );
      this.deferredIsCompleted[3] = this.deferred
        .get()
        .every((p) => EcamDeferredProcedures[p.id]?.type === DeferredProcedureType.FOR_LANDING && p.checklistCompleted);
    }

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
            originalItemIndex: index,
          });
        }

        switch (state.id) {
          case 1000006:
            if (this.hasDeferred[0]) {
              this.lineData.push({
                activeProcedure: true,
                sensed: true,
                checked: this.deferredIsCompleted[0],
                text: 'ALL PHASES : DEFERRED PROCEDURE',
                style: this.deferredIsCompleted[0]
                  ? ChecklistLineStyle.CompletedDeferredProcedure
                  : ChecklistLineStyle.DeferredProcedure,
                firstLine: false,
                lastLine: false,
                originalItemIndex: -1,
              });
            }
            if (this.hasDeferred[1]) {
              this.lineData.push({
                activeProcedure: true,
                sensed: true,
                checked: this.deferredIsCompleted[1],
                text: 'AT TOP OF DESCENT : DEFERRED PROCEDURE',
                style: this.deferredIsCompleted[1]
                  ? ChecklistLineStyle.CompletedDeferredProcedure
                  : ChecklistLineStyle.DeferredProcedure,
                firstLine: false,
                lastLine: false,
                originalItemIndex: -2,
              });
            }

            if (this.hasDeferred[2]) {
              this.lineData.push({
                activeProcedure: true,
                sensed: true,
                checked: this.deferredIsCompleted[2],
                text: 'FOR APPROACH : DEFERRED PROCEDURE',
                style: this.deferredIsCompleted[2]
                  ? ChecklistLineStyle.CompletedDeferredProcedure
                  : ChecklistLineStyle.DeferredProcedure,
                firstLine: false,
                lastLine: false,
                originalItemIndex: -3,
              });
            }
            break;
          case 1000007:
            if (this.hasDeferred[3]) {
              this.lineData.push({
                activeProcedure: true,
                sensed: true,
                checked: this.deferredIsCompleted[3],
                text: 'FOR LANDING : DEFERRED PROCEDURE',
                style: this.deferredIsCompleted[3]
                  ? ChecklistLineStyle.CompletedDeferredProcedure
                  : ChecklistLineStyle.DeferredProcedure,
                firstLine: false,
                lastLine: false,
                originalItemIndex: -4,
              });
            }
            break;
        }
      });
      this.totalLines.set(sorted.length + this.hasDeferred.reduce((acc, val) => acc + (val ? 1 : 0), 0) + 1);
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
          originalItemIndex: index,
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
        originalItemIndex: cl.items.length,
      });

      this.lineData.push({
        activeProcedure: true,
        sensed: false,
        checked: false,
        text: `${'\xa0'.repeat(34)}RESET`,
        style: ChecklistLineStyle.ChecklistItem,
        firstLine: false,
        lastLine: true,
        originalItemIndex: cl.items.length + 1,
      });
    } else if (this.checklistId.get() < 0) {
      // Deferred procedures
    }
    super.updateChecklists();
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.checklists.sub(() => this.updateChecklists(), true);
    this.checklistId.sub(() => this.updateChecklists());
    this.deferred.sub(() => this.updateChecklists());
  }

  // 17 lines
  render() {
    return super.render();
  }
}
