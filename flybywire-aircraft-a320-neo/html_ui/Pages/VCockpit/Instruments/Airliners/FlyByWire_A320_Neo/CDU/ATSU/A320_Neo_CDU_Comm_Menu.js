class CDUCommMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["COMM MENU"],
            ["\xa0VHF3[color]inop", "COMM\xa0[color]inop"],
            ["<DATA MODE[color]inop", "CONFIG>[color]inop"],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["", "MAINTENANCE>[color]inop"],
            [""],
            [""],
            ["\xa0ATC MENU", "AUTO PRINT\xa0[color]inop"],
            ["<RETURN", "SET ON\xa0[color]inop"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtsuMenu.ShowPage(mcdu);
        };
    }
}
