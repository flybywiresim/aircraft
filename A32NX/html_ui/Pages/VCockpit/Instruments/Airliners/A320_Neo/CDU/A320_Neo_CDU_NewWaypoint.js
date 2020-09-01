class CDUNewWaypoint {
    static ShowPage(mcdu) {
        mcdu.clearDisplay()
        mcdu.setTemplate([
            ["NEW WAYPOINT"],
            ["IDENT"],
            ["□□□□□□□[color]red"],
            ["LAT/LONG"],
            ["□□□□.□□/□□□□□.□□[color]red"],
            ["PLACE/BRG /DIST"],
            ["□□□□□□□/□□□° /□□□. □[color]red"],
            ["PLACE-BRG  /PLACE-BRG"],
            ["□□□□□-□□□°  /□□□□□-□□□°"],
            [""],
            ["", "RETURN>"],
            [""],
            [""]
        ])

        mcdu.onRightInput[4] = () => {
            CDUPilotsWaypoint.ShowPage(mcdu)
        }
    }
}