/*
    Displays blank navaid field, when navaid inputted, LAT, LONG will show.
    Derives from Data Index PG2
*/

class CDUNavaidPage {
    static ShowPage(fmc, mcdu, waypoint = undefined) {
        mcdu.setCurrentPage(); // note: no refresh
        mcdu.returnPageCallback = () => {
            CDUNavaidPage.ShowPage(fmc, mcdu, waypoint);
        };

        mcdu.setTemplate([
            ["NAVAID"],
            ["\xa0IDENT"],
            [waypoint ? waypoint.ident : "_______[color]amber"],
            [waypoint ? "\xa0LAT/LONG" : ""],
            [waypoint ? `${new LatLong(res.infos.coordinates.lat, res.infos.coordinates.long).toShortDegreeString()}[color]green` : ""],
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
                    mcdu.inOut = Object.keys(res); // TODO ??
                    CDUNavaidPage.ShowPage(fmc, mcdu, waypoint);
                } else {
                    mcdu.addNewMessage(NXSystemMessages.notAllowed);
                }
            });
        };
    }
}
