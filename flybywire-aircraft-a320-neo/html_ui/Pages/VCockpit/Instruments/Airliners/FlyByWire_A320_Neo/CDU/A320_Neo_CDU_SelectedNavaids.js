class CDUSelectedNavaids {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUSelectedNavaids.ShowPage(fmc, mcdu);
        });

        mcdu.setTemplate([
            ["\xa0SELECTED NAVAIDS"],
            ["\xa0VOR/TAC", "DESELECT", "AUTO"],
            [``, `[\xa0\xa0\xa0]{small}*{end}[color]cyan`, ""],
            [""],
            [""],
            [""],
            [""],
            ["\xa0ILS", "", "AUTO"],
            [``, ``, ""],
            ["\xa0RADIONAV SELECTED[color]cyan"],
            ["{DESELECT[color]inop"],
            ["\xa0GPS SELECTED[color]cyan"],
            ["{DESELECT[color]inop", "RETURN>"]
        ]);

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[5] = () => {
            CDUDataIndexPage.ShowPage1(fmc, mcdu);
        };
    }
}
