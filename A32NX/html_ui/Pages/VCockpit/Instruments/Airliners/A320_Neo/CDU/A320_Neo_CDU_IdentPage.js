class CDUIdentPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'FMGC';
        mcdu.setTemplate([
            ["A320-200"],
            [" ENG"],
            ["LEAP-1A26[color]green"],
            ["", "", " ACTIVE NAV DATA BASE"],
            [" 8OCT-5NOV[color]blue", "TC11103001[color]green"],
            ["", "", " SECOND NAV DATA BASE"],
            ["{8OCT-5NOV[s-text][color]blue"],
            [""],
            [""],
            ["CHG CODE"],
            ["[  ][color]blue"],
            ["IDLE/PERF", "SOFTWARE"],
            ["+0.0/+0.0[color]green", "STATUS/XLOAD>"]
        ]);
    }
}