/*
    Displays blank waypoint field, when waypoint inputted, LAT, LONG will show.
    Derives from Data Index PG2
*/

class CDUWaypointPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.WaypointPage;

        mcdu.setTemplate([
            ["WAYPOINT"],
            ["IDENT"],
            ["_______[color]red"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""]
        ]);

        mcdu.onLeftInput[0] = (value) => {
            const selectedWaypoint = mcdu.getOrSelectWaypointByIdent(value, res => {
                if (res) {
                    mcdu.clearDisplay();
                    mcdu.setTemplate([
                        ["WAYPOINT"],
                        ["IDENT"],
                        [`${value}`],
                        ["LAT/LONG"],
                        [`${new LatLong(res.infos.coordinates.lat, res.infos.coordinates.long).toShortDegreeString()}[color]green`],
                        [""],
                        [""],
                        [""],
                        [""],
                        [""],
                        [""],
                        [""],
                        [""]
                    ]);
                } else {
                    mcdu.showErrorMessage(mcdu.defaultInputErrorMessage);
                }
            });
        };
    }
}
