// Copyright (c) 2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Subscription } from '@microsoft/msfs-sdk';
import { EcamInfos } from '../../../instruments/src/MsfsAvionicsCommon/EcamMessages';
import { FwsCore, FwsSuppressableItem } from 'systems-host/CpiomC/FlightWarningSystem/FwsCore';
import { isSubscription } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';

export interface FwsInfoItem extends FwsSuppressableItem {}

export interface FwsInfoDict {
  [key: keyof typeof EcamInfos]: FwsInfoItem;
}

export class FwsInformation {
  public readonly subscriptions: Subscription[] = [];

  constructor(private fws: FwsCore) {}
  /** INFO shown on SD */
  info: FwsInfoDict = {
    220200004: {
      // LAND 2 ONLY
      simVarIsActive: this.fws.land2Only,
    },
    220200005: {
      // LAND 3 SINGLE ONLY
      simVarIsActive: this.fws.land3SingleOnly,
    },
    220200010: {
      // APPR 1 ONLY
      simVarIsActive: this.fws.appr1Only,
    },
  };

  public destroy(): void {
    this.subscriptions.forEach((sub) => sub.destroy());

    for (const key in this.info) {
      const element = this.info[key];

      if (isSubscription(element.simVarIsActive)) {
        element.simVarIsActive.destroy();
      }
    }
  }
}
