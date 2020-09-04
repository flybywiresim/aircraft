/*
    Displays blank navaid field, when navaid inputted, LAT, LONG will show.
    Derives from Data Index PG2
*/

class CDUNavaidPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay()

        mcdu.setTemplate([
            ["NAVAID"],
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
                        ["NAVAID"],
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
                    mcdu.inOut = Object.keys(res)
                } else {
                    mcdu.inOut = "INVALID ENTRY";
                }
            })
        }
    }
}