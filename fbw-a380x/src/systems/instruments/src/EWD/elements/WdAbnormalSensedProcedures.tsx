import { ConsumerSubject, VNode } from '@microsoft/msfs-sdk';
import {
  ProcedureLinesGenerator,
  ProcedureType,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages/ProcedureLinesGenerator';

import { WdAbstractChecklistComponent } from 'instruments/src/EWD/elements/WdAbstractChecklistComponent';
import { EcamAbnormalSensedProcedures } from 'instruments/src/MsfsAvionicsCommon/EcamMessages';

export class WdAbnormalSensedProcedures extends WdAbstractChecklistComponent {
  private readonly procedures = ConsumerSubject.create(this.sub.on('fws_abn_sensed_procedures'), []);

  private readonly activeProcedureId = ConsumerSubject.create(this.sub.on('fws_active_procedure'), '0');

  public updateChecklists() {
    this.lineData.length = 0;

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

    super.updateChecklists();
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.procedures.sub(() => this.updateChecklists(), true);
    this.activeProcedureId.sub(() => this.updateChecklists());
  }

  render() {
    return super.render();
  }
}
