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

        mcdu.onLeftInput[0] = () => {
            // TODO do not call this directly, it is private
            mcdu.flightPlanService.flightPlanManager.copy(Fmgc.FlightPlanIndex.Active, Fmgc.FlightPlanIndex.FirstSecondary);
            CDUFlightPlanPage.ShowPage(mcdu, 0, Fmgc.FlightPlanIndex.FirstSecondary);
        };
        mcdu.onRightInput[0] = () => {
            CDUInitPage.ShowPage1(mcdu, Fmgc.FlightPlanIndex.FirstSecondary);
        };

        mcdu.onLeftInput[1] = () => {
            CDUFlightPlanPage.ShowPage(mcdu, 0, Fmgc.FlightPlanIndex.FirstSecondary);
        };
        mcdu.onRightInput[1] = () => {
            CDUPerformancePage.ShowPage(mcdu, Fmgc.FlightPlanIndex.FirstSecondary);
        };

        mcdu.onLeftInput[2] = () => {
            mcdu.flightPlanService.secondaryReset(1);
        };

        mcdu.onLeftInput[5] = () => {
            mcdu.flightPlanService.flightPlanManager.swap(Fmgc.FlightPlanIndex.FirstSecondary, Fmgc.FlightPlanIndex.Active);
        };

        mcdu.setTemplate([
            ["SEC INDEX"],
            [""],
            ["{COPY ACTIVE", "INIT>"],
            [""],
            ["<SEC F-PLN", "PERF>"],
            [""],
            ["{DELETE SEC"],
            [""],
            ["*ACTIVATE SEC"],
            [""],
            [""],
            [""],
            ["*SWAP ACTIVE   "]
        ]);
    }
}
