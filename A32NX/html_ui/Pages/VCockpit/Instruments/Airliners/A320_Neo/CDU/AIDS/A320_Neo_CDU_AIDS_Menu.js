class CDU_AIDS_MainMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'AIDS';
        mcdu.setTemplate([
            ["AIDS"],
            ["CALL-UP[color]inop"],
            ["<PARAM[color]inop", "LOAD STATUS>[color]inop"],
            [""],
            ["<PROGRAMMING[color]inop"],
            ["", "LIST OF[color]inop"],
            ["<SAR[color]inop", "PREV REP>[color]inop"],
            ["", "STORED[color]inop"],
            ["", "REPORTS>[color]inop"],
            ["ASSIGNMENT[color]inop", "MAN REQST[color]inop"],
            ["<REMOTE PRINT[color]inop", "REPORTS>[color]inop"],
            ["", "POST[color]blue"],
            ["DAR = RUNNING[color]green", "STOP*[color]blue"]
        ]);

        mcdu.onRightInput[5] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        };
    }
}