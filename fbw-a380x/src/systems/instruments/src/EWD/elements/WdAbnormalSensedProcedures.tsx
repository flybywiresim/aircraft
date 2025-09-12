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

export class WdAbnormalSensedProcedures extends WdAbstractChecklistComponent {
  private readonly procedures = ConsumerSubject.create(this.sub.on('fws_abn_sensed_procedures'), []);

  private readonly activeProcedureId = ConsumerSubject.create(this.sub.on('fws_active_procedure'), '0');

  private readonly cpiomA1Available = ConsumerSubject.create(this.sub.on('cpiom_a_available_1'), false);
  private readonly cpiomA2Available = ConsumerSubject.create(this.sub.on('cpiom_a_available_2'), false);
  private readonly cpiomA3Available = ConsumerSubject.create(this.sub.on('cpiom_a_available_3'), false);
  private readonly cpiomA4Available = ConsumerSubject.create(this.sub.on('cpiom_a_available_4'), false);
  private readonly cpiomAFailed = MappedSubject.create(
    SubscribableMapFunctions.nor(),
    this.cpiomA1Available,
    this.cpiomA2Available,
    this.cpiomA3Available,
    this.cpiomA4Available,
  );

  private readonly cpiomB1Available = ConsumerSubject.create(this.sub.on('cpiom_b_available_1'), false);
  private readonly cpiomB2Available = ConsumerSubject.create(this.sub.on('cpiom_b_available_2'), false);
  private readonly cpiomB3Available = ConsumerSubject.create(this.sub.on('cpiom_b_available_3'), false);
  private readonly cpiomB4Available = ConsumerSubject.create(this.sub.on('cpiom_b_available_4'), false);
  private readonly cpiomBFailed = MappedSubject.create(
    SubscribableMapFunctions.nor(),
    this.cpiomB1Available,
    this.cpiomB2Available,
    this.cpiomB3Available,
    this.cpiomB4Available,
  );

  private readonly cpiomC1Available = ConsumerSubject.create(this.sub.on('cpiom_c_available_1'), false);
  private readonly cpiomC2Available = ConsumerSubject.create(this.sub.on('cpiom_c_available_2'), false);
  private readonly cpiomCFailed = MappedSubject.create(
    SubscribableMapFunctions.nor(),
    this.cpiomC1Available,
    this.cpiomC2Available,
  );

  private readonly cpiomD1Available = ConsumerSubject.create(this.sub.on('cpiom_d_available_1'), false);
  private readonly cpiomD3Available = ConsumerSubject.create(this.sub.on('cpiom_d_available_3'), false);
  private readonly cpiomDFailed = MappedSubject.create(
    SubscribableMapFunctions.nor(),
    this.cpiomD1Available,
    this.cpiomD3Available,
  );

  private readonly cpiomE1Available = ConsumerSubject.create(this.sub.on('cpiom_e_available_1'), false);
  private readonly cpiomE2Available = ConsumerSubject.create(this.sub.on('cpiom_e_available_2'), false);
  private readonly cpiomEFailed = MappedSubject.create(
    SubscribableMapFunctions.nor(),
    this.cpiomE1Available,
    this.cpiomE2Available,
  );

  private readonly cpiomF1Available = ConsumerSubject.create(this.sub.on('cpiom_f_available_1'), false);
  private readonly cpiomF2Available = ConsumerSubject.create(this.sub.on('cpiom_f_available_2'), false);
  private readonly cpiomF3Available = ConsumerSubject.create(this.sub.on('cpiom_f_available_3'), false);
  private readonly cpiomF4Available = ConsumerSubject.create(this.sub.on('cpiom_f_available_4'), false);
  private readonly cpiomFFailed = MappedSubject.create(
    SubscribableMapFunctions.nor(),
    this.cpiomF1Available,
    this.cpiomF2Available,
    this.cpiomF3Available,
    this.cpiomF4Available,
  );

  private readonly cpiomG1Available = ConsumerSubject.create(this.sub.on('cpiom_g_available_1'), false);
  private readonly cpiomG2Available = ConsumerSubject.create(this.sub.on('cpiom_g_available_2'), false);
  private readonly cpiomG3Available = ConsumerSubject.create(this.sub.on('cpiom_g_available_3'), false);
  private readonly cpiomG4Available = ConsumerSubject.create(this.sub.on('cpiom_g_available_4'), false);
  private readonly cpiomGFailed = MappedSubject.create(
    SubscribableMapFunctions.nor(),
    this.cpiomG1Available,
    this.cpiomG2Available,
    this.cpiomG3Available,
    this.cpiomG4Available,
  );

