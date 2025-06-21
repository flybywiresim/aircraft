// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EcamInopSys } from '../../../instruments/src/MsfsAvionicsCommon/EcamMessages';
import { MappedSubject, Subscribable, SubscribableMapFunctions } from '@microsoft/msfs-sdk';
import { FwsCore } from 'systems-host/systems/FlightWarningSystem/FwsCore';

enum FwsInopSysPhases {
  AllPhases,
  ApprLdg,
}

interface FwsInopSysItem {
  /** INOP SYS line is active */
  simVarIsActive: Subscribable<boolean>;
  /** This line won't be shown if the following line(s) are active */
  notActiveWhenItemActive?: (keyof typeof EcamInopSys)[];
  /** Relevant phase shown on SD/EWD: ALL PHASES or APPR & LDG */
  phase: FwsInopSysPhases;
  /** Only to be shown under REDUND LOSS on MORE page */
  redudancyLoss?: boolean;
}

export interface FwsInopSysDict {
  [key: keyof typeof EcamInopSys]: FwsInopSysItem;
}

export class FwsInopSys {
  constructor(private fws: FwsCore) {}
  /** INOP SYS shown on SD */
  ewdInopSys: FwsInopSysDict = {
    221300001: {
      simVarIsActive: this.fws.fmcAFault,
      phase: FwsInopSysPhases.AllPhases,
      redudancyLoss: true,
    },
    221300002: {
      simVarIsActive: this.fws.fmcBFault,
      phase: FwsInopSysPhases.AllPhases,
      redudancyLoss: true,
    },
    221300003: {
      simVarIsActive: this.fws.fmcCFault,
      phase: FwsInopSysPhases.AllPhases,
      redudancyLoss: true,
    },
    221300004: {
      simVarIsActive: this.fws.fms1Fault,
      notActiveWhenItemActive: ['221300006'],
      phase: FwsInopSysPhases.AllPhases,
    },
    221300005: {
      simVarIsActive: this.fws.fms2Fault,
      notActiveWhenItemActive: ['221300006'],
      phase: FwsInopSysPhases.AllPhases,
    },
    221300006: {
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.fms1Fault, this.fws.fms2Fault),
      phase: FwsInopSysPhases.AllPhases,
    },
  };
}
