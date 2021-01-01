class CDUIdentPage {
    static ShowPage(mcdu) {
        const date = getNavDataDateRange();
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.IdentPage;
        mcdu.activeSystem = 'FMGC';
        mcdu.setTemplate([
            ["A320-200"],
            ["\xa0ENG"],
            ["LEAP 1A-26[color]green"],
            ["\xa0ACTIVE NAV DATA BASE"],
            ["\xa0" + (date.length === 13 ? date[3] + date[4] + date[0] + date[1] + date[2] + "-" + date[8] + date[9] + date[5] + date[6] + date[7] : date) + "[color]cyan", "AIRAC[color]green"],
            ["\xa0SECOND NAV DATA BASE"],
            ["{small}{04MAY-04JUL{end}[color]cyan"],
            ["", "STORED"],
            ["", "{green}10{end}{small}RTES\xa0{end}{green}10{end}{small}RWYS{end}"],
            ["CHG CODE", "[b-text]{big}{green}20{end}{end}WPTS\xa0{big}{green}20{end}{end}NAVS"],
            ["{small}[  ]{end}[color]cyan", "DELETE ALL}[color]cyan"],
            ["IDLE/PERF", "SOFTWARE"],
            ["+0.0/+0.0[color]green", "STATUS/XLOAD>"]
        ]);
    }
}
