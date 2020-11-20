class CDUAtcEmergency {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["EMERGENCY[color]red"],
            ["", "EMERG ADS: OFF"],
            ["<MAYDAY[color]blue", "SET ON*[color]blue"],
            ["", "DESCENDING TO"],
            ["<PANPAN", "_____[color]red"],
            ["", "DIVERTING VIA"],
            ["", "____/____[color]red"],
            ["VOICE[color]blue", "FREQ"],
            ["CONTACT[color]blue", "121.5[color]blue"],
            ["ALL FIELDS"],
            ["*ERASE", "ADD TEXT>[color]inop"],
            ["ATC MENU", "ATC[color]blue"],
            ["<RETURN", "EMERG DISPL*[color]blue"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage1(mcdu);
        };
    }
}
