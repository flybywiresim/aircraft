// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

class CDUAtcAtisAutoUpdate {
    static ToggleAutoUpdate(mcdu, icao, reloadPage) {
        if (mcdu.atsu.atisAutoUpdateActive(icao)) {
            mcdu.atsu.deactivateAtisAutoUpdate(icao).then((status) => {
                if (status !== AtsuCommon.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(status);
                }
                if (reloadPage) {
                    CDUAtcAtisAutoUpdate.ShowPage(mcdu);
                }
            });
        } else {
            mcdu.atsu.activateAtisAutoUpdate(icao, AtsuCommon.AtisType.Arrival).then((status) => {
                if (status !== AtsuCommon.AtsuStatusCodes.Ok) {
                    mcdu.addNewAtsuMessage(status);
                }
                if (reloadPage) {
                    CDUAtcAtisAutoUpdate.ShowPage(mcdu);
                }
            });
        }
    }

    static ShowPage(mcdu, updateInProgress = false) {
        mcdu.clearDisplay();

        const activeDestinationAirport = mcdu.flightPlanService.active.destinationAirport;
        const activeAlternateAirport = mcdu.flightPlanService.active.alternateDestinationAirport;

        let arrAtis = "{inop}\xa0[  ]/[ ]{end}";
        let arrAtisState = "";
        let arrAtisButton = "{cyan}ON\xa0{end}";
        let altAtis = "{inop}\xa0[  ]/[ ]{end}";
        let altAtisState = "";
        let altAtisButton = "{cyan}ON\xa0{end}";
        if (activeDestinationAirport) {
            arrAtis = `{cyan}\xa0${activeDestinationAirport.ident}/ARR{end}`;
            if (mcdu.atsu.atisAutoUpdateActive(activeDestinationAirport.ident)) {
                arrAtisState = "\x3a ON";
                arrAtisButton = `{cyan}OFF${updateInProgress ? '\xa0' : '*'}{end}`;
            } else {
                arrAtisState = "\x3a OFF";
                arrAtisButton = `{cyan}ON${updateInProgress ? '\xa0' : '*'}{end}`;
            }
        }
        if (activeAlternateAirport && activeAlternateAirport.ident) {
            altAtis = `{cyan}\xa0${activeAlternateAirport.ident}/ARR{end}`;
            if (mcdu.atsu.atisAutoUpdateActive(activeAlternateAirport.ident)) {
                altAtisState = "\x3a ON";
                altAtisButton = "{cyan}OFF*{end}";
            } else {
                altAtisState = "\x3a OFF";
                altAtisButton = "{cyan}ON*{end}";
            }
        }

        mcdu.setTemplate([
            ["ATIS AUTO UPDATE"],
            [""],
            [""],
            ["", "{cyan}SET\xa0{end}"],
            [arrAtis, arrAtisButton, arrAtisState],
            ["", "{cyan}SET\xa0{end}"],
            [altAtis, altAtisButton, altAtisState],
            [""],
            [""],
            [""],
            [""],
            ["\xa0ATIS MENU"],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcAtisMenu.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = () => {
            const activeDestinationAirport = mcdu.flightPlanService.active.destinationAirport;

            if (updateInProgress === false && activeDestinationAirport) {
                CDUAtcAtisAutoUpdate.ToggleAutoUpdate(mcdu, activeDestinationAirport.ident, true);
                CDUAtcAtisAutoUpdate.ShowPage(mcdu, true);
            }
        };
        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = () => {
            const activeAlternateAirport = mcdu.flightPlanService.active.alternateDestinationAirport;

            if (updateInProgress === false && activeAlternateAirport) {
                CDUAtcAtisAutoUpdate.ToggleAutoUpdate(mcdu, activeAlternateAirport.ident, true);
                CDUAtcAtisAutoUpdate.ShowPage(mcdu, true);
            }
        };
    }
}
