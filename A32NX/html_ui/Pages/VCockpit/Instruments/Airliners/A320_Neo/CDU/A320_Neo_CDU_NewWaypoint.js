class CDUNewWaypoint {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.NewWaypoint;
        mcdu.setTemplate([
            ["NEW WAYPOINT"],
            ["IDENT"],
            ["_______[color]red"],
            ["LAT/LONG"],
            ["____.__|_____.__[color]red"],
            ["PLACE/BRG /DIST"],
            ["_______|___° |___. _[color]red"],
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