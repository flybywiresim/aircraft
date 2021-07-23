class CDUDatalinkStatus {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUDatalinkStatus.ShowPage(fmc, mcdu);
        });
        mcdu.setTemplate([
            ["DATALINK STATUS"],
            [""],
            ["\xa0VHF3:{small}{green}DLK AVAIL{end}{end}"],
            ["\xa0\xa0\xa0\xa0\xa0ATC / AOC"],
            [""],
            [""],
            ["\xa0HF:{small}NOT INSTALLED{end}"],
            [""],
            [""],
            [""],
            ["\xa0SATCOM:{small}NOT INSTALLED{end}"],
            ["", "PAGE\xa0[color]inop"],
            ["<RETURN", "PRINT*[color]inop"]
        ], true);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtsuMenu.ShowPage(fmc, mcdu);
        };
    }
}
