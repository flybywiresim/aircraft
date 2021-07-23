/*
    Displays blank waypoint field, when waypoint inputted, LAT, LONG will show.
    Derives from Data Index PG2
*/

class CDUWaypointPage {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(); // note: no refresh
        mcdu.returnPageCallback = () => {
            CDUWaypointPage.ShowPage(fmc, mcdu);
        };

        mcdu.setTemplate([
            ["WAYPOINT"],
            ["\xa0IDENT"],
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
            fmc.getOrSelectWaypointByIdent(mcdu, value, res => {
                if (res) {
                    mcdu.setCurrentPage(); // note: no refresh
                    mcdu.setTemplate([
                        ["WAYPOINT"],
                        ["\xa0IDENT"],
                        [`${value}`],
                        ["\xa0LAT/LONG"],
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
                    mcdu.addNewMessage(NXSystemMessages.notAllowed);
                }
            });
        };
    }
}
