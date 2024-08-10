// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Subject } from '@microsoft/msfs-sdk';
import { FwsEwdEvents } from 'instruments/src/MsfsAvionicsCommon/providers/FwsEwdPublisher';
import { FwsCore } from 'systems-host/systems/FlightWarningSystem/FwsCore';
import { EcamNormalProcedures } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/NormalProcedures';
import { NormalProcedure } from 'instruments/src/MsfsAvionicsCommon/EcamMessages';

export type ChecklistState = {
  id: number;
  checklistCompleted: boolean;
  itemsCompleted: boolean[];
};
export class FwsNormalChecklists {
  constructor(private fws: FwsCore) {
    this.showChecklist.sub((v) => this.pub.pub('fws_show_normal_checklists', v, true));
    this.checklistState.sub((cl) => {
      const flattened: ChecklistState[] = [];
      cl.forEach((val, key) =>
        flattened.push({ id: key, checklistCompleted: val.checklistCompleted, itemsCompleted: val.itemsCompleted }),
      );
      this.pub.pub('fws_normal_checklists', flattened, true);
    });
    this.activeChecklist.sub((id) => this.pub.pub('fws_normal_checklists_id', id, true));
    this.activeLine.sub((line) => this.pub.pub('fws_normal_checklists_active_line', line, true));

    // Populate checklistState
    const clStateInit = new Map<number, ChecklistState>();
    clStateInit.set(0, {
      id: 0,
      checklistCompleted: false,
      itemsCompleted: Array(Object.keys(EcamNormalProcedures).length).fill(false),
    });

    const keys = Object.keys(EcamNormalProcedures);
    keys.forEach((k) => {
      const proc = EcamNormalProcedures[k] as NormalProcedure;
      clStateInit.set(parseInt(k), {
        id: parseInt(k),
        checklistCompleted: false,
        itemsCompleted: Array(proc.items.length).fill(false),
      });
    });

    this.checklistState.set(clStateInit);
  }

  private readonly pub = this.fws.bus.getPublisher<FwsEwdEvents>();

  public readonly showChecklist = Subject.create(false);

  /** ID of checklist or 0 for overview */
  public readonly activeChecklist = Subject.create(0);

  /** Marked with cyan box */
  public readonly activeLine = Subject.create(0);

  public readonly checklistState = Subject.create<Map<number, ChecklistState> | null>(null);

  onUpdate() {
    if (this.fws.clPulseNode.read() === true) {
      this.showChecklist.set(!this.showChecklist.get());
    }
  }
}
