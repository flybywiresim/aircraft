class CDUAtcMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["ATC MENU"],
            [""],
            ["<LAT REQ", "VERT REQ>"],
            ["", ""],
            ["<WHEN CAN WE", "OTHER REQ>"],
            [""],
            ["", "TEXT>"],
            [""],
            ["<MSG RECORD", "REPORTS"],
            [""],
            ["<CONNECTION", ""],
            ["ATSU DLK"],
            ["<RETURN", "EMERGENCY>[color]red"]
        ]);
    }
}
