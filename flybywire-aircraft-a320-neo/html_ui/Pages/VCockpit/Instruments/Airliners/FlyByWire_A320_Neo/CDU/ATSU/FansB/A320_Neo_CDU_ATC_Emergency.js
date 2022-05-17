class CDUAtcEmergencyFansB {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCEmergency;

        mcdu.setTemplate([
            ["{amber}EMERGENCY{end}"],
            ["", "EMERG ADS-C:OFF\xa0"],
            ["", "{inop}SET ON*{end}"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["\xa0ATC MENU"],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage(mcdu);
        };
    }
}
