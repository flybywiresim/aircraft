/*
    Displays blank navaid field, when navaid inputted, LAT, LONG will show.
    Derives from Data Index PG2
*/

class CDUNavaidPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.NavaidPage;

        mcdu.setTemplate([
            ["NAVAID"],
            ["IDENT"],
            ["_______[color]amber"],
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
                        ["NAVAID"],
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
                    mcdu.inOut = Object.keys(res);
                } else {
                    mcdu.showErrorMessage(mcdu.defaultInputErrorMessage);
                }
            });
        };
    }
}
