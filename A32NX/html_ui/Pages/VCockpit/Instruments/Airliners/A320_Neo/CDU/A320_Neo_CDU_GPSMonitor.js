class CDUGPSMonitor {
    static ShowPage(mcdu) {
        let currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude")).toShortDegreeString();
        let TTRK = SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "radians") || "000";
        let GROUNDSPEED = SimVar.GetSimVarValue("GPS GROUND SPEED", "Meters per second") || "0";
        let ALTITUDE = SimVar.GetSimVarValue("INDICATED ALTITUDE", "Feet") || "0";

        var UTC_SECONDS  = Math.floor(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"));
        var hours = Math.floor(UTC_SECONDS / 3600) || 0
        var minutes = Math.floor(UTC_SECONDS % 3600 / 60) || 0
        var seconds = Math.floor(UTC_SECONDS % 3600 % 60) || 0

        var UTC = `${hours.toString().padStart(2, "0") || "00"}:${minutes.toString().padStart(2, "0") || "00"}:${seconds.toString().padStart(2, "0") || "00"}`

        mcdu.clearDisplay()
        mcdu.setTemplate([
            ["GPS MONITOR"],
            ["GPS1 POSITION"],
            [`${currPos}[color]green`],
            ["TTRK", "GS", "UTC"],
            [`${Math.round(TTRK)}[color]green`, `${Math.round(GROUNDSPEED)}[color]green`, `${UTC}[color]green`],
            ["MERIT", "MODE/SAT", "GPS ALT"],
            [`${Math.floor(Math.random() * 10) + 40}FT[color]green`, `NAV/${Math.floor(Math.random()*5) + 8}[color]green`, `${Math.round(ALTITUDE)}[color]green`],
            ["GPS2 POSITION"],
            [`${currPos}[color]green`],
            ["TTRK", "GS", "UTC"],
            [`${Math.round(TTRK)}[color]green`, `${Math.round(GROUNDSPEED)}[color]green`, `${UTC}[color]green`],
            ["MERIT", "MODE/SAT", "GPS ALT"],
            [`${Math.floor(Math.random() * 10) + 40}FT[color]green`, `NAV/${Math.floor(Math.random()*5) + 8}[color]green`, `${Math.round(ALTITUDE)}[color]green`]
        ])
    }
}