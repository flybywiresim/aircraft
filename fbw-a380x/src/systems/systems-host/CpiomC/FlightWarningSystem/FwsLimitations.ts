// Copyright (c) 2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Subscription } from '@microsoft/msfs-sdk';
import { EcamLimitations } from '../../../instruments/src/MsfsAvionicsCommon/EcamMessages';
import { FwsCore, FwsSuppressableItem } from 'systems-host/CpiomC/FlightWarningSystem/FwsCore';

export enum FwsLimitationsPhases {
  AllPhases,
  ApprLdg,
}

export interface FwsLimitationsItem extends FwsSuppressableItem {
  /** Relevant phase shown on SD/EWD: ALL PHASES or APPR & LDG */
  phase: FwsLimitationsPhases;
  /** Shown on PFD */
  pfd?: boolean;
}

export interface FwsLimitationsDict {
  [key: keyof typeof EcamLimitations]: FwsLimitationsItem;
}

export class FwsLimitations {
  public readonly subscriptions: Subscription[] = [];

  constructor(private fws: FwsCore) {}
  /** LIMITATIONS shown on SD */
  limitations: FwsLimitationsDict = {
    1: {
      simVarIsActive: this.fws.landAsap,
      phase: FwsLimitationsPhases.AllPhases,
      pfd: true,
    },

    230400001: {
      simVarIsActive: this.fws.allRmpFault,
      phase: FwsLimitationsPhases.AllPhases,
    },
    260400001: {
      // APU bleed do not use
      simVarIsActive: this.fws.fireButtonEng1,
      phase: FwsLimitationsPhases.AllPhases,
    },
  };

  public destroy(): void {
    this.subscriptions.forEach((sub) => sub.destroy());

    for (const key in this.limitations) {
      const element = this.limitations[key];
      if ('destroy' in element.simVarIsActive) {
        element.simVarIsActive.destroy();
      }
    }
  }
}