  private readonly otherCpiomFailed = MappedSubject.create(
    SubscribableMapFunctions.or(),
    this.cpiomAFailed,
    this.cpiomBFailed,
    this.cpiomDFailed,
    this.cpiomEFailed,
    this.cpiomFFailed,
    this.cpiomGFailed,
  );

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
      // Three possible cases to handle here:
      // FWS 1+2 FAULT
      // FWS 1+2 & FCDC 1+2 FAULT
      // FWS 1+2 & CPIOM FAULT
      // FWS 1+2 failed, show fallback
      if (!this.props.fwsAvail.get() && this.cpiomCFailed.get() && this.otherCpiomFailed.get()) {
        // FWS 1+2 & FCDC 1+2 & other CPIOM failed, show fallback
        // If CPIOM failed: Show line; If not failed: Show blank line before item
        const af = this.cpiomAFailed.get();
        const bf = this.cpiomBFailed.get();
        const df = this.cpiomDFailed.get();
        const ff = this.cpiomFFailed.get();
        const gf = this.cpiomGFailed.get();
        const itemsShow = [
          !af,
          af,
          !bf,
          bf,
          !bf,
          bf,
          !bf,
          bf,
          !af,
          af,
          !ff,
          ff,
          !ff,
          ff,
          !ff,
          ff,
          !df,
          df,
          !gf,
          gf,
          true,
          true,
          true,
          !af,
          af,
          !ff,
          ff,
          !gf,
          gf,
          !bf,
          bf,
          true,
          true,
          true,
        ];

        const fwsFailedFallbackClState: ChecklistState = {
          id: '314800002',
          procedureActivated: true,
          procedureCompleted: false,
          itemsActive: Array(itemsShow.length).fill(true),
          itemsChecked: Array(itemsShow.length).fill(false),
          itemsToShow: itemsShow,
        };
        const procGenFwsFailedFallback = new ProcedureLinesGenerator(
          '314800002',
          Subject.create(false),
          ProcedureType.FwsFailedFallback,
          fwsFailedFallbackClState,
        );
        this.lineData.push(...procGenFwsFailedFallback.toLineData());
        // Still TODO: Show LAND ANSA only when group F is failed
      } else if (!this.props.fwsAvail.get() && this.cpiomCFailed.get()) {
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
      }
    }

    super.updateChecklists();
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.procedures.sub(() => this.updateChecklists(), true),
      this.activeProcedureId.sub(() => this.updateChecklists(), true),
      MappedSubject.create(
        () => this.updateChecklists(),
        this.cpiomAFailed,
        this.cpiomBFailed,
        this.cpiomCFailed,
        this.cpiomDFailed,
        this.cpiomEFailed,
        this.cpiomFFailed,
        this.cpiomGFailed,
        this.otherCpiomFailed,
      ),
    );

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

    this.subscriptions.push(
      this.procedures,
      this.activeProcedureId,
      this.cpiomA1Available,
      this.cpiomA2Available,
      this.cpiomA3Available,
      this.cpiomA4Available,
      this.cpiomAFailed,
      this.cpiomB1Available,
      this.cpiomB2Available,
      this.cpiomB3Available,
      this.cpiomB4Available,
      this.cpiomBFailed,
      this.cpiomC1Available,
      this.cpiomC2Available,
      this.cpiomCFailed,
      this.cpiomD1Available,
      this.cpiomD3Available,
      this.cpiomDFailed,
      this.cpiomE1Available,
      this.cpiomE2Available,
      this.cpiomEFailed,
      this.cpiomF1Available,
      this.cpiomF2Available,
      this.cpiomF3Available,
      this.cpiomF4Available,
      this.cpiomFFailed,
      this.cpiomGFailed,
      this.cpiomG1Available,
      this.cpiomG2Available,
      this.cpiomG3Available,
      this.cpiomG4Available,
      this.otherCpiomFailed,
      this.timeSub,
    );
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
