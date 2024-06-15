class CDUDataIndexPage {
    static ShowPage1(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.DataIndexPage1;
        mcdu.activeSystem = 'FMGC';
        mcdu.setTemplate([
            ["DATA INDEX", "1", "2"],
            ["\xa0POSITION"],
            ["<MONITOR"],
            ["\xa0IRS"],
            ["<MONITOR"],
            ["\xa0GPS"],
            ["<MONITOR"],
            [""],
            ["<A/C STATUS"],
            ["\xa0CLOSEST"],
            ["<AIRPORTS"],
            ["\xa0EQUITIME", "ACARS/PRINT\xa0"],
            ["<POINT", "FUNCTION>"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[0] = () => {
            CDUPositionMonitorPage.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[1] = () => {
            CDUIRSMonitor.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[2] = () => {
            CDUGPSMonitor.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[3] = () => {
            CDUIdentPage.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[4] = () => {
            CDUAirportsMonitor.ShowPage(mcdu, true);
        };

        mcdu.onNextPage = () => {
            this.ShowPage2(mcdu);
        };
        mcdu.onPrevPage = () => {
            this.ShowPage2(mcdu);
        };
    }
    static ShowPage2(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.DataIndexPage2;
        mcdu.setTemplate([
            ["DATA INDEX", "2", "2"],
            ["", "STORED\xa0"],
            ["<WAYPOINTS", "WAYPOINTS>"],
            ["", "STORED\xa0[color]inop"],
            ["<NAVAIDS", "NAVAIDS>[color]inop"],
            ["", "STORED\xa0[color]inop"],
            ["<RUNWAYS[color]inop", "RUNWAYS>[color]inop"],
            ["", "STORED\xa0[color]inop"],
            ["<ROUTES[color]inop", "ROUTES>[color]inop"],
            ["\xa0ACTIVE F-PLAN[color]inop", ""],
            ["<WINDS[color]inop"],
            ["\xa0SEC F-PLAN[color]inop", ""],
            ["<WINDS[color]inop"]

        ]);

        mcdu.onLeftInput[0] = () => {
            CDUWaypointPage.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[0] = () => {
            CDUPilotsWaypoint.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[1] = () => {
            CDUNavaidPage.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onNextPage = () => {
            this.ShowPage1(mcdu);
        };
        mcdu.onPrevPage = () => {
            this.ShowPage1(mcdu);
        };
    }
}
