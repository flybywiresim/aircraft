class CDUCommMenu {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUCommMenu.ShowPage(fmc, mcdu);
        }, 'ATSU');

        mcdu.setTemplate([
            ["COMM MENU"],
            ["\xa0VHF3[color]inop", "COMM\xa0[color]inop"],
            ["<DATA MODE[color]inop", "STATUS>[color]inop"],
            [""],
            [""],
            ["\xa0ATC ONLINE[color]inop"],
            ["<LIST[color]inop"],
            [""],
            [""],
            [""],
            ["", "MAINTENANCE>[color]inop"],
            ["\xa0ATC MENU"],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtsuMenu.ShowPage(fmc, mcdu);
        };
    }
}
