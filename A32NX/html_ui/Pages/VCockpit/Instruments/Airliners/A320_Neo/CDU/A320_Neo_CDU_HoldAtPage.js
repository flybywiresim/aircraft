class CDUHoldAtPage {
    static ShowPage(mcdu, waypoint, waypointIndexFP) {
        mcdu.clearDisplay();
        let waypointIdent = "---";
        if (waypoint) {
            waypointIdent = waypoint.ident;
        }

        let holdCourse = 100
        if (mcdu.holdCourse) {
            holdCourse = mcdu.holdCourse
        }

        let holdTurn = "R"
        if (mcdu.holdTurn) {
            holdTurn = mcdu.holdTurn
        }

        let timeComp = "0.0";
        let distComp = "0.0";
        if (mcdu.timeComp) {
            timeComp = mcdu.timeComp
            distComp = mcdu.distComp
        }    

        let rteRsvWeight = mcdu.getRouteReservedWeight();
        let resFuel = "0.0"
        if (!isNaN(rteRsvWeight)) {
            resFuel = rteRsvWeight.toFixed(1);
        }

        let exitTime = "0000"
        exitTime = FMCMainDisplay.secondsTohhmm(mcdu.flightPlanManager.getDestination().estimatedTimeOfArrivalFP);

        mcdu.setTemplate([
            ["HOLD AT " + waypointIdent],
            ["INB CRS", "", ""],
            [holdCourse +"°[color]blue", "", ""],
            ["TURN", "", ""],
            [holdTurn + "[color]blue", "", ""],
            ["TIME/DIST", "", ""],
            [timeComp + "/" + distComp + "[color]blue", "", ""],
            [""],
            ["","LAST EXIT", ""],
            ["","UTC FUEL", ""],
            ["", exitTime + " " +  resFuel + "[color]red",""],
            ["TMPY[color]yellow", "TMPY[color]yellow"],
            ["<F-PLN[color]yellow", "INSERT*[color]yellow"]
        ]);

        mcdu.onLeftInput[0] = () => {
                let value = mcdu.inOut;
                if (isNaN(value) || 0 < value > 360) {
                    mcdu.inOut = "NaN"
                    return;
                }
                mcdu.clearUserInput();
                mcdu.holdCourse = value
                CDUHoldAtPage.ShowPage(mcdu, waypoint, waypointIndexFP);
        };

        mcdu.onLeftInput[1] = () => {
            let value = mcdu.inOut;
            if (value != "L" && value != "R") {
                mcdu.inOut = "ERR FMT"
                return;
            }
            mcdu.clearUserInput();
            mcdu.holdTurn = value
            CDUHoldAtPage.ShowPage(mcdu, waypoint, waypointIndexFP);
        };

        mcdu.onLeftInput[2] = () => {
            let value = mcdu.inOut;
            
            if (!value.includes("/")) {
                mcdu.inOut = "ERR FMT"
                return;
            }
            let comps = value.split("/", 2);
            if (comps.length != 2) {
                mcdu.inOut = "ERR INPUT"
                return;
            }

            if (isNaN(comps[0]) || isNaN(comps[1])) {
                mcdu.inOut = "NaN"
                return
            }

            mcdu.clearUserInput();
            mcdu.timeComp = comps[0]
            mcdu.distComp = comps[1]
            CDUHoldAtPage.ShowPage(mcdu, waypoint, waypointIndexFP);
        };

        mcdu.onLeftInput[5] = () => { 
            mcdu.holdCourse = null
            mcdu.timeComp = null 
            mcdu.distComp = null
            mcdu.holdTurn = null
            CDULateralRevisionPage.ShowPage(mcdu, waypoint, waypointIndexFP); 
        };
    }
}
//# sourceMappingURL=A320_Neo_CDU_HoldAtPage.js.map