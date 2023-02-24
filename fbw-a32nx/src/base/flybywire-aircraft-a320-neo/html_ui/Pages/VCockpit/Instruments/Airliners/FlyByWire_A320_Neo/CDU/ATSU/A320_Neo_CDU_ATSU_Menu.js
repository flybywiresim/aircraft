class CDUAtsuMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATSUMenu;
        mcdu.activeSystem = 'ATSU';

        const display = [
            ['ATSU DATALINK'],
            [''],
            ['<ATC MENU'],
            [''],
            ['', 'AOC MENU>'],
            [''],
            [''],
            [''],
            [''],
            ['', 'DATALINK\xa0'],
            ['', 'STATUS>'],
            [''],
            ['', 'COMM MENU>'],
        ];
        mcdu.setTemplate(display);

        mcdu.leftInputDelay[0] = () => mcdu.getDelaySwitchPage();
        mcdu.onLeftInput[0] = () => {
            CDUAtcMenu.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[1] = () => mcdu.getDelaySwitchPage();
        mcdu.onRightInput[1] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[4] = () => mcdu.getDelaySwitchPage();
        mcdu.onRightInput[4] = () => {
            CDUAtsuDatalinkStatus.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[5] = () => mcdu.getDelaySwitchPage();
        mcdu.onRightInput[5] = () => {
            CDUCommMenu.ShowPage(mcdu);
        };
    }
}
