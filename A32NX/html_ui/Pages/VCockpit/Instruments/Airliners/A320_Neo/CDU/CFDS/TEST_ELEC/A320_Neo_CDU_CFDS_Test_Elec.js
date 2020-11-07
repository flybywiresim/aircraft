class CDUCfdsTestElec {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST"],
            ["", "", "ELEC"],
            ["<AC GEN[color]inop", "TR 1>[color]inop"],
            [""],
            ["<GCU EMER[color]inop", "TR 2>[color]inop"],
            [""],
            ["<BCL 1[color]inop", "TR 3>[color]inop"],
            [""],
            ["<BCL 2[color]inop"],
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