// @ts-strict-ignore
// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FmgcFlightPhase } from '@shared/flightphase';
import { A320_Neo_CDU_AirwaysFromWaypointPage } from './A320_Neo_CDU_AirwaysFromWaypointPage';
import { CDUAvailableArrivalsPage } from './A320_Neo_CDU_AvailableArrivalsPage';
import { CDUAvailableDeparturesPage } from './A320_Neo_CDU_AvailableDeparturesPage';
import { CDUFixInfoPage } from './A320_Neo_CDU_FixInfoPage';
import { CDUFlightPlanPage } from './A320_Neo_CDU_FlightPlanPage';
import { CDUHoldAtPage } from './A320_Neo_CDU_HoldAtPage';
import { CDUInitPage } from './A320_Neo_CDU_InitPage';
import { NXFictionalMessages } from '../messages/NXSystemMessages';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

export class CDULateralRevisionPage {
  /**
   *
   * @param mcdu
   * @param leg {FlightPlanLeg}
   * @param legIndexFP
   * @constructor
   */
  static ShowPage(
    mcdu: LegacyFmsPageInterface,
    leg,
    legIndexFP,
    forPlan = FlightPlanIndex.Active,
    inAlternate = false,
  ) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.LateralRevisionPage;

    const plan = mcdu.getFlightPlan(forPlan);
    const targetPlan = inAlternate ? plan.alternateFlightPlan : plan;
    const isActivePlan = forPlan === FlightPlanIndex.Active;

    const isPpos = leg === undefined || (legIndexFP === 0 && leg !== targetPlan.originLeg);
    const isFrom = legIndexFP === targetPlan.fromLegIndex && isActivePlan && !inAlternate;
    const isDeparture = legIndexFP === targetPlan.originLegIndex && !isPpos; // TODO this is bogus... compare icaos
    const isDestination = legIndexFP === targetPlan.destinationLegIndex && !isPpos; // TODO this is bogus... compare icaos
    const isWaypoint = !isDeparture && !isDestination && !isPpos;
    const isManual = leg && leg.isVectors();

    let waypointIdent = isPpos ? 'PPOS' : '---';
    let coordinates = '';
    if (leg && leg.definition && leg.definition.waypoint && leg.definition.waypoint.location) {
      const lat = CDUInitPage.ConvertDDToDMS(leg.definition.waypoint.location['lat'], false);
      const long = CDUInitPage.ConvertDDToDMS(leg.definition.waypoint.location['long'], true);
      coordinates = `${lat.deg}°${lat.min}.${Math.ceil(Number(lat.sec / 100))}${lat.dir}/${long.deg}°${long.min}.${Math.ceil(Number(long.sec / 100))}${long.dir}${isActivePlan ? '[color]green' : ''}`;
    }

    if (leg) {
      if (isDestination && targetPlan.destinationRunway) {
        waypointIdent = targetPlan.destinationRunway.ident;
      } else {
        waypointIdent = leg.ident;
      }
    }

    let departureCell = '';
    if (isDeparture) {
      departureCell = '<DEPARTURE';
      mcdu.leftInputDelay[0] = () => {
        return mcdu.getDelaySwitchPage();
      };
      mcdu.onLeftInput[0] = () => {
        CDUAvailableDeparturesPage.ShowPage(mcdu, targetPlan.originAirport, -1, false, forPlan, inAlternate);
      };
    }

    let arrivalFixInfoCell = '';
    if (isDestination) {
      arrivalFixInfoCell = 'ARRIVAL>';
      mcdu.rightInputDelay[0] = () => {
        return mcdu.getDelaySwitchPage();
      };
      mcdu.onRightInput[0] = () => {
        CDUAvailableArrivalsPage.ShowPage(mcdu, targetPlan.destinationAirport, 0, false, forPlan, inAlternate);
      };
    } else if (isActivePlan && (isDeparture || isPpos || isFrom)) {
      arrivalFixInfoCell = 'FIX INFO>';
      mcdu.onRightInput[0] = () => {
        CDUFixInfoPage.ShowPage(mcdu);
      };
    }

    let crossingLabel = '';
    let crossingCell = '';
    if (!isDestination) {
      crossingLabel = 'LL XING/INCR/NO[color]inop';
      crossingCell = '[{sp}{sp}]°/[{sp}]°/[][color]inop';
    }

