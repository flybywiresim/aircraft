// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { CDUInitPage } from './A320_Neo_CDU_InitPage';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { CoRouteUplinkAdapter } from '@fmgc/flightplanning/uplink/CoRouteUplinkAdapter';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

export class CDUAvailableFlightPlanPage {
  static ShowPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex, offset = 0, currentRoute = 1) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.AvailableFlightPlanPage;
    let fromTo = 'NO ORIGIN/DEST';

    const plan = mcdu.flightPlanService.get(forPlan);

    const origin = plan.originAirport;
    const dest = plan.destinationAirport;

    if (origin && dest) {
      fromTo = `${origin.ident}/${dest.ident}`;
    }

    const hasCoRoutes = mcdu.coRoute.routes.length > 0;

    if (hasCoRoutes) {
      const coRoutesListSize = mcdu.coRoute.routes.length;

      // Page Management
      if (currentRoute < 1) {
        currentRoute = coRoutesListSize;
      }
      if (currentRoute > coRoutesListSize) {
        currentRoute = 1;
      }

      const { navlog, routeName } = mcdu.coRoute.routes[currentRoute - 1];

      let scrollText = [];
      const routeArray = [];
      const scrollLimit = 9;
      let columnPos = 0;
      let rowPos = 0;

      // Scroll Text builder
      for (let i = 0; i < navlog.length; i++) {
        const fix = navlog[i];
        const nextFix = navlog[i + 1];

        if (fix.is_sid_star === '1') {
          continue;
        }

        if (['TOP OF CLIMB', 'TOP OF DESCENT'].includes(fix.name)) {
          continue;
        }

        if (!nextFix) {
          continue;
        }

        if (fix.via_airway === 'DCT' && nextFix.via_airway === 'DCT') {
          switch (columnPos) {
            case 1:
              routeArray[rowPos] = [
                '',
                '',
                `${routeArray[rowPos][2]}` +
                  ' ' +
                  `{green}{big}${fix.via_airway.concat('@'.repeat(5 - fix.via_airway.length))}{end}{end}` +
                  ' ' +
                  `{small}${fix.ident.concat('@'.repeat(5 - fix.ident.length))}{end}`,
              ];
              columnPos = 2;
              break;
            case 2:
              routeArray[rowPos] = [
                '',
                '',
                `${routeArray[rowPos][2]}` +
                  ' ' +
                  `{green}{big}${fix.via_airway.concat('@'.repeat(5 - fix.via_airway.length))}{end}`,
              ];
              routeArray[rowPos + 1] = ['', '', `{small}${fix.ident.concat('@'.repeat(5 - fix.ident.length))}{end}`];
              columnPos = 1;
              rowPos++;
              break;
          }

          continue;
        }

        if (nextFix.via_airway !== fix.via_airway) {
          switch (columnPos) {
            case 0:
              routeArray[rowPos] = ['', '', `{small}${fix.ident.concat('@'.repeat(5 - fix.ident.length))}{end}`];
              columnPos = 1;
              break;
            case 1:
              routeArray[rowPos] = [
                '',
                '',
                `${routeArray[rowPos][2]}` +
                  ' ' +
                  `{green}{big}${fix.via_airway.concat('@'.repeat(5 - fix.via_airway.length))}{end}{end}` +
                  ' ' +
                  `{small}${fix.ident.concat('@'.repeat(5 - fix.ident.length))}{end}`,
              ];
              columnPos = 2;
              break;
            case 2:
              routeArray[rowPos] = [
                '',
                '',
                `${routeArray[rowPos][2]}` +
                  ' ' +
                  `{green}{big}${fix.via_airway.concat('@'.repeat(5 - fix.via_airway.length))}{end}{end}`,
              ];
              routeArray[rowPos + 1] = ['', '', `{small}${fix.ident.concat('@'.repeat(5 - fix.ident.length))}{end}`];
              columnPos = 1;
              rowPos++;
              break;
          }
          continue;
        }
      }

      /* row character width management,
             uses @ as a delim for adding spaces in short airways/waypoints */
      routeArray.forEach((line, index) => {
        const excludedLength = line[2].replace(/{small}|{green}|{end}|{big}|/g, '').length;
        if (excludedLength < 23) {
          // Add spaces to make up lack of row width
          const adjustedLine = line[2] + '{sp}'.repeat(23 - excludedLength);
          routeArray[index] = ['', '', adjustedLine];
        }
        // Add spaces for short airways/waypoints smaller than 5 characters
        routeArray[index] = ['', '', routeArray[index][2].replace(/@/g, '{sp}')];
      });

      // Offset Management
      const routeArrayLength = routeArray.length;
      if (offset < 0) {
        offset = 0;
      }
      if (offset > routeArrayLength - 9) {
        offset = routeArrayLength - 9;
      }
      scrollText =
        routeArrayLength > 9
          ? [...routeArray.slice(0 + offset, 9 + offset)]
          : [...routeArray, ...CDUAvailableFlightPlanPage.insertEmptyRows(scrollLimit - routeArray.length)];

      mcdu.setTemplate([
        [`{sp}{sp}{sp}{sp}{sp}ROUTE{sp}{sp}{small}${currentRoute}/${coRoutesListSize}{end}`],
        ['{sp}CO RTE', 'FROM/TO{sp}{sp}'],
        [`${routeName}[color]cyan`, `${fromTo}[color]cyan`],
        ...scrollText,
        ['<RETURN', 'INSERT*[color]amber'],
      ]);

      mcdu.onPrevPage = () => {
        CDUAvailableFlightPlanPage.ShowPage(mcdu, forPlan, 0, currentRoute - 1);
      };
      mcdu.onNextPage = () => {
        CDUAvailableFlightPlanPage.ShowPage(mcdu, forPlan, 0, currentRoute + 1);
      };
      mcdu.onDown = () => {
        //on page down decrement the page offset.
        CDUAvailableFlightPlanPage.ShowPage(mcdu, forPlan, offset - 1, currentRoute);
      };
      mcdu.onUp = () => {
        CDUAvailableFlightPlanPage.ShowPage(mcdu, forPlan, offset + 1, currentRoute);
      };

      mcdu.onLeftInput[5] = () => {
        mcdu.coRoute.routes = [];
        CDUInitPage.ShowPage1(mcdu, forPlan);
      };

      mcdu.onRightInput[5] = () => {
        const selectedRoute = mcdu.coRoute.routes[currentRoute - 1];
        // FIXME This whole thing is very shady. Why is this one object doing a bunch of different things?
        mcdu.coRoute.routeNumber = routeName;
        mcdu.coRoute['originIcao'] = selectedRoute.originIcao;
        mcdu.coRoute['destinationIcao'] = selectedRoute.destinationIcao;
        mcdu.coRoute['route'] = selectedRoute.route;
        if (selectedRoute.alternateIcao) {
          mcdu.coRoute['alternateIcao'] = selectedRoute.alternateIcao;
        }
        mcdu.coRoute['navlog'] = selectedRoute.navlog;
        setTimeout(async () => {
          // TODO sec?
          // FIXME This should not use the uplink functions, as it is not an uplink.
          // Doing so causes an erroneous uplink related scratchpad message.
          await CoRouteUplinkAdapter.uplinkFlightPlanFromCoRoute(
            mcdu,
            FlightPlanIndex.Active,
            mcdu.flightPlanService,
            selectedRoute,
          );
          await mcdu.flightPlanService.uplinkInsert();
          mcdu.setGroundTempFromOrigin(FlightPlanIndex.Active);

          CDUInitPage.ShowPage1(mcdu, forPlan);
        }, 0 /* No delay because it takes long enough without artificial delay */);
      };
    } else {
      mcdu.setTemplate([
        [fromTo],
        [''],
        ['NONE[color]green'],
        [''],
        [''],
        [''],
        [''],
        [''],
        [''],
        [''],
        [''],
        [''],
        ['<RETURN'],
      ]);
    }
    mcdu.onLeftInput[5] = () => {
      CDUInitPage.ShowPage1(mcdu, forPlan);
    };
  }

  static insertEmptyRows(rowsToInsert: number) {
    const array = [];
    for (let i = 0; i < rowsToInsert; i++) {
      array.push(['']);
    }
    return array;
  }
}
