class CDUCommMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["COMM MENU"],
            ["VHF3[color]inop", "COMM[color]inop"],
            ["<DATA MODE[color]inop", "STATUS>[color]inop"],
            [""],
            [""],
            ["ATC ONLINE[color]inop"],
            ["<LIST[color]inop"],
            [""],
            [""],
            [""],
            ["", "MAINTENANCE>[color]inop"],
            ["ATC MENU"],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtsuMenu.ShowPage(mcdu);
        };
    }
}
