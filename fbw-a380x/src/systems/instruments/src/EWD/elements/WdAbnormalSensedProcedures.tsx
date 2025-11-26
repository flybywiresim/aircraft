// Copyright (c) 2024-2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { ConsumerSubject, Subject, VNode } from '@microsoft/msfs-sdk';
import {
  ProcedureLinesGenerator,
  ProcedureType,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages/ProcedureLinesGenerator';

import { WdAbstractChecklistComponent } from 'instruments/src/EWD/elements/WdAbstractChecklistComponent';
import {
  EcamAbnormalProcedures,
  EcamAbnormalSensedProcedures,
  isChecklistAction,
  isChecklistCondition,
  isTimedItem,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
import { ChecklistState } from 'instruments/src/MsfsAvionicsCommon/providers/FwsPublisher';

export class WdAbnormalSensedProcedures extends WdAbstractChecklistComponent {
  private readonly procedures = ConsumerSubject.create(this.sub.on('fws_abn_sensed_procedures'), []);

  private readonly activeProcedureId = ConsumerSubject.create(this.sub.on('fws_active_procedure'), '0');

  private lastProcUpdate: number | null = null;

  private timeSub = this.sub
    .on('realTime')
    .atFrequency(1)
    .handle((_t) => {
      this.updateTimedItems();
    }, false);

  public updateChecklists() {
    this.lineData.length = 0;
    this.lastProcUpdate = Date.now();

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
    this.props.fwsAvail?.sub((v) => {
      if (v) {
        this.timeSub.resume();
      } else {
        this.timeSub.pause();
      }

      this.updateChecklists();
    }, true);
  }

  render() {
    return super.render();
  }

  private updateTimedItems() {
    if (this.props.fwsAvail?.get()) {
      if (Date.now() - (this.lastProcUpdate ?? 0) >= 1000) {
        // Only run if last procedure update was more than 1 second ago
        let changedIdx: number[] | undefined = undefined;
        this.procedures.get().forEach((p) => {
          const proc = EcamAbnormalProcedures[p.id];
          proc.items.forEach((it, idx) => {
            if (isTimedItem(it)) {
              let newText: string | null = null;
              if (isChecklistAction(it)) {
                newText = ProcedureLinesGenerator.getChecklistActionText(it, idx, p.itemsChecked[idx], p);
              } else if (isChecklistCondition(it)) {
                newText = ProcedureLinesGenerator.getChecklistConditionText(it, idx, p.itemsChecked[idx], p);
              }

              if (newText != null) {
                const lineIdx = this.lineData.findIndex((v) => v.procedureId === p.id && v.originalItemIndex === idx);
                if (lineIdx !== -1) {
                  const oldLine = this.lineData[lineIdx];
                  if (oldLine.text !== newText) {
                    oldLine.text = newText;
                    if (changedIdx === undefined) {
                      changedIdx = [];
                    }
                    changedIdx.push(lineIdx);
                  }
                }
              }
            }
          });
        });
        if (changedIdx) {
          super.updateChecklists(changedIdx);
        }
      }
    }
  }
}
