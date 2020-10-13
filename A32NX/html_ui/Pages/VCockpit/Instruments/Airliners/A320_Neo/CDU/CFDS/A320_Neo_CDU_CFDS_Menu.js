class CDUCfdsMainMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'CFDS';
        mcdu.setTemplate([
            ["CFDS"],
            [""],
            ["<LAST LEG REPORT"],
            [""],
            ["<LAST LEG ECAM REPORT"],
            [""],
            ["<PREVIOUS LEGS REPORT"],
            [""],
            ["<AVIONICS STATUS"],
            [""],
            ["<SYSTEM REPORT / TEST"],
            ["", "", "POST"],
            ["*SEND[color]blue", "PRINT*[color]blue", "FLT REP"]
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
        mcdu.onLeftInput[3] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onLeftInput[5] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onRightInput[5] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }

        // IMPLEMENTED BUTTONS
        mcdu.onLeftInput[4] = () => {
            CDUCfdsTestMenu.ShowPage(mcdu);
        }
    }
}