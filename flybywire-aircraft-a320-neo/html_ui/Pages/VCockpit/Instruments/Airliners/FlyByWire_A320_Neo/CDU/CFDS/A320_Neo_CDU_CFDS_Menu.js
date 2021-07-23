class CDUCfdsMainMenu {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUCfdsMainMenu.ShowPage(fmc, mcdu);
        }, 'CFDS');

        mcdu.setTemplate([
            ["CFDS", "1", "2"],
            [""],
            ["<LAST LEG REPORT[color]inop"],
            [""],
            ["<LAST LEG ECAM REPORT[color]inop"],
            [""],
            ["<PREVIOUS LEGS REPORT[color]inop"],
            [""],
            ["<AVIONICS STATUS"],
            [""],
            ["<SYSTEM REPORT / TEST"],
            ["", "", "POST"],
            ["*SEND[color]cyan", "PRINT*[color]inop", "FLT REP"]
        ]);

        mcdu.leftInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[3] = () => {
            CDUCfdsAvionicsMenu.ShowPage(fmc, mcdu);
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUCfdsTestMenu.ShowPage(fmc, mcdu);
        };

        // PAGE SWITCHING
        mcdu.onPrevPage = () => {
            CDUCfdsMainMenu.ShowPage2(fmc, mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsMainMenu.ShowPage2(fmc, mcdu);
        };
    }

    static ShowPage2(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUCfdsMainMenu.ShowPage2(fmc, mcdu);
        }, 'CFDS');

        mcdu.setTemplate([
            ["CFDS", "2", "2"],
            [""],
            ["<GMT/DATE INIT[color]inop"],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<PFR FILTER PROGRAM[color]inop"],
            [""],
            ["<PASSWORD CHANGE[color]inop"],
            [""],
            [""]
        ]);

        // PAGE SWITCHING
        mcdu.onPrevPage = () => {
            CDUCfdsMainMenu.ShowPage(fmc, mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsMainMenu.ShowPage(fmc, mcdu);
        };
    }
}
