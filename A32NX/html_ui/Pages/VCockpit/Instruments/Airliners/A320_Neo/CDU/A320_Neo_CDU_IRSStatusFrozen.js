class CDUIRSStatusFrozen {
    static ShowPage(mcdu, index, wind_dir) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.IRSStatusFrozen;
        let currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"),
            SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude")).toShortDegreeString();
        if (currPos.includes("N")) {
            var currPosSplit = currPos.split("N");
            var sep = "N/";
        } else {
            var currPosSplit = currPos.split("S");
            var sep = "S/";
        }
        const latStr = currPosSplit[0];
        const lonStr = currPosSplit[1];
        currPos = latStr + sep + lonStr;
        const GROUNDSPEED = SimVar.GetSimVarValue("GPS GROUND SPEED", "Meters per second") || "0";
        const THDG = SimVar.GetSimVarValue("GPS GROUND TRUE HEADING", "radians") || "000";
        const TTRK = SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "radians") || "000";
        const MHDG = SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "radians") || "000";
        const WIND_VELOCITY = SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "Knots") || "00";
        const UTC_SECONDS = Math.floor(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"));
        const hours = Math.floor(UTC_SECONDS / 3600) || 0;
        const minutes = Math.floor(UTC_SECONDS % 3600 / 60) || 0;
        const hhmm = `${hours.toString().padStart(2, "0") || "00"}${minutes.toString().padStart(2, "0") || "00"}`;

        mcdu.setTemplate([
            [`IRS${index} FROZEN AT ${hhmm}`],
            ["POSITION"],
            [`${currPos}[color]green`],
            ["TTRK", "GS"],
            [`${Math.round(TTRK)}[color]green`, `${Math.round(GROUNDSPEED)}[color]green`],
            [`THDG`, "MHDG"],
            [`${Math.round(THDG)}[color]green`, `${Math.round(MHDG)}[color]green`],
            ["WIND", "GPIRS ACCUR"],
            [`${Math.round(wind_dir)}°/${Math.round(WIND_VELOCITY)}[color]green`, `200FT[color]green`],
            ["GPIRS POSITION"],
            [`${currPos}[color]green`],
            ["", ""],
            ["{UNFREEZE[color]blue", `${index < 3 ? "NEXT IRS>" : "RETURN>"}`]
        ]);

        mcdu.onLeftInput[5] = () => {
            CDUIRSStatus.ShowPage(mcdu, index);
        };

        mcdu.onRightInput[5] = () => {
            if (index > 2) {
                CDUIRSMonitor.ShowPage(mcdu);
            } else {
                CDUIRSStatus.ShowPage(mcdu, index + 1);
            }
        };
    }
}