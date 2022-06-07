class CDUSelectedNavaids {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.SelectedNavaids;

        let mode = "AUTO";
        if (mcdu.backupNavTuning) {
            mode = "RMP";
        } else if (mcdu.vor1IdIsPilotEntered || mcdu.vor1FreqIsPilotEntered ||
                    mcdu.vor2IdIsPilotEntered || mcdu.vor2FreqIsPilotEntered ||
                    mcdu._ilsFrequencyPilotEntered || mcdu._ilsIdentPilotEntered ||
                    mcdu.adf1IdIsPilotEntered || mcdu.adf1FreqIsPilotEntered ||
                    mcdu.adf2IdIsPilotEntered || mcdu.adf2FreqIsPilotEntered) {
            mode = "MAN";
        }

        mcdu.setTemplate([
            ["\xa0SELECTED NAVAIDS"],
            ["\xa0VOR/TAC", "DESELECT", mode],
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
            CDUDataIndexPage.ShowPage1(mcdu);
        };
    }
}
