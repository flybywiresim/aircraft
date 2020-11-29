class CDUSelectedNavaids {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.SelectedNavaids;

        mcdu.setTemplate([
            ["SELECTED NAVAIDS"],
            ["VOR/TAC", "DESELECT", "AUTO"],
            [``, `[  ]*[color]cyan`, ""],
            [""],
            [""],
            [""],
            [""],
            ["ILS", "", "AUTO"],
            [``, ``, ""],
            ["RADIONAV SELECTED[color]cyan"],
            ["DESELECT"],
            ["GPS SELECTED[color]cyan"],
            ["DESELECT", "RETURN>"]
        ]);

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[5] = () => {
            CDUDataIndexPage.ShowPage1(mcdu);
        };
    }
}
