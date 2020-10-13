class CDU_AIDS_MainMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'AIDS';
        mcdu.setTemplate([
            ["AIDS"],
            ["CALL-UP"],
            ["<PARAM", "LOAD STATUS>"],
            [""],
            ["<PROGRAMMING"],
            ["", "LIST OF"],
            ["<SAR", "PREV REP>"],
            ["", "STORED"],
            ["", "REPORTS>"],
            ["ASSIGNMENT", "MAN REQST"],
            ["<REMOTE PRINT", "REPORTS>"],
            ["", "POST[color]blue"],
            ["DAR = RUNNING[color]green", "STOP*[color]blue"]
        ]);

        mcdu.onLeftInput[0] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onLeftInput[1] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onLeftInput[2] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onLeftInput[4] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onRightInput[0] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onRightInput[2] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onRightInput[3] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onRightInput[4] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onRightInput[5] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
    }
}