class CDUIRSStatus {
    static ShowPage(mcdu, index) {
        mcdu.clearDisplay()
        mcdu.refreshPageCallback = () => {
            CDUIRSStatus.ShowPage(mcdu, index);
        }
        SimVar.SetSimVarValue("L:FMC_UPDATE_CURRENT_PAGE", "number", 1);
        let currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"),
                                  SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude")).toShortDegreeString();
        if (currPos.includes("N")) {
            var currPosSplit = currPos.split("N")
            var sep = "N/"
        } else {
            var currPosSplit = currPos.split("S")
            var sep = "S/"
        }
        let latStr = currPosSplit[0]
        let lonStr = currPosSplit[1]
        currPos = latStr + sep + lonStr
        let GROUNDSPEED = SimVar.GetSimVarValue("GPS GROUND SPEED", "Meters per second") || "0";
        let THDG = SimVar.GetSimVarValue("GPS GROUND TRUE HEADING", "radians") || "000";
        let TTRK = SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "radians") || "000";
        let MHDG = SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "radians") || "000";
        let WIND_DIR = SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "Degrees") || "000";
        let WIND_VELOCITY = SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "Knots") || "00";
        mcdu.setTemplate([
            [`IRS${index}`],
            ["POSITION"],
            [`${currPos}[color]green`],
            ["TTRK", "GS"],
            [`${Math.round(TTRK)}[color]green`, `${Math.round(GROUNDSPEED)}[color]green`],
            [`THDG`, "MHDG"],
            [`${Math.round(THDG)}[color]green`, `${Math.round(MHDG)}[color]green`],
            ["WIND", "GPIRS ACCUR"],
            [`${Math.round(WIND_DIR)}°/${Math.round(WIND_VELOCITY)}[color]green`, `200FT[color]green`],
            ["GPIRS POSITION"],
            [`${currPos}[color]green`],
            ["", ""],
            ["←FREEZE[color]blue", `${index<3 ? "NEXT IRS>" : "RETURN>"}`]
        ])

        mcdu.onLeftInput[5] = () => {
            CDUIRSStatusFrozen.ShowPage(mcdu, index);
        }

        mcdu.onRightInput[5] = () => {
            if (index>2) {
                CDUIRSMonitor.ShowPage(mcdu);
            } else {
                this.ShowPage(mcdu, index+1)
            }
        }
    }
}