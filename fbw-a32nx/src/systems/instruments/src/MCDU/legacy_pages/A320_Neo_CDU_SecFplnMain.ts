// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { CDUFlightPlanPage } from './A320_Neo_CDU_FlightPlanPage';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { Column, FormatTemplate } from '../legacy/A320_Neo_CDU_Format';
import { CDUInitPage } from './A320_Neo_CDU_InitPage';
import { CDUPerformancePage } from './A320_Neo_CDU_PerformancePage';
import { FlightPlanUtils } from '@fmgc/flightplanning/FlightPlanUtils';
import { NXSystemMessages } from '../messages/NXSystemMessages';

export class CDUSecFplnMain {
  static ShowPage(mcdu: LegacyFmsPageInterface) {
    mcdu.clearDisplay();
    mcdu.activeSystem = 'FMGC';

    mcdu.efisInterfaces.L.setSecRelatedPageOpen(true);
    mcdu.efisInterfaces.R.setSecRelatedPageOpen(true);
    mcdu.onUnload = () => {
      mcdu.efisInterfaces.L.setSecRelatedPageOpen(false);
      mcdu.efisInterfaces.R.setSecRelatedPageOpen(false);
    };

    mcdu.SelfPtr = setTimeout(() => {
      if (mcdu.page.Current === mcdu.page.SecFplnMain) {
        CDUSecFplnMain.ShowPage(mcdu);
      }
    }, mcdu.PageTimeout.Medium);

    const hasSecondary = mcdu.flightPlanService.hasSecondary(1);
    let hasFromTo = false;
    if (hasSecondary) {
      const secPlan = mcdu.flightPlanService.secondary(1);
      hasFromTo = !!secPlan.originAirport && !!secPlan.destinationAirport;
    }

    const deleteSecColumn = new Column(0, '', Column.cyan);

    // <DELETE SEC
    if (hasFromTo) {
      deleteSecColumn.update('{DELETE SEC');

      mcdu.onLeftInput[2] = () => {
        mcdu.flightPlanService.secondaryReset(1);
        CDUSecFplnMain.ShowPage(mcdu);
      };
    }

    const activateSecColumn = new Column(0, '', Column.amber);

    const activePlan = mcdu.flightPlanService.active;

    let canActivateOrSwapSec = false;
    if (hasFromTo) {
      const secPlan = mcdu.flightPlanService.secondary(1);

      const activeToLeg = activePlan.activeLeg;
      const secToLeg = secPlan.activeLeg;

      canActivateOrSwapSec =
        !mcdu.navModeEngaged() ||
        (activeToLeg === undefined && secToLeg === undefined) ||
        (activeToLeg !== undefined &&
          secToLeg !== undefined &&
          FlightPlanUtils.areFlightPlanElementsSame(activeToLeg, secToLeg) &&
          activePlan.activeLegIndex === secPlan.activeLegIndex);
    }

    // *ACTIVATE SEC
    if (canActivateOrSwapSec) {
      activateSecColumn.update('*ACTIVATE SEC');

      mcdu.onLeftInput[3] = (_, scratchpadCallback) => {
        // We should not get here, because the button is not even shown, but the page might not have refreshed yet to reflect
        // the new NAV status
        if (!canActivateOrSwapSec) {
          mcdu.setScratchpadMessage(NXSystemMessages.notAllowedInNav);
          scratchpadCallback();
          return;
        }

        mcdu.flightPlanService.secondaryActivate(1).then(() => {
          mcdu.onSecondaryActivated();
          CDUFlightPlanPage.ShowPage(mcdu);
        });
      };
    }

    // <COPY ACTIVE
    mcdu.onLeftInput[0] = () => {
      mcdu.flightPlanService.secondaryCopyFromActive(1);
      CDUFlightPlanPage.ShowPage(mcdu, 0, FlightPlanIndex.FirstSecondary);
    };

    // INIT>
    mcdu.onRightInput[0] = () => {
      if (!hasSecondary) {
        mcdu.flightPlanService.secondaryInit(1);
      }
      CDUInitPage.ShowPage1(mcdu, FlightPlanIndex.FirstSecondary);
    };

    // <SEC F-PLN
    mcdu.onLeftInput[1] = () => {
      if (!hasSecondary) {
        mcdu.flightPlanService.secondaryInit(1);
      }
      CDUFlightPlanPage.ShowPage(mcdu, 0, FlightPlanIndex.FirstSecondary);
    };

    // PERF>
    const secPerfColumn = new Column(23, '', Column.right);
    if (hasFromTo) {
      secPerfColumn.update('PERF>');

      mcdu.onRightInput[1] = () => {
        CDUPerformancePage.ShowPage(mcdu, FlightPlanIndex.FirstSecondary);
      };
    }

    const secSwapActiveColumn = new Column(0, '', Column.amber);
    if (canActivateOrSwapSec) {
      secSwapActiveColumn.update('*SWAP ACTIVE   ');

      mcdu.onLeftInput[5] = async (_, scratchpadCallback) => {
        // We should not get here, because the button is not even shown, but the page might not have refreshed yet to reflect
        // the new NAV status
        if (!canActivateOrSwapSec) {
          mcdu.setScratchpadMessage(NXSystemMessages.notAllowedInNav);
          scratchpadCallback();
          return;
        }

        await mcdu.flightPlanService.activeAndSecondarySwap(1);
        mcdu.onSecondaryActivated();
        CDUFlightPlanPage.ShowPage(mcdu);
      };
    }

    mcdu.setTemplate(
      FormatTemplate([
        [new Column(7, 'SEC INDEX')],
        [],
        [new Column(0, '{COPY ACTIVE', Column.cyan), new Column(23, 'INIT>', Column.right)],
        [],
        [new Column(0, '<SEC F-PLN'), secPerfColumn],
        [],
        [deleteSecColumn],
        [],
        [activateSecColumn],
        [],
        [],
        [],
        [secSwapActiveColumn],
      ]),
    );
  }
}
