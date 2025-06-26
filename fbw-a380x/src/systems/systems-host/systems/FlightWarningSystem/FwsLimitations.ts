// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EcamLimitations } from '../../../instruments/src/MsfsAvionicsCommon/EcamMessages';
import { FwsCore, FwsSuppressableItem } from 'systems-host/systems/FlightWarningSystem/FwsCore';

export enum FwsLimitationsPhases {
  AllPhases,
  ApprLdg,
}

export interface FwsLimitationsItem extends FwsSuppressableItem {
  /** Relevant phase shown on SD/EWD: ALL PHASES or APPR & LDG */
  phase: FwsLimitationsPhases;
  /** Shown on PFD */
  pfd: boolean;
}

export interface FwsLimitationsDict {
  [key: keyof typeof EcamLimitations]: FwsLimitationsItem;
}

export class FwsLimitations {
  constructor(private fws: FwsCore) {}
  /** LIMITATIONS shown on SD */
  limitations: FwsLimitationsDict = {};
}
