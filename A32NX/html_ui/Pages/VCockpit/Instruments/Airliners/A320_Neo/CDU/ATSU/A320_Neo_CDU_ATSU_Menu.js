class CDUAtsuMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'ATSU';
        const display = [
            ["ATSU DATALINK"],
            [""],
            ["<ATC MENU[color]inop"],
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

        mcdu.onRightInput[1] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };
    }
}