// @ts-strict-ignore
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
import { NXFictionalMessages, NXSystemMessages } from '../messages/NXSystemMessages';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';

export class CDUSecFplnMain {
  static ShowPage(mcdu: LegacyFmsPageInterface) {
    mcdu.clearDisplay();
    mcdu.activeSystem = 'FMGC';
    mcdu.page.Current = mcdu.page.SecFplnMain;

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
    const canActivateOrSwapSec = this.canActivateOrSwapSecondary(mcdu, activePlan);

    // *ACTIVATE SEC
    if (canActivateOrSwapSec) {
      activateSecColumn.update('*ACTIVATE SEC');

      mcdu.onLeftInput[3] = async (_, scratchpadCallback) => {
        if (mcdu.flightPlanService.hasTemporary) {
          mcdu.setScratchpadMessage(NXSystemMessages.temporaryFplnExists);
          scratchpadCallback();
          return;
        }

        // We should not get here, because the button is not even shown, but the page might not have refreshed yet to reflect
        // the new NAV status
        if (!this.canActivateOrSwapSecondary(mcdu, activePlan)) {
          mcdu.setScratchpadMessage(NXSystemMessages.notAllowedInNav);
          scratchpadCallback();
          return;
        }

        try {
          await mcdu.activateSecondaryPlan(1);

          CDUFlightPlanPage.ShowPage(mcdu);
        } catch (error) {
          console.error(error);
          mcdu.logTroubleshootingError(error);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
        }
      };
    }

    // <COPY ACTIVE
    mcdu.onLeftInput[0] = async () => {
      try {
        await mcdu.flightPlanService.secondaryCopyFromActive(1, !mcdu.isAnEngineOn());
      } catch (error) {
        console.error(error);
        mcdu.logTroubleshootingError(error);
        mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
      }

      CDUFlightPlanPage.ShowPage(mcdu, 0, false, FlightPlanIndex.FirstSecondary);
    };

    // INIT>
    mcdu.onRightInput[0] = async () => {
      if (!hasSecondary) {
        try {
          await mcdu.flightPlanService.secondaryInit(1);
        } catch (error) {
          console.error(error);
          mcdu.logTroubleshootingError(error);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
        }
      }

      CDUInitPage.ShowPage1(mcdu, FlightPlanIndex.FirstSecondary);
    };

    // <SEC F-PLN
    mcdu.onLeftInput[1] = async () => {
      if (!hasSecondary) {
        await mcdu.flightPlanService.secondaryInit(1);
      }
      CDUFlightPlanPage.ShowPage(mcdu, 0, false, FlightPlanIndex.FirstSecondary);
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
        if (mcdu.flightPlanService.hasTemporary) {
          mcdu.setScratchpadMessage(NXSystemMessages.temporaryFplnExists);
          scratchpadCallback();
          return;
        }

        // We should not get here, because the button is not even shown, but the page might not have refreshed yet to reflect
        // the new NAV status
        if (!this.canActivateOrSwapSecondary(mcdu, activePlan)) {
          mcdu.setScratchpadMessage(NXSystemMessages.notAllowedInNav);
          scratchpadCallback();
          return;
        }

        try {
          await mcdu.swapActiveAndSecondaryPlan(1);

          CDUFlightPlanPage.ShowPage(mcdu);
        } catch (error) {
          console.error(error);
          mcdu.logTroubleshootingError(error);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
          return;
        }
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

  static canActivateOrSwapSecondary(
    mcdu: LegacyFmsPageInterface,
    activePlan: FlightPlan<FlightPlanPerformanceData>,
  ): boolean {
    if (!mcdu.flightPlanService.hasSecondary(1)) {
      return false;
    }

    const secPlan = mcdu.flightPlanService.secondary(1);

    if (!secPlan.originAirport || !secPlan.destinationAirport) {
      return false;
    }

    const activeToLeg = activePlan.activeLeg;
    const secToLeg = secPlan.activeLeg;

    return (
      !mcdu.isNavModeEngaged() ||
      (activeToLeg === undefined && secToLeg === undefined) ||
      (activeToLeg !== undefined &&
        secToLeg !== undefined &&
        FlightPlanUtils.areFlightPlanElementsSame(activeToLeg, secToLeg) &&
        activePlan.activeLegIndex === secPlan.activeLegIndex)
    );
  }
}
