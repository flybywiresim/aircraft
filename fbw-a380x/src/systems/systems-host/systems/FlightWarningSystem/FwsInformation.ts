// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EcamInfos } from '../../../instruments/src/MsfsAvionicsCommon/EcamMessages';
import { FwsCore, FwsSuppressableItem } from 'systems-host/systems/FlightWarningSystem/FwsCore';

export interface FwsInfoItem extends FwsSuppressableItem {}

export interface FwsInfoDict {
  [key: keyof typeof EcamInfos]: FwsInfoItem;
}

export class FwsInformation {
  constructor(private fws: FwsCore) {}
  /** INFO shown on SD */
  info: FwsInfoDict = {
    220200005: {
      // LAND 3 SINGLE ONLY
      simVarIsActive: this.fws.ilsCat3DualInop,
    },
  };
}
