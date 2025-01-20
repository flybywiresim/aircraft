//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { EventBus, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { OIT } from 'instruments/src/OIT/OIT';
import { OitFltOpsMenuPage } from 'instruments/src/OIT/pages/flt-ops/OitFltOpsMenuPage';
import { OitFltOpsPerformance } from 'instruments/src/OIT/pages/flt-ops/OitFltOpsPerformance';
import { OitFltOpsStatus } from 'instruments/src/OIT/pages/flt-ops/OitFltOpsStatus';
import { OitNotFound } from 'instruments/src/OIT/pages/OitNotFound';

// Page imports
// eslint-disable-next-line jsdoc/require-jsdoc
export function pageForUrl(url: string, bus: EventBus, oit: OIT): VNode {
  switch (url) {
    case 'flt-ops':
      return <OitFltOpsMenuPage bus={bus} oit={oit} />;
    case 'flt-ops/sts':
      return <OitFltOpsStatus bus={bus} oit={oit} />;
    case 'flt-ops/to-perf':
      return <OitFltOpsPerformance bus={bus} oit={oit} />;
    case 'flt-ops/ldg-perf':
      return <OitFltOpsPerformance bus={bus} oit={oit} />;

    default:
      return <OitNotFound bus={bus} oit={oit} />;
  }
}
