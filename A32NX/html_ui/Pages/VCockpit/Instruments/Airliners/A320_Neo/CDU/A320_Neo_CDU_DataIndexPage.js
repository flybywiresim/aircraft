class CDUDataIndexPage {
    static ShowPage1(mcdu) {
        mcdu.clearDisplay()
        mcdu.setTemplate([
            ["DATA INDEX", "1", "2"],
            ["POSITION"],
            ["<MONITOR"],
            ["IRS"],
            ["<MONITOR"],
            ["GPS"],
            ["<MONITOR"],
            [""],
            ["<A/C STATUS"],
            ["CLOSEST", "PRINT"],
            ["<AIRPORTS", "FUNCTION>"],
            ["EQUITIME", "AOC"],
            ["<POINT", "FUNCTION>"]
        ])

        mcdu.onLeftInput[3] = () => {
            CDUIdentPage.ShowPage(mcdu);
        }

        mcdu.onLeftInput[0] = () => {
            CDUPositionMonitorPage.ShowPage(mcdu);
        }

        mcdu.onLeftInput[1] = () => {
            CDUIRSMonitor.ShowPage(mcdu)
        }

        mcdu.onLeftInput[2] = () => {
            CDUGPSMonitor.ShowPage(mcdu)
        }

        mcdu.onNextPage = () => {
            this.ShowPage2(mcdu)
        }
        mcdu.onPrevPage = () => {
            this.ShowPage2(mcdu)
        }
    }
    static ShowPage2(mcdu) {
        mcdu.clearDisplay()
        mcdu.setTemplate([
            ["DATA INDEX", "2", "2"],
            ["", "PILOTS"],
            ["<WAYPOINTS", "WAYPOINTS>"],
            ["", "PILOTS"],
            ["<NAVAIDS", "NAVAIDS>"],
            ["", "PILOTS"],
            ["<RUNWAYS", "RUNWAYS>"],
            ["", "PILOTS"],
            ["<ROUTES", "ROUTES>"],
            ["ACTIVE F-PLAN", ""],
            ["<WINDS"],
            ["SEC F-PLAN", ""],
            ["<WINDS"]
            
        ])

        mcdu.onLeftInput[0] = () => {
            CDUWaypointPage.ShowPage(mcdu)
        }

        mcdu.onRightInput[0] = () => {
            CDUPilotsWaypoint.ShowPage(mcdu)
        }

        mcdu.onLeftInput[1] = () => {
            CDUNavaidPage.ShowPage(mcdu)
        }

        mcdu.onNextPage = () => {
            this.ShowPage1(mcdu)
        }
        mcdu.onPrevPage = () => {
            this.ShowPage1(mcdu)
        }
    }
}
//# sourceMappingURL=A320_Neo_CDU_DataIndexPage.js.map