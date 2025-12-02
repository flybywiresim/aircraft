// Copyright (c) 2024-2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { ConsumerSubject, MappedSubject, Subject, SubscribableMapFunctions, VNode } from '@microsoft/msfs-sdk';
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
import { ChecklistState } from 'instruments/src/MsfsAvionicsCommon/providers/FwsEwdPublisher';
import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';

export class WdAbnormalSensedProcedures extends WdAbstractChecklistComponent {
  private readonly procedures = ConsumerSubject.create(this.sub.on('fws_abn_sensed_procedures'), []);

  private readonly activeProcedureId = ConsumerSubject.create(this.sub.on('fws_active_procedure'), '0');

  private readonly fcdc1DiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_1_1'));
  private readonly fcdc2DiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_1_2'));
  private readonly fcdc12Failed = MappedSubject.create(
    ([word1, word2]) => word1.isInvalid() && word2.isInvalid(),
    this.fcdc1DiscreteWord1,
    this.fcdc2DiscreteWord1,
  );

  private readonly groundspeed1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir_ground_speed_1'));
  private readonly groundspeed2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir_ground_speed_2'));
  private readonly groundspeed3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir_ground_speed_3'));
  private readonly groundspeed = MappedSubject.create(
    ([gs1, gs2, gs3]) => (!gs1.isInvalid() ? gs1.valueOr(0) : !gs2.isInvalid() ? gs2.valueOr(0) : gs3.valueOr(0)),
    this.groundspeed1,
    this.groundspeed2,
    this.groundspeed3,
  );
  private readonly onGround1 = ConsumerSubject.create(this.sub.on('nose_gear_compressed_1'), true);
  private readonly onGround2 = ConsumerSubject.create(this.sub.on('nose_gear_compressed_2'), true);
  private readonly onGround = MappedSubject.create(SubscribableMapFunctions.or(), this.onGround1, this.onGround2);

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
    } else if (!(this.onGround.get() && this.groundspeed.get() >= 50)) {
      // Three possible cases to handle here:
      // FWS 1+2 FAULT
      // FWS 1+2 & FCDC 1+2 FAULT
      // FWS 1+2 & CPIOM FAULT
      // FWS 1+2 failed, show fallback
      if (
        (this.props.cpiomAvailChecker?.cpiomCFailed.get() ||
          (!this.props.fwsAvail?.get() && this.fcdc12Failed.get())) &&
        !this.props.cpiomAvailChecker?.otherCpiomFailed.get()
      ) {
        // FWS 1+2 & FCDC 1+2 failed, show fallback
        const fwsFailedFallbackClState: ChecklistState = {
          id: '314800003',
          procedureActivated: true,
          procedureCompleted: false,
          itemsActive: [true, true, true, true, true, true, true, true, true, true],
          itemsChecked: [false, false, false, false, false, false, false, false, false, false],
          itemsToShow: [true, true, true, true, true, true, true, true, true, true],
        };
        const procGenFwsFailedFallback = new ProcedureLinesGenerator(
          '314800003',
          Subject.create(false),
          ProcedureType.FwsFailedFallback,
          fwsFailedFallbackClState,
        );
        this.lineData.push(...procGenFwsFailedFallback.toLineData());
      } else {
        // FWS 1+2 failed, show fallback
        const fwsFailedFallbackClState: ChecklistState = {
          id: '314800004',
          procedureActivated: true,
          procedureCompleted: false,
          itemsActive: [true, true, true, true, true, true, true, true, true, true],
          itemsChecked: [false, false, false, false, false, false, false, false, false, false],
          itemsToShow: [true, true, true, true, true, true, true, true, true, true],
        };
        const procGenFwsFailedFallback = new ProcedureLinesGenerator(
          '314800004',
          Subject.create(false),
          ProcedureType.FwsFailedFallback,
          fwsFailedFallbackClState,
        );
        this.lineData.push(...procGenFwsFailedFallback.toLineData());
      }
    }

    super.updateChecklists();
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.procedures.sub(() => this.updateChecklists(), true),
      this.activeProcedureId.sub(() => this.updateChecklists(), true),
      this.fcdc12Failed.sub(() => this.updateChecklists(), true),
      this.fcdc1DiscreteWord1,
      this.fcdc2DiscreteWord1,
      this.fcdc12Failed,
      this.groundspeed1,
      this.groundspeed2,
      this.groundspeed3,
      this.groundspeed,
      this.onGround1,
      this.onGround2,
      this.onGround,
    );

    if (this.props.cpiomAvailChecker) {
      this.subscriptions.push(
        MappedSubject.create(
          () => this.updateChecklists(),
          this.props.cpiomAvailChecker.cpiomAFailed,
          this.props.cpiomAvailChecker.cpiomBFailed,
          this.props.cpiomAvailChecker.cpiomCFailed,
          this.props.cpiomAvailChecker.cpiomDFailed,
          this.props.cpiomAvailChecker.cpiomEFailed,
          this.props.cpiomAvailChecker.cpiomFFailed,
          this.props.cpiomAvailChecker.cpiomGFailed,
          this.props.cpiomAvailChecker.otherCpiomFailed,
        ),
      );
    }

    if (this.props.fwsAvail) {
      this.subscriptions.push(
        this.props.fwsAvail.sub((v) => {
          if (v) {
            this.timeSub.resume();
          } else {
            this.timeSub.pause();
          }

          this.updateChecklists();
        }, true),
      );
    }

    this.subscriptions.push(this.procedures, this.activeProcedureId, this.timeSub);
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
