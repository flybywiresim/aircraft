class CDUCfdsTestPneu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST"],
            ["", "", "PNEU"],
            ["<BMC 1[color]inop"],
            [""],
            ["<BMC 2[color]inop"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN[color]blue"]
        ]);

        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestMenu.ShowPage2(mcdu);
        };
    }
}