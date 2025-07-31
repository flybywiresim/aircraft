// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { SyncedSettingDefinition } from '@flybywiresim/flypad';
import { A380X_DEFAULT_RADIO_AUTO_CALL_OUTS } from 'shared/src/AutoCallOuts';

export const a380xSyncedSettings: SyncedSettingDefinition[] = [
  {
    configKey: 'CONFIG_A380X_FWC_RADIO_AUTO_CALL_OUT_PINS',
    localVarName: 'L:A380X_FWC_RADIO_AUTO_CALL_OUT_PINS',
    defaultValue: A380X_DEFAULT_RADIO_AUTO_CALL_OUTS.toString(),
  },
];
