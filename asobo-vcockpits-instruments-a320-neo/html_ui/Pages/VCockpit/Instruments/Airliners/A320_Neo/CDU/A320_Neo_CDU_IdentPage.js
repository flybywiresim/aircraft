class CDUIdentPage {
    static ShowPage(mcdu) {
        const date = mcdu.getNavDataDateRange();
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["A320"],
            ["ENG"],
            ["LEAP A-1"],
            ["ACTIVE DATA BASE"],
            [date + "[color]blue", "AIRAC"],
            ["SECOND DATA BASE"],
            ["←" + date + "[color]blue"],
            [""],
            [""],
            [""],
            [""],
            ["", "PERF FACTOR"],
            ["", "0.0"]
        ]);
    }
}
//# sourceMappingURL=A320_Neo_CDU_IdentPage.js.map