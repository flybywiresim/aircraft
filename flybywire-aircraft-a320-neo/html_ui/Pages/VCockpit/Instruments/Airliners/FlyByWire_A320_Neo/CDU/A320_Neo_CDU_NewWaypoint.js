class CDUNewWaypoint {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage();

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
            CDUPilotsWaypoint.ShowPage(fmc, mcdu);
        };
    }
}
