class CDUIdentPage {
    static ShowPage(mcdu) {
        const date = mcdu.getNavDataDateRange();
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["A320"],
            ["ENG"],
            ["LEAP A-1[color]green"],
            ["", "", "ACTIVE NAV DATA BASE"],
            [date + "[color]blue", "AIRAC"],
            ["", "", "SECOND NAV DATA BASE"],
            ["{" + date + "4MAY-4JUL[color]blue"],
            [""],
            [""],
            ["CHG CODE"],
            ["FBW"],
            ["IDLE/PERF", "SOFTWARE"],
            ["+0.0/+2.4[color]green", "STATUS/XLOAD>"]
        ]);
    }
}
//# sourceMappingURL=A320_Neo_CDU_IdentPage.js.map