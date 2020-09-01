class CDUAtsuMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
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
            ["", "DATALINK"],
            ["", "STATUS>"],
            [""],
            ["", "COMM MENU"]
        ];
        mcdu.setTemplate(display);

        mcdu.onRightInput[1] = () => {
            CDUAocMenu.ShowPage(mcdu);
        }

        mcdu.onLeftInput[1] = () => {
            // Pass
        }
    }
}