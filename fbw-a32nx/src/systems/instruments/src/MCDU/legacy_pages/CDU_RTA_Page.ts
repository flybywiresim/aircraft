import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FmgcFlightPhase } from '@shared/flightphase';
import { CDUVerticalRevisionPage } from './A320_Neo_CDU_VerticalRevisionPage';
import { Column, FormatTemplate } from '../legacy/A320_Neo_CDU_Format';
import { VerticalWaypointPrediction } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { FmsFormatters } from '../legacy/FmsFormatters';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';

export class CduRtaPage {
  static readonly EttHeaderColumn = new Column(1, 'ETT');

  static readonly returnColumn = new Column(0, '<RETURN');

  static ShowPage(
    mcdu: LegacyFmsPageInterface,
    waypoint: FlightPlanLeg,
    index: number,
    verticalWaypoint: VerticalWaypointPrediction,
    forplan: FlightPlanIndex,
  ): void {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.RTAPage;
    const isPreFlight = mcdu.flightPhaseManager.phase === FmgcFlightPhase.Preflight;
    const flightplan = mcdu.flightPlanService.get(forplan);
    const ett = flightplan.performanceData.estimatedTakeoffDate.get();
    const rtaExists = ett != null && !flightplan.performanceData.estimatedTakeoffTimeExpired.get();

    // Regular updating due to expiration of EET
    if (rtaExists) {
      mcdu.SelfPtr = setTimeout(() => {
        if (mcdu.page.Current === mcdu.page.RTAPage) {
          CduRtaPage.ShowPage(mcdu, waypoint, index, verticalWaypoint, forplan);
        }
      }, mcdu.PageTimeout.Slow);
    }

    const allowRta = isPreFlight || !flightplan.isActiveOrCopiedFromActive();
    const rtaCell = allowRta
      ? rtaExists
        ? `${FmsFormatters.secondsTohhmmss(FmsFormatters.dateToSecondsSinceMidnightUTC(new Date(ett)))}`
        : '*[\xa0\xa0\xa0\xa0\xa0\xa0]'
      : '';
    mcdu.setTemplate(
      FormatTemplate([
        [
          new Column(
            0,
            (flightplan.index === FlightPlanIndex.FirstSecondary ? 'SEC' : '').padEnd(12, '\xa0') + 'RTA',
            Column.white,
          ),
        ],
        [new Column(1, 'AT WPT')],
        [],
        [new Column(1, 'ACCUR'.padEnd(14, '\xa0') + 'ETA', Column.inop)],
        [new Column(0, '*10/30')],
        [new Column(1, allowRta ? 'ETT' : '')],
        [new Column(0, rtaCell, rtaExists ? Column.magenta : Column.cyan)],
        [],
        [],
        [],
        [],
        [],
        [this.returnColumn],
      ]),
    );

    mcdu.onLeftInput[2] = (value) => {
      if (allowRta) {
        mcdu.setEstimatedTakeoffTime(value, forplan);
        CduRtaPage.ShowPage(mcdu, waypoint, index, verticalWaypoint, forplan);
      }
    };
    mcdu.onLeftInput[5] = () => {
      CDUVerticalRevisionPage.ShowPage(
        mcdu,
        waypoint,
        index,
        verticalWaypoint,
        undefined,
        undefined,
        undefined,
        forplan,
      );
    };
  }
}
