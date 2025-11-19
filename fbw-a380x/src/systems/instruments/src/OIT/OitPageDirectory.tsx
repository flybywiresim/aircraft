//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { EventBus, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { OitFltOpsEfbOverlay } from './Pages/FltOps/OitFltOpsEfbOverlay';
import { OitFltOpsMenuPage } from './Pages/FltOps/OitFltOpsMenuPage';
import { OitFltOpsPerformance } from './Pages/FltOps/OitFltOpsPerformance';
import { OitFltOpsStatus } from './Pages/FltOps/OitFltOpsStatus';
import { OitNotFound } from './Pages/OitNotFound';
import { OitUiService } from './OitUiService';
import { OitFltOpsContainer } from './OitFltOpsContainer';
import { OitAvncsContainer } from './OitAvncsContainer';
import { OitAvncsCompanyCom } from './Pages/NssAvncs/CompanyCom/OitAvncsCompanyCom';
import { OitAvncsMenu } from './Pages/NssAvncs/OitAvncsMenu';
import { OitAvncsCompanyComFlightLog } from './Pages/NssAvncs/CompanyCom/OitAvncsCompanyComFlightLog';
import { OitAvncsCompanyComInbox } from './Pages/NssAvncs/CompanyCom/OitAvncsCompanyComInbox';
import { OitAvncsFbwSystems } from './Pages/NssAvncs/FbwSystems/OitAvncsFbwSystems';
import { OitAvncsFbwSystemsGenericDebug } from './Pages/NssAvncs/FbwSystems/OitAvncsFbwSystemsGenericDebug';
import { OitAvncsFbwSystemsAppLdgCap } from './Pages/NssAvncs/FbwSystems/OitAvncsFbwSystemsAppLdgCap';

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
    case 'nss-avncs/a380x-systems':
      return <OitAvncsFbwSystems bus={bus} uiService={uiService} container={container} />;

    default:
      return <OitNotFound uiService={uiService} />;
  }
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function avncsCompanyComPageForUrl(
  url: string,
  bus: EventBus,
  uiService: OitUiService,
  container: OitAvncsContainer,
): VNode {
  switch (url) {
    case 'nss-avncs/company-com/inbox':
      return <OitAvncsCompanyComInbox bus={bus} uiService={uiService} container={container} />;
    case 'nss-avncs/company-com/pre-flight/flight-log':
      return <OitAvncsCompanyComFlightLog bus={bus} uiService={uiService} container={container} />;
    case 'nss-avncs/company-com/in-flight/flight-log':
      return <OitAvncsCompanyComFlightLog bus={bus} uiService={uiService} container={container} />;
    case 'nss-avncs/company-com/post-flight/flight-log':
      return <OitAvncsCompanyComFlightLog bus={bus} uiService={uiService} container={container} />;

    default:
      return <OitNotFound uiService={uiService} />;
  }
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function avncsFbwSystemsPageForUrl(
  url: string,
  bus: EventBus,
  uiService: OitUiService,
  container: OitAvncsContainer,
): VNode {
  switch (url) {
    case 'nss-avncs/a380x-systems':
      return <OitAvncsFbwSystems bus={bus} uiService={uiService} container={container} />;
    case 'nss-avncs/a380x-systems/debug-data':
      return (
        <OitAvncsFbwSystemsGenericDebug
          bus={bus}
          uiService={uiService}
          container={container}
          title={'Flight Warning System Debug'}
          controlEventName="a380x_ois_fws_debug_data_enabled"
          dataEventName="a380x_ois_fws_debug_data"
        />
      );
    case 'nss-avncs/a380x-systems/app-ldg-cap':
      return (
        <OitAvncsFbwSystemsAppLdgCap
          bus={bus}
          uiService={uiService}
          container={container}
          title={'Approach & Landing Capability'}
        />
      );

    default:
      return <OitNotFound uiService={uiService} />;
  }
}
