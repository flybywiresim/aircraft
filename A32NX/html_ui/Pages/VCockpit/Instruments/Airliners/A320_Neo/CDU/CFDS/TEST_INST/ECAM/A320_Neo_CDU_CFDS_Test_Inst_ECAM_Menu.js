class CDU_CFDS_Test_Inst_ECAM_Menu {
    static ShowPage(mcdu, ecamIndex) {
        mcdu.clearDisplay();
        const title = "ECAM-" + ecamIndex;
        mcdu.setTemplate([
            [title],
            ["", "", "FWC1/2-SDAC1/2-ECP"],
            ["<LAST LEG REPORT"],
            [""],
            ["<PREVIOUS LEGS REPORT"],
            [""],
            ["<LRU IDENTIFICATION"],
            [""],
            ["<GROUND SCANNING"],
            [""],
            ["<CLASS 3 FAULTS"],
            [""],
            ["<RETURN[color]blue"]
        ]);

        // INOP BUTTONS
        mcdu.onLeftInput[0] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[1] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[2] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[3] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[4] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }

        // IMPLEMENTED BUTTONS
        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestInst.ShowPage(mcdu);
        }

    }
}