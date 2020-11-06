class CDUGPSMonitor {
    static ShowPage(mcdu, merit1, merit2, sat1, sat2) {
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
        const TTRK = SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "radians") || "000";
        const GROUNDSPEED = SimVar.GetSimVarValue("GPS GROUND SPEED", "Meters per second") || "0";
        const ALTITUDE = SimVar.GetSimVarValue("INDICATED ALTITUDE", "Feet") || "0";

        const UTC_SECONDS = Math.floor(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"));
        const hours = Math.floor(UTC_SECONDS / 3600) || 0;
        const minutes = Math.floor(UTC_SECONDS % 3600 / 60) || 0;
        const seconds = Math.floor(UTC_SECONDS % 3600 % 60) || 0;

        const UTC = `${hours.toString().padStart(2, "0") || "00"}:${minutes.toString().padStart(2, "0") || "00"}:${seconds.toString().padStart(2, "0") || "00"}`;

        if (typeof merit1 == 'undefined') {
            merit1 = Math.floor(Math.random() * 10) + 40;
            merit2 = Math.floor(Math.random() * 10) + 40;
            sat1 = Math.floor(Math.random() * 5) + 8;
            sat2 = Math.floor(Math.random() * 5) + 8;
        }

        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.GPSMonitor;
        // ideally, this would update with the same frequency (is it known?) as the A320 GPS
        mcdu.refreshPageCallback = () => {
            CDUGPSMonitor.ShowPage(mcdu, merit1, merit2, sat1, sat2);
        };
        SimVar.SetSimVarValue("L:FMC_UPDATE_CURRENT_PAGE", "number", 1);

        mcdu.setTemplate([
            ["GPS MONITOR"],
            ["GPS1 POSITION"],
            [`${currPos}[color]green`],
            ["TTRK", "GS", "UTC"],
            [`${Math.round(TTRK)}[color]green`, `${Math.round(GROUNDSPEED)}[color]green`, `${UTC}[color]green`],
            ["MERIT", "MODE/SAT", "GPS ALT"],
            [`${merit1}FT[color]green`, `NAV/${sat1}[color]green`, `${Math.round(ALTITUDE)}[color]green`],
            ["GPS2 POSITION"],
            [`${currPos}[color]green`],
            ["TTRK", "GS", "UTC"],
            [`${Math.round(TTRK)}[color]green`, `${Math.round(GROUNDSPEED)}[color]green`, `${UTC}[color]green`],
            ["MERIT", "MODE/SAT", "GPS ALT"],
            [`${merit2}FT[color]green`, `NAV/${sat2}[color]green`, `${Math.round(ALTITUDE)}[color]green`]
        ]);
    }
}