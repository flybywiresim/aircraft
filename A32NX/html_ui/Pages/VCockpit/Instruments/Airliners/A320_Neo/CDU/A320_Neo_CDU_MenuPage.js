class CDUMenuPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        const activeSystem = mcdu.activeSystem;
        let textATSU;
        let textFMGC;
        let textAIDS;
        let textCFDS;
        let textMaint;
        let textReturn;
        let selectedFMGC = false;
        let selectedATSU = false;
        let selectedCFDS = false;

        const updateView = () => {
            textFMGC = "<FMGC";
            textATSU = "<ATSU";
            textAIDS = "<AIDS";
            textCFDS = "<CFDS";
            textMaint = "MCDU MAINT>";
            textReturn = "RETURN>";
            if (activeSystem === "FMGC") textFMGC = "<FMGC[color]green";
            if (activeSystem === "ATSU") textATSU = "<ATSU[color]green";
            if (activeSystem === "CFDS") textCFDS = "<CFDS[color]green";
            if (selectedFMGC) textFMGC = "<FMGC (SEL)[color]blue";
            if (selectedATSU) textATSU = "<ATSU (SEL)[color]blue";
            if (selectedCFDS) textCFDS = "<CFDS (SEL)[color]blue";

            mcdu.setTemplate([
                ["MCDU MENU"],
                [""],
                [textFMGC],
                [""],
                [textATSU],
                [""],
                [textAIDS],
                [""],
                [textCFDS, textMaint],
                [""],
                [""],
                [""],
                ["", textReturn]
            ]);
        }

        updateView();

        mcdu.showErrorMessage("SELECT DESIRED SYSTEM");

        mcdu.onLeftInput[0] = () => {
            mcdu.showErrorMessage("WAIT FOR SYSTEM RESPONSE");
            selectedFMGC = true;
            updateView();
            setTimeout(() => {
                mcdu.showErrorMessage("");
                CDUIdentPage.ShowPage(mcdu);
            }, Math.floor(Math.random() * (2000 - 1000)) + 1000); 
        }

        mcdu.onLeftInput[1] = () => {
            mcdu.showErrorMessage("WAIT FOR SYSTEM RESPONSE");
            selectedATSU = true;
            updateView();
            setTimeout(() => {
                mcdu.showErrorMessage("");
                CDUAtsuMenu.ShowPage(mcdu);
            }, Math.floor(Math.random() * (2000 - 1000)) + 1000); 
        }

        mcdu.onLeftInput[2] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }

        mcdu.onLeftInput[3] = () => {
            mcdu.showErrorMessage("WAIT FOR SYSTEM RESPONSE");
            selectedCFDS = true;
            updateView();
            setTimeout(() => {
                mcdu.showErrorMessage("");
                CDUCfdsMainMenu.ShowPage(mcdu);
            }, Math.floor(Math.random() * (2000 - 1000)) + 1000); 
        }

        mcdu.onRightInput[3] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }

        mcdu.onDir = () => {
            mcdu.showErrorMessage("");
            CDUDirectToPage.ShowPage(mcdu);
        };
        mcdu.onProg = () => {
            mcdu.showErrorMessage("");
            CDUProgressPage.ShowPage(mcdu);
        };
        mcdu.onPerf = () => {
            mcdu.showErrorMessage("");
            CDUPerformancePage.ShowPage(mcdu);
        };
        mcdu.onInit = () => {
            mcdu.showErrorMessage("");
            CDUInitPage.ShowPage1(mcdu);
        };
        mcdu.onData = () => {
            mcdu.showErrorMessage("");
            CDUDataIndexPage.ShowPage1(mcdu);
        };
        mcdu.onFpln = () => {
            mcdu.showErrorMessage("");
            CDUFlightPlanPage.ShowPage(mcdu);
        };
        mcdu.onRad = () => {
            mcdu.showErrorMessage("");
            CDUNavRadioPage.ShowPage(mcdu);
        };
        mcdu.onFuel = () => {
            mcdu.showErrorMessage("");
            CDUFuelPredPage.ShowPage(mcdu);
        };
        // Previous (original) MCDU menu
        // mcdu.setTemplate([
        //     ["A320"],
        //     ["ENG"],
        //     ["LEAP A-1"],
        //     ["ACTIVE DATA BASE"],
        //     ["4MAY-4JUL[color]blue", "TC11103001"],
        //     ["SECOND DATA BASE"],
        //     ["{4MAY-4JUL[color]blue"],
        //     [""],
        //     [""],
        //     [""],
        //     [""],
        //     ["", "PERF FACTOR"],
        //     ["", "0.0"]
        // ]);
    }
}