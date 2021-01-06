class CDUNewWaypoint {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.NewWaypoint;
        mcdu.setTemplate([
            ["NEW WAYPOINT"],
            ["IDENT"],
            ["_______[color]amber"],
            ["LAT/LONG"],
            ["____.__|_____.__[color]amber"],
            ["PLACE/BRG /DIST"],
            ["_______|___° |___. _[color]amber"],
            ["PLACE-BRG  /PLACE-BRG"],
            ["_____-___°  |_____-___°"],
            [""],
            ["", "RETURN>"],
            [""],
            [""]
        ]);

        mcdu.onRightInput[4] = () => {
            CDUPilotsWaypoint.ShowPage(mcdu);
        };
    }
}
