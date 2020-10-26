class CDUCfdsMainMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'CFDS';
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
            ["*SEND[color]blue", "PRINT*[color]blue", "FLT REP"]
        ]);

        mcdu.onLeftInput[3] = () => {
            CDUCfdsAvionicsMenu.ShowPage(mcdu);
        };
        mcdu.onLeftInput[4] = () => {
            CDUCfdsTestMenu.ShowPage(mcdu);
        };

        // PAGE SWITCHING
        mcdu.onPrevPage = () => {
            CDUCfdsMainMenu.ShowPage2(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsMainMenu.ShowPage2(mcdu);
        };
    }

    static ShowPage2(mcdu) {
        mcdu.clearDisplay();

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
            CDUCfdsMainMenu.ShowPage(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsMainMenu.ShowPage(mcdu);
        };
    }
}