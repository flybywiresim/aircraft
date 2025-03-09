import { EventBus, FSComponent, Subscribable, VNode } from '@microsoft/msfs-sdk';

// Page imports
import { MfdFmsDataStatus } from 'instruments/src/MFD/pages/FMS/DATA/MfdFmsDataStatus';
import { MfdFmsFplnAirways } from 'instruments/src/MFD/pages/FMS/F-PLN/MfdFmsFplnAirways';
import { MfdFmsFplnArr } from 'instruments/src/MFD/pages/FMS/F-PLN/MfdFmsFplnArr';
import { MfdFmsFplnDep } from 'instruments/src/MFD/pages/FMS/F-PLN/MfdFmsFplnDep';
import { MfdFmsFplnDirectTo } from 'instruments/src/MFD/pages/FMS/F-PLN/MfdFmsFplnDirectTo';
import { MfdFmsFpln } from 'instruments/src/MFD/pages/FMS/F-PLN/MfdFmsFpln';
import { MfdFmsFplnHold } from 'instruments/src/MFD/pages/FMS/F-PLN/MfdFmsFplnHold';
import { MfdFmsFplnVertRev } from 'instruments/src/MFD/pages/FMS/F-PLN/MfdFmsFplnVertRev';
import { MfdFmsFuelLoad } from 'instruments/src/MFD/pages/FMS/MfdFmsFuelLoad';
import { MfdFmsInit } from 'instruments/src/MFD/pages/FMS/MfdFmsInit';
import { MfdNotFound } from 'instruments/src/MFD/pages/FMS/MfdNotFound';
import { MfdFmsPerf } from 'instruments/src/MFD/pages/FMS/MfdFmsPerf';
import { MfdFmsPositionIrs } from 'instruments/src/MFD/pages/FMS/POSITION/MfdFmsPositionIrs';
import { MfdFmsPositionNavaids } from 'instruments/src/MFD/pages/FMS/POSITION/MfdFmsPositionNavaids';
import { MfdAtccomConnect } from 'instruments/src/MFD/pages/ATCCOM/MfdAtccomConnect';
import { MfdAtccomMsgRecord } from 'instruments/src/MFD/pages/ATCCOM/MfdAtccomMsgRecord';
import { MfdAtccomMsgRecordAll } from 'instruments/src/MFD/pages/ATCCOM/MfdAtccomMsgRecordAll';
import { MfdAtccomMsgRecordMonitored } from 'instruments/src/MFD/pages/ATCCOM/MfdAtccomMsgRecordMonitored';
import { MfdAtccomMsgRecordExpand } from 'instruments/src/MFD/pages/ATCCOM/MfdAtccomMsgRecordExpand';
import { MfdAtccomDAtis } from 'instruments/src/MFD/pages/ATCCOM/MfdAtccomDAtis';
import { MfdAtccomDAtisReceived } from 'instruments/src/MFD/pages/ATCCOM/MfdAtccomDAtisReceived';

// Header imports
import { AtccomHeader } from 'instruments/src/MFD/pages/common/AtccomHeader';
import { FcuBkupHeader } from 'instruments/src/MFD/pages/common/FcuBkupHeader';
import { FmsHeader } from 'instruments/src/MFD/pages/common/FmsHeader';
import { SurvHeader } from 'instruments/src/MFD/pages/common/SurvHeader';
import { FmcServiceInterface } from 'instruments/src/MFD/FMC/FmcServiceInterface';
import { FmsDisplayInterface } from '@fmgc/flightplanning/interface/FmsDisplayInterface';
import { MfdDisplayInterface } from 'instruments/src/MFD/MFD';
import { MfdUiService } from 'instruments/src/MFD/pages/common/MfdUiService';
import { MfdFmsDataDebug } from 'instruments/src/MFD/pages/FMS/DATA/MfdFmsDataDebug';
import { MfdSurvControls } from 'instruments/src/MFD/pages/SURV/MfdSurvControls';
import { MfdFmsFplnFixInfo } from './pages/FMS/F-PLN/MfdFmsFplnFixInfo';
import { MfdSurvStatusSwitching } from 'instruments/src/MFD/pages/SURV/MfdSurvStatusSwitching';
import { MfdFmsDataAirport } from 'instruments/src/MFD/pages/FMS/DATA/MfdFmsDataAirport';
import { MfdFmsDataWaypoint } from 'instruments/src/MFD/pages/FMS/DATA/MfdFmsDataWaypoint';

