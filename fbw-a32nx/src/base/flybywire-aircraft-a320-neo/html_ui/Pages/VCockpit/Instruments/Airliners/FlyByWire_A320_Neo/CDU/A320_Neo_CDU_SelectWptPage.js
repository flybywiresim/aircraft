class A320_Neo_CDU_SelectWptPage {
    /**
     * @param mcdu
     * @param fixes {Array.<import('msfs-navdata').Fix>}
     * @param callback
     * @param page
     * @constructor
     */
    static ShowPage(mcdu, fixes, callback, page = 0) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.SelectWptPage;
        const rows = [
            ["", 'FREQ', 'LAT/LONG'],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN"]
        ];

        /**
         * @param w {import('msfs-navdata').Waypoint}
         * @returns {NauticalMiles}
         */
        function calculateDistance(w) {
            const planeLla = new LatLongAlt(SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude"), SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude"));
            return Avionics.Utils.computeGreatCircleDistance(planeLla, w.location);
        }

        const orderedWaypoints = [...fixes].sort((a, b) => calculateDistance(a) - calculateDistance(b));

        for (let i = 0; i < 5; i++) {
            const w = orderedWaypoints[i + 5 * page];
            if (w) {
                let freq = "";

                if (w.databaseId[0] === "V" || w.databaseId[0] === "N") {
                    freq = w.frequency ? fastToFixed(w.frequency, 2).toString() : " ";
                }

                const latString = (w.location.lat.toFixed(0) >= 0) ? `${w.location.lat.toFixed(0).toString().padStart(2, "0")}N` : `${Math.abs(w.location.lat.toFixed(0)).toString().padStart(2, "0")}S`;
                const longString = (w.location.long.toFixed(0) >= 0) ? `${w.location.long.toFixed(0).toString().padStart(3, "0")}E` : `${Math.abs(w.location.long.toFixed(0)).toString().padStart(3, "0")}W`;

                const dist = Math.min(calculateDistance(w), 9999);

                rows[2 * i].splice(0, 1, "{green}" + dist.toFixed(0) + "{end}NM");
                rows[2 * i + 1] = ["*" + w.ident + "[color]cyan", freq + "[color]green", `${latString}/${longString}[color]green`];
                mcdu.onLeftInput[i] = () => {
                    callback(w);
                };
                mcdu.onRightInput[i] = () => {
                    callback(w);
                };
                mcdu.onLeftInput[5] = () => {
                    if (mcdu.returnPageCallback) {
                        mcdu.returnPageCallback();
                    } else {
                        console.error("A return page callback was expected but not declared. Add a returnPageCallback to page: " + mcdu.page.Current);
                    }
                };
            }
        }
        mcdu.setTemplate([
            ["DUPLICATE NAMES", (page + 1).toFixed(0), Math.ceil(orderedWaypoints.length / 5).toFixed(0)],
            ...rows,
            [""]
        ]);
        mcdu.onPrevPage = () => {
            if (page > 0) {
                A320_Neo_CDU_SelectWptPage.ShowPage(mcdu, orderedWaypoints, callback, page - 1);
            }
        };
        mcdu.onNextPage = () => {
            if (page < Math.floor(fixes.length / 5)) {
                A320_Neo_CDU_SelectWptPage.ShowPage(mcdu, orderedWaypoints, callback, page + 1);
            }
        };
    }
}
