class CDUIdentPage {
    static ShowPage(mcdu) {
        const date = mcdu.getNavDataDateRange();
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.IdentPage;
        mcdu.activeSystem = 'FMGC';
        mcdu.setTemplate([
            ["A320-200"],
            ["ENG"],
            ["LEAP 1A-26[color]green"],
            ["", "", "ACTIVE NAV DATA BASE"],
            [date + "[color]blue", "AIRAC"],
            ["", "", "SECOND NAV DATA BASE"],
            ["{" + date + "4MAY-4JUL[color]blue"],
            [""],
            [""],
            ["CHG CODE"],
            ["[  ][color]blue"],
            ["IDLE/PERF", "SOFTWARE"],
            ["+0.0/+0.0[color]green", "STATUS/XLOAD>"]
        ]);
    }
}
//# sourceMappingURL=A320_Neo_CDU_IdentPage.js.map