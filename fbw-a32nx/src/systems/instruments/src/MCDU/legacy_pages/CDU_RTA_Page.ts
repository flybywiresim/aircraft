// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FmgcFlightPhase } from '@shared/flightphase';
import { CDUVerticalRevisionPage } from './A320_Neo_CDU_VerticalRevisionPage';
import { Column, FormatTemplate } from '../legacy/A320_Neo_CDU_Format';
import { VerticalWaypointPrediction } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { FmsFormatters } from '../legacy/FmsFormatters';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';

export class CduRtaPage {
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
    const ett = flightplan.performanceData.estimatedTakeoffTime.get();
    const ettExists = ett !== null && !flightplan.performanceData.estimatedTakeoffTimeExpired.get();

    // Regular updating due to expiration of ETT
    if (ettExists) {
      mcdu.SelfPtr = setTimeout(() => {
        if (mcdu.page.Current === mcdu.page.RTAPage) {
          CduRtaPage.ShowPage(mcdu, waypoint, index, verticalWaypoint, forplan);
        }
      }, mcdu.PageTimeout.Slow);
    }

    const allowEtt = isPreFlight || !flightplan.isActiveOrCopiedFromActive();
    const ettCell = allowEtt
      ? ettExists
        ? `${FmsFormatters.secondsTohhmmss(ett % 86400)}`
        : '*[\xa0\xa0\xa0\xa0\xa0]'
      : '';
    mcdu.setTemplate(
      FormatTemplate([
        [
          new Column(
            0,
            (flightplan.index === FlightPlanIndex.FirstSecondary ? 'SEC' : '').padEnd(10, '\xa0') + 'RTA',
            Column.white,
          ),
        ],
        [new Column(1, 'AT WPT' + '\xa0'.repeat(3) + 'DIST' + '\xa0'.repeat(6) + 'RTA', Column.inop)],
        [new Column(0, '[\xa0\xa0\xa0\xa0\xa0]' + '\xa0'.repeat(9) + '[\xa0\xa0\xa0\xa0\xa0]*', Column.inop)],
        [new Column(1, 'ACCUR' + '\xa0'.repeat(14) + 'ETA', Column.inop)],
        [new Column(0, '*10/30' + '\xa0'.repeat(10) + '--:--:--', Column.inop)],
        [new Column(1, allowEtt ? 'ETT' : '', Column.white)],
        [new Column(0, ettCell, ettExists ? Column.magenta : Column.cyan)],
        [new Column(1, 'VMAX', Column.inop)],
        [new Column(0, '.80/340', Column.inop)],
        [new Column(1, 'RELIABLE RTA', Column.inop)],
        [new Column(0, '--:--:--/--:--:--', Column.inop)],
        [],
        [this.returnColumn],
      ]),
    );

    mcdu.onLeftInput[2] = (value) => {
      if (allowEtt) {
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
