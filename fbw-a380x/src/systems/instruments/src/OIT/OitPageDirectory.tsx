//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { EventBus, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { OitFltOpsEfbOverlay } from './Pages/flt-ops/OitFltOpsEfbOverlay';
import { OitFltOpsMenuPage } from './Pages/flt-ops/OitFltOpsMenuPage';
import { OitFltOpsPerformance } from './Pages/flt-ops/OitFltOpsPerformance';
import { OitFltOpsStatus } from './Pages/flt-ops/OitFltOpsStatus';
import { OitNotFound } from './Pages/OitNotFound';
import { OitUiService } from './OitUiService';
import { OitFltOpsContainer } from './OitFltOpsContainer';
import { OitAvncsContainer } from './OitAvncsContainer';
import { OitAvncsCompanyCom } from './Pages/nss-avncs/OitAvncsCompanyCom';
import { OitAvncsMenu } from './Pages/nss-avncs/OitAvncsMenu';

// Page imports
// eslint-disable-next-line jsdoc/require-jsdoc
export function fltOpsPageForUrl(
  url: string,
  bus: EventBus,
  uiService: OitUiService,
  container: OitFltOpsContainer,
): VNode {
  switch (url) {
    case 'flt-ops':
      return <OitFltOpsMenuPage bus={bus} uiService={uiService} container={container} />;
    case 'flt-ops/sts':
      return <OitFltOpsStatus bus={bus} uiService={uiService} container={container} />;
    case 'flt-ops/to-perf':
      return <OitFltOpsPerformance bus={bus} uiService={uiService} container={container} />;
    case 'flt-ops/ldg-perf':
      return <OitFltOpsPerformance bus={bus} uiService={uiService} container={container} />;
    case 'flt-ops/charts':
      return <OitFltOpsEfbOverlay bus={bus} uiService={uiService} container={container} />;
    case 'flt-ops/flt-folder':
      return <OitFltOpsEfbOverlay bus={bus} uiService={uiService} container={container} />;

    default:
      return <OitNotFound uiService={uiService} />;
  }
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function avncsPageForUrl(
  url: string,
  bus: EventBus,
  uiService: OitUiService,
  container: OitAvncsContainer,
): VNode {
  switch (url) {
    case 'nss-avncs':
      return <OitAvncsMenu bus={bus} uiService={uiService} container={container} />;
    case 'nss-avncs/company-com':
      return <OitAvncsCompanyCom bus={bus} uiService={uiService} container={container} />;

    default:
      return <OitNotFound uiService={uiService} />;
  }
}
