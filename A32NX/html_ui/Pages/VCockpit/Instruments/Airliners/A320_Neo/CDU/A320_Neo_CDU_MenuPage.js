class CDUMenuPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["A320"],
            ["ENG"],
            ["LEAP A-1"],
            ["ACTIVE DATA BASE"],
            ["4MAY-4JUL[color]blue", "TC11103001"],
            ["SECOND DATA BASE"],
            ["←4MAY-4JUL[color]blue"],
            [""],
            [""],
            [""],
            [""],
            ["", "PERF FACTOR"],
            ["", "0.0"]
        ]);
    }
}