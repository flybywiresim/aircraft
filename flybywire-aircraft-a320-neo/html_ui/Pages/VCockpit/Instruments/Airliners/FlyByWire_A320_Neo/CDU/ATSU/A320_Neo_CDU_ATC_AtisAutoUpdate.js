class CDUAtcAtisAutoUpdate {
    static ToggleAutoUpdate(mcdu, icao) {
        if (mcdu.atsuManager.atc.atisAutoUpdateActive(icao)) {
            mcdu.atsuManager.atc.deactivateAtisAutoUpdate(icao);
        } else {
            mcdu.atsuManager.atc.activateAtisAutoUpdate(icao);
        }
    }

    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCAtisAutoUpdate;

        let arrAtis = "\xa0[  ]/[ ][color]cyan";
        let arrAtisState = "";
        let arrAtisButton = "ON\xa0[color]cyan";
        let altAtis = "\xa0[  ]/[ ][color]cyan";
        let altAtisState = "";
        let altAtisButton = "ON\xa0[color]cyan";
        if (mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().ident) {
            arrAtis = `\xa0${mcdu.flightPlanManager.getDestination().ident}/ARR[color]cyan`;
            if (mcdu.atsuManager.atc.atisAutoUpdateActive(mcdu.flightPlanManager.getDestination().ident)) {
                arrAtisState = "\x3a ON";
                arrAtisButton = "OFF*[color]cyan";
            } else {
                arrAtisState = "\x3a OFF";
                arrAtisButton = "ON*[color]cyan";
            }
        }
        if (mcdu.altDestination && mcdu.altDestination.ident) {
            altAtis = `\xa0${mcdu.altDestination.ident}/ARR[color]cyan`;
            if (mcdu.atsuManager.atc.atisAutoUpdateActive(mcdu.altDestination.ident)) {
                altAtisState = "\x3a ON";
                altAtisButton = "OFF*[color]cyan";
            } else {
                altAtisState = "\x3a OFF";
                altAtisButton = "ON*[color]cyan";
            }
        }

        mcdu.setTemplate([
            ["ATIS AUTO UPDATE"],
            [""],
            [""],
            ["", "SET\xa0[color]cyan"],
            [arrAtis, arrAtisButton, arrAtisState],
            ["", "SET\xa0[color]cyan"],
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
            CDUAtcMenu.ShowPage2(mcdu);
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
