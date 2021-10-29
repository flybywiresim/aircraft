/*
    Displays blank navaid field, when navaid inputted, LAT, LONG will show.
    Derives from Data Index PG2
*/

class CDUNavaidPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.NavaidPage;
        mcdu.returnPageCallback = () => {
            CDUNavaidPage.ShowPage(mcdu);
        };

        mcdu.setTemplate([
            ["NAVAID"],
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
                        ["NAVAID"],
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
                    mcdu.inOut = Object.keys(res);
                } else {
                    mcdu.addNewMessage(NXSystemMessages.notAllowed);
                    scratchpadCallback();
                }
            });
        };
    }
}
