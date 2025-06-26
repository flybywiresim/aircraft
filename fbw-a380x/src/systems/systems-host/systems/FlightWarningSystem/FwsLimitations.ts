// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EcamLimitations } from '../../../instruments/src/MsfsAvionicsCommon/EcamMessages';
import { Subscribable } from '@microsoft/msfs-sdk';
import { FwsCore } from 'systems-host/systems/FlightWarningSystem/FwsCore';

enum FwsLimitationsPhases {
  AllPhases,
  ApprLdg,
}

interface FwsLimitationsItem {
  /** LIMITATIONS line is active */
  simVarIsActive: Subscribable<boolean>;
  /** This line won't be shown if the following line(s) are active */
  notActiveWhenItemActive?: (keyof typeof EcamLimitations)[];
  /** Relevant phase shown on SD/EWD: ALL PHASES or APPR & LDG */
  phase: FwsLimitationsPhases;
}

export interface FwsLimitationsDict {
  [key: keyof typeof EcamLimitations]: FwsLimitationsItem;
}

export class FwsLimitations {
  constructor(private fws: FwsCore) {}
  /** LIMITATIONS shown on SD */
  limitations: FwsLimitationsDict = {};
}
