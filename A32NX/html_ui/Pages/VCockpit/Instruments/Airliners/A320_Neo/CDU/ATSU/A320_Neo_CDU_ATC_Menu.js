class CDUAtcMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["ATC MENU"],
            [""],
            ["<LAT REQ", "VET REQ>"],
            ["", "RECEIVED"],
            ["<WX REQUEST", "MESSAGES>"],
            ["", "SENT"],
            ["<ATIS", "MESSAGES>"],
            [""],
            ["<FUEL[color]inop", "BOARDING>[color]inop"],
            [""],
            ["<PERF/W&B[color]inop", "DIVERSION>[color]inop"],
            ["ATSU DLK"],
            ["<RETURN", "MISC>[color]inop"]
        ]);
    }
}
