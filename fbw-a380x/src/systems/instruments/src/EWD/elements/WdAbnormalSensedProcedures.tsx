import { ConsumerSubject, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import {
  ProcedureLinesGenerator,
  ProcedureType,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages/ProcedureLinesGenerator';

import { WdAbstractChecklistComponent } from 'instruments/src/EWD/elements/WdAbstractChecklistComponent';

export class WdAbnormalSensedProcedures extends WdAbstractChecklistComponent {
  private readonly procedures = ConsumerSubject.create(this.sub.on('fws_abn_sensed_procedures'), []);

  public updateChecklists() {
    this.lineData.length = 0;

    this.procedures.get().forEach((procState, procIndex) => {
      const procGen = new ProcedureLinesGenerator(
        procState.id,
        Subject.create(procIndex === 0),
        ProcedureType.Abnormal,
        procState,
      );
      this.lineData.push(...procGen.toLineData());
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
