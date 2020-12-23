class CDUPilotsWaypoint {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.PilotsWaypoint;
        mcdu.setTemplate([
            ["PILOTS WAYPOINT", "1", "1"],
            ["\xa0IDENT"],
            ["[   ][color]cyan"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["", "NEW\xa0"],
            ["", "WAYPOINT>"],
            ["", "DELETE ALL}[color]cyan"]
        ]);

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[4] = () => {
            CDUNewWaypoint.ShowPage(mcdu);
        };
    }
}
