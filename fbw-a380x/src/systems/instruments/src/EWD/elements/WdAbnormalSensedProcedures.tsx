import { ConsumerSubject, Subject, VNode } from '@microsoft/msfs-sdk';
import {
  ProcedureLinesGenerator,
  ProcedureType,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages/ProcedureLinesGenerator';

import { WdAbstractChecklistComponent } from 'instruments/src/EWD/elements/WdAbstractChecklistComponent';
import { EcamAbnormalSensedProcedures } from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
import { ChecklistState } from 'instruments/src/MsfsAvionicsCommon/providers/FwsEwdPublisher';

export class WdAbnormalSensedProcedures extends WdAbstractChecklistComponent {
  private readonly procedures = ConsumerSubject.create(this.sub.on('fws_abn_sensed_procedures'), []);

  private readonly activeProcedureId = ConsumerSubject.create(this.sub.on('fws_active_procedure'), '0');

  public updateChecklists() {
    this.lineData.length = 0;

    if (!this.props.fwsAvail || this.props.fwsAvail.get()) {
      this.procedures.get().forEach((procState, index) => {
        const procGen = new ProcedureLinesGenerator(
          procState.id,
          this.activeProcedureId.map((id) => id === procState.id),
          ProcedureType.Abnormal,
          procState,
          undefined,
          undefined,
          undefined,
          EcamAbnormalSensedProcedures[procState.id].recommendation,
          index === 0,
        );
        this.lineData.push(...procGen.toLineData());
      });
    } else {
      // FWS 1+2 failed, show fallback
      const fallbackClState: ChecklistState = {
        id: '314800004',
        procedureActivated: true,
        procedureCompleted: false,
        itemsActive: [true, true, true, true, true, true, true, true, true],
        itemsChecked: [false, false, true, true, true, true, true, true, true],
        itemsToShow: [true, true, true, true, true, true, true, true, true],
      };
      const procGenFallback = new ProcedureLinesGenerator(
        '314800004',
        Subject.create(false),
        ProcedureType.FwsFailedFallback,
        fallbackClState,
      );
      this.lineData.push(...procGenFallback.toLineData());
    }

    super.updateChecklists();
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.procedures.sub(() => this.updateChecklists(), true);
    this.activeProcedureId.sub(() => this.updateChecklists(), true);
    this.props.fwsAvail?.sub(() => this.updateChecklists(), true);
  }

  render() {
    return super.render();
  }
}
