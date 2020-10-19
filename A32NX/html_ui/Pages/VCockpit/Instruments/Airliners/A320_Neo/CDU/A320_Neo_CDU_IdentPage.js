class CDUIdentPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["A320-200"],
            [" ENG"],
            ["LEAP-1A26[color]green"],
            ["", "", " ACTIVE NAV DATA BASE"],
            [" 4MAY-4JUL[color]blue", "TC11103001[color]green"],
            ["", "", " SECOND NAV DATA BASE"],
            ["{4MAY-4JUL[s-text][color]blue"],
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