// Copyright (c) 2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Subscription } from '@microsoft/msfs-sdk';
import { EcamLimitations } from '../../../instruments/src/MsfsAvionicsCommon/EcamMessages';
import { FwsCore, FwsSuppressableItem } from 'systems-host/CpiomC/FlightWarningSystem/FwsCore';
import { isSubscription } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';

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
    230400001: {
      simVarIsActive: this.fws.allRmpFault,
      phase: FwsLimitationsPhases.AllPhases,
    },
  };

  public destroy(): void {
    this.subscriptions.forEach((sub) => sub.destroy());

    for (const key in this.limitations) {
      const element = this.limitations[key];
      if (isSubscription(element.simVarIsActive)) {
        element.simVarIsActive.destroy();
      }
    }
  }
}