    let offsetCell = '';
    if (isDeparture || isWaypoint) {
      offsetCell = '<OFFSET[color]inop';
    }

    let nextWptLabel = '';
    let nextWpt = '';
    const isPreflight = mcdu.flightPhaseManager.phase === FmgcFlightPhase.Preflight;
    if ((isDeparture && isPreflight) || (isWaypoint && !isManual) || isDestination) {
      nextWptLabel = 'NEXT WPT{sp}';
      nextWpt = '[{sp}{sp}{sp}{sp}][color]cyan';

      mcdu.onRightInput[2] = async (value, scratchpadCallback) => {
        mcdu.insertWaypoint(value, forPlan, inAlternate, legIndexFP, false, (success) => {
          if (!success) {
            scratchpadCallback();
          }
          CDUFlightPlanPage.ShowPage(mcdu, 0, false, forPlan);
        });
      };
    }

    let holdCell = '';
    if (isWaypoint) {
      holdCell = '<HOLD';
      mcdu.leftInputDelay[2] = () => {
        return mcdu.getDelaySwitchPage();
      };
      mcdu.onLeftInput[2] = () => {
        const nextLeg = targetPlan.maybeElementAt(legIndexFP + 1);

        if (nextLeg && nextLeg.isDiscontinuity === false && nextLeg.isHX()) {
          CDUHoldAtPage.ShowPage(mcdu, legIndexFP + 1, forPlan, inAlternate);
        } else {
          CDUHoldAtPage.ShowPage(mcdu, legIndexFP, forPlan, inAlternate);
        }
      };
    }

    let enableAltnLabel = '';
    let enableAltnCell = '';
    if (!isDeparture && !inAlternate && plan.alternateDestinationAirport) {
      enableAltnLabel = '{sp}ENABLE[color]cyan';
      enableAltnCell = '{ALTN[color]cyan';

      mcdu.leftInputDelay[3] = () => {
        return mcdu.getDelaySwitchPage();
      };
      mcdu.onLeftInput[3] = async () => {
        const cruiseLevel = mcdu.computeAlternateCruiseLevel(forPlan);

        try {
          await mcdu.flightPlanService.enableAltn(legIndexFP, cruiseLevel, forPlan);
        } catch (e) {
          console.error(e);
          mcdu.logTroubleshootingError(e);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
        }

        CDUFlightPlanPage.ShowPage(mcdu, 0, false, forPlan);
      };
    }

    let newDestLabel = '';
    let newDestCell = '';
    if (!isDestination && !isPpos && !isManual) {
      newDestLabel = 'NEW DEST{sp}';
      newDestCell = '[{sp}{sp}][color]cyan';

      mcdu.onRightInput[3] = async (value) => {
        await mcdu.flightPlanService.newDest(legIndexFP, value, forPlan, inAlternate);

        CDUFlightPlanPage.ShowPage(mcdu, 0, false, forPlan);
      };
    }

    let airwaysCell = '';
    if (isWaypoint) {
      airwaysCell = 'AIRWAYS>';
      mcdu.rightInputDelay[4] = () => {
        return mcdu.getDelaySwitchPage();
      };
      mcdu.onRightInput[4] = () => {
        A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, legIndexFP, undefined, undefined, forPlan, inAlternate);
      };
    }

    let altnCell = '';
    if (isDestination) {
      altnCell = '<ALTN[color]inop';
    }

    const titleCell =
      forPlan >= FlightPlanIndex.FirstSecondary
        ? `SEC LAT REV{small} FROM {end}${waypointIdent.padEnd(7, '\xa0')}`
        : `LAT REV{small} FROM {end}{green}${waypointIdent}{end}`;

    mcdu.setTemplate([
      [titleCell],
      ['', '', coordinates],
      [departureCell, arrivalFixInfoCell],
      ['', crossingLabel],
      [offsetCell, crossingCell],
      ['', nextWptLabel],
      [holdCell, nextWpt],
      [enableAltnLabel, newDestLabel],
      [enableAltnCell, newDestCell],
      [''],
      [altnCell, airwaysCell],
      [''],
      ['<RETURN'],
    ]);
    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onLeftInput[5] = () => {
      mcdu.returnPageCallback();
    };
  }
}
