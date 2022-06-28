class CDUAtcAtisAutoUpdate {
    static ToggleAutoUpdate(mcdu, icao) {
        if (mcdu.atsu.atc.atisAutoUpdateActive(icao)) {
            mcdu.atsu.atc.deactivateAtisAutoUpdate(icao);
        } else {
            mcdu.atsu.atc.activateAtisAutoUpdate(icao, Atsu.AtisType.Arrival);
        }
    }

    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        let arrAtis = "{inop}\xa0[  ]/[ ]{end}";
        let arrAtisState = "";
        let arrAtisButton = "{cyan}ON\xa0{end}";
        let altAtis = "{inop}\xa0[  ]/[ ]{end}";
        let altAtisState = "";
        let altAtisButton = "{cyan}ON\xa0{end}";
        if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
            arrAtis = `{cyan}\xa0${mcdu.flightPlanManager.getDestination().ident}/ARR{end}`;
            if (mcdu.atsu.atc.atisAutoUpdateActive(mcdu.flightPlanManager.getDestination().ident)) {
                arrAtisState = "\x3a ON";
                arrAtisButton = "{cyan}OFF*{end}";
            } else {
                arrAtisState = "\x3a OFF";
                arrAtisButton = "{cyan}ON*{end}";
            }
        }
        if (mcdu.altDestination && mcdu.altDestination.ident) {
            altAtis = `{cyan}\xa0${mcdu.altDestination.ident}/ARR{end}`;
            if (mcdu.atsu.atc.atisAutoUpdateActive(mcdu.altDestination.ident)) {
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
            if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
                CDUAtcAtisAutoUpdate.ToggleAutoUpdate(mcdu, mcdu.flightPlanManager.getDestination().ident);
                CDUAtcAtisAutoUpdate.ShowPage(mcdu);
            }
        };
        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = () => {
            if (mcdu.flightPlanManager.getDestination() && mcdu.altDestination.ident) {
                CDUAtcAtisAutoUpdate.ToggleAutoUpdate(mcdu, mcdu.altDestination.ident);
                CDUAtcAtisAutoUpdate.ShowPage(mcdu);
            }
        };
    }
}
