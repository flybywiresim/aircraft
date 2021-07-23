class CDUDataIndexPage {
    static ShowPage1(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUDataIndexPage.ShowPage1(fmc, mcdu);
        }, 'FMGC');

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
            CDUPositionMonitorPage.ShowPage(fmc, mcdu);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[1] = () => {
            CDUIRSMonitor.ShowPage(fmc, mcdu);
        };

        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[2] = () => {
            CDUGPSMonitor.ShowPage(fmc, mcdu);
        };

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[3] = () => {
            CDUIdentPage.ShowPage(fmc, mcdu);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[4] = () => {
            CDUAirportsMonitor.ShowPage(fmc, mcdu, true);
        };

        mcdu.onNextPage = () => {
            this.ShowPage2(fmc, mcdu);
        };
        mcdu.onPrevPage = () => {
            this.ShowPage2(fmc, mcdu);
        };
    }
    static ShowPage2(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUDataIndexPage.ShowPage2(fmc, mcdu);
        });

        mcdu.setTemplate([
            ["DATA INDEX", "2", "2"],
            ["", "STORED\xa0"],
            ["<WAYPOINTS", "WAYPOINTS>"],
            ["", "STORED\xa0"],
            ["<NAVAIDS", "NAVAIDS>"],
            ["", "STORED\xa0"],
            ["<RUNWAYS", "RUNWAYS>"],
            ["", "STORED\xa0"],
            ["<ROUTES", "ROUTES>"],
            ["\xa0ACTIVE F-PLAN", ""],
            ["<WINDS"],
            ["\xa0SEC F-PLAN", ""],
            ["<WINDS"]

        ]);

        mcdu.onLeftInput[0] = () => {
            CDUWaypointPage.ShowPage(fmc, mcdu);
        };

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[0] = () => {
            CDUPilotsWaypoint.ShowPage(fmc, mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[1] = () => {
            CDUNavaidPage.ShowPage(fmc, mcdu);
        };

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onNextPage = () => {
            this.ShowPage1(fmc, mcdu);
        };
        mcdu.onPrevPage = () => {
            this.ShowPage1(fmc, mcdu);
        };
    }
}
