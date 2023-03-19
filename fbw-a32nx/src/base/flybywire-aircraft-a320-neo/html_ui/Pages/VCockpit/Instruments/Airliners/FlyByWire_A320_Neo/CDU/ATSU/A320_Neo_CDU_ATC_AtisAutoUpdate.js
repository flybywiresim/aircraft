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

        let arrAtis = "{inop}\xa0[  ]/[ ]{end}";
        let arrAtisState = "";
        let arrAtisButton = "{cyan}ON\xa0{end}";
        let altAtis = "{inop}\xa0[  ]/[ ]{end}";
        let altAtisState = "";
        let altAtisButton = "{cyan}ON\xa0{end}";
        if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
            arrAtis = `{cyan}\xa0${mcdu.flightPlanManager.getDestination().ident}/ARR{end}`;
            if (mcdu.atsu.atisAutoUpdateActive(mcdu.flightPlanManager.getDestination().ident)) {
                arrAtisState = "\x3a ON";
                arrAtisButton = `{cyan}OFF${updateInProgress ? '\xa0' : '*'}{end}`;
            } else {
                arrAtisState = "\x3a OFF";
                arrAtisButton = `{cyan}ON${updateInProgress ? '\xa0' : '*'}{end}`;
            }
        }
        if (mcdu.altDestination && mcdu.altDestination.ident) {
            altAtis = `{cyan}\xa0${mcdu.altDestination.ident}/ARR{end}`;
            if (mcdu.atsu.atisAutoUpdateActive(mcdu.altDestination.ident)) {
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
            ["\xa0ATC MENU"],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = () => {
            if (updateInProgress === false && mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
                CDUAtcAtisAutoUpdate.ToggleAutoUpdate(mcdu, mcdu.flightPlanManager.getDestination().ident, true);
                CDUAtcAtisAutoUpdate.ShowPage(mcdu, true);
            }
        };
        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = () => {
            if (updateInProgress === false && mcdu.flightPlanManager.getDestination() && mcdu.altDestination.ident) {
                CDUAtcAtisAutoUpdate.ToggleAutoUpdate(mcdu, mcdu.altDestination.ident, true);
                CDUAtcAtisAutoUpdate.ShowPage(mcdu, true);
            }
        };
    }
}
