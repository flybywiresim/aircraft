class CDUCfdsAvionicsMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
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
            ["<RETURN[color]blue", "PRINT*[color]blue"]
        ]);

        // INOP BUTTONS
        mcdu.onRightInput[5] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }

        // IMPLEMENTED BUTTONS
        mcdu.onLeftInput[5] = () => {
            CDUCfdsMainMenu.ShowPage(mcdu);
        }

        // PAGE SWITCHING
        mcdu.onPrevPage = () => {
            CDUCfdsAvionicsMenu.ShowPage2(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsAvionicsMenu.ShowPage2(mcdu);
        };
    }

    static ShowPage2(mcdu) {
        mcdu.clearDisplay();
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
            ["<RETURN[color]blue", "PRINT*[color]blue"]
        ]);

         // INOP BUTTONS
        mcdu.onRightInput[5] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }

        // IMPLEMENTED BUTTONS
        mcdu.onLeftInput[5] = () => {
            CDUCfdsMainMenu.ShowPage(mcdu);
        }
        
        // PAGE SWITCHING
        mcdu.onPrevPage = () => {
            CDUCfdsAvionicsMenu.ShowPage(mcdu);
        };
        mcdu.onNextPage = () => {
            CDUCfdsAvionicsMenu.ShowPage(mcdu);
        };
    }
}