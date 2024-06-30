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
            return;
            mcdu.flightPlanService.flightPlanManager.copy(Fmgc.FlightPlanIndex.Active, Fmgc.FlightPlanIndex.FirstSecondary);
            CDUFlightPlanPage.ShowPage(mcdu, 0, Fmgc.FlightPlanIndex.FirstSecondary);
        };

        mcdu.onLeftInput[1] = () => {
            return;
            CDUFlightPlanPage.ShowPage(mcdu, 0, Fmgc.FlightPlanIndex.FirstSecondary);
        };

        mcdu.onLeftInput[2] = () => {
            return;
            mcdu.flightPlanService.secondaryReset(1);
        };

        mcdu.onLeftInput[5] = () => {
            return;
            mcdu.flightPlanService.flightPlanManager.swap(Fmgc.FlightPlanIndex.FirstSecondary, Fmgc.FlightPlanIndex.Active);
        };

        mcdu.setTemplate([
            ["SEC INDEX"],
            [""],
            ["{COPY ACTIVE[color]inop", "INIT>[color]inop"],
            [""],
            ["<SEC F-PLN[color]inop", "PERF>[color]inop"],
            [""],
            ["{DELETE SEC[color]inop"],
            [""],
            ["*ACTIVATE SEC[color]inop"],
            [""],
            [""],
            [""],
            ["*SWAP ACTIVE[color]inop"]
        ]);
    }
}
