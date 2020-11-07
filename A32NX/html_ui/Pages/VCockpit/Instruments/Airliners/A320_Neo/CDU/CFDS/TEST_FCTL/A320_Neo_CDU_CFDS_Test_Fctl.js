class CDUCfdsTestFctl {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST"],
            ["", "", "F/CTL"],
            ["<EFCS1[color]inop"],
            [""],
            ["<EFCS2[color]inop"],
            [""],
            ["<SFCC1[color]inop"],
            [""],
            ["<SFCC2[color]inop"],
            [""],
            [""],
            [""],
            ["<RETURN[color]blue"]
        ]);

        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestMenu.ShowPage(mcdu);
        };
    }
}