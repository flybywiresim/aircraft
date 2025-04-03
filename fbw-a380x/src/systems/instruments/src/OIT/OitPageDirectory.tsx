//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { EventBus, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { OIT } from './OIT';
import { OitFltOpsEfbOverlay } from './Pages/flt-ops/OitFltOpsEfbOverlay';
import { OitFltOpsMenuPage } from './Pages/flt-ops/OitFltOpsMenuPage';
import { OitFltOpsPerformance } from './Pages/flt-ops/OitFltOpsPerformance';
import { OitFltOpsStatus } from './Pages/flt-ops/OitFltOpsStatus';
import { OitNotFound } from './Pages/OitNotFound';

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
    case 'flt-ops/charts':
      return <OitFltOpsEfbOverlay bus={bus} oit={oit} />;
    case 'flt-ops/flt-folder':
      return <OitFltOpsEfbOverlay bus={bus} oit={oit} />;

    default:
      return <OitNotFound bus={bus} oit={oit} />;
  }
}
