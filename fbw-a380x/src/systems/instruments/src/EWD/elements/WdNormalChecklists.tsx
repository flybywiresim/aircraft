import { ConsumerSubject, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import {
  deferredProcedureIds,
  EcamNormalProcedures,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages/NormalProcedures';
import {
  ChecklistLineStyle,
  DeferredProcedureType,
  EcamDeferredProcedures,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
import { WdAbstractChecklistComponent } from 'instruments/src/EWD/elements/WdAbstractChecklistComponent';
import {
  ProcedureLinesGenerator,
  ProcedureType,
  SPECIAL_INDEX_DEFERRED_PAGE_CLEAR,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages/ProcedureLinesGenerator';

export class WdNormalChecklists extends WdAbstractChecklistComponent {
  private readonly checklists = ConsumerSubject.create(this.sub.on('fws_normal_checklists'), []);

  private readonly checklistId = ConsumerSubject.create(this.sub.on('fws_normal_checklists_id'), 0);

  private readonly activeDeferredProcedureId = ConsumerSubject.create(this.sub.on('fws_active_procedure'), '0');

  private readonly deferred = ConsumerSubject.create(this.sub.on('fws_deferred_procedures'), []);

  /** ALL PHASES, TOP OF DESCENT, FOR APPROACH, FOR LANDING */
  private readonly hasDeferred = [false, false, false, false];

  /** ALL PHASES, TOP OF DESCENT, FOR APPROACH, FOR LANDING */
  private readonly deferredIsCompleted = [false, false, false, false];

  public updateChecklists() {
    this.lineData.length = 0;

    const sorted = this.checklists
      .get()
      .filter((v) => v.id !== '0')
      .sort((a, b) => parseInt(a.id) - parseInt(b.id));
    const clState = sorted.find((v) => parseInt(v.id) === this.checklistId.get());

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
      .every((p) => EcamDeferredProcedures[p.id]?.type === DeferredProcedureType.ALL_PHASES && p.procedureCompleted);
    this.deferredIsCompleted[1] = this.deferred
      .get()
      .every(
        (p) => EcamDeferredProcedures[p.id]?.type === DeferredProcedureType.AT_TOP_OF_DESCENT && p.procedureCompleted,
      );
    this.deferredIsCompleted[2] = this.deferred
      .get()
      .every((p) => EcamDeferredProcedures[p.id]?.type === DeferredProcedureType.FOR_APPROACH && p.procedureCompleted);
    this.deferredIsCompleted[3] = this.deferred
      .get()
      .every((p) => EcamDeferredProcedures[p.id]?.type === DeferredProcedureType.FOR_LANDING && p.procedureCompleted);

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
        if (EcamNormalProcedures[parseInt(state.id)]) {
          let lineStyle: ChecklistLineStyle;
          let checked = false;
          let display = true;
          if (deferredProcedureIds.includes(parseInt(state.id))) {
            display = false;
            lineStyle = state.procedureCompleted
              ? ChecklistLineStyle.CompletedDeferredProcedure
              : ChecklistLineStyle.DeferredProcedure;
            if (deferredProcedureIds.findIndex((p) => p === parseInt(state.id)) >= 0) {
              checked = this.deferredIsCompleted[deferredProcedureIds.findIndex((p) => p === parseInt(state.id))];
              display = this.hasDeferred[deferredProcedureIds.findIndex((p) => p === parseInt(state.id))];
            }
          } else {
            lineStyle = state.procedureCompleted
              ? ChecklistLineStyle.CompletedChecklist
              : ChecklistLineStyle.ChecklistItem;
            checked = state.procedureCompleted ?? false;
          }

          if (display) {
            this.lineData.push({
              activeProcedure: true,
              sensed: true,
              checked: checked,
              text: EcamNormalProcedures[parseInt(state.id)].title,
              style: lineStyle,
              firstLine: false,
              lastLine: index === sorted.length - 1,
              originalItemIndex: index,
            });
          }
        }
      });
      this.totalLines.set(sorted.length + this.hasDeferred.reduce((acc, val) => acc + (val ? 1 : 0), 0) + 1);
    } else if (
      clState &&
      EcamNormalProcedures[parseInt(clState.id)] &&
      !deferredProcedureIds.includes(parseInt(clState.id))
    ) {
      const procGen = new ProcedureLinesGenerator(clState.id, Subject.create(true), ProcedureType.Normal, clState);
      this.lineData.push(...procGen.toLineData());
    } else if (clState && deferredProcedureIds.includes(parseInt(clState.id))) {
      // Deferred procedures
      this.lineData.push({
        activeProcedure: true,
        abnormalProcedure: true,
        sensed: true,
        checked: false,
        text: `${clState.procedureCompleted ? '\x1b<7m' : '\x1b<4m'}${EcamNormalProcedures[parseInt(clState.id)].title} \x1bm`,
        style: ChecklistLineStyle.Headline,
        firstLine: true,
        lastLine: false,
      });
      this.lineData.push({
        abnormalProcedure: true,
        activeProcedure: true,
        sensed: true,
        checked: false,
        text: '',
        style: ChecklistLineStyle.ChecklistItem,
        firstLine: false,
        lastLine: false,
      });

      const currentDeferredType =
        deferredProcedureIds.indexOf(parseInt(clState.id)) !== -1
          ? (deferredProcedureIds.indexOf(parseInt(clState.id)) as DeferredProcedureType)
          : null;
      const visibleDeferred = this.deferred
        .get()
        .filter((v) => currentDeferredType !== null && EcamDeferredProcedures[v.id].type === currentDeferredType);
      visibleDeferred.forEach((proc, index) => {
        const procGen = new ProcedureLinesGenerator(
          proc.id,
          this.activeDeferredProcedureId.map((id) => proc.id === id),
          ProcedureType.Deferred,
          proc,
          undefined,
          undefined,
          undefined,
          undefined,
          index === visibleDeferred.length - 1,
        );
        this.lineData.push(...procGen.toLineData());
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
        originalItemIndex: SPECIAL_INDEX_DEFERRED_PAGE_CLEAR,
      });
    }
    super.updateChecklists();
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.checklists.sub(() => this.updateChecklists(), true);
    this.checklistId.sub(() => this.updateChecklists(), true);
    this.deferred.sub(() => this.updateChecklists(), true);
    this.activeDeferredProcedureId.sub(() => this.updateChecklists());
  }

  // 17 lines
  render() {
    return super.render();
  }
}
