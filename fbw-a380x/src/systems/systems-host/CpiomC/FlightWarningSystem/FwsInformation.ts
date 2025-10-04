// Copyright (c) 2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { MappedSubject, SubscribableMapFunctions, Subscription } from '@microsoft/msfs-sdk';
import { EcamInfos } from '../../../instruments/src/MsfsAvionicsCommon/EcamMessages';
import { FwsCore, FwsSuppressableItem } from 'systems-host/CpiomC/FlightWarningSystem/FwsCore';

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
      simVarIsActive: this.fws.land3FailPassiveInop,
    },
    220200005: {
      // LAND 3 SINGLE ONLY
      simVarIsActive: this.fws.land3FailOperationalInop,
    },
    220200006: {
      // FOR AUTOLAND: MAN ROLL OUT ONLY
      simVarIsActive: this.fws.rollOutFault,
    },
    220200010: {
      // APPR 1 ONLY
      simVarIsActive: this.fws.land2Inop,
    },
    270200003: {
      // F/CTL BKUP CTL ACTIVE
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.directLawCondition,
        this.fws.allPrimFailed,
        this.fws.allSecFaultCondition,
      ),
    },
    270200004: {
      // AUDIOS NOT AVAIL : WINDHSHEAR, SPEED SPEED
      simVarIsActive: this.fws.fcdc12FaultCondition,
    },
    270200005: {
      // F/CTL INDICATIONS LOST
      simVarIsActive: this.fws.fcdc12FaultCondition,
    },
    340200002: {
      // ALTN LAW : PROT LOST
      simVarIsActive: this.fws.altnLawCondition,
    },
    340200004: {
      // DIRECT LAW : PROT LOST
      simVarIsActive: this.fws.directLawCondition,
    },
  };

  public destroy(): void {
    this.subscriptions.forEach((sub) => sub.destroy());

    for (const key in this.info) {
      const element = this.info[key];

      if ('destroy' in element.simVarIsActive) {
        element.simVarIsActive.destroy();
      }
    }
  }
}
