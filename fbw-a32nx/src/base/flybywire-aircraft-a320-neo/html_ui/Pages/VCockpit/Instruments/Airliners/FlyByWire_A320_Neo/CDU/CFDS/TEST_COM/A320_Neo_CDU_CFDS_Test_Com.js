class CDUCfdsTestCom {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST   }"],
            ["", "", "COM"],
            ["<AMU[color]inop", "CIDS 2>[color]inop"],
            [""],
            ["<RMP 1[color]inop", "HF 1>[color]inop"],
            [""],
            ["<RMP 2[color]inop", "HF 2>[color]inop"],
            [""],
            ["<RMP 3[color]inop", "VHF 1>[color]inop"],
            [""],
            ["<CIDS 1[color]inop", "VHF 2>[color]inop"],
            [""],
            ["<RETURN[color]cyan", "VHF 3>[color]inop"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestMenu.ShowPage(mcdu);
        };

        // PAGE SWITCHING
        mcdu.onPrevPage = () => {
            CDUCfdsTestCom.ShowPage2(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsTestCom.ShowPage2(mcdu);
        };
    }

    static ShowPage2(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST   }"],
            ["", "", "COM"],
            ["<ACARS MU[color]inop"],
            [""],
            ["<SDU[color]inop"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN[color]cyan"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestMenu.ShowPage(mcdu);
        };

        // PAGE SWITCHING
        mcdu.onPrevPage = () => {
            CDUCfdsTestCom.ShowPage(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsTestCom.ShowPage(mcdu);
        };
    }
}
