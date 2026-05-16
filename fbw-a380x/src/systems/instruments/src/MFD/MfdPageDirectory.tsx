import { EventBus, FSComponent, Subscribable, VNode } from '@microsoft/msfs-sdk';
import {
  fmsActivePagePrefix,
  fmsSec1PagePrefix,
  fmsSec2PagePrefix,
  fmsSec3PagePrefix,
  flightPlanUriPage,
  lateralRevisionHoldPage,
  dataStatusUri,
  fuelAndLoadPage,
  performancePage,
  initPage,
  verticalRevisionPage,
  departurePage,
  arrivalPage,
  airwaysPage,
  secIndexPageUri,
  windPage,
  activeFlightPlanPageUri,
  activeFlightPlanFuelAndLoadUri,
  activeFlightPlanHoldUri,
  fixInfoUri,
  dirToUri,
} from './shared/utils';

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
import { MfdSurvControls } from 'instruments/src/MFD/pages/SURV/MfdSurvControls';
import { MfdFmsFplnFixInfo } from './pages/FMS/F-PLN/MfdFmsFplnFixInfo';
import { MfdFmsPositionMonitor } from './pages/FMS/POSITION/MfdFmsPositionMonitor';
import { MfdSurvStatusSwitching } from 'instruments/src/MFD/pages/SURV/MfdSurvStatusSwitching';
import { MfdFmsDataAirport } from 'instruments/src/MFD/pages/FMS/DATA/MfdFmsDataAirport';
import { AtcDatalinkSystem } from './ATCCOM/AtcDatalinkSystem';
import { MfdFmsSecIndex } from './pages/FMS/SEC/MfdFmsSecIndex';
import { MfdFmsWindPage } from './pages/FMS/MfdFmsWindPage';

export function pageForUrl(
  url: string,
  bus: EventBus,
  mfd: FmsDisplayInterface & MfdDisplayInterface,
  fmcService: FmcServiceInterface,
  atcService: AtcDatalinkSystem,
): VNode {
  switch (url) {
    case fmsActivePagePrefix + performancePage:
    case fmsSec1PagePrefix + performancePage:
    case fmsSec2PagePrefix + performancePage:
    case fmsSec3PagePrefix + performancePage:
      return (
        <MfdFmsPerf
          pageTitle="PERF"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case fmsActivePagePrefix + initPage:
    case fmsSec1PagePrefix + initPage:
    case fmsSec2PagePrefix + initPage:
    case fmsSec3PagePrefix + initPage:
      return (
        <MfdFmsInit
          pageTitle="INIT"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case fmsActivePagePrefix + windPage:
    case fmsSec1PagePrefix + windPage:
    case fmsSec2PagePrefix + windPage:
      return (
        <MfdFmsWindPage
          pageTitle="WIND"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case fmsActivePagePrefix + fuelAndLoadPage:
    case activeFlightPlanFuelAndLoadUri:
    case fmsSec1PagePrefix + fuelAndLoadPage:
    case fmsSec2PagePrefix + fuelAndLoadPage:
    case fmsSec3PagePrefix + fuelAndLoadPage:
      return (
        <MfdFmsFuelLoad
          pageTitle="FUEL&LOAD"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case activeFlightPlanPageUri:
    case fmsSec1PagePrefix + flightPlanUriPage:
    case fmsSec2PagePrefix + flightPlanUriPage:
    case fmsSec3PagePrefix + flightPlanUriPage:
      return (
        <MfdFmsFpln
          pageTitle="F-PLN"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case fmsActivePagePrefix + airwaysPage:
    case fmsSec1PagePrefix + airwaysPage:
    case fmsSec2PagePrefix + airwaysPage:
    case fmsSec3PagePrefix + airwaysPage:
      return (
        <MfdFmsFplnAirways
          pageTitle="F-PLN/AIRWAYS"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case fmsActivePagePrefix + departurePage:
    case fmsSec1PagePrefix + departurePage:
    case fmsSec2PagePrefix + departurePage:
    case fmsSec3PagePrefix + departurePage:
      return (
        <MfdFmsFplnDep
          pageTitle="F-PLN/DEPARTURE"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case fmsActivePagePrefix + arrivalPage:
    case fmsSec1PagePrefix + arrivalPage:
    case fmsSec2PagePrefix + arrivalPage:
    case fmsSec3PagePrefix + arrivalPage:
      return (
        <MfdFmsFplnArr
          pageTitle="F-PLN/ARRIVAL"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case dirToUri:
      return (
        <MfdFmsFplnDirectTo
          pageTitle="F-PLN/DIRECT-TO"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case fmsActivePagePrefix + verticalRevisionPage:
    case fmsSec1PagePrefix + verticalRevisionPage:
    case fmsSec2PagePrefix + verticalRevisionPage:
    case fmsSec3PagePrefix + verticalRevisionPage:
      return (
        <MfdFmsFplnVertRev
          pageTitle="F-PLN/VERT REV"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case activeFlightPlanHoldUri:
    case fmsSec1PagePrefix + lateralRevisionHoldPage:
    case fmsSec2PagePrefix + lateralRevisionHoldPage:
    case fmsSec3PagePrefix + lateralRevisionHoldPage:
      return (
        <MfdFmsFplnHold
          pageTitle="F-PLN/HOLD"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case fixInfoUri:
      return (
        <MfdFmsFplnFixInfo
          pageTitle="F-PLN/FIX INFO"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case secIndexPageUri:
      return (
        <MfdFmsSecIndex
          pageTitle="SEC INDEX"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case 'fms/position/monitor':
      return (
        <MfdFmsPositionMonitor
          pageTitle="MONITOR"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case 'fms/position/irs':
      return (
        <MfdFmsPositionIrs
          pageTitle="IRS"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case 'fms/position/navaids':
      return (
        <MfdFmsPositionNavaids
          pageTitle="NAVAIDS"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case dataStatusUri:
      return (
        <MfdFmsDataStatus
          pageTitle="STATUS"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case 'fms/data/airport':
      return (
        <MfdFmsDataAirport
          pageTitle="AIRPORT"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case 'surv/controls':
      return (
        <MfdSurvControls
          pageTitle="CONTROLS"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case 'surv/status-switching':
      return (
        <MfdSurvStatusSwitching
          pageTitle="STATUS & SWITCHING"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case 'atccom/connect':
      return (
        <MfdAtccomConnect
          pageTitle=""
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case 'atccom/msg-record':
      return (
        <MfdAtccomMsgRecord
          pageTitle="MSG RECORD"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case 'atccom/msg-record/all-msg':
      return (
        <MfdAtccomMsgRecordAll
          pageTitle="MSG RECORD/ALL MSG"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case 'atccom/msg-record/monitored-msg':
      return (
        <MfdAtccomMsgRecordMonitored
          pageTitle="MSG RECORD/MONITORED MSG"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case 'atccom/msg-record/all-msg-expand':
      return (
        <MfdAtccomMsgRecordExpand
          pageTitle="MSG RECORD/ALL MSG/EXPAND"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
    case 'atccom/d-atis/list':
      return <MfdAtccomDAtis pageTitle="D-ATIS/LIST" bus={bus} mfd={mfd} atcService={atcService} />;
    case 'atccom/d-atis/received':
      return <MfdAtccomDAtisReceived pageTitle="D-ATIS/RECEIVED" bus={bus} mfd={mfd} atcService={atcService} />;

    default:
      return (
        <MfdNotFound
          pageTitle="NOT FOUND"
          bus={bus}
          mfd={mfd}
          fmcService={fmcService}
          flightPlanInterface={fmcService.master.flightPlanInterface}
        />
      );
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
