import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FmgcFlightPhase } from '@shared/flightphase';
import { CDUVerticalRevisionPage } from './A320_Neo_CDU_VerticalRevisionPage';
import { Column, FormatTemplate } from '../legacy/A320_Neo_CDU_Format';
import { VerticalWaypointPrediction } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { FmsFormatters } from '../legacy/FmsFormatters';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';

export class CduRtaPage {
  static readonly RtaHeaderColumn = new Column(12, 'RTA');

  static readonly EttHeaderColumn = new Column(0, 'ETT');

  static readonly returnColumn = new Column(0, 'RETURN>');

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
    const ett = mcdu.flightPlanService.active.performanceData.estimatedTakeoffTime.get();
    const rtaExists = ett != null;
    const rtaCell = isPreFlight
      ? rtaExists
        ? `${FmsFormatters.secondsTohhmmss(ett)}`
        : '[\xa0\xa0\xa0\xa0\xa0\xa0]*'
      : '';
    mcdu.setTemplate(
      FormatTemplate([
        [this.RtaHeaderColumn],
        [],
        [],
        [],
        [],
        [this.EttHeaderColumn],
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
      if (isPreFlight) {
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
