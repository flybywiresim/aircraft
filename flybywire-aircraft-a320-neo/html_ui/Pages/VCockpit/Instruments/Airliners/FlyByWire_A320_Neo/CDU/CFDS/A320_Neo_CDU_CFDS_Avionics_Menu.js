class CDUCfdsAvionicsMenu {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUCfdsAvionicsMenu.ShowPage(fmc, mcdu);
        });
        mcdu.setTemplate([
            ["AVIONICS STATUS", "1", "2"],
            [""],
            ["NO GPCU DATA"],
            [""],
            ["ADF 1 (CLASS 3)"],
            [""],
            ["FMGC"],
            [""],
            ["VHF"],
            [""],
            ["AIDS"],
            [""],
            ["<RETURN[color]cyan", "PRINT*[color]inop"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[5] = () => {
            CDUCfdsMainMenu.ShowPage(fmc, mcdu);
        };

        // PAGE SWITCHING
        mcdu.onPrevPage = () => {
            CDUCfdsAvionicsMenu.ShowPage2(fmc, mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsAvionicsMenu.ShowPage2(fmc, mcdu);
        };
    }

    static ShowPage2(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUCfdsAvionicsMenu.ShowPage2(fmc, mcdu);
        });
        mcdu.setTemplate([
            ["AVIONICS STATUS", "2", "2"],
            [""],
            ["NO ILS DATA"],
            [""],
            ["DMC (CLASS 3)"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN[color]cyan", "PRINT*[color]inop"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[5] = () => {
            CDUCfdsMainMenu.ShowPage(fmc, mcdu);
        };

        // PAGE SWITCHING
        mcdu.onPrevPage = () => {
            CDUCfdsAvionicsMenu.ShowPage(fmc, mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsAvionicsMenu.ShowPage(fmc, mcdu);
        };
    }
}
