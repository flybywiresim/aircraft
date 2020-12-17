class CDUIdentPage {
    static ShowPage(mcdu) {
        const date = mcdu.getNavDataDateRange();
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.IdentPage;
        mcdu.activeSystem = 'FMGC';
        mcdu.setTemplate([
            ["A320-251N"],
            ["\xa0ENG"],
            ["LEAP 1A-26[color]green"],
            ["\xa0ACTIVE NAV DATA BASE"],
            ["\xa0" + date + "[color]cyan", "AIRAC[color]green"],
            ["\xa0SECOND NAV DATA BASE"],
            ["{small}{04MAY-04JUL{end}[color]cyan"],
            ["", "STORED"],
            ["", "{green}10{end}{small}RTES\xa0{end}{green}10{end}{small}RWYS{end}"],
            ["CHG CODE", "{big}{green}20{end}{end}WPTS\xa0{big}{green}20{end}{end}NAVS"],
            ["{small}[  ]{end}[color]cyan", "DELETE ALL}[color]cyan"],
            ["IDLE/PERF", "SOFTWARE"],
            ["+0.0/+0.0[color]green", "STATUS/XLOAD>"]
        ]);
    }
}
