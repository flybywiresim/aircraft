/*
    Displays blank waypoint field, when waypoint inputted, LAT, LONG will show.
    Derives from Data Index PG2
*/

class CDUWaypointPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.WaypointPage;
        mcdu.returnPageCallback = () => {
            CDUWaypointPage.ShowPage(mcdu);
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

        mcdu.onLeftInput[0] = (value, scratchpadCallback) => {
            const selectedWaypoint = mcdu.getOrSelectWaypointByIdent(value, res => {
                if (res) {
                    mcdu.clearDisplay();
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
                    scratchpadCallback();
                }
            });
        };
    }
}
