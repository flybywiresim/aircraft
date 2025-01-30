// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

class CDUSecFplnMain {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'FMGC';

        mcdu.efisInterfaces.L.setSecRelatedPageOpen(true);
        mcdu.efisInterfaces.R.setSecRelatedPageOpen(true);
        mcdu.onUnload = () => {
            mcdu.efisInterfaces.L.setSecRelatedPageOpen(false);
            mcdu.efisInterfaces.R.setSecRelatedPageOpen(false);
        };

        const hasSecondary = mcdu.flightPlanService.hasSecondary(1);

        const deleteSecColumn = new Column(0, "");

        // <DELETE SEC
        if (hasSecondary) {
            deleteSecColumn.update("{DELETE SEC");

            mcdu.onLeftInput[2] = () => {
                mcdu.flightPlanService.secondaryReset(1);
            };
        }

        const activateSecColumn = new Column(0, "");

        const activePlan = mcdu.flightPlanService.active;

        let canCopyOrSwapSec = false;
        if (hasSecondary) {
            const secPlan = mcdu.flightPlanService.secondary(1);

            const activeToLeg = activePlan.activeLeg;
            const secToLeg = secPlan.activeLeg;

            canCopyOrSwapSec = !mcdu.navModeEngaged() || (Fmgc.FlightPlanUtils.areFlightPlanElementsSame(activeToLeg, secToLeg) && activePlan.activeLegIndex === secPlan.activeLegIndex);
        }

        // *ACTIVATE SEC
        if (canCopyOrSwapSec) {
            activateSecColumn.update("*ACTIVATE SEC");

            mcdu.onLeftInput[3] = () => {
                mcdu.flightPlanService.secondaryReset();
            };
        }

        // <COPY ACTIVE
        mcdu.onLeftInput[0] = () => {
            mcdu.flightPlanService.secondaryCopyFromActive(1);
            CDUFlightPlanPage.ShowPage(mcdu, 0, Fmgc.FlightPlanIndex.FirstSecondary);
        };

        // INIT>
        mcdu.onRightInput[0] = () => {
            mcdu.flightPlanService.secondaryInit(1); // FIXME ideally the page would be fine showing for a non-existent plan, but we work around this for now
            CDUInitPage.ShowPage1(mcdu, Fmgc.FlightPlanIndex.FirstSecondary);
        };

        // <SEC F-PLN
        mcdu.onLeftInput[1] = () => {
            CDUFlightPlanPage.ShowPage(mcdu, 0, Fmgc.FlightPlanIndex.FirstSecondary);
        };

        // PERF>
        const secPerfColumn = new Column(23, "", Column.right);
        if (hasSecondary) {
            secPerfColumn.update("PERF>");

            mcdu.onRightInput[1] = () => {
                CDUPerformancePage.ShowPage(mcdu, Fmgc.FlightPlanIndex.FirstSecondary);
            };
        }

        const secSwapActiveColumn = new Column(0, "");
        if (hasSecondary && canCopyOrSwapSec) {
            secSwapActiveColumn.update("*SWAP ACTIVE   ");

            mcdu.onLeftInput[5] = () => {
                mcdu.flightPlanService.activeAndSecondarySwap(1);
            };
        }

        mcdu.setTemplate(FormatTemplate([
            [new Column(7, "SEC INDEX")],
            [""],
            [new Column(0, "{COPY ACTIVE"), new Column(23, "INIT>", Column.right)],
            [""],
            [new Column(0, "<SEC F-PLN"), secPerfColumn],
            [""],
            [deleteSecColumn],
            [""],
            [activateSecColumn],
            [""],
            [""],
            [""],
            [secSwapActiveColumn]
        ]));
    }
}
