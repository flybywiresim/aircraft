// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EcamInfos } from '../../../instruments/src/MsfsAvionicsCommon/EcamMessages';
import { Subscribable } from '@microsoft/msfs-sdk';
import { FwsCore } from 'systems-host/systems/FlightWarningSystem/FwsCore';

interface FwsInfoItem {
  /** INFO line is active */
  simVarIsActive: Subscribable<boolean>;
  /** This line won't be shown if the following line(s) are active */
  notActiveWhenItemActive?: (keyof typeof EcamInfos)[];
}

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
