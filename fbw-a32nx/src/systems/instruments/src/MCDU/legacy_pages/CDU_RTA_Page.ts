import { FlightPlanLeg } from '@microsoft/msfs-sdk';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FmgcFlightPhase } from '@shared/flightphase';
import { CDUVerticalRevisionPage } from './A320_Neo_CDU_VerticalRevisionPage';
import { Column, FormatTemplate } from '../legacy/A320_Neo_CDU_Format';
import { VerticalWaypointPrediction } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';

export class CduRtaPage {
  static readonly RtaHeaderColumn = new Column(12, 'RTA');

  static readonly EttHeaderColumn = new Column(0, 'ETT');

  static readonly returnColumn = new Column(23, 'RETURN>');

  static ShowPage(
    mcdu: LegacyFmsPageInterface,
    waypoint: FlightPlanLeg,
    index: number,
    verticalWaypoint: VerticalWaypointPrediction,
  ): void {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.RTAPage;
    const isPreFlight = mcdu.flightPhaseManager.phase === FmgcFlightPhase.Preflight;
    const ett = mcdu.flightPlanService.active.performanceData.estimatedTakeoffTime.get();
    const rtaExists = ett != null;
    const rtaCell = isPreFlight ? (rtaExists ? `${this.formatTime(ett)}` : '[\xa0\xa0\xa0\xa0\xa0\xa0]*') : '';
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
        mcdu.setEstimatedTakeoffTime(value);
      }
    };
    mcdu.onLeftInput[5] = () => {
      CDUVerticalRevisionPage.ShowPage(mcdu, waypoint, index, verticalWaypoint);
    };
  }

  private static formatTime(secondsSinceMidnight: number): string {
    const date = new Date(secondsSinceMidnight);
    return (
      date.getHours().toString().padStart(2, '0') +
      ':' +
      date.getMinutes().toString().padStart(2, '0') +
      ':' +
      date.getSeconds().toString().padStart(2, '0')
    );
  }
}
