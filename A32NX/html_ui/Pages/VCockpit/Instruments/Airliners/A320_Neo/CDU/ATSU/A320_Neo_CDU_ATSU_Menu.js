class CDUAtsuMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'ATSU';
        const display = [
            ["ATSU DATALINK"],
            [""],
            ["<ATC MENU"],
            [""],
            ["", "AOC MENU>"],
            [""],
            [""],
            [""],
            [""],
            ["", "DATALINK[color]inop"],
            ["", "STATUS>[color]inop"],
            [""],
            ["", "COMM MENU[color]inop"]
        ];
        mcdu.setTemplate(display);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[0] = () => {
            CDUAtcMenu.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[1] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };
    }
}
