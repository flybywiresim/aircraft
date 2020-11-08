class CDUCfdsTestNav {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST   }"],
            ["", "", "NAV"],
            ["<ADR 1[color]inop", "IR 3>[color]inop"],
            [""],
            ["<IR 1[color]inop", "RA 1>[color]inop"],
            [""],
            ["<ADR 2[color]inop", "RA 2>[color]inop"],
            [""],
            ["<IR 2[color]inop", "DME 1>[color]inop"],
            [""],
            ["<ADR 3[color]inop", "DME 2>[color]inop"],
            [""],
            ["<RETURN[color]blue", "MMR 1>[color]inop"]
        ]);

        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestMenu.ShowPage(mcdu);
        };

        // PAGE SWITCHING
        mcdu.onPrevPage = () => {
            CDUCfdsTestNav.ShowPage3(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsTestNav.ShowPage2(mcdu);
        };
    }

    static ShowPage2(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST   }"],
            ["", "", "NAV"],
            ["<MMR 2[color]inop", "ADF 1>[color]inop"],
            [""],
            ["<VOR 1[color]inop", "ADF 2>[color]inop"],
            [""],
            ["<VOR 2[color]inop", "ATC 1>[color]inop"],
            [""],
            ["<RADAR 1[color]inop", "ATC 2>[color]inop"],
            [""],
            [""],
            [""],
            ["<RETURN[color]blue"]
        ]);

        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestMenu.ShowPage(mcdu);
        };

        // PAGE SWITCHING
        mcdu.onPrevPage = () => {
            CDUCfdsTestNav.ShowPage(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsTestNav.ShowPage3(mcdu);
        };
    }

    static ShowPage3(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST  }"],
            ["", "", "NAV"],
            ["<HUD[color]inop", "ISIS>[color]inop"],
            [""],
            ["<GPWC[color]inop", "OANS>[color]inop"],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<TCAS[color]inop"],
            [""],
            ["<RETURN[color]blue"]
        ]);

        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestMenu.ShowPage(mcdu);
        };

        // PAGE SWITCHING
        mcdu.onPrevPage = () => {
            CDUCfdsTestNav.ShowPage2(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsTestNav.ShowPage(mcdu);
        };
    }
}