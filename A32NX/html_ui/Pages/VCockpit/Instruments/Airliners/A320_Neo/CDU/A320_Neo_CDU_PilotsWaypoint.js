class CDUPilotsWaypoint {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.PilotsWaypoint;
        mcdu.setTemplate([
            ["PILOTS WAYPOINT", "1", "1"],
            ["IDENT"],
            ["[   ][color]cyan"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["", "NEW"],
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