export function pageForUrl(
  url: string,
  bus: EventBus,
  mfd: FmsDisplayInterface & MfdDisplayInterface,
  fmcService: FmcServiceInterface,
): VNode {
  switch (url) {
    case 'fms/active/perf':
    case 'fms/sec1/perf':
    case 'fms/sec2/perf':
    case 'fms/sec3/perf':
      return <MfdFmsPerf pageTitle="PERF" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'fms/active/init':
    case 'fms/sec1/init':
    case 'fms/sec2/init':
    case 'fms/sec3/init':
      return <MfdFmsInit pageTitle="INIT" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'fms/active/fuel-load':
    case 'fms/sec1/fuel-load':
    case 'fms/sec2/fuel-load':
    case 'fms/sec3/fuel-load':
      return <MfdFmsFuelLoad pageTitle="FUEL&LOAD" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'fms/active/f-pln':
    case 'fms/sec1/f-pln':
    case 'fms/sec2/f-pln':
    case 'fms/sec3/f-pln':
      return <MfdFmsFpln pageTitle="F-PLN" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'fms/active/f-pln-airways':
    case 'fms/sec1/f-pln-airways':
    case 'fms/sec2/f-pln-airways':
    case 'fms/sec3/f-pln-airways':
      return <MfdFmsFplnAirways pageTitle="F-PLN/AIRWAYS" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'fms/active/f-pln-departure':
    case 'fms/sec1/f-pln-departure':
    case 'fms/sec2/f-pln-departure':
    case 'fms/sec3/f-pln-departure':
      return <MfdFmsFplnDep pageTitle="F-PLN/DEPARTURE" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'fms/active/f-pln-arrival':
    case 'fms/sec1/f-pln-arrival':
    case 'fms/sec2/f-pln-arrival':
    case 'fms/sec3/f-pln-arrival':
      return <MfdFmsFplnArr pageTitle="F-PLN/ARRIVAL" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'fms/active/f-pln-direct-to':
      return <MfdFmsFplnDirectTo pageTitle="F-PLN/DIRECT-TO" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'fms/active/f-pln-vert-rev':
    case 'fms/sec1/f-pln-vert-rev':
    case 'fms/sec2/f-pln-vert-rev':
    case 'fms/sec3/f-pln-vert-rev':
      return <MfdFmsFplnVertRev pageTitle="F-PLN/VERT REV" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'fms/active/f-pln-hold':
    case 'fms/sec1/f-pln-hold':
    case 'fms/sec2/f-pln-hold':
    case 'fms/sec3/f-pln-hold':
      return <MfdFmsFplnHold pageTitle="F-PLN/HOLD" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'fms/active/f-pln-fix-info':
      return <MfdFmsFplnFixInfo pageTitle="F-PLN/FIX INFO" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'fms/position/irs':
      return <MfdFmsPositionIrs pageTitle="IRS" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'fms/position/navaids':
      return <MfdFmsPositionNavaids pageTitle="NAVAIDS" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'fms/data/status':
      return <MfdFmsDataStatus pageTitle="STATUS" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'fms/data/waypoint':
      return <MfdFmsDataWaypoint pageTitle="WAYPOINT" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'fms/data/debug':
      return <MfdFmsDataDebug pageTitle="DEBUG" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'fms/data/airport':
      return <MfdFmsDataAirport pageTitle="AIRPORT" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'surv/controls':
      return <MfdSurvControls pageTitle="CONTROLS" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'surv/status-switching':
      return <MfdSurvStatusSwitching pageTitle="STATUS & SWITCHING" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'atccom/connect':
      return <MfdAtccomConnect pageTitle="" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'atccom/msg-record':
      return <MfdAtccomMsgRecord pageTitle="MSG RECORD" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'atccom/msg-record/all-msg':
      return <MfdAtccomMsgRecordAll pageTitle="MSG RECORD/ALL MSG" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'atccom/msg-record/monitored-msg':
      return (
        <MfdAtccomMsgRecordMonitored pageTitle="MSG RECORD/MONITORED MSG" bus={bus} mfd={mfd} fmcService={fmcService} />
      );
    case 'atccom/msg-record/all-msg-expand':
      return (
        <MfdAtccomMsgRecordExpand pageTitle="MSG RECORD/ALL MSG/EXPAND" bus={bus} mfd={mfd} fmcService={fmcService} />
      );
    case 'atccom/d-atis/list':
      return <MfdAtccomDAtis pageTitle="D-ATIS/LIST" bus={bus} mfd={mfd} fmcService={fmcService} />;
    case 'atccom/d-atis/received':
      return <MfdAtccomDAtisReceived pageTitle="D-ATIS/RECEIVED" bus={bus} mfd={mfd} fmcService={fmcService} />;

    default:
      return <MfdNotFound pageTitle="NOT FOUND" bus={bus} mfd={mfd} fmcService={fmcService} />;
  }
}

export function headerForSystem(
  sys: string,
  mfd: FmsDisplayInterface & MfdDisplayInterface,
  atcCallsign: Subscribable<string | null>,
  activeFmsSource: Subscribable<'FMS 1' | 'FMS 2' | 'FMS 1-C' | 'FMS 2-C'>,
  uiService: MfdUiService,
): VNode {
  switch (sys) {
    case 'fms':
      return <FmsHeader callsign={atcCallsign} activeFmsSource={activeFmsSource} uiService={uiService} mfd={mfd} />;
    case 'atccom':
      return <AtccomHeader callsign={atcCallsign} activeFmsSource={activeFmsSource} uiService={uiService} mfd={mfd} />;
    case 'surv':
      return <SurvHeader callsign={atcCallsign} activeFmsSource={activeFmsSource} uiService={uiService} mfd={mfd} />;
    case 'fcubkup':
      return <FcuBkupHeader callsign={atcCallsign} activeFmsSource={activeFmsSource} uiService={uiService} mfd={mfd} />;
    default:
      return <FmsHeader callsign={atcCallsign} activeFmsSource={activeFmsSource} uiService={uiService} mfd={mfd} />;
  }
}
