/*
    Displays blank waypoint field, when waypoint inputted, LAT, LONG will show.
    Derives from Data Index PG2
*/

class CDUWaypointPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay()

        mcdu.setTemplate([
            ["WAYPOINT"],
            ["IDENT"],
            ["□□□□□□□[color]red"],
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
        ])

        mcdu.onLeftInput[0] = () => {
            let INPUT = mcdu.inOut;
            mcdu.clearUserInput()

            var selectedWaypoint = mcdu.getOrSelectWaypointByIdent(INPUT, res => {
                if(res) {
                    mcdu.clearDisplay()
                    mcdu.setTemplate([
                        ["WAYPOINT"],
                        ["IDENT"],
                        [`${INPUT}`],
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
                    ])
                } else {
                    mcdu.inOut = "INVALID ENTRY";
                }
            })
        }
    }
}