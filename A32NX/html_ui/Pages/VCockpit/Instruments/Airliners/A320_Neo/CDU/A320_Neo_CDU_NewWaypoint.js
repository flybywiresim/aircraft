class CDUNewWaypoint {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["NEW WAYPOINT"],
            ["IDENT"],
            ["_______[color]red"],
            ["LAT/LONG"],
            ["____.__|_____.__[color]red"],
            ["PLACE/BRG /DIST"],
            ["_______|___d |___. _[color]red"],
            ["PLACE-BRG  /PLACE-BRG"],
            ["_____-___d  |_____-___d"],
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