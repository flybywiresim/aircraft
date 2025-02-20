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

    const hasSecondary = mcdu.flightPlanService.hasSecondary(1);

    const deleteSecColumn = new Column(0, '', Column.cyan);

    // <DELETE SEC
    if (hasSecondary) {
      deleteSecColumn.update('{DELETE SEC');

      mcdu.onLeftInput[2] = () => {
        mcdu.flightPlanService.secondaryReset(1);
      };
    }

    const activateSecColumn = new Column(0, '', Column.amber);

    const activePlan = mcdu.flightPlanService.active;

    let canCopyOrSwapSec = false;
    if (hasSecondary) {
      const secPlan = mcdu.flightPlanService.secondary(1);

      const activeToLeg = activePlan.activeLeg;
      const secToLeg = secPlan.activeLeg;

      canCopyOrSwapSec =
        !mcdu.navModeEngaged() ||
        (FlightPlanUtils.areFlightPlanElementsSame(activeToLeg, secToLeg) &&
          activePlan.activeLegIndex === secPlan.activeLegIndex);
    }

    // *ACTIVATE SEC
    if (canCopyOrSwapSec) {
      activateSecColumn.update('*ACTIVATE SEC');

      mcdu.onLeftInput[3] = () => {
        mcdu.flightPlanService.secondaryActivate(1).then(() => {
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
      mcdu.flightPlanService.secondaryInit(1); // FIXME ideally the page would be fine showing for a non-existent plan, but we work around this for now
      CDUInitPage.ShowPage1(mcdu, FlightPlanIndex.FirstSecondary);
    };

    // <SEC F-PLN
    mcdu.onLeftInput[1] = () => {
      CDUFlightPlanPage.ShowPage(mcdu, 0, FlightPlanIndex.FirstSecondary);
    };

    // PERF>
    const secPerfColumn = new Column(23, '', Column.right);
    if (hasSecondary) {
      secPerfColumn.update('PERF>');

      mcdu.onRightInput[1] = () => {
        CDUPerformancePage.ShowPage(mcdu, FlightPlanIndex.FirstSecondary);
      };
    }

    const secSwapActiveColumn = new Column(0, '', Column.amber);
    if (hasSecondary && canCopyOrSwapSec) {
      secSwapActiveColumn.update('*SWAP ACTIVE   ');

      mcdu.onLeftInput[5] = () => {
        mcdu.flightPlanService.activeAndSecondarySwap(1);
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
