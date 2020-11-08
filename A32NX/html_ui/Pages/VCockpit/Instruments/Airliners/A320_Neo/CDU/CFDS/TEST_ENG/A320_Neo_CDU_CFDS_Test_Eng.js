class CDUCfdsTestEng {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST"],
            ["", "", "ENG"],
            ["<EIU 1[color]inop", "EIU 2>[color]inop"],
            [""],
            ["<FADEC 1A[color]inop", "FADEC 1B>[color]inop"],
            [""],
            ["<FADEC 2A[color]inop", "FADEC 2B>[color]inop"],
            [""],
            ["<EVMU[color]inop"],
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